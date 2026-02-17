export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD') // Décompose les caractères accentués
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Supprime les tirets au début et à la fin
}

export function generateSlug(title: string, id: number): string {
    const slug = slugify(title);
    return `${slug}-${id}`;
}

export function extractIdFromSlug(slug: string): number | null {
    const match = slug.match(/-(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

export function getArticleLink(article: { id: number; title: string; category?: string }): string {
    const slug = generateSlug(article.title, article.id);
    const isInterview = article.category?.toLowerCase().includes('interview');
    return isInterview ? `/interviews/${slug}` : `/news/${slug}`;
}
