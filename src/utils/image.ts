/**
 * Resolve an image URL to be domain-agnostic and handle fallback images.
 * This function is critical for fixing the "broken images" issue across the site.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    // Normalize string type and trim
    let processedUrl = String(url).trim();
    
    if (!processedUrl || processedUrl === 'undefined' || processedUrl === 'null') return fallback;

    // 1. Handle Protocol-Relative URLs
    if (processedUrl.startsWith('//')) {
        return 'https:' + processedUrl;
    }

    // 2. Handle Absolute URLs to Dropsiders
    // We KEEP them absolute so they load from the live server if local assets are missing
    if (/^https?:\/\/(www\.)?dropsiders\.fr/i.test(processedUrl)) {
        // Clean double uploads if present in the absolute URL
        if (processedUrl.includes('/uploads/uploads/')) {
            processedUrl = processedUrl.replace('/uploads/uploads/', '/uploads/');
        }
        return processedUrl;
    }

    // 3. Handle Other Absolute URLs (External)
    if (processedUrl.startsWith('http')) {
        return processedUrl;
    }

    // 4. Handle Relative Paths
    // Clean redundant /uploads/uploads/ first
    if (processedUrl.includes('uploads/uploads/')) {
        processedUrl = processedUrl.replace('uploads/uploads/', 'uploads/');
    }

    // Ensure it starts with /uploads/ if it doesn't already
    // This fixes the Wiki/Team images where only the filename is stored (e.g. djs_name.jpg)
    if (!processedUrl.startsWith('/') && !processedUrl.startsWith('uploads/')) {
        processedUrl = '/uploads/' + processedUrl;
    } else if (processedUrl.startsWith('uploads/')) {
        processedUrl = '/' + processedUrl;
    }

    // Ensure single leading slash and clean up
    if (!processedUrl.startsWith('/')) {
        processedUrl = '/' + processedUrl;
    }
    
    // Final check for redundant /uploads/uploads/ just in case
    processedUrl = processedUrl.replace(/^\/uploads\/uploads\//, '/uploads/');

    return processedUrl;
}
