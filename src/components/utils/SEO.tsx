import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    article?: boolean;
}

const DEFAULT_TITLE = "DROPSIDERS : L'actu de tous les festivals";
const DEFAULT_DESC = "Découvrez toute l'actualité des festivals EDM, Techno, House et plus. Recaps, interviews et exclusivités.";
const DEFAULT_IMAGE = "https://dropsiders.fr/logo_presentation.png";
const BASE_URL = "https://www.dropsiders.fr";

export function SEO({ title, description, image, article }: SEOProps) {
    const { pathname } = useLocation();

    useEffect(() => {
        // 1. Titre de la page
        const fullTitle = title ? `${title} | DROPSIDERS` : DEFAULT_TITLE;
        document.title = fullTitle;

        // 2. Meta Description
        const metaDesc = description || DEFAULT_DESC;
        let metaDescriptionTag = document.querySelector('meta[name="description"]');
        if (metaDescriptionTag) {
            metaDescriptionTag.setAttribute('content', metaDesc);
        } else {
            metaDescriptionTag = document.createElement('meta');
            metaDescriptionTag.setAttribute('name', 'description');
            metaDescriptionTag.setAttribute('content', metaDesc);
            document.head.appendChild(metaDescriptionTag);
        }

        // 3. Open Graph (Facebook / Discord / WhatsApp)
        const updateMeta = (property: string, content: string) => {
            let tag = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
            if (tag) {
                tag.setAttribute('content', content);
            } else {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                tag.setAttribute('content', content);
                document.head.appendChild(tag);
            }
        };

        const currentUrl = `${BASE_URL}${pathname}`;
        const currentImg = image || DEFAULT_IMAGE;

        updateMeta('og:title', fullTitle);
        updateMeta('og:description', metaDesc);
        updateMeta('og:image', currentImg);
        updateMeta('og:url', currentUrl);
        updateMeta('og:type', article ? 'article' : 'website');

        // 4. Twitter Cards
        updateMeta('twitter:title', fullTitle);
        updateMeta('twitter:description', metaDesc);
        updateMeta('twitter:image', currentImg);
        updateMeta('twitter:card', 'summary_large_image');

        // 5. Canonical Link
        let canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute('href', currentUrl);
        } else {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            canonical.setAttribute('href', currentUrl);
            document.head.appendChild(canonical);
        }

    }, [title, description, image, article, pathname]);

    return null;
}
