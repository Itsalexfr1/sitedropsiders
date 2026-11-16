/**
 * Shared theme utilities for Dropsiders V2
 * Synchronized with Social Studio palette
 */

export const getCategoryColor = (category: string = ''): string => {
    const cat = category.toLowerCase().trim();
    
    if (cat.includes('musique') || cat.includes('music') || cat.includes('review')) return 'neon-green';
    if (cat.includes('focus')) return 'neon-yellow';
    if (cat.includes('concour') || cat.includes('contest')) return 'neon-blue';
    if (cat.includes('event') || cat.includes('planning') || cat.includes('agenda')) return 'neon-orange';
    if (cat.includes('highlight')) return 'neon-sky';
    if (cat.includes('tracklist')) return 'neon-orange';
    if (cat.includes('sets') || cat.includes('mix')) return 'neon-purple';
    if (cat.includes('recap') || cat.includes('reels') || cat.includes('conseils')) return 'neon-purple';
    if (cat.includes('interview')) return 'white';
    if (cat.includes('top 100') || cat.includes('top100') || cat.includes('top 10') || cat.includes('top10') || cat.includes('top 5')) return 'neon-yellow';
    if (cat.includes('live') || cat.includes('stream') || cat.includes('direct')) return 'neon-red';
    if (cat.includes('communaute')) return 'neon-cyan';
    if (cat.includes('voyage') || cat.includes('vols')) return 'neon-green';
    if (cat.includes('team')) return 'neon-lime';
    if (cat.includes('shop') || cat.includes('boutique')) return 'neon-blue';
    if (cat.includes('galerie') || cat.includes('gallery') || cat.includes('spotlight')) return 'neon-emerald';
    if (cat.includes('news') || cat.includes('actualite') || cat.includes('actu')) return 'neon-red';
    
    // Default
    return 'neon-red';
};

export const getCategoryColorHex = (category: string = ''): string => {
    const cat = category.toLowerCase().trim();
    
    // Direct theme matches matching Social Studio exactly
    if (cat.includes('musique') || cat.includes('music') || cat.includes('review')) return '#39ff14'; // MUSIQUE Vert néon
    if (cat.includes('focus')) return '#ffe600'; // FOCUS Jaune électrique
    if (cat.includes('concour') || cat.includes('contest')) return '#008cff'; // CONCOURS Bleu royal
    if (cat.includes('event') || cat.includes('planning') || cat.includes('agenda')) return '#ff6700'; // EVENTS / PLANNING Orange
    if (cat.includes('highlight')) return '#38bdf8'; // HIGHLIGHTS Bleu ciel
    if (cat.includes('tracklist')) return '#ff7800'; // TRACKLIST Cuivre / Orange
    if (cat.includes('sets') || cat.includes('mix')) return '#a855f7'; // DJ SETS Violet néon
    if (cat.includes('recap')) return '#c026d3'; // RÉCAP Violet / Magenta
    if (cat.includes('interview')) return '#ffffff'; // INTERVIEW Blanc argenté
    if (cat.includes('top 100') || cat.includes('top100')) return '#d4af37'; // TOP 100 Or métallique
    if (cat.includes('galerie') || cat.includes('gallery') || cat.includes('spotlight')) return '#00ffa3'; // SPOTLIGHT / GALERIE Émeraude
    if (cat.includes('news')) return '#ff0033'; // NEWS Rouge Dropsiders

    const colorName = getCategoryColor(category);
    switch (colorName) {
        case 'white': return '#ffffff';
        case 'neon-red': return '#ff0033';
        case 'neon-cyan': return '#00f0ff';
        case 'neon-sky': return '#38bdf8';
        case 'neon-purple': return '#c026d3';
        case 'neon-orange': return '#ff6700';
        case 'neon-yellow': return '#ffe600';
        case 'neon-pink': return '#ff007f';
        case 'neon-green': return '#39ff14';
        case 'neon-lime': return '#ccff00';
        case 'neon-blue': return '#008cff';
        case 'neon-emerald': return '#00ffa3';
        default: return '#ff0033';
    }
};
