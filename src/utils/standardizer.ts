
/**
 * Utility to standardize news and recap content with premium styling.
 * Automatically wraps specific keywords in a red uppercase style.
 * 
 * UPDATE: Removed aggressive uppercase wrapping to prevent "Giant Red Letters" issue.
 */

// Fix Common Encoding issues (Emojis and special chars)
export const fixEncoding = (text: string) => {
    if (!text) return text;
    let s = text;

    const USER_REPORTED: Record<string, string> = {
        // Hex escaped keys for safety against editor encoding issues
        '\u00E0\u00B0\u00A8': '📍', // à°¨
        '\u00E0\u00B0\u00A5': '🔥', // à°¥
        '\u00E0\u00A2\u00EF\u00B8\u008F': '☀️', // à¢ï¸ (Sun?)
        '\u00E0\u00A2\u00B3': '⌛', // à¢³ (Hourglass?)
        '\u00E0\u00A2\u20AC\u00EF\u00B8\u008F': '☀️', // '˜€ï¸  (Another Sun variant?)
        '\'\u008F\u00B3': '⌛', // ' ³ (With 8F control char)
        '\'\u00B3': '⌛', // '³ (Hourglass) -- User provided ' ³
        "' \u00B3": '⌛', // ' ³

        // Article specific
        'Knofourn\u00E0\u0083\u00A9e': 'Knock2',

        // Quotes and Apostrophes
        "n'\u20AC\u2122": "n'", "l'\u20AC\u2122": "l'", "d'\u20AC\u2122": "d'",
        "s'\u20AC\u2122": "s'", "c'\u20AC\u2122": "c'", "C'\u20AC\u2122": "C'", "qu'\u20AC\u2122": "qu'",
        "n'\u0080\u0099": "n'", "l'\u0080\u0099": "l'", "d'\u0080\u0099": "d'",
        "s'\u0080\u0099": "s'", "c'\u0080\u0099": "c'", "C'\u0080\u0099": "C'",

        'àvà©nement': 'événement', 'à\u0083\u0089và\u0083\u00ABnement': 'événement',

        // General cleanup
        'Cà\u0083\u00B4tà\u0083\u00A9': 'Côté', 'Tià\u0083\u00ABsto': 'Tiësto',
        'premià\u0083\u00A8re': 'première', 'thà\u0083\u00A9à\u0083\u00A2tre': 'théâtre',
        'Baptisà\u0083\u00A9e': 'Baptisée', 'terminà\u0083\u00A9e': 'terminée',
        'immà\u0083\u00A9diate': 'immédiate', 'fà\u0083\u00A9vrier': 'février',
        'fà\u0083\u00AAter': 'fêter', 'dà\u0083\u00A9cennies': 'décennies',
        'entià\u0083\u00A8re': 'entière', 'prà\u0083\u00A9pare': 'prépare',
        'dà\u0083\u00A9voile': 'dévoile', 'rà\u0083\u00A9plique': 'réplique',
        'emblà\u0083\u00A9matiques': 'emblématiques', 's\'apprà\u0083\u00AAtent': "s'apprêtent",
        'dernià\u0083\u00A8res': 'dernières',
        'Ushuaa': 'Ushuaïa',
        'AEDEN': 'ÆDEN', 'Ã†DEN': 'ÆDEN'
    };

    const SPELLING_CORRECTIONS: Record<string, string> = {
        // Grammaire et expressions communes
        "y'a n'a": "il y en a",
        "y'a": "il y a",
        "si y'a": "s'il y a",
        "enfaite": "en fait",
        "dailleur": "d'ailleurs",
        "en tout cas": "en tout cas", // Déjà correct
        "quel qu'un": "quelqu'un",
        "quelqu'un": "quelqu'un",
        "rendez vous": "rendez-vous",
        "Rendez vous": "Rendez-vous",
        "parmis": "parmi",
        "hormis": "hormis",
        "malgrès": "malgré",
        "apart": "à part",
        "certe": "certes",
        "acceuil": "accueil",
        "connection": "connexion",
        
        // Accents manquants (Minuscules)
        "evenement": "événement",
        "evenements": "événements",
        "evennement": "événement",
        "evènement": "événement",
        "fete": "fête",
        "fetes": "fêtes",
        "bientot": "bientôt",
        "deja": "déjà",
        "tres": "très",
        "apres": "après",
        "plutot": "plutôt",
        "etant": "étant",
        "etait": "était",
        "etant ": "étant ",
        "etes": "êtes",
        "etre": "être",
        "cote": "côté",
        "diner": "dîner",
        "cloture": "clôture",
        "controle": "contrôle",
        "n'hesitez pas": "n'hésitez pas",
        
        // Accents manquants (Majuscules)
        "Evenement": "Événement",
        "Apres": "Après",
        "Deja": "Déjà",
        "Etre": "Être",
        "Etes": "Êtes",
        "N'hesitez pas": "N'hésitez pas",
        "A bientot": "À bientôt",
        "A demain": "À demain"
    };

    // 1. Fix encoding first
    for (const [bad, good] of Object.entries(USER_REPORTED)) {
        s = s.split(bad).join(good);
    }

    // 2. Fix common spelling mistakes
    // We use regex for some to ensure word boundaries
    for (const [bad, good] of Object.entries(SPELLING_CORRECTIONS)) {
        // Simple replace for common multi-word expressions or those with apostrophes
        if (bad.includes(' ') || bad.includes("'")) {
            s = s.split(bad).join(good);
        } else {
            // Use word boundary for single words to avoid partial replacement
            const regex = new RegExp(`\\b${bad}\\b`, 'g');
            s = s.replace(regex, good);
        }
    }

    // 2. COMMON TRIPLE/DOUBLE PATTERNS
    s = s
        .replace(/\u00E0\u0083\u00A9/g, 'é').replace(/\u00E0\u0083\u00A8/g, 'è')
        .replace(/\u00E0\u0083\u00AA/g, 'ê').replace(/\u00E0\u0083\u00AB/g, 'ë')
        .replace(/\u00E0\u0083\u00A7/g, 'ç').replace(/\u00E0\u0083\u00A0/g, 'à')
        .replace(/\u00E0\u0083\u00B4/g, 'ô').replace(/\u00E0\u0083\u00AE/g, 'î')
        .replace(/\u00E0\u0083\u00AF/g, 'ï').replace(/\u00E0\u0083\u00B9/g, 'ù')
        .replace(/\u00E0\u0083\u0089/g, 'É').replace(/\u00E0\u0083\u0080/g, 'À')
        .replace(/\u00E0\u0083\u00A2/g, 'â')
        .replace(/\u00E0\u0083/g, 'à') // Final fallback
        .replace(/àƒ©/g, 'é').replace(/àƒ¨/g, 'è')
        .replace(/\u00E0\u00A2\u20AC\u2122/g, "'").replace(/\u00E0\u00A2\u0080\u0099/g, "'")
        .replace(/ÃƒÂ©/g, 'é').replace(/ÃƒÂ /g, 'à').replace(/ÃƒÂ¨/g, 'è')
        .replace(/ÃƒÂª/g, 'ê').replace(/ÃƒÂ§/g, 'ç')
        .replace(/Ã©/g, 'é').replace(/Ã /g, 'à').replace(/Ã¨/g, 'è')
        .replace(/Ãª/g, 'ê').replace(/Ã§/g, 'ç').replace(/Ã´/g, 'ô')
        .replace(/├®/g, 'é').replace(/├á/g, 'à').replace(/├¿/g, 'è')
        .replace(/├¬/g, 'ê').replace(/├â/g, 'Â').replace(/├å/g, 'Æ')
        .replace(/Â«/g, '«').replace(/Â»/g, '»').replace(/à‚«/g, '«').replace(/à‚»/g, '»')
        .replace(/ÔÇô/g, '–').replace(/ÔÇÖ/g, "'").replace(/â€™/g, "'")
        .replace(/Ã…Â“/g, 'œ').replace(/Ã…â€œ/g, 'œ')
        .replace(/àƒÂ à‚Âƒà‚Â /g, 'à')
        .replace(/ÃƒÂ Ã‚ÂƒÃ‚Â /g, 'à')
        // Remnants
        .replace(/à¢/g, "'").replace(/àƒ/g, "à").replace(/' /g, "'")
        // Basic spacing
        .replace(/à([a-zA-Z0-9])/gi, 'à $1')
        .replace(/Ushuaa/gi, 'Ushuaïa')
        .replace(/AEDEN/g, 'ÆDEN').replace(/Ã†DEN/g, 'ÆDEN');

    return s;
};

const RED_KEYWORDS = [
    'ANYMA',
    'MOSIMANN',
    'CALVIN HARRIS',
    'AFROJACK',
    'ALOK',
    'VINI VICI',
    'W&W',
    'KUNGS',
    'OFENBACH',
    'VLADIMIR CAUCHEMAR',
    'DOM DOLLA',
    'PEGGY GOU',
    'FISHER',
    'CHRIS LAKE',
    'JOHN SUMMIT',
    'MAU P',
    'PAWSA',
    'CLAPTONE',
    'SOLOMUN',
    'BLACK COFFEE',
    'KEVIN DE VRIES',
    'TALE OF US',
    'MATHAME',
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
    'FRED AGAIN..',
    'SKRILLEX',
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
    'OSHEAGA',
    'TRANCE',
    'PROGRESSIVE HOUSE',
    'HARDSTYLE',
    'DRUM & BASS'
];



export function standardizeContent(html: string): string {
    if (!html) return html;

    try {

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // 1. Process text nodes for keywords and links
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
    const nodesToProcess: Text[] = [];

    let currentNode;
    while (currentNode = walker.nextNode()) {
        const node = currentNode as Text;
        // Skip text nodes that are already inside an <a> tag
        let parent = node.parentElement;
        let isInsideLink = false;
        while (parent && parent !== tempDiv) {
            if (parent.tagName === 'A') {
                isInsideLink = true;
                break;
            }
            parent = parent.parentElement;
        }
        if (!isInsideLink) {
            nodesToProcess.push(node);
        }
    }

    nodesToProcess.forEach(node => {
        let text = node.textContent || '';
        if (!text.trim()) return;

        // PRE-PROCESS: Fix Encoding
        text = fixEncoding(text);

        let hasMatches = false;
        let resultHtml = text;

        // 1.0 Process Bold Markdown **text**
        if (resultHtml.includes('**')) {
            const boldRegex = /\*\*([^*]+)\*\*/g;
            if (boldRegex.test(resultHtml)) {
                hasMatches = true;
                resultHtml = resultHtml.replace(boldRegex, '<strong>$1</strong>');
            }
        }

        // 1.1 Process Markdown Links [text](url)
        const markdownLinks: string[] = [];
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        if (markdownLinkRegex.test(resultHtml)) {
            hasMatches = true;
            resultHtml = resultHtml.replace(markdownLinkRegex, (_match, text, url) => {
                const linkHtml = `<a href="${url}" target="_blank" class="premium-link">${text}</a>`;
                markdownLinks.push(linkHtml);
                return `__MARKDOWN_LINK_${markdownLinks.length - 1}__`;
            });
        }

        // 1.2 "No-Code" Link Pattern: "Text : URL" or "Text -> URL"
        // Improved: Captures optional list markers and handles labels better
        const simpleLinkRegex = /^([-•*]\s*)?([^:\n\-*]+)\s*[:\->]\s*(https?:\/\/\b(?:www\.)?[a-z0-9-]+\.[a-z]{2,}\b\S*|www\.[a-z0-9-]+\.[a-z]{2,}\b\S*)/gi;
        const simpleLinks: string[] = [];
        if (simpleLinkRegex.test(resultHtml)) {
            hasMatches = true;
            resultHtml = resultHtml.replace(simpleLinkRegex, (_match, marker, label, url) => {
                const cleanLabel = label.replace(/[*_\[\]]/g, '').trim();
                const linkHtml = `<a href="${url.startsWith('www') ? 'https://' + url : url}" target="_blank" class="premium-link">${cleanLabel}</a>`;
                simpleLinks.push(linkHtml);
                return `${marker || ''}__SIMPLE_LINK_${simpleLinks.length - 1}__`;
            });
        }

        // 1.3 Process Remaining URLs/Domains (Clickable, Bold & Red)
        const urlRegex = /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.(?:com|org|net|fr|eu|be|info|me|tv|io|live))\b/gi;
        if (urlRegex.test(resultHtml)) {
            const matches = resultHtml.match(urlRegex);
            if (matches) {
                // Avoid wrapping placeholders
                const filtered = matches.filter(m => !m.includes('__LINK_'));
                if (filtered.length > 0) {
                    hasMatches = true;
                    resultHtml = resultHtml.replace(urlRegex, (match) => {
                        if (match.includes('__LINK_')) return match;
                        const href = match.startsWith('http') ? match : `https://${match}`;
                        return `<a href="${href}" target="_blank" class="premium-link">${match}</a>`;
                    });
                }
            }
        }

        // 1.4 Process explicit keywords
        RED_KEYWORDS.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
            if (regex.test(resultHtml)) {
                hasMatches = true;
                resultHtml = resultHtml.replace(regex, '<span class="premium-text-bold">$1</span>');
            }
        });

        // 1.5 Restore Links
        markdownLinks.forEach((linkHtml, index) => {
            resultHtml = resultHtml.replace(`__MARKDOWN_LINK_${index}__`, linkHtml);
        });
        simpleLinks.forEach((linkHtml, index) => {
            resultHtml = resultHtml.replace(`__SIMPLE_LINK_${index}__`, linkHtml);
        });

        // 1.6 Process Lines (Lists and Newlines)
        if (resultHtml.includes('\n') || /^[ \t]*[-•*] /m.test(resultHtml)) {
            hasMatches = true;
            const lines = resultHtml.split('\n');
            resultHtml = lines.map(line => {
                const trimmed = line.trim();
                // Match standard list markers
                const listMatch = line.match(/^([ \t]*)([-•*])\s+(.*)/);
                if (listMatch) {
                    const indent = listMatch[1];
                    const content = listMatch[3];
                    return `${indent}<span class="premium-bullet">•</span> ${content}`;
                }
                // Match bullet without space
                if (trimmed.startsWith('•') && !trimmed.startsWith('• ')) {
                    return `<span class="premium-bullet">•</span> ${trimmed.substring(1)}`;
                }
                return line;
            }).join('<br/>');
        }

        if (hasMatches) {
            const span = document.createElement('span');
            span.innerHTML = resultHtml;
            node.parentNode?.replaceChild(span, node);
        }
    });

    // 2. Ensure ALL <a> tags have target="_blank"
    const allLinks = tempDiv.querySelectorAll('a');
    allLinks.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
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
                headerText.includes('practical info') ||
                headerText.includes('infos festival') ||
                headerText.includes('festival info') ||
                headerText.includes('pratique') ||
                headerText.includes('practical') ||
                headerText.includes('billetterie') ||
                headerText.includes('ticketing') ||
                headerText.includes('tickets')) {
                inInfoPratiques = true;
            } else {
                inInfoPratiques = false;
            }
        }

        if (tagName === 'P' || tagName === 'LI') {
            const p = child as HTMLElement;
            const text = p.textContent?.trim() || '';

            // Rule 1: Starts with an emoji indicating info
            const hasInfoEmoji = /^[📍📅🎟️💵🎫🎫💰🗺️🏨✈️🚅🚗].*/u.test(text);

            // Rule 2: Specifically centered text (usually info blocks)
            const isCentered = p.style.textAlign === 'center' || p.classList.contains('text-center');

            // Rule 3: Starts with a dash or bullet (Human-friendly list)
            const isListLike = /^([ \t]*)([-•*])/.test(text);

            if (inInfoPratiques || hasInfoEmoji || isCentered || isListLike) {
                p.classList.add('no-lettrage');

                // If it's a list point, replace the character with a styled bullet
                if (isListLike) {
                    const content = p.innerHTML;
                    // Replace the leading character, supporting indentation
                    p.innerHTML = content.replace(/^(\s*)([-•*])\s*/, '$1<span class="premium-bullet">•</span> ');
                }
            }
        }
    });

        return tempDiv.innerHTML;
    } catch (e) {
        console.error("Standardize Error:", e);
        return html;
    }
}
