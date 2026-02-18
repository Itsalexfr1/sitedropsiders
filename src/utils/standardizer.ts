
/**
 * Utility to standardize news and recap content with premium styling.
 * Automatically wraps specific keywords in a red uppercase style.
 */

const RED_KEYWORDS = [
    'ANYMA',
    'COACHELLA',
    'TOMORROWLAND',
    'EDC',
    'LAS VEGAS',
    'UNVRS',
    'IBIZA',
    'SWEDISH HOUSE MAFIA',
    'CERCLE FESTIVAL',
    'CERCLE',
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
    'DC-10'
];

export function standardizeContent(html: string): string {
    if (!html) return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Process text nodes only to avoid breaking HTML tags/attributes
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
    const nodesToProcess: Text[] = [];

    let currentNode;
    while (currentNode = walker.nextNode()) {
        nodesToProcess.push(currentNode as Text);
    }

    nodesToProcess.forEach(node => {
        let text = node.textContent || '';
        if (!text.trim()) return;

        let hasMatches = false;
        let resultHtml = text;

        // 1. Process explicit keywords
        RED_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            if (regex.test(resultHtml)) {
                hasMatches = true;
                resultHtml = resultHtml.replace(regex, `<span class="premium-text-red">${keyword}</span>`);
            }
        });

        // 2. Process other words in ALL CAPS (at least 3 letters)
        const exclusions = ['LES', 'DES', 'POUR', 'UNE', 'AUX', 'DANS', 'AVEC', 'SANS', 'SOUS'];
        const uppercaseRegex = /\b([A-ZÀ-Ÿ]{3,})\b/g;

        if (uppercaseRegex.test(resultHtml)) {
            resultHtml = resultHtml.replace(uppercaseRegex, (match) => {
                if (RED_KEYWORDS.includes(match.toUpperCase()) || exclusions.includes(match.toUpperCase())) {
                    return match; // Already handled or excluded
                }
                hasMatches = true;
                return `<span class="premium-text-red">${match}</span>`;
            });
        }

        if (hasMatches) {
            const span = document.createElement('span');
            span.innerHTML = resultHtml;
            node.parentNode?.replaceChild(span, node);
        }
    });

    return tempDiv.innerHTML;
}
