import { forwardRef, useImperativeHandle, useRef } from 'react';
import { toPng } from 'html-to-image';
import type { DropsidersCard } from '../../context/UserContext';
import { DropsidersCardComponent } from './DropsidersCard';

// ─── Print Specs ──────────────────────────────────────────────────────────────
// Card physical size: 63mm × 88mm (standard TCG)
// With 3mm bleed all sides: 69mm × 94mm
// At 300 DPI: 1 mm ≈ 11.81px → 69mm × 300/25.4 ≈ 815px, 94mm × 300/25.4 ≈ 1110px
// We render a card at scale=3.4 (~816×1120px total including bleed wrapper)
// The bleed wrapper adds 36px (3mm) on each side

const PRINT_SCALE = 3.4;
// Card base dimensions in the component: 240px wide × 350px tall
// At scale 3.4: 816px × 1190px → slighly above 300 DPI equivalent
const BLEED_PX = Math.round(11.81 * 3); // 3mm bleed = ~35px at 300 DPI

export interface CardPrintExporterHandle {
    exportFront(): Promise<Blob>;
    exportBack(): Promise<Blob>;
    exportFoilMask(): Promise<Blob>;
}

interface CardPrintExporterProps {
    card: DropsidersCard;
}

export const CardPrintExporter = forwardRef<CardPrintExporterHandle, CardPrintExporterProps>(
    ({ card }, ref) => {
        const frontRef = useRef<HTMLDivElement>(null);
        const backRef = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => ({
            async exportFront(): Promise<Blob> {
                if (!frontRef.current) throw new Error('Front ref not ready');
                return domToBlob(frontRef.current, card);
            },
            async exportBack(): Promise<Blob> {
                if (!backRef.current) throw new Error('Back ref not ready');
                return domToBlob(backRef.current, card);
            },
            async exportFoilMask(): Promise<Blob> {
                return generateFoilMask(card);
            },
        }));

        const cardW = Math.round(240 * PRINT_SCALE);
        const cardH = Math.round(350 * PRINT_SCALE);
        const totalW = cardW + BLEED_PX * 2;
        const totalH = cardH + BLEED_PX * 2;

        // Determine bleed color: use border color of card theme (we use a neutral dark)
        const bleedStyle: React.CSSProperties = {
            width: totalW,
            height: totalH,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        };

        return (
            // Hidden off-screen container — not visible to the user
            <div
                style={{
                    position: 'fixed',
                    top: -99999,
                    left: -99999,
                    zIndex: -1,
                    pointerEvents: 'none',
                }}
                aria-hidden="true"
            >
                {/* FRONT with bleed wrapper */}
                <div ref={frontRef} style={bleedStyle}>
                    <DropsidersCardComponent
                        card={card}
                        flippable={false}
                        scale={PRINT_SCALE}
                        showDate={false}
                    />
                </div>

                {/* BACK with bleed wrapper — we show the card flipped */}
                <div ref={backRef} style={{ ...bleedStyle, marginTop: 20 }}>
                    <DropsidersCardComponent
                        card={card}
                        flippable={true}
                        scale={PRINT_SCALE}
                        showDate={false}
                    />
                </div>
            </div>
        );
    }
);

CardPrintExporter.displayName = 'CardPrintExporter';

// ─── DOM → Blob helper ────────────────────────────────────────────────────────
async function domToBlob(node: HTMLElement, _card: DropsidersCard): Promise<Blob> {
    const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 1, // We handle scaling in the PRINT_SCALE — no further pixel ratio needed
        skipFonts: false,
        style: {
            // Ensure no transforms applied externally interfere
            transform: 'none',
            transformOrigin: 'top left',
        },
        filter: (element) => {
            // Skip framer-motion overlay hints that only exist in DOM for animation
            if (element instanceof HTMLElement && element.dataset.fmHint) return false;
            return true;
        },
    });
    return dataUrlToBlob(dataUrl);
}

// ─── Foil Mask Generator ──────────────────────────────────────────────────────
// Generates a B&W PNG where WHITE = foil zones, BLACK = no foil
// Zones: outer border frame + illustration box area
async function generateFoilMask(card: DropsidersCard): Promise<Blob> {
    const cardW = Math.round(240 * PRINT_SCALE);
    const cardH = Math.round(350 * PRINT_SCALE);
    const totalW = cardW + BLEED_PX * 2;
    const totalH = cardH + BLEED_PX * 2;

    const canvas = document.createElement('canvas');
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;

    // Background = black (no foil)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, totalW, totalH);

    // Foil zone 1: Card border frame (outer ~11px border at print scale)
    const borderPx = Math.round(11 * PRINT_SCALE);
    const borderRadius = Math.round(24 * PRINT_SCALE);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, BLEED_PX, BLEED_PX, cardW, cardH, borderRadius);
    ctx.fill();

    // Subtract inner non-foil area (parchment body = inner area)
    const innerX = BLEED_PX + borderPx;
    const innerY = BLEED_PX + borderPx;
    const innerW = cardW - borderPx * 2;
    const innerH = cardH - borderPx * 2;
    ctx.fillStyle = '#000000';
    roundRect(ctx, innerX, innerY, innerW, innerH, Math.round(10 * PRINT_SCALE));
    ctx.fill();

    // Foil zone 2: Illustration box area (approx position in card layout)
    // In card layout: image box starts ~35px from top, height ~42% of card
    const illustBoxX = innerX + Math.round(5 * PRINT_SCALE);
    const illustBoxY = BLEED_PX + Math.round(37 * PRINT_SCALE);
    const illustBoxW = cardW - borderPx * 2 - Math.round(10 * PRINT_SCALE);
    const illustBoxH = Math.round(cardH * 0.42);
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, illustBoxX, illustBoxY, illustBoxW, illustBoxH, Math.round(5 * PRINT_SCALE));
    ctx.fill();

    // Foil zone 3: Rarity card name header area (for legendary/epic)
    if (card.rarity === 'legendary' || card.rarity === 'epic') {
        const headerY = BLEED_PX + Math.round(6 * PRINT_SCALE);
        const headerH = Math.round(28 * PRINT_SCALE);
        ctx.fillStyle = '#888888'; // 50% grey = 50% foil intensity
        roundRect(ctx, innerX, headerY, innerW, headerH, Math.round(3 * PRINT_SCALE));
        ctx.fill();
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
        }, 'image/png');
    });
}

// ─── Canvas roundRect helper (compatible with older browsers) ─────────────────
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// ─── DataURL → Blob ──────────────────────────────────────────────────────────
function dataUrlToBlob(dataUrl: string): Blob {
    const [header, data] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

// ─── Blob → Base64 string ────────────────────────────────────────────────────
export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
