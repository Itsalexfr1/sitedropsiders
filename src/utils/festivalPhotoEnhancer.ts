/**
 * Festival Pro Photo Enhancer (Auto)
 * ----------------------------------
 * Analyse automatique (luminosité globale, distribution spatiale, contraste, métadonnées EXIF)
 * et étalonnage photographique professionnel non-destructif (100% traitement d'image réel,
 * zéro ajout d'éléments artificiels).
 *
 * Modes automatiques :
 * 1. NIGHT_INDOOR : Scènes nocturnes, hangars, clubs, lasers
 * 2. DAY_OUTDOOR  : Installations extérieures, décors, allées, scènes de jour
 */

export type FestivalSceneMode = 'NIGHT_INDOOR' | 'DAY_OUTDOOR';

export interface ExifHints {
    iso?: number;
    exposureTime?: number;
    fNumber?: number;
    brightnessValue?: number;
    hour?: number;
    flashFired?: boolean;
}

export interface SceneProfile {
    mode: FestivalSceneMode;
    meanL: number;
    medianL: number;
    stdL: number;
    p02: number;
    p08: number;
    p15: number;
    p25: number;
    p75: number;
    p90: number;
    p98: number;
    darkRatio: number;
    brightSpotRatio: number;
    neonLaserRatio: number;
    topMeanL: number;
    topBrightOvercastRatio: number;
    topSkyBlueRatio: number;
    exif: ExifHints;
}

export interface FestivalEnhancementResult {
    blob: Blob;
    dataUrl: string;
    mode: FestivalSceneMode;
    label: string;
    profile: SceneProfile;
}

// ============================================================================
// Math & Signal Helpers (Zero-Allocation Scalar Utilities)
// ============================================================================

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const clampRange = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v;

const smoothstep = (edge0: number, edge1: number, x: number): number => {
    const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
    return t * t * (3 - 2 * t);
};

/** Circular Gaussian bell on hue angle in degrees [0..360) */
const hueBell = (hue: number, center: number, sigma: number): number => {
    let diff = Math.abs(hue - center) % 360;
    if (diff > 180) diff = 360 - diff;
    const z = diff / sigma;
    return Math.exp(-0.5 * z * z);
};

/** Soft-knee saturation curve preventing harsh RGB gamut clipping */
const softBoostSaturation = (s: number, boost: number): number => {
    if (s <= 0.004) return s;
    if (boost >= 0) {
        // Vibrance-aware curve: strong lift in mid-high chroma with smooth asymptotic roll-off near 0.98
        const target = s + boost * s * (1 - 0.55 * s);
        return Math.min(0.985, 1 - Math.exp(-2.35 * target) * (1 - target * 0.28));
    } else {
        return clamp01(s * (1 + boost));
    }
};

// ============================================================================
// Fast Separable Sliding-Window Box Blur (Approximates Gaussian in 2 Passes)
// ============================================================================

function boxBlurHorizontal(src: Float32Array, dst: Float32Array, w: number, h: number, r: number): void {
    const inv = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) {
        const row = y * w;
        let sum = src[row] * (r + 1);
        for (let x = 1; x <= r; x++) {
            sum += src[row + (x < w ? x : w - 1)];
        }
        for (let x = 0; x < w; x++) {
            dst[row + x] = sum * inv;
            const leftIdx = x - r;
            const rightIdx = x + r + 1;
            const leftVal = src[row + (leftIdx < 0 ? 0 : leftIdx)];
            const rightVal = src[row + (rightIdx >= w ? w - 1 : rightIdx)];
            sum += rightVal - leftVal;
        }
    }
}

function boxBlurVertical(src: Float32Array, dst: Float32Array, w: number, h: number, r: number): void {
    const inv = 1 / (2 * r + 1);
    for (let x = 0; x < w; x++) {
        let sum = src[x] * (r + 1);
        for (let y = 1; y <= r; y++) {
            sum += src[(y < h ? y : h - 1) * w + x];
        }
        for (let y = 0; y < h; y++) {
            dst[y * w + x] = sum * inv;
            const topIdx = y - r;
            const botIdx = y + r + 1;
            const topVal = src[(topIdx < 0 ? 0 : topIdx) * w + x];
            const botVal = src[(botIdx >= h ? h - 1 : botIdx) * w + x];
            sum += botVal - topVal;
        }
    }
}

function blurLuminance(
    src: Float32Array,
    tmp: Float32Array,
    w: number,
    h: number,
    radius: number
): Float32Array {
    const out = new Float32Array(w * h);
    const r1 = Math.max(1, Math.round(radius));
    const r2 = Math.max(1, Math.round(radius * 0.75));
    // Pass 1
    boxBlurHorizontal(src, tmp, w, h, r1);
    boxBlurVertical(tmp, out, w, h, r1);
    // Pass 2 (Tent / near-Gaussian kernel -> zero box ringing)
    boxBlurHorizontal(out, tmp, w, h, r2);
    boxBlurVertical(tmp, out, w, h, r2);
    return out;
}

