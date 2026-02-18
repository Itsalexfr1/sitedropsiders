
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

        // 1. Process URLs/Domains (Bold & Red)
        const urlRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.(?:com|org|net|fr|eu|be|info|me|tv|io|live))\b/gi;
        if (urlRegex.test(resultHtml)) {
            hasMatches = true;
            resultHtml = resultHtml.replace(urlRegex, (match) => {
                return `<span class="premium-link">${match}</span>`;
            });
        }

        // 2. Process explicit keywords
        RED_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            if (regex.test(resultHtml)) {
                // Avoid double wrapping if it was already caught by URL regex (rare but possible)
                if (!resultHtml.includes(`>${keyword}<`)) {
                    hasMatches = true;
                    resultHtml = resultHtml.replace(regex, `<span class="premium-text-bold">${keyword}</span>`);
                }
            }
        });

        // 3. Process other words in ALL CAPS (at least 3 letters)
        const exclusions = ['LES', 'DES', 'POUR', 'UNE', 'AUX', 'DANS', 'AVEC', 'SANS', 'SOUS'];
        const uppercaseRegex = /\b([A-ZÀ-Ÿ]{3,})\b/g;

        if (uppercaseRegex.test(resultHtml)) {
            resultHtml = resultHtml.replace(uppercaseRegex, (match) => {
                // Skip if already wrapped in a span (check for both classes)
                if (RED_KEYWORDS.includes(match.toUpperCase()) || exclusions.includes(match.toUpperCase())) {
                    return match;
                }
                hasMatches = true;
                return `<span class="premium-text-bold">${match}</span>`;
            });
        }

        if (hasMatches) {
            const span = document.createElement('span');
            span.innerHTML = resultHtml;
            node.parentNode?.replaceChild(span, node);
        }
    });

    // 4. Style existing <a> tags
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        link.classList.add('premium-link');
    });

    return tempDiv.innerHTML;
}
