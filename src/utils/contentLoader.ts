
import newsContent1 from '../data/news_content_1.json';
import newsContent2 from '../data/news_content_2.json';
import newsContent3 from '../data/news_content_3.json';
import newsContentLegacy from '../data/news_content_legacy.json';
import recapsContent1 from '../data/recaps_content_1.json';
import recapsContent2 from '../data/recaps_content_2.json';

// Fusionner les contenus en mémoire (ou charger à la demande si on veut optimiser plus tard)
// Pour l'instant, charger tout en mémoire est acceptable si ce n'est pas énorme (quelques MB)
// Mais pour être plus propre et scalable, on va faire une recherche.

const allNewsContent = [
    ...newsContent1,
    ...newsContent2,
    ...newsContent3,
    ...newsContentLegacy
];

const allRecapsContent = [
    ...recapsContent1,
    ...recapsContent2
];

export const getNewsContent = (id: number | string): string | undefined => {
    const item = allNewsContent.find((n: any) => String(n.id) === String(id));
    return item ? item.content : undefined;
};

export const getRecapContent = (id: number | string): string | undefined => {
    const item = allRecapsContent.find((r: any) => String(r.id) === String(id));
    return item ? item.content : undefined;
};