// ============================================================================
// Lightweight JPEG EXIF Parser (ISO, Shutter, Brightness, Capture Hour)
// ============================================================================

export async function extractExifHints(source?: File | Blob | null): Promise<ExifHints> {
    const hints: ExifHints = {};
    if (!source || source.size < 16) return hints;

    try {
        const slice = source.slice(0, Math.min(source.size, 131072));
        const buffer = await slice.arrayBuffer();
        const view = new DataView(buffer);

        // Check JPEG SOI 0xFFD8
        if (view.getUint16(0, false) !== 0xffd8) return hints;

        let offset = 2;
        while (offset + 4 < view.byteLength) {
            const marker = view.getUint16(offset, false);
            offset += 2;
            if (marker === 0xffda || marker === 0xffd9) break; // SOS / EOI
            const segLen = view.getUint16(offset, false);
            if (segLen < 2 || offset + segLen > view.byteLength) break;

            // APP1 0xFFE1 with "Exif\0\0"
            if (
                marker === 0xffe1 &&
                segLen >= 14 &&
                view.getUint32(offset + 2, false) === 0x45786966 &&
                view.getUint16(offset + 6, false) === 0x0000
            ) {
                const tiffStart = offset + 8;
                const byteOrder = view.getUint16(tiffStart, false);
                const littleEndian = byteOrder === 0x4949;
                if (!littleEndian && byteOrder !== 0x4d4d) break;

                const readU16 = (pos: number) =>
                    pos + 2 <= view.byteLength ? view.getUint16(pos, littleEndian) : 0;
                const readU32 = (pos: number) =>
                    pos + 4 <= view.byteLength ? view.getUint32(pos, littleEndian) : 0;
                const readI32 = (pos: number) =>
                    pos + 4 <= view.byteLength ? view.getInt32(pos, littleEndian) : 0;

                const parseDateHour = (valOffset: number, count: number) => {
                    if (valOffset + count > view.byteLength || count < 13) return;
                    let str = '';
                    for (let i = 0; i < Math.min(count - 1, 19); i++) {
                        str += String.fromCharCode(view.getUint8(valOffset + i));
                    }
                    // Format "YYYY:MM:DD HH:MM:SS"
                    const match = str.match(/\d{4}:\d{2}:\d{2}\s+(\d{2}):/);
                    if (match) {
                        const hr = parseInt(match[1], 10);
                        if (!isNaN(hr) && hr >= 0 && hr <= 23) hints.hour = hr;
                    }
                };

                const parseIFD = (ifdOffset: number): number => {
                    if (ifdOffset <= 0 || ifdOffset + 2 > view.byteLength) return 0;
                    const entries = readU16(ifdOffset);
                    let exifSubIfd = 0;

                    for (let i = 0; i < entries; i++) {
                        const entryPos = ifdOffset + 2 + i * 12;
                        if (entryPos + 12 > view.byteLength) break;

                        const tag = readU16(entryPos);
                        const type = readU16(entryPos + 2);
                        const count = readU32(entryPos + 4);
                        const valFieldPos = entryPos + 8;

                        if (tag === 0x8769) {
                            exifSubIfd = tiffStart + readU32(valFieldPos);
                        } else if (tag === 0x0132 || tag === 0x9003) {
                            // DateTime / DateTimeOriginal
                            if (type === 2 && count > 4) {
                                const strPos = tiffStart + readU32(valFieldPos);
                                parseDateHour(strPos, count);
                            }
                        } else if (tag === 0x8827) {
                            // ISOSpeedRatings
                            const iso = type === 3 ? readU16(valFieldPos) : readU32(valFieldPos);
                            if (iso > 0 && iso < 512000) hints.iso = iso;
                        } else if (tag === 0x829a && type === 5) {
                            // ExposureTime (unsigned rational)
                            const ratPos = tiffStart + readU32(valFieldPos);
                            if (ratPos + 8 <= view.byteLength) {
                                const num = readU32(ratPos);
                                const den = readU32(ratPos + 4);
                                if (den > 0 && num > 0) hints.exposureTime = num / den;
                            }
                        } else if (tag === 0x829d && type === 5) {
                            // FNumber
                            const ratPos = tiffStart + readU32(valFieldPos);
                            if (ratPos + 8 <= view.byteLength) {
                                const num = readU32(ratPos);
                                const den = readU32(ratPos + 4);
                                if (den > 0) hints.fNumber = num / den;
                            }
                        } else if (tag === 0x9203 && type === 10) {
                            // BrightnessValue (signed rational APEX)
                            const ratPos = tiffStart + readU32(valFieldPos);
                            if (ratPos + 8 <= view.byteLength) {
                                const num = readI32(ratPos);
                                const den = readI32(ratPos + 4);
                                if (den !== 0) hints.brightnessValue = num / den;
                            }
                        } else if (tag === 0x9209) {
                            // Flash
                            const flashVal = readU16(valFieldPos);
                            hints.flashFired = (flashVal & 1) === 1;
                        }
                    }
                    return exifSubIfd;
                };

                const firstIfd = tiffStart + readU32(tiffStart + 4);
                const subIfd = parseIFD(firstIfd);
                if (subIfd > 0) parseIFD(subIfd);
                break;
            }
            offset += segLen;
        }
    } catch {
        // Ignore malformed EXIF silently
    }

    return hints;
}

