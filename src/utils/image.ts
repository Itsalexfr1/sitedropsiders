/**
 * Resolve an image URL to be domain-agnostic and handle fallback images.
 * If the URL points to dropsiders.fr (with or without www), it converts it to a root-relative path.
 */
export function resolveImageUrl(url: string | undefined | null): string {
    const fallback = 'https://images.unsplash.com/photo-1514525253344-f814d074e015?q=80&w=1933&auto=format&fit=crop';
    
    if (!url) return fallback;
    
    // Normalize string type if needed
    let processedUrl = String(url).trim();
    
    if (!processedUrl) return fallback;

    // Convert absolute dropsiders URLs to relative
    // This handles both https://dropsiders.fr/uploads/... and https://www.dropsiders.fr/uploads/...
    if (processedUrl.includes('dropsiders.fr')) {
        processedUrl = processedUrl.replace(/https?:\/\/(www\.)?dropsiders\.fr/g, '');
    }
    
    // Handle protocol-relative URLs
    if (processedUrl.startsWith('//')) {
        return 'https:' + processedUrl;
    }
    
    // Handle external absolute URLs
    if (processedUrl.startsWith('http')) {
        return processedUrl;
    }
    
    // Ensure relative paths start with a single slash
    if (!processedUrl.startsWith('/')) {
        return '/' + processedUrl;
    }
    
    return processedUrl;
}
