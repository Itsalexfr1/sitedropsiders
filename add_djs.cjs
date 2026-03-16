
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/wiki_djs.json');
const currentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const existingNames = new Set(currentData.map(d => d.name));

const newArtists = [
    {
        name: "Joseph Capriati",
        bio: "Joseph Capriati est un DJ et producteur italien incontournable de la scène techno mondiale. Originaire de Caserta, il est célèbre pour ses sets marathon d'une énergie débordante et son groove hypnotique. Figure emblématique du label Drumcode et fondateur de Redimension, il incarne l'excellence de la techno italienne sur les plus grandes scènes du globe.",
        country: "Intl",
        id: "joseph-capriati",
        deezerId: "230129"
    },
    {
        name: "Sebastian Ingrosso",
        bio: "Sebastian Ingrosso est un DJ et producteur suédois de renommée mondiale, membre fondateur du groupe iconique Swedish House Mafia. Avec une carrière jalonnée de hits planétaires comme 'Calling' et 'Reload', il a façonné le son de l'EDM et de la house progressive moderne. Fondateur du label Refune Music, il reste l'un des piliers les plus influents de la musique électronique.",
        country: "Intl",
        id: "sebastian-ingrosso",
        deezerId: "313264"
    },
    {
        name: "Steve Angello",
        bio: "Steve Angello est un DJ et producteur suédois d'origine grecque, figure historique de la Swedish House Mafia. Créateur du prestigieux label Size Records, il est reconnu pour son approche artistique exigeante et ses productions aux sonorités puissantes et cinématographiques. Son influence sur la house music mondiale depuis deux décennies est immense et intemporelle.",
        country: "Intl",
        id: "steve-angello",
        deezerId: "81223"
    },
    {
        name: "Axwell",
        bio: "Axwell, de son vrai nom Axel Hedfors, est un DJ et producteur suédois légendaire, membre pilier de la Swedish House Mafia. Maître de la house mélodique et fondatrice, il dirige le label Axtone Records, référence absolue en matière de qualité sonore. Ses multiples nominations aux Grammy Awards témoignent de son génie créatif et de son impact sur la culture électronique globale.",
        country: "Intl",
        id: "axwell",
        deezerId: "5707"
    },
    {
        name: "Richie Hawtin",
        bio: "Richie Hawtin est un pionnier visionnaire de la techno minimale et un innovateur technologique de premier plan. Sous son alias Plastikman ou son propre nom, le Canadien a redéfini les limites de la musique électronique par son minimalisme pur et ses performances avant-gardistes. Fondateur des labels Plus 8 et M_nus, il reste l'un des artistes les plus respectés et influents de l'histoire du genre.",
        country: "Intl",
        id: "richie-hawtin",
        deezerId: "3757"
    },
    {
        name: "Sven Väth",
        bio: "Sven Väth, surnommé 'Papa Sven', est l'un des plus grands ambassadeurs de la techno allemande. Avec une carrière de plus de 30 ans, il est le fondateur de l'empire Cocoon et un ardent défenseur du vinyle. Sa passion communicative et son charisme légendaire font de lui une figure paternelle et inspirante pour toute la culture électronique mondiale.",
        country: "Intl",
        id: "sven-vath",
        deezerId: "7339"
    },
    {
        name: "Reinier Zonneveld",
        bio: "Reinier Zonneveld est le maître du live techno acide, réputé pour ses performances improvisées utilisant synthétiseurs et boîtes à rythmes. Le Néerlandais a conquis la scène mondiale avec son label Filth on Acid et ses sets marathon d'une intensité rare. Sa formation classique au piano apporte une profondeur mélodique unique à ses compositions puissantes et dévastatrices.",
        country: "Intl",
        id: "reinier-zonneveld",
        deezerId: "9163014"
    },
    {
        name: "Adriatique",
        bio: "Adriatique est un duo suisse composé d'Adrian Shala et Adrian Schweizer, maîtres de la techno mélodique profonde et cinématographique. Depuis plus d'une décennie, ils sculptent un univers sonore hypnotique et élégant à travers leurs sets et leur label Siamese. Leurs productions sont des voyages oniriques qui captivent les foules dans les lieux les plus prestigieux au monde.",
        country: "Intl",
        id: "adriatique",
        deezerId: "4751508"
    },
    {
        name: "Francis Mercier",
        bio: "Francis Mercier est un DJ et producteur haïtien qui rayonne sur la scène house mondiale avec son mélange unique d'influences Afro et de house mélodique. Fondateur du label Deep Root Records, il apporte une énergie solaire et multiculturelle à la musique électronique. Ses productions, soutenues par les plus grands noms, célèbrent la richesse des rythmes globaux sur les dancefloors.",
        country: "Intl",
        id: "francis-mercier",
        deezerId: "5722122"
    },
    {
        name: "Samm",
        bio: "Samm est un talent émergent de la scène belge, reconnu pour ses sonorités Afro-house chaleureuses et mélodieuses. Co-fondateur de Magnifik Music, il a rapidement acquis une renommée internationale grâce à ses productions élégantes et ses sets chargés d'émotion. Son ascension témoigne du renouveau dynamique de la scène électronique européenne.",
        country: "Intl",
        id: "samm",
        deezerId: "11494910"
    },
    {
        name: "Ajna",
        bio: "Ajna est un DJ et producteur belge, figure montante de l'Afro House et de la Melodic House. Co-fondateur du collectif Magnifik, il distille un son profond et rythmé qui séduit un public de plus en plus large. Sa vision moderne de la house music, entre tradition et futurisme, en fait l'un des artistes à suivre de près.",
        country: "Intl",
        id: "ajna",
        deezerId: "9099951"
    },
    {
        name: "Notre Dame",
        bio: "Notre Dame est un producteur français qui se distingue par son approche émotionnelle et cinématographique de l'Electronic Dance Music. Révélé par son succès 'Yumi' sur le label Diynamic de Solomun, il crée des paysages sonores envoûtants qui fusionnent French Touch et mélodies mélancoliques. Son univers onirique apporte une fraîcheur nouvelle à la scène mélodique internationale.",
        country: "Intl",
        id: "notre-dame",
        deezerId: "154785462"
    },
    {
        name: "Massano",
        bio: "Massano est un prodige de la techno mélodique originaire de Liverpool, célèbre pour son design sonore agressif et ses grooves hypnotiques. Propulsé sur le devant de la scène par ses sorties sur Afterlife, il définit un nouveau standard d'intensité pour le genre. Sa capacité à créer des atmosphères sombres et puissantes fait de lui l'une des têtes d'affiche les plus demandées du moment.",
        country: "Intl",
        id: "massano",
        deezerId: "81201502"
    },
    {
        name: "Mind Against",
        bio: "Mind Against est un duo italien composé des frères Fognini, réputés pour leur techno mélodique profonde et introspective. Basés à Berlin, ils ont développé un son unique, véritable signature émotionnelle au sein du label Afterlife. Leurs sets sont des récits sonores complexes qui transportent l'auditeur dans une dimension onirique et intemporelle.",
        country: "Intl",
        id: "mind-against",
        deezerId: "4890983"
    },
    {
        name: "Artbat",
        bio: "Artbat est un duo ukrainien qui a conquis le monde avec ses productions techno et house à la fois puissantes et mélodiques. Artur et Batish sont devenus des acteurs incontournables de la scène clubbing grâce à leurs hymnes massifs et leur label Upperground. Leur capacité à allier efficacité redoutable sur le dancefloor et sophistication rythmique est leur marque de fabrique.",
        country: "Intl",
        id: "artbat",
        deezerId: "6803875"
    },
    {
        name: "Korolova",
        bio: "Korolova est une DJ et productrice ukrainienne qui s'impose comme une figure majeure de la Techno Mélodique et de la Progressive House. Avec son label Captive Soul et ses performances captivantes aux quatre coins du globe, elle distille une énergie solaire et émotionnelle. Sa présence scénique et la qualité de ses productions en font une artiste incontournable de la scène actuelle.",
        country: "Intl",
        id: "korolova",
        deezerId: "121616272"
    },
    {
        name: "Anfisa Letyago",
        bio: "Anfisa Letyago est une DJ et productrice d'origine sibérienne basée à Naples, incarnation du renouveau de la techno 'groovy'. Portée par le soutien de légendes comme Carl Cox, elle a su imposer son propre style, dynamique et percutant. Fondatrice du label NSDA, elle rayonne sur les plus grandes scènes mondiales par sa technique irréprochable et son énergie communicative.",
        country: "Intl",
        id: "anfisa-letyago",
        deezerId: "6141386"
    },
    {
        name: "Deborah De Luca",
        bio: "Deborah De Luca est une icône de la techno parthénopéenne, reconnue pour ses sets d'une puissance brute et ses productions aux kicks dévastateurs. Originaire de Naples, elle a bâti son succès sur un dévouement total et une authenticité sans faille. Son label Sola_mente est le reflet d'une techno sans compromis qui fait vibrer les clubs du monde entier.",
        country: "Intl",
        id: "deborah-de-luca",
        deezerId: "3307591"
    },
    {
        name: "Lilly Palmer",
        bio: "Lilly Palmer est une artiste techno allemande qui captive par ses sets énergiques et ses productions aux basses profondes. Issue de la scène zurichoise, elle a rapidement gravi les échelons pour devenir une figure de proue de la techno contemporaine. Son son, à la fois sombre et mélodique, résonne avec force sur les mainstages des plus grands festivals internationaux.",
        country: "Intl",
        id: "lilly-palmer",
        deezerId: "9027878"
    },
    {
        name: "999999999",
        bio: "999999999 est un duo italien légendaire de la scène Hard Techno, célèbre pour ses sets matériels improvisés d'une intensité extrême. Sans compromis, ils incarnent l'essence même de l'acid techno et de la rave culture moderne. Leur présence sur scène est une expérience physique et sonore brute qui ne laisse personne indifférent, faisant d'eux les rois du hard sound actuel.",
        country: "Intl",
        id: "999999999",
        deezerId: "999999999"
    },
    {
        name: "6EJOU",
        bio: "6EJOU est un artiste français qui révolutionne la 'Industrial Techno' avec ses sets live hybrides d'une puissance phénoménale. Connu pour son énergie punk et ses rythmes effrénés, il apporte un souffle nouveau et sauvage à la scène techno radicale. Ses performances sont des uppercuts sonores qui enflamment les entrepôts et les festivals les plus pointus.",
        country: "Intl",
        id: "6ejou",
        deezerId: "123136272"
    },
    {
        name: "Dyen",
        bio: "Dyen est un producteur néerlandais, figure de proue du mouvement 'Neo-Rave' et de la techno indus rapide. Inspiré par les sonorités des années 90, il insuffle une énergie brutale et nostalgique dans ses productions modernes. Ses sets sont des voyages à 160 BPM qui font vibrer toute une nouvelle génération de ravers avides de sensations fortes.",
        country: "Intl",
        id: "dyen",
        deezerId: "15159489"
    },
    {
        name: "Charlie Sparks",
        bio: "Charlie Sparks est un DJ britannique connu pour sa techno acide et industrielle à haute vélocité. Surnommé l'Energy Selecta, ses sets sont des tourbillons de kicks percutants et de synthés psychédéliques qui ne laissent aucun répit sur le dancefloor. Il incarne parfaitement le renouveau sauvage et décomplexé de la scène techno actuelle.",
        country: "Intl",
        id: "charlie-sparks",
        deezerId: "122180592"
    },
    {
        name: "Parfait",
        bio: "Parfait est une figure centrale de la techno parisienne, co-fondatrice du collectif Possession. Ses sets sont des manifestes pour une fête libre, inclusive et intense, naviguant entre techno brute et hard trance. Artiste engagée, elle a largement contribué à redéfinir les codes de la nuit parisienne et internationale par sa vision radicale et authentique.",
        country: "Intl",
        id: "parfait",
        deezerId: "210080327"
    },
    {
        name: "Anetha",
        bio: "Anetha est l'une des artistes les plus talentueuses de la scène techno française, reconnue pour ses sets aux rythmes effrénés et ses sélections pointues. Fondatrice du label Mama Told Ya, elle encourage l'expérimentation et la solidarité au sein de la scène électronique. Son style unique, entre techno, trance et electro, en fait une tête d'affiche indispensable des festivals mondiaux.",
        country: "Intl",
        id: "anetha",
        deezerId: "5464521"
    },
    {
        name: "VTSS",
        bio: "VTSS est une productrice et DJ polonaise renommée pour sa techno 'maximaliste' et son refus des barrières de genre. Ses sets explosifs sont des mélanges audacieux de techno, gabber, acid et EBM, portés par une technique impressionnante. Basée entre Londres et Berlin, elle incarne une vision moderne et intrépide de la musique électronique underground.",
        country: "Intl",
        id: "vtss",
        deezerId: "12435772"
    },
    {
        name: "Kobosil",
        bio: "Kobosil est un DJ et producteur berlinois, résident emblématique du Berghain. Représentant d'une techno sombre, agressive et industrielle, il a su créer tout un univers visuel et sonore autour de son label R-Label Group. Ses sets sont des expériences sonores brutales et immersives qui définissent le son de la nuit berlinoise actuelle.",
        country: "Intl",
        id: "kobosil",
        deezerId: "4629471"
    },
    {
        name: "Dax J",
        bio: "Dax J est un DJ et producteur britannique basé à Berlin, maître d'une techno brute et sans compromis. Son style, influencé par la culture rave britannique et le jungle, est d'une efficacité redoutable sur les dancefloors. À la tête de son label Monnom Black, il défend une vision puriste et puissante du genre qui le place au sommet des scènes mondiales.",
        country: "Intl",
        id: "dax-j",
        deezerId: "231579"
    },
    {
        name: "Paula Temple",
        bio: "Paula Temple est une artiste britannique incontournable de la techno industrielle, célèbre pour son design sonore noisey et percutant. Pionnière technologique, elle distille une musique sombre et puissante qui défie les conventions. Son engagement pour la diversité à travers son label Noise Manifesto et son talent singulier font d'elle une figure majeure de la scène underground.",
        country: "Intl",
        id: "paula-temple",
        deezerId: "7192"
    },
    {
        name: "Perc",
        bio: "Ali Wells, alias Perc, est un pilier de la techno britannique et fondateur du label Perc Trax. Son son industriel, anguleux et chargé de tension a marqué le genre depuis deux décennies. Reconnu pour son intégrité artistique et sa capacité à repousser les limites du sonore, il reste l'un des artistes les plus influents et respectés de la scène techno mondiale.",
        country: "Intl",
        id: "perc",
        deezerId: "2984"
    },
    {
        name: "Ellen Allien",
        bio: "Ellen Allien est une icône absolue de la scène berlinoise, fondatrice de l'illustre label BPitch Control. Artiste pluridisciplinaire, elle incarne l'esprit créatif et libre de Berlin à travers ses productions mêlant techno, IDM et electro. Sa passion inépuisable et son charisme unique continuent de faire d'elle une source d'inspiration majeure pour la culture électronique globale.",
        country: "Intl",
        id: "ellen-allien",
        deezerId: "4890"
    },
    {
        name: "Ben Klock",
        bio: "Ben Klock est la figure de proue de la techno moderne et résident historique du Berghain. Son son puissant, hypnotique et chargé d'émotion a défini l'esthétique du club berlinois. À travers son label Klockworks, il encourage une techno minimaliste mais d'une efficacité sonore redoutable, faisant de lui l'un des DJs les plus respectés et demandés au monde.",
        country: "Intl",
        id: "ben-klock",
        deezerId: "112674"
    },
    {
        name: "Marcel Dettmann",
        bio: "Marcel Dettmann est un architecte de la techno contemporaine et l'un des visages les plus emblématiques du Berghain. Son approche brute, réduite et pourtant riche en émotions a façonné le son de Berlin au XXIe siècle. Curateur exigeant et DJ hors pair, il continue d'influencer la scène techno mondiale par sa vision artistique intemporelle et sans concession.",
        country: "Intl",
        id: "marcel-dettmann",
        deezerId: "336497"
    },
    {
        name: "Rødhåd",
        bio: "Rødhåd est le maître berlinois d'une techno profonde, atmosphérique et mélancolique. Chef de file du collectif Dystopian, il crée des récits sonores immersifs qui captivent par leur puissance évocatrice. Ses sets, d'une intensité rare, sont des voyages au cœur d'une techno organique et émotionnelle qui résonne sur les plus grandes scènes internationales.",
        country: "Intl",
        id: "rodhad",
        deezerId: "2307591"
    },
    {
        name: "Freddy K",
        bio: "Freddy K est le puriste ultime de la techno, célèbre pour ses sets vinyles marathon et son engagement total envers la culture club. Actif depuis les années 90, il est le gardien d'un savoir-faire et d'une éthique sans compromis à travers son label KEY Vinyl. Figure respectée par ses pairs, il incarne l'essence même de la techno de club dans ce qu'elle a de plus authentique.",
        country: "Intl",
        id: "freddy-k",
        deezerId: "154625"
    },
    {
        name: "DVS1",
        bio: "DVS1, alias Zak Khutoretsky, est un DJ américain basé à Berlin, vénéré pour ses sets techno d'une pureté et d'une intensité sonore exceptionnelles. Résident au Berghain, il défend une vision de la fête basée sur le son et la connexion pure, loin des artifices. Son respect pour l'art du mixage fait de lui l'un des techniciens les plus accomplis et respectés de la planète.",
        country: "Intl",
        id: "dvs1",
        deezerId: "683110"
    },
    {
        name: "Oscar Mulero",
        bio: "Oscar Mulero est la légende absolue de la techno espagnole, pilier de la scène underground depuis le début des années 90. Fondateur du label PoleGroup, il distille une techno sombre, complexe et d'une précision chirurgicale. Son influence et sa longévité font de lui l'un des artistes les plus respectés et constants de l'histoire de la musique électronique européenne.",
        country: "Intl",
        id: "oscar-mulero",
        deezerId: "47262"
    },
    {
        name: "Surgeon",
        bio: "Anthony Child, alias Surgeon, est l'un des architectes les plus influents de la techno industrielle britannique. Depuis 1994, il repousse les limites du genre en fusionnant techno brute, dub et sonorités expérimentales. Son approche novatrice de la technologie en live et son son impitoyable font de lui une référence absolue pour tout amateur de techno sophistiquée.",
        country: "Intl",
        id: "surgeon",
        deezerId: "4125"
    },
    {
        name: "Blawan",
        bio: "Blawan est un producteur britannique visionnaire, célèbre pour sa techno industrielle aux rythmes percutants et aux textures sonores complexes. Artiste singulier, il réinvente sans cesse son univers à travers des machines analogiques et une créativité débordante. Ses productions, à la fois sombres et incroyablement groovy, en font l'un des innovateurs les plus passionnants de la scène actuelle.",
        country: "Intl",
        id: "blawan",
        deezerId: "2307771"
    }
];