// ============================================================================
// Scene Detection Engine (NIGHT_INDOOR vs DAY_OUTDOOR)
// ============================================================================

export function analyzeSceneProfile(img: HTMLImageElement, exif: ExifHints = {}): SceneProfile {
    const maxSample = 320;
    const scale = Math.min(1, maxSample / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height, 1));
    const sw = Math.max(16, Math.round((img.naturalWidth || img.width) * scale));
    const sh = Math.max(16, Math.round((img.naturalHeight || img.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
        return {
            mode: 'NIGHT_INDOOR',
            meanL: 0.25,
            medianL: 0.22,
            stdL: 0.2,
            p02: 0.02,
            p08: 0.05,
            p15: 0.08,
            p25: 0.12,
            p75: 0.4,
            p90: 0.65,
            p98: 0.9,
            darkRatio: 0.5,
            brightSpotRatio: 0.02,
            neonLaserRatio: 0.05,
            topMeanL: 0.2,
            topBrightOvercastRatio: 0,
            topSkyBlueRatio: 0,
            exif
        };
    }

    ctx.drawImage(img, 0, 0, sw, sh);
    const { data } = ctx.getImageData(0, 0, sw, sh);
    const totalPixels = sw * sh;
    const hist = new Uint32Array(256);

    let sumL = 0;
    let sumL2 = 0;
    let darkCount = 0;
    let brightSpotCount = 0;
    let neonLaserCount = 0;
    let lowSatSmokeCount = 0;

    const topRows = Math.max(1, Math.floor(sh * 0.32));
    const topTotal = topRows * sw;
    let topSumL = 0;
    let topBrightOvercastCount = 0;
    let topSkyBlueCount = 0;

    for (let y = 0; y < sh; y++) {
        const isTop = y < topRows;
        for (let x = 0; x < sw; x++) {
            const idx = (y * sw + x) * 4;
            const r = data[idx] / 255;
            const g = data[idx + 1] / 255;
            const b = data[idx + 2] / 255;

            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
            const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
            const chroma = maxC - minC;
            const sat = maxC > 0.005 ? chroma / maxC : 0;

            sumL += lum;
            sumL2 += lum * lum;
            const bin = lum <= 0 ? 0 : lum >= 1 ? 255 : (lum * 255) | 0;
            hist[bin]++;

            if (lum < 0.20) darkCount++;
            if (lum > 0.86) brightSpotCount++;
            if (sat > 0.68 && maxC > 0.42 && lum < 0.80) neonLaserCount++;
            if (lum >= 0.07 && lum <= 0.38 && sat < 0.22) lowSatSmokeCount++;

            if (isTop) {
                topSumL += lum;
                if (lum > 0.65 && sat < 0.28) topBrightOvercastCount++;
                if (lum > 0.36 && b > r * 1.14 && b >= g * 0.94 && sat > 0.14) topSkyBlueCount++;
            }
        }
    }

    const percentile = (q: number): number => {
        const target = totalPixels * q;
        let acc = 0;
        for (let i = 0; i < 256; i++) {
            acc += hist[i];
            if (acc >= target) return i / 255;
        }
        return 1;
    };

    const meanL = sumL / totalPixels;
    const variance = Math.max(0, sumL2 / totalPixels - meanL * meanL);
    const stdL = Math.sqrt(variance);
    const p02 = percentile(0.02);
    const p08 = percentile(0.08);
    const p15 = percentile(0.15);
    const p25 = percentile(0.25);
    const medianL = percentile(0.50);
    const p75 = percentile(0.75);
    const p90 = percentile(0.90);
    const p98 = percentile(0.98);

    const darkRatio = darkCount / totalPixels;
    const brightSpotRatio = brightSpotCount / totalPixels;
    const neonLaserRatio = neonLaserCount / totalPixels;
    const lowSatSmokeRatio = lowSatSmokeCount / totalPixels;

    const topMeanL = topSumL / topTotal;
    const topBrightOvercastRatio = topBrightOvercastCount / topTotal;
    const topSkyBlueRatio = topSkyBlueCount / topTotal;

    // Multi-cue classification scoring
    let nightScore = 0;
    let dayScore = 0;

    // 1. Global brightness & median luminance
    if (medianL < 0.25) nightScore += 3.6;
    else if (medianL < 0.35) nightScore += 2.1;
    else if (medianL > 0.45) dayScore += 3.0;
    else if (medianL > 0.38) dayScore += 1.6;

    if (meanL < 0.30) nightScore += 2.2;
    else if (meanL < 0.37) nightScore += 1.0;
    else if (meanL > 0.44) dayScore += 2.2;

    // 2. Shadow dominance & stage contrast signature
    if (darkRatio > 0.48) nightScore += 2.6;
    else if (darkRatio > 0.34) nightScore += 1.3;
    else if (darkRatio < 0.16) dayScore += 2.0;

    if (darkRatio > 0.30 && brightSpotRatio > 0.004 && p98 - p15 > 0.62) {
        nightScore += 1.8; // High-contrast dark venue + spotlights/lasers
    }
    if (neonLaserRatio > 0.032 && medianL < 0.44) {
        nightScore += 1.9; // Saturated stage lighting / lasers
    }
    if (lowSatSmokeRatio > 0.28 && topBrightOvercastRatio < 0.08 && topSkyBlueRatio < 0.05 && medianL < 0.42) {
        nightScore += 1.4; // Indoor hangar / club smoke haze
    }

    // 3. Sky / Outdoor upper-frame signature
    if (topMeanL > 0.55 && (topBrightOvercastRatio > 0.18 || topSkyBlueRatio > 0.14)) {
        dayScore += 3.4; // Clear outdoor sky (sunny or overcast)
    } else if (topSkyBlueRatio > 0.18 && meanL > 0.33) {
        dayScore += 2.2;
    } else if (topMeanL < 0.27) {
        nightScore += 1.7; // Dark night sky or hangar ceiling
    }

    // 4. EXIF Metadata signals (secondary confirmation)
    if (exif.iso !== undefined) {
        if (exif.iso >= 1600) nightScore += 2.2;
        else if (exif.iso >= 800) nightScore += 1.1;
        else if (exif.iso <= 250) dayScore += 1.6;
    }
    if (exif.brightnessValue !== undefined) {
        if (exif.brightnessValue < 1.5) nightScore += 2.0;
        else if (exif.brightnessValue > 5.0) dayScore += 2.0;
    }
    if (exif.exposureTime !== undefined) {
        if (exif.exposureTime >= 1 / 50 && (exif.iso ?? 400) >= 640) nightScore += 1.2;
        else if (exif.exposureTime <= 1 / 640 && (exif.iso ?? 200) <= 400) dayScore += 1.5;
    }
    if (exif.hour !== undefined) {
        if (exif.hour >= 22 || exif.hour <= 5) nightScore += 1.9;
        else if (exif.hour >= 10 && exif.hour <= 17) dayScore += 1.0;
    }

    const mode: FestivalSceneMode = nightScore >= dayScore ? 'NIGHT_INDOOR' : 'DAY_OUTDOOR';

    return {
        mode,
        meanL,
        medianL,
        stdL,
        p02,
        p08,
        p15,
        p25,
        p75,
        p90,
        p98,
        darkRatio,
        brightSpotRatio,
        neonLaserRatio,
        topMeanL,
        topBrightOvercastRatio,
        topSkyBlueRatio,
        exif
    };
}

// ============================================================================
// Core Pixel Grading Pipelines
// ============================================================================

function applyNightIndoorPipeline(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    L: Float32Array,
    fineL: Float32Array,
    midL: Float32Array,
    wideL: Float32Array,
    profile: SceneProfile
): void {
    // 1. Edge-preserving bilateral shadow luma + chroma denoising (for L < 0.23)
    const srcCopy = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++) {
        const rowOffset = y * w;
        for (let x = 1; x < w - 1; x++) {
            const p = rowOffset + x;
            const lc = L[p];
            if (lc >= 0.23) continue;

            const idx = p * 4;
            const rc = srcCopy[idx];
            const gc = srcCopy[idx + 1];
            const bc = srcCopy[idx + 2];

            let sumW = 1.6;
            let sumR = rc * 1.6;
            let sumG = gc * 1.6;
            let sumB = bc * 1.6;

            // 3x3 bilateral neighborhood weighted by luminance similarity (preserves silhouettes)
            for (let dy = -1; dy <= 1; dy++) {
                const nRow = (y + dy) * w;
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const np = nRow + (x + dx);
                    const diffL = Math.abs(L[np] - lc);
                    if (diffL < 0.065) {
                        const wgt = 1 - diffL * 15.38;
                        const nIdx = np * 4;
                        sumW += wgt;
                        sumR += srcCopy[nIdx] * wgt;
                        sumG += srcCopy[nIdx + 1] * wgt;
                        sumB += srcCopy[nIdx + 2] * wgt;
                    }
                }
            }

            const avgR = sumR / sumW;
            const avgG = sumG / sumW;
            const avgB = sumB / sumW;
            const avgLum = 0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB;
            const curLum = lc * 255;

            const denoiseStrength = 1 - smoothstep(0.05, 0.23, lc);
            const lumaBlend = curLum + (avgLum - curLum) * (0.58 * denoiseStrength);
            // Stronger chroma smoothing in deep shadows removes color noise speckles
            const chromaBlend = 0.80 * denoiseStrength;

            const curCr = rc - curLum;
            const curCg = gc - curLum;
            const curCb = bc - curLum;

            const avgCr = avgR - avgLum;
            const avgCg = avgG - avgLum;
            const avgCb = avgB - avgLum;

            data[idx] = lumaBlend + curCr + (avgCr - curCr) * chromaBlend;
            data[idx + 1] = lumaBlend + curCg + (avgCg - curCg) * chromaBlend;
            data[idx + 2] = lumaBlend + curCb + (avgCb - curCb) * chromaBlend;
        }
    }

    // Adaptive smoke haze floor based on elevated dark percentile
    const globalSmokeFloor = clampRange(profile.p08 * 0.90, 0.014, 0.145);
    const highlightKnee = 0.65;
    const invTanh85 = 1 / Math.tanh(0.85);

    // 2. Full Tonal, Dehaze, White-Guard, Clarity & Selective Warm Laser Color Grading
    for (let y = 0; y < h; y++) {
        const yNorm = y / Math.max(1, h - 1);
        const crowdSpatial = smoothstep(0.48, 0.96, yNorm);
        const rowOffset = y * w;

        for (let x = 0; x < w; x++) {
            const p = rowOffset + x;
            const idx = p * 4;

            let r = data[idx] / 255;
            let g = data[idx + 1] / 255;
            let b = data[idx + 2] / 255;

            const max0 = r > g ? (r > b ? r : b) : g > b ? g : b;
            const min0 = r < g ? (r < b ? r : b) : g < b ? g : b;
            const sat0 = max0 > 0.005 ? (max0 - min0) / max0 : 0;

            // A. High Dehaze (eliminates grayish smoke haze while sparing pure laser chroma)
            const lowSatHazeMask = 1 - smoothstep(0.16, 0.62, sat0);
            const localEnv = wideL[p] < midL[p] ? wideL[p] : midL[p];
            const localSmoke =
                localEnv * 0.25 * lowSatHazeMask * (1 - smoothstep(0.26, 0.72, wideL[p]));
            const veil = globalSmokeFloor * (0.62 + 0.38 * lowSatHazeMask) + localSmoke;
            const invTrans = 1 / Math.max(0.70, 1 - veil * 0.92);

            r = Math.max(0, (r - veil) * invTrans);
            g = Math.max(0, (g - veil) * invTrans);
            b = Math.max(0, (b - veil) * invTrans);

            let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            // B. Deep Nocturnal Contrast & Lower-Frame Crowd Silhouette Density
            const crowdShadowMask =
                crowdSpatial *
                (1 - smoothstep(0.12, 0.38, lum)) *
                (1 - smoothstep(0.45, 0.80, sat0));

            let targetLum = lum * (1 - 0.46 * crowdShadowMask);

            // Dramatic nocturnal S-curve (deep obsidian blacks + punchy stage midtones)
            if (targetLum < 0.46) {
                const t = targetLum / 0.46;
                targetLum = 0.46 * Math.pow(t, 1.34) * (0.86 + 0.14 * t);
            } else if (targetLum > highlightKnee) {
                // C. Strict Highlight Control (soft shoulder pulls down blown beams)
                const over = (targetLum - highlightKnee) / (1 - highlightKnee);
                targetLum =
                    highlightKnee +
                    (0.965 - highlightKnee) * Math.tanh(over * 0.85) * invTanh85;
            }

            // Stage Structure Clarity (masked off deep denoised shadows & clipped cores)
            const origL = L[p];
            const clarityMask =
                smoothstep(0.08, 0.22, origL) * (1 - smoothstep(0.85, 0.96, targetLum));
            const structDelta =
                (origL - midL[p]) * 0.48 + clampRange(origL - fineL[p], -0.075, 0.075) * 0.38;
            targetLum = clamp01(targetLum + structDelta * clarityMask);

            if (lum > 1e-5) {
                const lumScale = targetLum / lum;
                r *= lumScale;
                g *= lumScale;
                b *= lumScale;
            } else {
                r = targetLum;
                g = targetLum;
                b = targetLum;
            }

            // Soft channel clamp before HSL analysis
            r = clamp01(r);
            g = clamp01(g);
            b = clamp01(b);

            // Convert RGB -> HSL (inline, zero allocation)
            const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
            const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
            const delta = maxC - minC;
            let l = (maxC + minC) * 0.5;
            let hDeg = 0;
            let s = 0;

            if (delta > 1e-5) {
                s = l > 0.5 ? delta / (2 - maxC - minC) : delta / (maxC + minC);
                if (maxC === r) {
                    hDeg = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
                } else if (maxC === g) {
                    hDeg = ((b - r) / delta + 2) * 60;
                } else {
                    hDeg = ((r - g) / delta + 4) * 60;
                }
            }

            // D. Strict Silvery-White Spotlight & Beam Guard (prevents yellow/orange drift in whites)
            const isWarmYellowishWhite = hueBell(hDeg, 42, 22) * (1 - smoothstep(0.32, 0.62, s));
            const isLowSatBright = 1 - smoothstep(0.18, 0.48, s);
            const whiteBeamMask =
                smoothstep(0.70, 0.92, targetLum) * Math.max(isLowSatBright, isWarmYellowishWhite);

            if (whiteBeamMask > 0.01) {
                // Pull saturation down in white beam cores & shift slightly cool silvery-white
                s *= 1 - 0.84 * whiteBeamMask;
            }

            // E. Warm Selective Saturation (Reds, Magentas, Oranges) & Warm Magenta Lock
            if (s > 0.015) {
                // Keep pink/magenta warm & dense: nudge cold violet-magenta (275°..338°) toward warm rose-magenta
                if (hDeg >= 270 && hDeg <= 345) {
                    const coldMagentaWeight =
                        hueBell(hDeg, 305, 20) * 14 + hueBell(hDeg, 325, 14) * 7;
                    hDeg = (hDeg + coldMagentaWeight * smoothstep(0.12, 0.35, s)) % 360;
                    // Dense magenta richness (avoids washed-out pastel pink)
                    l *= 1 - 0.075 * s * smoothstep(0.42, 0.82, l);
                }

                const redBoost = hueBell(hDeg, 0, 22) * 0.54;
                const orangeBoost = hueBell(hDeg, 28, 18) * 0.46 * (1 - whiteBeamMask);
                const magentaBoost = hueBell(hDeg, 332, 26) * 0.52;
                // Restrain murky low-chroma cold blue/cyan smoke tint while keeping true blue lasers intact
                const murkyColdSmoke =
                    hueBell(hDeg, 215, 34) * (1 - smoothstep(0.12, 0.34, s)) * -0.25;

                const totalSatBoost = redBoost + orangeBoost + magentaBoost + murkyColdSmoke;
                s = softBoostSaturation(s, totalSatBoost);
            }

            // Convert HSL -> RGB
            let outR: number, outG: number, outB: number;
            if (s <= 1e-4) {
                outR = l;
                outG = l;
                outB = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const pVal = 2 * l - q;
                const hk = hDeg / 360;

                const hue2rgb = (tInput: number): number => {
                    let t = tInput;
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return pVal + (q - pVal) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return pVal + (q - pVal) * (2 / 3 - t) * 6;
                    return pVal;
                };

                outR = hue2rgb(hk + 1 / 3);
                outG = hue2rgb(hk);
                outB = hue2rgb(hk - 1 / 3);
            }

            // Subtle silvery-white crispness on spotlight cores
            if (whiteBeamMask > 0.05) {
                const silverW = whiteBeamMask * 0.65;
                const neutral = 0.2126 * outR + 0.7152 * outG + 0.0722 * outB;
                outR = outR + (neutral * 0.988 - outR) * silverW;
                outG = outG + (neutral * 0.996 - outG) * silverW;
                outB = outB + (Math.min(1, neutral * 1.018) - outB) * silverW;
            }

            data[idx] = Math.round(clamp01(outR) * 255);
            data[idx + 1] = Math.round(clamp01(outG) * 255);
            data[idx + 2] = Math.round(clamp01(outB) * 255);
        }
    }
}

