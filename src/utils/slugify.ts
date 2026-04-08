export function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD') // Décompose les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Supprime les tirets au début et à la fin
}

export function generateSlug(title: string, id: number | string): string {
    if (typeof id === 'string' && isNaN(Number(id))) {
        return id;
    }
    const slug = slugify(title);
    return `${slug}-${id}`;
}

export function extractIdFromSlug(slug: string | undefined): number | string | null {
    if (!slug) return null;

    // Si le slug ressemble à un ID numérique pur
    if (/^\d+$/.test(slug)) return parseInt(slug, 10);

    // Check for slug-id (new: title-123)
    const endMatch = slug.match(/-(\d+)$/);
    if (endMatch) return parseInt(endMatch[1], 10);

    // Check for id_slug (old: 123_title)
    const startMatch = slug.match(/^(\d+)[_-]/);
    if (startMatch) return parseInt(startMatch[1], 10);

    // Si c'est un slug texte (ex: Galerie)
    return slug;
}

export function getArticleLink(article: { id: number | string; title: string; category?: string }): string {
    const slug = generateSlug(article.title, article.id);
    const category = (article.category || '').toLowerCase();
    
    if (category.includes('interview')) return `/interviews/${slug}`;
    if (category.includes('recap')) return `/recaps/${slug}`;
    
    return `/news/${slug}`;
}

export function getRecapLink(recap: { id: number | string; title: string }): string {
    const slug = generateSlug(recap.title, recap.id);
    return `/recaps/${slug}`;
}

export function getGalleryLink(gallery: { id: number | string; title: string }): string {
    const slug = generateSlug(gallery.title, gallery.id);
    return `/galerie/${slug}`;
}

export function getAgendaLink(event: { id: number | string; title: string }): string {
    const slug = generateSlug(event.title, event.id);
    return `/agenda?event=${slug}`;
}
