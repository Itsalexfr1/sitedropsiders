/**
 * Shared theme utilities for Dropsiders V2
 */

export const getCategoryColor = (category: string = ''): string => {
    const cat = category.toLowerCase().trim();
    
    if (cat.includes('musique') || cat.includes('music')) return 'neon-green';
    if (cat.includes('recap')) return 'neon-cyan';
    if (cat.includes('interview')) return 'neon-purple';
    if (cat.includes('top 100') || cat.includes('top100')) return 'neon-yellow';
    if (cat.includes('festival')) return 'neon-red';
    if (cat.includes('voyage')) return 'neon-blue';
    
    // Default
    return 'neon-red';
};

export const getCategoryColorHex = (category: string = ''): string => {
    const colorName = getCategoryColor(category);
    switch (colorName) {
        case 'neon-green': return '#39ff14';
        case 'neon-cyan': return '#00f0ff';
        case 'neon-purple': return '#bc13fe';
        case 'neon-yellow': return '#fff01f';
        case 'neon-blue': return '#0070ff';
        case 'neon-red': 
        default: return '#ff0033';
    }
};