function applyDayOutdoorPipeline(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    L: Float32Array,
    fineL: Float32Array,
    midL: Float32Array,
    wideL: Float32Array,
    profile: SceneProfile
): void {
    // Adaptive black floor removal to eliminate flat milky outdoor haze
    const blackAnchor = clampRange(profile.p02 * 0.85, 0.008, 0.095);
    const invBlackSpan = 1 / Math.max(0.85, 1 - blackAnchor);
    const overcastStrength = clampRange(profile.topBrightOvercastRatio * 1.6, 0.25, 1.0);
    const invTanh90 = 1 / Math.tanh(0.90);

    for (let y = 0; y < h; y++) {
        const yNorm = y / Math.max(1, h - 1);
        const skySpatial = 1 - smoothstep(0.24, 0.66, yNorm);
        const rowOffset = y * w;

        for (let x = 0; x < w; x++) {
            const p = rowOffset + x;
            const idx = p * 4;

            let r = Math.max(0, (data[idx] / 255 - blackAnchor) * invBlackSpan);
            let g = Math.max(0, (data[idx + 1] / 255 - blackAnchor) * invBlackSpan);
            let b = Math.max(0, (data[idx + 2] / 255 - blackAnchor) * invBlackSpan);

            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            let targetLum = lum;

            // A. Dynamism & Relief: densify shadows and deep blacks while keeping midtones open & readable
            if (targetLum < 0.42) {
                const t = targetLum / 0.42;
                targetLum = 0.42 * Math.pow(t, 1.22) * (0.90 + 0.10 * t);
            }

            // B. Sky & Highlight Texture Recovery: prevent washed-out white skies
            const highlightStart = 0.56;
            if (targetLum > highlightStart) {
                const over = (targetLum - highlightStart) / (1 - highlightStart);
                const compressed =
                    highlightStart +
                    (0.935 - highlightStart) * Math.tanh(over * 0.90) * invTanh90;
                const recoveryMix = 0.65 + 0.35 * skySpatial * overcastStrength;
                targetLum = targetLum + (compressed - targetLum) * recoveryMix;
            }

            // Recover cloud/sky local matter in bright zones
            const origL = L[p];
            const skyMatterMask = smoothstep(0.54, 0.78, origL) * (0.65 + 0.45 * skySpatial);
            const skyTextureDelta =
                (origL - wideL[p]) * 0.42 * skyMatterMask;

            // C. Official-Media Micro-Contrast & Piqué (wood, straw, tarps, stages, graffiti)
            const detailMask =
                smoothstep(0.03, 0.14, origL) * (1 - smoothstep(0.88, 0.98, targetLum));
            const microContrast =
                ((origL - midL[p]) * 0.44 +
                    clampRange(origL - fineL[p], -0.085, 0.085) * 0.52) *
                detailMask;

            targetLum = clamp01(targetLum + skyTextureDelta + microContrast);

            if (lum > 1e-5) {
                const scale = targetLum / lum;
                r = clamp01(r * scale);
                g = clamp01(g * scale);
                b = clamp01(b * scale);
            } else {
                r = targetLum;
                g = targetLum;
                b = targetLum;
            }

            // D. Vivid Festival Decor Saturation (Oranges, Electric Greens, Blues, Reds)
            const maxC = r > g ? (r > b ? r : b) : g > b ? g : b;
            const minC = r < g ? (r < b ? r : b) : g < b ? g : b;
            const delta = maxC - minC;
            let l = (maxC + minC) * 0.5;
            let hDeg = 0;
            let s = 0;

            if (delta > 1e-5) {
                s = l > 0.5 ? delta / (2 - maxC - minC) : delta / (maxC + minC);
                if (maxC === r) {
                    hDeg = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
                } else if (maxC === g) {
                    hDeg = ((b - r) / delta + 2) * 60;
                } else {
                    hDeg = ((r - g) / delta + 4) * 60;
                }
            }

            if (s > 0.015) {
                // Protect natural human skin tones (moderate chroma around 16°..36°) from oversaturation
                const skinGuard =
                    hueBell(hDeg, 25, 11) *
                    smoothstep(0.14, 0.24, s) *
                    (1 - smoothstep(0.45, 0.62, s)) *
                    smoothstep(0.28, 0.44, l) *
                    (1 - smoothstep(0.74, 0.88, l));

                // Freshen dull yellowish grass slightly toward vivid festival green
                if (hDeg >= 68 && hDeg <= 102) {
                    hDeg += hueBell(hDeg, 84, 10) * 3.5;
                }

                const redDecor = hueBell(hDeg, 2, 22) * 0.45;
                const orangeDecor = hueBell(hDeg, 34, 22) * 0.44 * (1 - 0.65 * skinGuard);
                const electricGreen = hueBell(hDeg, 114, 40) * 0.46;
                const vividBlue = hueBell(hDeg, 210, 36) * 0.46;
                const graffitiMagenta = hueBell(hDeg, 308, 28) * 0.36;
                const baseVibrance = 0.20 * (1 - 0.5 * s) * (1 - 0.55 * skinGuard);

                // Subtle sky blue depth (prevents pale cyan skies)
                const blueDepth = hueBell(hDeg, 212, 28) * skySpatial * s;
                l *= 1 - 0.085 * blueDepth;

                const totalBoost = Math.max(
                    baseVibrance,
                    redDecor + orangeDecor + electricGreen + vividBlue + graffitiMagenta
                );
                s = softBoostSaturation(s, totalBoost);
            }

            // Convert HSL -> RGB
            let outR: number, outG: number, outB: number;
            if (s <= 1e-4) {
                outR = l;
                outG = l;
                outB = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const pVal = 2 * l - q;
                const hk = hDeg / 360;

                const hue2rgb = (tInput: number): number => {
                    let t = tInput;
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return pVal + (q - pVal) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return pVal + (q - pVal) * (2 / 3 - t) * 6;
                    return pVal;
                };

                outR = hue2rgb(hk + 1 / 3);
                outG = hue2rgb(hk);
                outB = hue2rgb(hk - 1 / 3);
            }

            data[idx] = Math.round(clamp01(outR) * 255);
            data[idx + 1] = Math.round(clamp01(outG) * 255);
            data[idx + 2] = Math.round(clamp01(outB) * 255);
        }
    }
}

