export const getCountryCode = (location: string): string => {
    if (!location) return '';

    const parts = location.split(',');
    const country = parts[parts.length - 1].trim();

    const countryCodes: Record<string, string> = {
        'France': 'FR',
        'USA': 'US',
        'Espagne': 'ES',
        'Spain': 'ES',
        'Belgique': 'BE',
        'Belgium': 'BE',
        'Royaume-Uni': 'GB',
        'UK': 'GB',
        'Allemagne': 'DE',
        'Germany': 'DE',
        'Italie': 'IT',
        'Italy': 'IT',
        'Pays-Bas': 'NL',
        'Netherlands': 'NL',
        'Croatie': 'HR',
        'Croatia': 'HR',
        'Brésil': 'BR',
        'Brazil': 'BR',
        'Japon': 'JP',
        'Japan': 'JP',
        'Suisse': 'CH',
        'Switzerland': 'CH',
        'Émirats Arabes Unis': 'AE',
        'UAE': 'AE',
        'Dubai': 'AE',
        'Mexique': 'MX',
        'Mexico': 'MX',
        'Portugal': 'PT',
        'Autriche': 'AT',
        'Austria': 'AT',
        'Etats Unis': 'US',
        'Etats-Unis': 'US',
        'États-Unis': 'US',
    };

    return countryCodes[country] || '';
};

export const getCountryFlag = (location: string): string => {
    const code = getCountryCode(location);
    if (!code) return '';

    // Traditional emoji flag converter
    const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
};
