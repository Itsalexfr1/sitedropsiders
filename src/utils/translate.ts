const translationCache: Record<string, string> = {};
const GOOGLE_TRANSLATE_API = 'https://translate.googleapis.com/translate_a/single';

export async function translateText(text: string, targetLang: string): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed || targetLang === 'fr') return text;
    
    // Check if it's just numbers or symbols
    if (!/[a-zA-Z]/.test(trimmed)) return text;
    
    // Check cache
    const cacheKey = `${targetLang}:${trimmed}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    try {
        const params = new URLSearchParams({
            client: 'gtx',
            sl: 'fr',
            tl: targetLang,
            dt: 't',
            q: trimmed
        });

        const response = await fetch(`${GOOGLE_TRANSLATE_API}?${params}`);
        if (!response.ok) throw new Error(`Translate API error: ${response.status}`);
        
        const data = await response.json();
        if (data && data[0]) {
            const translated = data[0].map((item: any) => item[0]).join('');
            translationCache[cacheKey] = translated;
            return translated;
        }

        return text;
    } catch (error: any) {
        console.error('Translation error:', error);
        return text;
    }
}

export async function translateHTML(html: string, targetLang: string): Promise<string> {
    if (!html || !html.trim() || targetLang === 'fr') return html;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const textNodes: { node: Node; originalText: string }[] = [];
    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);

    let node;
    while ((node = walker.nextNode())) {
        const content = node.textContent?.trim();
        // Include accented French characters in the detection regex
        if (content && content.length > 1 && /[a-zA-ZÀ-ÿ]/.test(content)) {
            textNodes.push({ node, originalText: node.textContent || '' });
        }
    }

    if (textNodes.length === 0) return html;

    // Smaller chunks + delay between chunks to avoid rate-limiting on the free API
    // (the title works because it's 1 call; the body fails because it's N parallel calls)
    const CHUNK_SIZE = 3;
    const DELAY_MS = 250;

    for (let i = 0; i < textNodes.length; i += CHUNK_SIZE) {
        const chunk = textNodes.slice(i, i + CHUNK_SIZE);
        await Promise.all(
            chunk.map(async ({ node, originalText }) => {
                const translated = await translateText(originalText, targetLang);
                node.textContent = translated;
            })
        );
        // Small pause between chunks to respect API rate limits
        if (i + CHUNK_SIZE < textNodes.length) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    return tempDiv.innerHTML;
}
