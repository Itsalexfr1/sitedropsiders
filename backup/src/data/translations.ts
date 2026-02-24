
export type TranslationKey =
    | 'nav.news' | 'nav.recaps' | 'nav.galerie' | 'nav.interviews' | 'nav.agenda' | 'nav.team' | 'nav.shop' | 'nav.contact'
    | 'footer.slogan' | 'footer.desc' | 'footer.community' | 'footer.join' | 'footer.subscribe' | 'footer.subscribe_btn' | 'footer.nav' | 'footer.contact' | 'footer.privacy' | 'footer.terms' | 'footer.cookies' | 'footer.legal' | 'footer.admin' | 'footer.rights'
    | 'home.hero.title' | 'home.hero.subtitle' | 'home.latest_news' | 'home.latest_recaps' | 'home.all_recaps' | 'home.upcoming_events' | 'home.view_more' | 'home.featured' | 'home.hot' | 'home.no_article' | 'home.new' | 'home.all_news' | 'home.view_all_agenda' | 'home.view_full_agenda' | 'home.agenda' | 'home.view_all' | 'home.no_recap' | 'home.recap_badge' | 'home.latest_interviews' | 'home.no_interview' | 'home.interview_badge' | 'home.all_events'
    | 'news.badge' | 'news.title' | 'news.subtitle' | 'news.no_news'
    | 'recaps.badge' | 'recaps.title' | 'recaps.title_span' | 'recaps.subtitle' | 'recaps.no_recaps'
    | 'interviews.badge' | 'interviews.title' | 'interviews.title_span' | 'interviews.read_more' | 'interviews.no_interviews' | 'interviews.no_interviews_subtitle'
    | 'team.title' | 'team.join_title' | 'team.join_desc' | 'team.contact_btn'
    | 'galerie.badge' | 'galerie.title' | 'galerie.title_span' | 'galerie.filter_by' | 'galerie.view_album' | 'galerie.no_albums' | 'galerie.photos_suffix' | 'galerie.filter_all' | 'galerie.filter_festivals' | 'galerie.filter_clubs' | 'galerie.filter_concerts' | 'galerie.filter_portraits' | 'galerie.filter_others'
    | 'common.read_more' | 'common.by' | 'common.on' | 'common.date' | 'common.location' | 'common.search' | 'common.no_results' | 'common.photo' | 'common.gallery_alt' | 'common.min_read'
    | 'agenda.title' | 'agenda.subtitle' | 'agenda.filter_all' | 'agenda.filter_club' | 'agenda.filter_festival' | 'agenda.title_span' | 'agenda.badge' | 'agenda.official_site' | 'agenda.filter_by' | 'agenda.no_results' | 'agenda.infos_tickets' | 'agenda.no_events_selection' | 'agenda.loading'
    | 'article_detail.back_to_news' | 'article_detail.back_to_interviews' | 'article_detail.back_to_home' | 'article_detail.read_time' | 'article_detail.video_title' | 'article_detail.video_subtitle' | 'article_detail.gallery_title' | 'article_detail.related_title' | 'article_detail.other_interviews' | 'article_detail.not_found_title' | 'article_detail.not_found_btn' | 'article_detail.newsletter_title' | 'article_detail.newsletter_subtitle' | 'article_detail.newsletter_placeholder' | 'article_detail.newsletter_btn' | 'article_detail.newsletter_count'
    | 'recap_detail.not_found_title' | 'recap_detail.not_found_btn' | 'recap_detail.back_to_recaps' | 'recap_detail.video_available' | 'recap_detail.video_title' | 'recap_detail.gallery_expand' | 'recap_detail.related_title' | 'recap_detail.view_all_recaps'
    | 'album_detail.not_found_title' | 'album_detail.back_to_galerie' | 'album_detail.share_btn' | 'album_detail.default_category'
    | 'home.playlists_title' | 'home.follow' | 'recaps.no_recaps_subtitle'
    | 'newsletter.hero.badge' | 'newsletter.hero.title' | 'newsletter.hero.title_span' | 'newsletter.hero.desc' | 'newsletter.stats.subscribers' | 'newsletter.stats.frequency' | 'newsletter.stats.coverage' | 'newsletter.form.title' | 'newsletter.form.subtitle' | 'newsletter.benefits.title' | 'newsletter.benefits.subtitle' | 'newsletter.benefits.exclusive_news' | 'newsletter.benefits.exclusive_news_desc' | 'newsletter.benefits.recaps' | 'newsletter.benefits.recaps_desc' | 'newsletter.benefits.alerts' | 'newsletter.benefits.alerts_desc' | 'newsletter.benefits.content' | 'newsletter.benefits.content_desc' | 'newsletter.community.title' | 'newsletter.community.desc' | 'newsletter.community.free' | 'newsletter.community.no_spam' | 'newsletter.community.easy_unsubscribe'
    | 'newsletter_form.email_label' | 'newsletter_form.email_placeholder' | 'newsletter_form.first_name_label' | 'newsletter_form.first_name_placeholder' | 'newsletter_form.last_name_label' | 'newsletter_form.last_name_placeholder' | 'newsletter_form.submit_btn' | 'newsletter_form.submitting_btn' | 'newsletter_form.success_msg' | 'newsletter_form.error_required' | 'newsletter_form.error_invalid' | 'newsletter_form.error_server' | 'newsletter_form.privacy_notice' | 'newsletter_form.privacy_link'
    | 'article_detail.link_copied' | 'article_detail.share' | 'article_detail.focus' | 'article_detail.previous' | 'article_detail.next'
    | 'admin.featured'
    | 'cookies.title' | 'cookies.desc' | 'cookies.accept' | 'cookies.refuse' | 'cookies.manage';

