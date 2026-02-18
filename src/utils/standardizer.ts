
/**
 * Utility to standardize news and recap content with premium styling.
 * Automatically wraps specific keywords in a red uppercase style.
 * 
 * UPDATE: Removed aggressive uppercase wrapping to prevent "Giant Red Letters" issue.
 */

// Fix Common Encoding issues (Emojis and special chars)
const fixEncoding = (text: string) => {
    return text
        .replace(/AEDEN/g, 'ÆDEN')
        .replace(/Ã†DEN/g, 'ÆDEN')
        .replace(/­ƒôì/g, '📍')
        .replace(/ƒôì/g, '📍')
        .replace(/­ƒôà/g, '📅')
        .replace(/ƒôà/g, '📅')
        .replace(/­ƒÄƒ´©Å/g, '🎟️')
        .replace(/ƒÄƒ´©Å/g, '🎟️')
        .replace(/à([a-zA-Z0-9])/g, 'à $1') // Fix missing spaces after 'à'
        .replace(/Ushuaa/gi, 'Ushuaïa')
        .replace(/ÔåÆ/g, '→')
        .replace(/┬▓/g, '²')
        .replace(/├é/g, 'Â')
        .replace(/├ä/g, 'Ä')
        .replace(/ÔÇô/g, '–');
};

const RED_KEYWORDS = [
    'ANYMA',
    'COACHELLA',
    'TOMORROWLAND',
    'EDC',
    'EDC WEEK',
    'LAS VEGAS',
    'UNVRS',
    'IBIZA',
    'SWEDISH HOUSE MAFIA',
    'CERCLE FESTIVAL',
    'CERCLE',
    'ULTRA MIAMI',
    'ULTRA',
    'RESISTANCE',
    'MARTIN GARRIX',
    'DAVID GUETTA',
    'ARMIN VAN BUUREN',
    'TIËSTO',
    'CHARLOTTE DE WITTE',
    'AMELIE LENS',
    'FISHER',
    'CHRIS LAKE',
    'JOHN SUMMIT',
    'FRED AGAIN..',
    'SKRILLEX',
    'PEGGY GOU',
    'HÏ IBIZA',
    'USHUAÏA',
    'AMNESIA',
    'PACHA',
    'DC-10',
    'MARS',
    'AEDEN',
    'GENESE',
    'ÆDEN',
    'SONUS FESTIVAL',
    'SONUS',
    'IGLOOFEST',
    'OSHEAGA'
];



export function standardizeContent(html: string): string {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. Process text nodes for keywords and links
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
    const nodesToProcess: Text[] = [];

    let currentNode;
    while (currentNode = walker.nextNode()) {
        nodesToProcess.push(currentNode as Text);
    }

    nodesToProcess.forEach(node => {
        let text = node.textContent || '';
        if (!text.trim()) return;

        // PRE-PROCESS: Fix Encoding
        text = fixEncoding(text);

        let hasMatches = false;
        let resultHtml = text;

        // 1.1 Process URLs/Domains (Bold & Red)
        const urlRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.(?:com|org|net|fr|eu|be|info|me|tv|io|live))\b/gi;
        if (urlRegex.test(resultHtml)) {
            hasMatches = true;
            resultHtml = resultHtml.replace(urlRegex, (match) => {
                return `<span class="premium-link">${match}</span>`;
            });
        }

        // 1.2 Process explicit keywords
        RED_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
            if (regex.test(resultHtml)) {
                hasMatches = true;
                resultHtml = resultHtml.replace(regex, '<span class="premium-text-bold">$1</span>');
            }
        });

        if (hasMatches) {
            const span = document.createElement('span');
            span.innerHTML = resultHtml;
            node.parentNode?.replaceChild(span, node);
        }
    });

    // 3. Process paragraphs for Infos Pratiques / Alignment
    const children = Array.from(tempDiv.children);
    let inInfoPratiques = false;

    children.forEach(child => {
        const tagName = child.tagName.toUpperCase();

        // Detect Info Headers
        if (tagName === 'H1' || tagName === 'H2' || tagName === 'H3' || tagName === 'H4') {
            const headerText = child.textContent?.toLowerCase() || '';
            if (headerText.includes('infos pratiques') ||
                headerText.includes('infos festival') ||
                headerText.includes('pratique') ||
                headerText.includes('billetterie') ||
                headerText.includes('tickets')) {
                inInfoPratiques = true;
            } else {
                inInfoPratiques = false;
            }
        }

        if (tagName === 'P') {
            const p = child as HTMLElement;
            const text = p.textContent?.trim() || '';

            // Rule 1: Starts with an emoji indicating info
            const hasInfoEmoji = /^[📍📅🎟️💵🎫🎫💰🗺️🏨✈️🚅🚗].*/u.test(text);

            // Rule 2: Specifically centered text (usually info blocks)
            const isCentered = p.style.textAlign === 'center' || p.classList.contains('text-center');

            if (inInfoPratiques || hasInfoEmoji || isCentered) {
                p.classList.add('no-lettrage');
            }
        }
    });

    return tempDiv.innerHTML;
}
