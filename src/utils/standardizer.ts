
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
        .replace(/à([a-zA-Z])/g, 'à $1'); // Fix missing spaces after 'à' (e.g. àIbiza -> à Ibiza)
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

    // 2. Style existing <a> tags
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        link.classList.add('premium-link');
    });

    // 3. APPLY DROP-CAP (REMOVED - Back to Manual as requested)
    /*
    const paras = tempDiv.querySelectorAll('p');
    for (const p of Array.from(paras)) {
        if (p.textContent && p.textContent.trim().length > 50) {
            if (applyDropCap(p as HTMLElement)) break;
        }
    }
    */

    return tempDiv.innerHTML;
}
