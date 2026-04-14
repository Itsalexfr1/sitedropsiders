/**
 * Ultra-safe resolveImageUrl utility.
 * Resolves image paths to be relative to the current host and handles R2 worker requirements.
 *
 * CRITICAL: The Cloudflare R2 Worker route is /uploads/*.
 * It strips the first "/uploads/" and uses the remaining string as the R2 key.
 * Therefore, for a file in the "uploads" folder of the R2 bucket,
 * the URL MUST be: /uploads/uploads/filename.jpg
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    let processedUrl = String(url).trim();
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // 1. Strip the main domain if present
    processedUrl = processedUrl.replace(/^https?:\/\/(www\.)?dropsiders\.fr/i, '');

    // 2. If it's an absolute URL to another domain, return as is
    if (processedUrl.startsWith('http') || processedUrl.startsWith('//')) {
        return processedUrl.startsWith('//') ? 'https:' + processedUrl : processedUrl;
    }

    // 3. Handle local static assets
    if (processedUrl.startsWith('/images/') || processedUrl.startsWith('/assets/') || processedUrl === '/Logo.png') {
        return processedUrl;
    }

    // 4. Ensure we have a leading slash for normalization
    if (!processedUrl.startsWith('/')) {
        processedUrl = '/' + processedUrl;
    }

    // 5. R2 Worker Logic: Enforce double /uploads/uploads/
    // Case A: Starts with /uploads/uploads/ -> ALREADY CORRECT
    if (processedUrl.startsWith('/uploads/uploads/')) {
        // do nothing
    }
    // Case B: Starts with /uploads/migrated/ -> LIKELY CORRECT (single prefix)
    else if (processedUrl.startsWith('/uploads/migrated/')) {
        // do nothing
    }
    // Case C: Starts with /uploads/FILENAME -> Add the missing "uploads/" segment
    else if (processedUrl.startsWith('/uploads/')) {
        processedUrl = '/uploads/uploads/' + processedUrl.substring(9);
    }
    // Case D: It's a raw path or /filename -> Add the full /uploads/uploads/ prefix
    else {
        // Remove leading slash if any before prefixing
        const cleanPath = processedUrl.startsWith('/') ? processedUrl.substring(1) : processedUrl;
        processedUrl = '/uploads/uploads/' + cleanPath;
    }

    // Final cleanup of redundant slashes (but preserve the double ones in path)
    return processedUrl.replace(/\/+/g, '/').replace(/^\/uploads\/uploads\//, '/uploads/uploads/');
}
