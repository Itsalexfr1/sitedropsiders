/**
 * fixWebmDuration — injecte la vraie duree dans le header EBML d'un blob WebM.
 * Sans ca, MediaRecorder genere des WebM sans metadata de duree,
 * ce qui empeche le navigateur de scrubber/bufferer correctement.
 *
 * Base sur: https://www.npmjs.com/package/fix-webm-duration
 */

function readVint(data: DataView, start: number): { value: number; length: number } {
    const length = 8 - Math.floor(Math.log2(data.getUint8(start)));
    let value = data.getUint8(start) & ((1 << (8 - length)) - 1);
    for (let i = 1; i < length; i++) {
        value = (value * 256) + data.getUint8(start + i);
    }
    return { value, length };
}

function writeVint(value: number, length: number): number[] {
    const result: number[] = [];
    for (let i = length - 1; i >= 0; i--) {
        result.push((value >> (i * 8)) & 0xff);
    }
    result[0] |= (1 << (8 - length));
    return result;
}

function findElement(data: DataView, id: number[], start: number, end: number): number {
    let offset = start;
    while (offset < end) {
        let match = true;
        for (let i = 0; i < id.length; i++) {
            if (data.getUint8(offset + i) !== id[i]) { match = false; break; }
        }
        if (match) return offset;
        // Avancer d'un octet (recherche brute)
        offset++;
    }
    return -1;
}

export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
    if (!blob || blob.size === 0 || durationMs <= 0) return blob;

    try {
        const buffer = await blob.arrayBuffer();
        const data = new DataView(buffer);
        const arr = new Uint8Array(buffer);

        // Chercher l'element Duration dans le bloc Info de Segment
        // ID Duration = 0x4489
        const DURATION_ID = [0x44, 0x89];
        const durationPos = findElement(data, DURATION_ID, 0, Math.min(arr.length, 50000));

        if (durationPos === -1) {
            // Duration absente — on ne peut pas patcher sans rewrite complet
            // Retourner le blob original (le Stream HLS prendra le relais)
            console.warn('[fixWebm] Duration element non trouve, retour blob original');
            return blob;
        }

        // Lire la taille de l'element Duration (vint apres l'ID)
        const sizeInfo = readVint(data, durationPos + 2);
        const valueOffset = durationPos + 2 + sizeInfo.length;

        // Duration stockee en Float64 (8 octets) dans WebM
        const clone = new Uint8Array(buffer.slice(0));
        const durationView = new DataView(clone.buffer, valueOffset, 8);
        // La duree dans WebM est en millisecondes (timecodeScale = 1000000 => en ms)
        durationView.setFloat64(0, durationMs, false);

        return new Blob([clone], { type: blob.type });
    } catch (e) {
        console.warn('[fixWebm] Erreur patch duree:', e);
        return blob;
    }
}