export const translations: Record<TranslationKey, { fr: string, en: string }> = {
    'article_detail.link_copied': { fr: 'Lien copié !', en: 'Link copied!' },
    'article_detail.share': { fr: 'Partager', en: 'Share' },
    'article_detail.focus': { fr: 'Focus de la semaine', en: 'Focus of the week' },
    'article_detail.previous': { fr: 'Précédent', en: 'Previous' },
    'article_detail.next': { fr: 'Suivant', en: 'Next' },
    'nav.news': { fr: 'News', en: 'News' },
    'nav.recaps': { fr: 'Récaps', en: 'Recaps' },
    'nav.galerie': { fr: 'Galeries', en: 'Galleries' },
    'nav.interviews': { fr: 'Interviews', en: 'Interviews' },
    'nav.agenda': { fr: 'Agenda', en: 'Agenda' },
    'nav.team': { fr: 'Team', en: 'Team' },
    'nav.shop': { fr: 'Shop', en: 'Shop' },
    'nav.contact': { fr: 'Contact', en: 'Contact' },

    'footer.slogan': {
        fr: "LE MÉDIA FRANÇAIS SPÉCIALISÉ DANS L'ACTUALITÉ DES <span class='text-neon-red'>FESTIVALS.</span>",
        en: "THE FRENCH MEDIA SPECIALIZED IN <span class='text-neon-red'>FESTIVAL NEWS.</span>"
    },
    'footer.desc': {
        fr: "Dropsiders est le média français spécialisé dans l'actualité des festivals et de la scène électronique. Rejoignez une communauté de plus de 60 000 passionnés.",
        en: "Dropsiders is the French media specialized in festival news and the electronic scene. Join a community of over 60,000 enthusiasts."
    },
    'footer.community': { fr: '<span class="text-neon-red">Communauté</span>', en: '<span class="text-neon-red">Community</span>' },
    'footer.join': { fr: 'Rejoignez-nous sur <span class="text-neon-red">nos réseaux</span>', en: 'Join us on <span class="text-neon-red">our networks</span>' },
    'footer.subscribe': { fr: "S'abonner à la Newsletter", en: "Subscribe to Newsletter" },
    'footer.subscribe_btn': { fr: "S'abonner", en: "Subscribe" },
    'footer.nav': { fr: 'Navigation', en: 'Navigation' },
    'footer.contact': { fr: 'Contact', en: 'Contact' },
    'footer.privacy': { fr: 'Politique de Confidentialité', en: 'Privacy Policy' },
    'footer.terms': { fr: "Conditions d'Utilisation", en: 'Terms of Service' },
    'footer.cookies': { fr: 'Cookies', en: 'Cookies' },
    'footer.legal': { fr: 'Mentions Légales', en: 'Legal Notice' },
    'footer.admin': { fr: 'Admin', en: 'Admin' },
    'footer.rights': { fr: 'TOUS DROITS RÉSERVÉS', en: 'ALL RIGHTS RESERVED' },

    'home.hero.title': { fr: 'L\'ACTUALITÉ DES FESTIVALS', en: 'FESTIVAL NEWS' },
    'home.hero.subtitle': { fr: 'VOTRE DOSE QUOTIDIENNE DE MUSIQUE ÉLECTRONIQUE', en: 'YOUR DAILY DOSE OF ELECTRONIC MUSIC' },
    'home.latest_news': { fr: 'Dernières News', en: 'Latest News' },
    'home.latest_recaps': { fr: 'Derniers Récaps', en: 'Latest Recaps' },
    'home.all_recaps': { fr: 'TOUS LES RÉCAPS', en: 'ALL RECAPS' },
    'home.upcoming_events': { fr: 'Prochains Événements', en: 'Upcoming Events' },
    'home.view_more': { fr: 'Voir plus', en: 'View more' },
    'home.featured': { fr: 'À LA UNE', en: 'FEATURED' },
    'home.hot': { fr: 'HOT', en: 'HOT' },
    'home.new': { fr: 'NEW', en: 'NEW' },
    'home.all_news': { fr: 'TOUTES LES ACTUALITÉS', en: 'ALL NEWS' },
    'home.view_all_agenda': { fr: 'TOUT VOIR', en: 'VIEW ALL' },
    'home.view_full_agenda': { fr: 'TOUT VOIR', en: 'VIEW ALL' },
    'home.agenda': { fr: 'AGENDA', en: 'AGENDA' },
    'home.view_all': { fr: 'TOUT VOIR', en: 'VIEW ALL' },
    'home.all_events': { fr: "VOIR TOUT L'AGENDA", en: 'VIEW FULL AGENDA' },
    'home.no_article': { fr: 'Aucun article pour le moment', en: 'No article for now' },
    'home.no_recap': { fr: 'Aucun récap pour le moment', en: 'No recap for now' },
    'home.recap_badge': { fr: 'RÉCAP', en: 'RECAP' },
    'home.latest_interviews': { fr: 'DERNIÈRES INTERVIEWS', en: 'LATEST INTERVIEWS' },
    'home.no_interview': { fr: 'Aucune interview pour le moment', en: 'No interview for now' },
    'home.interview_badge': { fr: 'INTERVIEW', en: 'INTERVIEW' },

    'news.badge': { fr: 'Actualités', en: 'News' },
    'news.title': { fr: 'NEWS', en: 'NEWS' },
    'news.subtitle': { fr: 'Restez informé des dernières nouvelles, des sorties d\'albums et des événements majeurs de la scène électronique mondiale.', en: 'Stay informed about the latest news, album releases, and major events in the global electronic scene.' },
    'news.no_news': { fr: 'Aucune actualité pour le moment', en: 'No news for now' },

    'recaps.badge': { fr: 'Couvertures Festivals', en: 'Festival Coverages' },
    'recaps.title': { fr: 'RÉCAPS', en: 'RECAPS' },
    'recaps.title_span': { fr: 'EVENTS', en: 'EVENTS' },
    'recaps.subtitle': { fr: 'Revivez les moments forts des plus grands festivals et événements électroniques à travers nos reportages photos et vidéos exclusifs.', en: 'Relive the highlights of the biggest electronic festivals and events through our exclusive photo and video reports.' },
    'recaps.no_recaps': { fr: 'Aucun récap disponible', en: 'No recap available' },

    'interviews.badge': { fr: 'Exclusivités', en: 'Exclusives' },
    'interviews.title': { fr: 'INTERVIEWS', en: 'ARTIST' },
    'interviews.title_span': { fr: 'ARTISTES', en: 'INTERVIEWS' },
    'interviews.read_more': { fr: 'LIRE L\'INTERVIEW', en: 'READ INTERVIEW' },
    'interviews.no_interviews': { fr: 'Aucune interview trouvée', en: 'No interviews found' },
    'interviews.no_interviews_subtitle': { fr: 'Revenez plus tard pour de nouveaux contenus exclusifs.', en: 'Check back later for new exclusive content.' },

    'team.title': { fr: 'NOTRE ÉQUIPE', en: 'OUR TEAM' },
    'team.join_title': { fr: 'REJOINDRE L\'AVENTURE', en: 'JOIN THE ADVENTURE' },
    'team.join_desc': { fr: 'Vous êtes passionné par la musique électronique et les festivals ? Vous aimez écrire, photographier ou filmer ? On recherche toujours de nouveaux talents pour agrandir l\'équipe.', en: 'Are you passionate about electronic music and festivals? Do you enjoy writing, photography, or filming? We are always looking for new talents to grow the team.' },
    'team.contact_btn': { fr: 'Nous Contacter', en: 'Contact Us' },

    'galerie.badge': { fr: 'Photos & Albums', en: 'Photos & Albums' },
    'galerie.title': { fr: 'GALERIES', en: 'PHOTO' },
    'galerie.title_span': { fr: 'PHOTO', en: 'GALLERIES' },
    'galerie.filter_by': { fr: 'Filtrer par :', en: 'Filter by:' },
    'galerie.view_album': { fr: 'VOIR L\'ALBUM', en: 'VIEW ALBUM' },
    'galerie.no_albums': { fr: 'Aucun album trouvé', en: 'No album found' },
    'galerie.photos_suffix': { fr: 'Photos', en: 'Photos' },
    'galerie.filter_all': { fr: 'TOUT', en: 'ALL' },
    'galerie.filter_festivals': { fr: 'FESTIVALS', en: 'FESTIVALS' },
    'galerie.filter_clubs': { fr: 'CLUBS & EVENTS', en: 'CLUBS & EVENTS' },
    'galerie.filter_concerts': { fr: 'CONCERTS', en: 'CONCERTS' },
    'galerie.filter_portraits': { fr: 'PORTRAITS', en: 'PORTRAITS' },
    'galerie.filter_others': { fr: 'OTHERS', en: 'OTHERS' },

    'common.read_more': { fr: 'Lire la suite', en: 'Read more' },
    'common.by': { fr: 'Par', en: 'By' },
    'common.on': { fr: 'le', en: 'on' },
    'common.date': { fr: 'Date', en: 'Date' },
    'common.location': { fr: 'Lieu', en: 'Location' },
    'common.search': { fr: 'Rechercher sur le site...', en: 'Search on the site...' },
    'common.no_results': { fr: 'Aucun résultat trouvé pour', en: 'No results found for' },
    'common.photo': { fr: 'Photo', en: 'Photo' },
    'common.gallery_alt': { fr: 'Galerie', en: 'Gallery' },
    'common.min_read': { fr: 'MIN DE LECTURE', en: 'MIN READ' },

    'agenda.title': { fr: 'AGENDA', en: 'AGENDA' },
    'agenda.title_span': { fr: '2026', en: '2026' },
    'agenda.badge': { fr: 'Événements', en: 'Events' },
    'agenda.subtitle': { fr: 'Découvrez les événements à venir. Des festivals massifs aux sets de clubs intimes.', en: 'Discover upcoming events. From massive festivals to intimate club sets.' },
    'agenda.filter_all': { fr: 'TOUT', en: 'ALL' },
    'agenda.filter_club': { fr: 'CLUB', en: 'CLUB' },
    'agenda.filter_festival': { fr: 'FESTIVAL', en: 'FESTIVAL' },
    'agenda.official_site': { fr: 'SITE OFFICIEL', en: 'OFFICIAL SITE' },
    'agenda.no_results': { fr: 'Aucun événement à venir pour le moment', en: 'No upcoming events for now' },
    'agenda.filter_by': { fr: 'Filtrer par :', en: 'Filter by:' },
    'agenda.infos_tickets': { fr: 'Infos / Tickets', en: 'Infos / Tickets' },
    'agenda.no_events_selection': { fr: 'Aucun événement trouvé pour cette sélection', en: 'No events found for this selection' },
    'agenda.loading': { fr: 'Chargement...', en: 'Loading...' },

    'article_detail.back_to_news': { fr: 'Retour aux news', en: 'Back to news' },
    'article_detail.back_to_interviews': { fr: 'Retour aux interviews', en: 'Back to interviews' },
    'article_detail.back_to_home': { fr: 'Retour accueil', en: 'Back to home' },
    'article_detail.read_time': { fr: 'Lecture 5 min', en: '5 min read' },
    'article_detail.video_title': { fr: 'Vidéo de l\'article', en: 'Article Video' },
    'article_detail.video_subtitle': { fr: 'À NE PAS MANQUER', en: 'MUST WATCH' },
    'article_detail.gallery_title': { fr: 'Galerie Photos', en: 'Photo Gallery' },
    'article_detail.related_title': { fr: 'À lire aussi', en: 'Related articles' },
    'article_detail.other_interviews': { fr: 'Nos autres interviews', en: 'Our other interviews' },
    'article_detail.not_found_title': { fr: 'Page Intraçable', en: 'Page Not Found' },
    'article_detail.not_found_btn': { fr: 'Retourner à la home', en: 'Back to home' },
    'article_detail.newsletter_title': { fr: 'REJOIGNEZ <span class="text-neon-red">NOUS</span>', en: 'JOIN <span class="text-neon-red">US</span>' },
    'article_detail.newsletter_subtitle': { fr: 'Recevez l\'actu des festivals en avant-première', en: 'Get festival news first' },
    'article_detail.newsletter_placeholder': { fr: 'votre@email.com', en: 'your@email.com' },
    'article_detail.newsletter_btn': { fr: 'S\'abonner', en: 'Subscribe' },
    'article_detail.newsletter_count': { fr: '+60 000 passionnés nous suivent', en: '+60 000 passionate fans follow us' },

    'recap_detail.not_found_title': { fr: 'RÉCAP NON TROUVÉ', en: 'RECAP NOT FOUND' },
    'recap_detail.not_found_btn': { fr: '← Retour aux récaps', en: '← Back to recaps' },
    'recap_detail.back_to_recaps': { fr: 'Retour aux récaps', en: 'Back to recaps' },
    'recap_detail.video_available': { fr: 'Vidéo disponible', en: 'Video available' },
    'recap_detail.video_title': { fr: 'Vidéo Récap', en: 'Recap Video' },
    'recap_detail.gallery_expand': { fr: 'Agrandir la photo', en: 'Enlarge photo' },
    'recap_detail.related_title': { fr: 'Autres Récapitulatifs', en: 'Other Recaps' },
    'recap_detail.view_all_recaps': { fr: 'Voir tous les récaps', en: 'View all recaps' },

    'album_detail.not_found_title': { fr: 'Album introuvable', en: 'Album not found' },
    'album_detail.back_to_galerie': { fr: 'Retour à la galerie', en: 'Back to gallery' },
    'album_detail.share_btn': { fr: 'PARTAGER L\'ALBUM', en: 'SHARE ALBUM' },
    'album_detail.default_category': { fr: 'Album Photo', en: 'Photo Album' },

    'home.playlists_title': { fr: 'NOS PLAYLISTS', en: 'OUR PLAYLISTS' },
    'home.follow': { fr: 'Suivre', en: 'Follow' },
    'recaps.no_recaps_subtitle': { fr: 'Les récaps seront bientôt disponibles après le scraping', en: 'Recaps will be available soon after scraping' },

    'newsletter.hero.badge': { fr: 'Newsletter Dropsiders', en: 'Dropsiders Newsletter' },
    'newsletter.hero.title': { fr: 'Restez Connectés à la ', en: 'Stay Connected to the ' },
    'newsletter.hero.title_span': { fr: 'Scène Électro', en: 'Electronic Scene' },
    'newsletter.hero.desc': {
        fr: 'Rejoignez plus de 60 000 passionnés et recevez une fois par semaine l\'actualité des festivals, des interviews exclusives et des bons plans.',
        en: 'Join over 60,000 enthusiasts and receive weekly festival news, exclusive interviews, and great deals.'
    },
    'newsletter.stats.subscribers': { fr: 'Abonnés', en: 'Subscribers' },
    'newsletter.stats.frequency': { fr: 'Newsletters', en: 'Newsletters' },
    'newsletter.stats.coverage': { fr: 'Festivals couverts', en: 'Festivals covered' },
    'newsletter.form.title': { fr: 'Inscrivez-vous Gratuitement', en: 'Sign Up for Free' },
    'newsletter.form.subtitle': { fr: 'Remplissez le formulaire ci-dessous pour recevoir nos newsletters', en: 'Fill out the form below to receive our newsletters' },
    'newsletter.benefits.title': { fr: 'Pourquoi S\'abonner ?', en: 'Why Subscribe?' },
    'newsletter.benefits.subtitle': { fr: 'Découvrez tous les avantages de notre newsletter', en: 'Discover all the benefits of our newsletter' },
    'newsletter.benefits.exclusive_news': { fr: 'Actualités en Exclusivité', en: 'Exclusive News' },
    'newsletter.benefits.exclusive_news_desc': { fr: 'Soyez les premiers informés des annonces de festivals, line-ups et événements électro.', en: 'Be the first to know about festival announcements, line-ups, and electro events.' },
    'newsletter.benefits.recaps': { fr: 'Recaps & Interviews', en: 'Recaps & Interviews' },
    'newsletter.benefits.recaps_desc': { fr: 'Recevez nos meilleurs recaps de festivals et interviews d\'artistes directement dans votre boîte mail.', en: 'Get our best festival recaps and artist interviews directly in your inbox.' },
    'newsletter.benefits.alerts': { fr: 'Alertes Billetterie', en: 'Ticket Alerts' },
    'newsletter.benefits.alerts_desc': { fr: 'Ne ratez plus jamais la mise en vente des billets pour vos festivals préférés.', en: 'Never miss ticket sales for your favorite festivals again.' },
    'newsletter.benefits.content': { fr: 'Contenus Exclusifs', en: 'Exclusive Content' },
    'newsletter.benefits.content_desc': { fr: 'Accédez à des contenus réservés aux abonnés : playlists, tips, bons plans...', en: 'Access subscriber-only content: playlists, tips, deals...' },
    'newsletter.community.title': { fr: 'Rejoignez la Communauté', en: 'Join the Community' },
    'newsletter.community.desc': {
        fr: 'Plus de 60 000 festivaliers nous font déjà confiance pour rester informés de l\'actualité de la scène électronique française et internationale.',
        en: 'Over 60,000 festival-goers already trust us to stay informed about the French and international electronic scene.'
    },
    'newsletter.community.free': { fr: '100% Gratuit', en: '100% Free' },
    'newsletter.community.no_spam': { fr: 'Sans Spam', en: 'No Spam' },
    'newsletter.community.easy_unsubscribe': { fr: 'Désinscription Facile', en: 'Easy Unsubscribe' },

    'newsletter_form.email_label': { fr: 'Email *', en: 'Email *' },
    'newsletter_form.email_placeholder': { fr: 'votre.email@exemple.fr', en: 'your.email@example.com' },
    'newsletter_form.first_name_label': { fr: 'Prénom (optionnel)', en: 'First Name (optional)' },
    'newsletter_form.first_name_placeholder': { fr: 'Prénom', en: 'First Name' },
    'newsletter_form.last_name_label': { fr: 'Nom (optionnel)', en: 'Last Name (optional)' },
    'newsletter_form.last_name_placeholder': { fr: 'Nom', en: 'Last Name' },
    'newsletter_form.submit_btn': { fr: "S'abonner à la Newsletter", en: "Subscribe to Newsletter" },
    'newsletter_form.submitting_btn': { fr: 'Inscription en cours...', en: 'Signing up...' },
    'newsletter_form.success_msg': { fr: 'Merci ! Vous êtes maintenant inscrit à notre newsletter 🎉', en: 'Thank you! You are now subscribed to our newsletter 🎉' },
    'newsletter_form.error_required': { fr: "L'email est requis", en: 'Email is required' },
    'newsletter_form.error_invalid': { fr: 'Veuillez entrer un email valide', en: 'Please enter a valid email' },
    'newsletter_form.error_server': { fr: 'Une erreur est survenue.', en: 'An error occurred.' },
    'newsletter_form.privacy_notice': { fr: 'En vous inscrivant, vous acceptez de recevoir nos newsletters. Vous pouvez vous désinscrire à tout moment. Vos données sont protégées conformément à notre ', en: 'By subscribing, you agree to receive our newsletters. You can unsubscribe at any time. Your data is protected in accordance with our ' },
    'newsletter_form.privacy_link': { fr: 'politique de confidentialité', en: 'privacy policy' },
    'admin.featured': { fr: 'Mettre à la une', en: 'Feature this article' },
    'cookies.title': { fr: 'Cookies & Confidentialité', en: 'Cookies & Privacy' },
    'cookies.desc': {
        fr: 'Nous utilisons des cookies pour assurer le bon fonctionnement du site et analyser notre trafic, conformément au RGPD et aux réglementations européennes.',
        en: 'We use cookies to ensure the site functions correctly and to analyze our traffic, in accordance with GDPR and European regulations.'
    },
    'cookies.accept': { fr: 'Tout ACcepter', en: 'Accept All' },
    'cookies.refuse': { fr: 'Refuser', en: 'Refuse' },
    'cookies.manage': { fr: 'Gérer', en: 'Manage' }
};
