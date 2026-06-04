/**
 * Shared theme utilities for Dropsiders V2
 */

export const getCategoryColor = (category: string = ''): string => {
    const cat = category.toLowerCase().trim();
    
    if (cat.includes('musique') || cat.includes('music')) return 'neon-green';
    if (cat.includes('sets') || cat.includes('mix')) return 'neon-purple';
    if (cat.includes('news')) return 'neon-red';
    if (cat.includes('agenda')) return 'neon-cyan';
    if (cat.includes('recap')) return 'neon-purple';
    if (cat.includes('interview')) return 'neon-orange';
    if (cat.includes('top 100') || cat.includes('top100')) return 'neon-yellow';
    if (cat.includes('communaute')) return 'neon-pink';
    if (cat.includes('voyage') || cat.includes('vols')) return 'neon-green';
    if (cat.includes('team')) return 'neon-lime';
    if (cat.includes('shop')) return 'neon-blue';
    if (cat.includes('galerie') || cat.includes('gallery')) return 'neon-emerald';
    
    // Default
    return 'neon-red';
};

export const getCategoryColorHex = (category: string = ''): string => {
    const colorName = getCategoryColor(category);
    switch (colorName) {
        case 'neon-red': return '#ff1241';
        case 'neon-cyan': return '#22d3ee';
        case 'neon-purple': return '#bf00ff';
        case 'neon-orange': return '#ff6700';
        case 'neon-yellow': return '#fff01f';
        case 'neon-pink': return '#ff007f';
        case 'neon-green': return '#39ff14';
        case 'neon-lime': return '#ccff00';
        case 'neon-blue': return '#0070ff';
        case 'neon-emerald': return '#00ffa3';
        default: return '#ff1241';
    }
};
