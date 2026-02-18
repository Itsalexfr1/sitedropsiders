
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
    'ÆDEN',
    'SONUS FESTIVAL',
    'SONUS',
    'IGLOOFEST',
    'OSHEAGA'
];

/**
 * Helper to apply drop-cap to the first letter of an element's text.
 */
function applyDropCap(element: HTMLElement) {
    if (element.querySelector('.drop-cap')) return;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node = walker.nextNode();

    while (node) {
        const text = node.textContent || '';
        const trimmed = text.trimStart();
        if (trimmed.length > 0) {
            // Found the first text node with content
            const firstChar = trimmed[0];
            const leadingWhitespace = text.substring(0, text.indexOf(firstChar));
            const remaining = text.substring(text.indexOf(firstChar) + 1);

            const span = document.createElement('span');
            span.className = 'drop-cap';
            span.textContent = firstChar;

            const parent = node.parentNode;
            if (parent) {
                // If there's leading whitespace, keep it as a text node before the span
                if (leadingWhitespace) {
                    parent.insertBefore(document.createTextNode(leadingWhitespace), node);
                }
                parent.insertBefore(span, node);
                node.textContent = remaining;
            }
            return true; // Success
        }
        node = walker.nextNode();
    }
    return false;
}

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
        text = fixAnymaEncoding(text);

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

    // 3. APPLY DROP-CAP
    // Standard Premium Look: Apply to the first substantive paragraph
    const paras = tempDiv.querySelectorAll('p');
    for (const p of Array.from(paras)) {
        // Skip short meta-paragraphs (like "Published on...") if possible, 
        // but cleaner to just apply to the first one that has enough text.
        if (p.textContent && p.textContent.trim().length > 50) {
            if (applyDropCap(p as HTMLElement)) break; // Only apply to the first one
        }
    }

    return tempDiv.innerHTML;
}
