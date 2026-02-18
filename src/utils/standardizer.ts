
/**
 * Utility to standardize news and recap content with premium styling.
 * Automatically wraps specific keywords in a red uppercase style.
 * 
 * UPDATE: Removed aggressive uppercase wrapping to prevent "Giant Red Letters" issue.
 */

// Fix Anyma Encoding specifically
const fixAnymaEncoding = (text: string) => {
    return text.replace(/AEDEN/g, 'ÆDEN').replace(/Ã†DEN/g, 'ÆDEN');
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
    'AVRIL',
    'MAI',
    'JUIN',
    'JUILLET',
    'AOÛT',
    'SEPTEMBRE',
    'OCTOBRE',
    'NOVEMBRE',
    'DÉCEMBRE',
    'AEDEN',
    'GENESE',
    'ÆDEN' // Added specialized character
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

        // PRE-PROCESS: Fix Encoding
        text = fixAnymaEncoding(text);

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

        // 3. Process explicit keywords (Keep them bold/red but don't force EVERY uppercase word)
        RED_KEYWORDS.forEach(keyword => {
            // Create a case-insensitive regex for the keyword
            const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
            if (regex.test(resultHtml)) {
                hasMatches = true;
                // Replace with the captured group to preserve original casing if needed, or force uppercase? 
                // User said "sans grosse lettre rouge". 
                // "Big red letter" usually refers to Drop Cap or H1.
                // But user also said "elle y sons toujours la".
                // If they mean the keywords are too much, we should tone it down.
                // Let's keep the highlighting but ensure it's not "giant".
                // The CSS class 'premium-text-bold' handles the style (likely red color).
                resultHtml = resultHtml.replace(regex, '<span class="premium-text-bold">$1</span>');
            }
        });

        // REMOVED: The aggressive uppercaseRegex block that turned ALL caps words red.
        // This was likely causing "plein de lettre géantes rouge" if many words were capitalized.

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
