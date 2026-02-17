// Simple translation utility using Google Translate API (free tier)
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text: string, targetLang: string): Promise<string> {
    if (!text || targetLang === 'fr') return text;

    try {
        const params = new URLSearchParams({
            client: 'gtx',
            sl: 'fr',
            tl: targetLang,
            dt: 't',
            q: text
        });

        const response = await fetch(`${GOOGLE_TRANSLATE_API}?${params}`);
        const data = await response.json();

        if (data && data[0]) {
            return data[0].map((item: any) => item[0]).join('');
        }

        return text;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

export async function translateHTML(html: string, targetLang: string): Promise<string> {
    if (!html || targetLang === 'fr') return html;

    // Extract text from HTML and translate
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const textNodes: { node: Node; originalText: string }[] = [];

    // Find all text nodes
    const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null
    );

    let node;
    while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.trim()) {
            textNodes.push({ node, originalText: node.textContent });
        }
    }

    // Translate all text nodes
    for (const { node, originalText } of textNodes) {
        const translated = await translateText(originalText, targetLang);
        node.textContent = translated;
    }

    return tempDiv.innerHTML;
}