const formattedNewArtists = newArtists.filter(a => !existingNames.has(a.name)).map(artist => {
    const nameSlug = artist.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/\./g, '');
    return {
        id: Math.max(...currentData.map(d => parseInt(d.id))) + 1 + "", // Inaccurate but following local pattern
        name: artist.name,
        bio: artist.bio,
        country: artist.country,
        image: `https://cdn-images.dzcdn.net/images/artist/${artist.deezerId}/1000x1000-000000-80-0-0.jpg`,
        rating: "0",
        spotify: `https://open.spotify.com/search/${encodeURIComponent(artist.name)}`,
        instagram: `https://instagram.com/${nameSlug.replace(/-/g, '')}`,
        facebook: `https://facebook.com/${nameSlug}`,
        soundcloud: `https://soundcloud.com/${nameSlug}`,
        beatport: `https://www.beatport.com/search?q=${encodeURIComponent(artist.name)}`
    };
});

// Update IDs to be unique
let nextId = Math.max(...currentData.map(d => isNaN(parseInt(d.id)) ? 0 : parseInt(d.id))) + 1;
formattedNewArtists.forEach(a => {
    a.id = (nextId++).toString();
});

const updatedData = [...currentData, ...formattedNewArtists];
fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
console.log(`Added ${formattedNewArtists.length} artists. Total: ${updatedData.length}`);