// ============================================================================
// Image Loader & Public API
// ============================================================================

function loadImageElement(source: File | Blob | string): Promise<{ img: HTMLImageElement; revokeUrl?: string }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        let revokeUrl: string | undefined;

        if (typeof source !== 'string') {
            revokeUrl = URL.createObjectURL(source);
            img.src = revokeUrl;
        } else {
            if (!source.startsWith('data:') && !source.startsWith('blob:')) {
                const originMatch = source.match(/^https?:\/\/[^/]+/i);
                if (originMatch && originMatch[0] !== window.location.origin) {
                    img.crossOrigin = 'anonymous';
                }
            }
            img.src = source;
        }

        img.onload = () => resolve({ img, revokeUrl });
        img.onerror = () => {
            if (revokeUrl) URL.revokeObjectURL(revokeUrl);
            reject(new Error("Impossible de charger l'image pour l'amélioration Festival Pro"));
        };
    });
}

export function getFestivalModeLabel(mode: FestivalSceneMode): string {
    return mode === 'NIGHT_INDOOR' ? 'Nuit / Indoor' : 'Jour / Outdoor';
}

/**
 * Analyse et applique automatiquement le traitement "Amélioration Festival Pro (Auto)"
 * sur un File, Blob ou DataURL/URL d'image.
 */
