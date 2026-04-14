/**
 * Ultra-safe resolveImageUrl utility.
 * We only touch the URL if it's a raw filename without any path markers.
 *
 * NOTE: Do NOT remove double /uploads/uploads/ paths.
 * The Cloudflare R2 Worker is configured with route /uploads/* and strips
 * the leading /uploads/ prefix, so /uploads/uploads/file.jpg resolves to
 * the R2 key "uploads/file.jpg" — this is correct by design.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    let processedUrl = String(url).trim();
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // 1. If it starts with http or //, it's absolute, LEAVE IT 100% ALONE.
    // Do NOT clean double /uploads/ in absolute URLs — the R2 worker requires it.
    if (processedUrl.startsWith('http') || processedUrl.startsWith('//')) {
        return processedUrl.startsWith('//') ? 'https:' + processedUrl : processedUrl;
    }

    // 2. If it starts with /, it's already a root-relative path, LEAVE IT ALONE
    if (processedUrl.startsWith('/')) {
        return processedUrl;
    }

    // 3. If it starts with uploads/, we just need a leading slash
    if (processedUrl.startsWith('uploads/')) {
        return '/' + processedUrl;
    }

    // 4. Otherwise, it's a raw filename (e.g. image.jpg) -> assume it's in /uploads/
    return '/uploads/' + processedUrl;
}