export async function enhanceFestivalPhoto(
    source: File | Blob | string,
    options?: {
        fileForExif?: File | Blob | null;
        maxDimension?: number;
        quality?: number;
    }
): Promise<FestivalEnhancementResult> {
    const exifSource =
        options?.fileForExif ?? (typeof source !== 'string' ? source : null);
    const maxDim = options?.maxDimension ?? 2048;
    const quality = options?.quality ?? 0.90;

    const [exif, loaded] = await Promise.all([
        extractExifHints(exifSource),
        loadImageElement(source)
    ]);

    try {
        const { img } = loaded;
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Analyze scene (Night/Indoor vs Day/Outdoor)
        const profile = analyzeSceneProfile(img, exif);

        // Compute target working resolution (up to 4K Ultra-HD by default)
        const scale = Math.min(1, maxDim / Math.max(origW, origH, 1));
        const w = Math.max(1, Math.round(origW * scale));
        const h = Math.max(1, Math.round(origH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Contexte Canvas 2D indisponible');

        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const { data } = imageData;
        const pixelCount = w * h;

        // Extract perceptual luminance map
        const L = new Float32Array(pixelCount);
        for (let i = 0; i < pixelCount; i++) {
            const idx = i * 4;
            L[i] = (0.2126 * data[idx] + 0.7152 * data[idx + 1] + 0.0722 * data[idx + 2]) / 255;
        }

        // Multi-scale spatial luminance envelopes (fine piqué, medium structure, wide haze/sky)
        const minDim = Math.min(w, h);
        const tmp = new Float32Array(pixelCount);
        const rFine = Math.max(1, Math.round(minDim * 0.0012));
        const rMid = Math.max(3, Math.round(minDim * 0.0048));
        const rWide = Math.max(12, Math.round(minDim * 0.018));

        const fineL = blurLuminance(L, tmp, w, h, rFine);
        const midL = blurLuminance(L, tmp, w, h, rMid);
        const wideL = blurLuminance(L, tmp, w, h, rWide);

        // Yield briefly on large images so UI stays responsive
        if (pixelCount > 1_500_000) {
            await new Promise<void>((r) => setTimeout(r, 0));
        }

        if (profile.mode === 'NIGHT_INDOOR') {
            applyNightIndoorPipeline(data, w, h, L, fineL, midL, wideL, profile);
        } else {
            applyDayOutdoorPipeline(data, w, h, L, fineL, midL, wideL, profile);
        }

        ctx.putImageData(imageData, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const blob: Blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('Échec encodage JPEG'))),
                'image/jpeg',
                quality
            );
        });

        return {
            blob,
            dataUrl,
            mode: profile.mode,
            label: getFestivalModeLabel(profile.mode),
            profile
        };
    } finally {
        if (loaded.revokeUrl) {
            URL.revokeObjectURL(loaded.revokeUrl);
        }
    }
}
