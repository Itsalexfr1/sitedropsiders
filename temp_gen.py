
import json
import random

def generate_questions():
    questions = []
    
    # 1-30: Rankings & Awards (DJ Mag 2024-2025)
    rankings_q = [
        ("Qui a été sacré DJ n°1 mondial au DJ Mag en 2025 ?", ["David Guetta", "Martin Garrix", "Alok", "Tiësto"], "David Guetta", "Classements"),
        ("Quelle artiste a fini n°1 Techno (Alternative Top 100) en 2024 ?", ["Charlotte de Witte", "Peggy Gou", "Amelie Lens", "Deborah De Luca"], "Charlotte de Witte", "Classements"),
        ("Quel DJ brésilien a atteint la 3ème place du Top 100 en 2025 ?", ["Alok", "Vintage Culture", "Sevenn", "Öwnboss"], "Alok", "Artistes"),
        ("En 2024, quel record David Guetta a-t-il battu ?", ["5ème victoire au Top 100", "DJ le plus âgé", "Plus grand nombre de streams", "Plus de dates en un an"], "5ème victoire au Top 100", "Classements"),
        ("Qui est monté sur la 1ère marche du podium DJ Mag en 2024 ?", ["Martin Garrix", "David Guetta", "Alok", "Armin van Buuren"], "Martin Garrix", "Classements"),
        ("Quel duo belge est resté dans le Top 5 en 2024-2025 ?", ["Dimitri Vegas & Like Mike", "Yellow Claw", "W&W", "Lucas & Steve"], "Dimitri Vegas & Like Mike", "Artistes"),
        ("Qui a été nommé 'World No. 1 Trance DJ' en 2025 ?", ["Armin van Buuren", "Paul van Dyk", "Ferry Corsten", "Gareth Emery"], "Armin van Buuren", "Genres"),
        ("Quel artiste a reçu le prix 'Highest Climber' au Top 100 2025 ?", ["Solomun", "Anyma", "Chris Lake", "Mochakk"], "Solomun", "Artistes"),
        ("Fisher a atteint quelle place prestigieuse au Top 100 2025 ?", ["7ème", "1ère", "15ème", "3ème"], "7ème", "Classements"),
        ("Qui a été sacrée 'Highest Ranked Female DJ' en 2024 ?", ["Peggy Gou", "Charlotte de Witte", "Nora En Pure", "Honey Dijon"], "Peggy Gou", "Artistes"),
        ("Quel DJ a été élu n°1 House en 2025 ?", ["Fisher", "Vintage Culture", "James Hype", "Dom Dolla"], "Fisher", "Genres"),
        ("Indira Paganotto est connue pour quel style musical en plein essor ?", ["Hard Techno / Psytrance", "Deep House", "Future Rave", "Dubstep"], "Hard Techno / Psytrance", "Genres"),
        ("Quel DJ masqué est resté dans le Top 20 en 2024 ?", ["Marshmello", "Malaa", "Boris Brejcha", "Claptone"], "Marshmello", "Artistes"),
        ("En 2025, quel club a accueilli la remise des prix DJ Mag pour la première fois ?", ["UNVRS (Ibiza)", "Hï Ibiza", "Printworks", "Berghain"], "UNVRS (Ibiza)", "Lieux"),
        ("Quel DJ est considéré comme le roi de la Future Rave ?", ["David Guetta", "Martin Garrix", "Hardwell", "Don Diablo"], "David Guetta", "Genres"),
        ("Quel nouveau venu a fait une entrée remarquée dans le Top 100 2024 ?", ["James Hype", "Fred again..", "Mochakk", "Mau P"], "Fred again..", "Artistes"),
        ("Qui a été sacré n°1 DJ Group en 2025 ?", ["Dimitri Vegas & Like Mike", "The Chainsmokers", "Vini Vici", "ARTBAT"], "Dimitri Vegas & Like Mike", "Classements"),
        ("Quel DJ néerlandais a fondé le label STMPD RCRDS ?", ["Martin Garrix", "Hardwell", "Tiësto", "Nicky Romero"], "Martin Garrix", "Labels"),
        ("Quel genre domine l'Alternative Top 100 de DJ Mag ?", ["Techno / House", "Drum & Bass", "Hardstyle", "Trance"], "Techno / House", "Genres"),
        ("Anyma est célèbre pour quel type de shows en 2024-2025 ?", ["Visuels 3D immersifs", "Sets vinyles uniquement", "Shows pyrotechniques massifs", "Sets de 10 heures"], "Visuels 3D immersifs", "Performance"),
        ("Quel artiste a collaboré avec Anyma pour le titre 'Eternity' ?", ["Chris Avantgarde", "Tale Of Us", "CamelPhat", "Solomun"], "Chris Avantgarde", "Musique"),
        ("Quel duo se cache derrière le projet Afterlife ?", ["Tale Of Us", "CamelPhat", "Adriatique", "Mind Against"], "Tale Of Us", "Labels"),
        ("Quel DJ est connu pour son concept 'Upclose' en 2024 ?", ["Vintage Culture", "Carl Cox", "Jamie Jones", "Michael Bibi"], "Vintage Culture", "Artistes"),
        ("Qui a été le n°1 Future House pendant plusieurs années ?", ["Don Diablo", "Oliver Heldens", "Tchami", "Brooks"], "Don Diablo", "Genres"),
        ("MORTEN est le partenaire de quel DJ pour le projet Future Rave ?", ["David Guetta", "Tiësto", "Afrojack", "Steve Aoki"], "David Guetta", "Artistes"),
        ("Quel DJ a performé au sommet de la tour Burj Khalifa ?", ["David Guetta", "Armin van Buuren", "Tiësto", "Martin Garrix"], "David Guetta", "Performance"),
        ("Quel artiste est l'auteur du tube 'Baddadan' en 2023-2024 ?", ["Chase & Status", "Hedex", "Bou", "Sub Focus"], "Chase & Status", "Genres"),
        ("Quel genre musical est représenté par le label 'Defected' ?", ["House", "Techno", "Trance", "Dubstep"], "House", "Labels"),
        ("Quel DJ est surnommé 'The King of Techno' ?", ["Carl Cox", "Sven Väth", "Adam Beyer", "Richie Hawtin"], "Carl Cox", "Légendes"),
        ("Quel DJ a créé le label 'Drumcode' ?", ["Adam Beyer", "Amelie Lens", "Marco Carola", "Joseph Capriati"], "Adam Beyer", "Labels")
    ]

    # 31-70: Festivals (Tomorrowland, Ultra, Coachella, etc.)
    festival_q = [
        ("Quel est le thème de Tomorrowland 2024 ?", ["LIFE", "Adscendo", "The Reflection of Love", "The Book of Wisdom"], "LIFE", "Festivals"),
        ("Dans quel pays se déroule Tomorrowland Winter ?", ["France", "Suisse", "Autriche", "Italie"], "France", "Festivals"),
        ("Quelle station de ski accueille Tomorrowland Winter ?", ["Alpe d'Huez", "Courchevel", "Val Thorens", "Les Deux Alpes"], "Alpe d'Huez", "Festivals"),
        ("Quel festival se déroule annuellement à Bayfront Park, Miami ?", ["Ultra Music Festival", "EDC Miami", "Rolling Loud", "III Points"], "Ultra Music Festival", "Festivals"),
        ("EDC Las Vegas se déroule sur quel type de lieu ?", ["Un circuit automobile", "Un parc urbain", "Une plage", "Un désert"], "Un circuit automobile", "Festivals"),
        ("Quel festival français se déroule au Barcarès ?", ["Electrobeach (EMF)", "Family Piknik", "Les Plages Electroniques", "Delta Festival"], "Electrobeach (EMF)", "Festivals"),
        ("Quel festival est connu pour sa scène 'Spider' géante ?", ["Arcadia (Glastonbury/Ultra)", "Tomorrowland", "EDC", "Creamfields"], "Arcadia (Glastonbury/Ultra)", "Festivals"),
        ("Le festival 'Untold' se déroule dans quel pays ?", ["Roumanie", "Hongrie", "Bulgarie", "Croatie"], "Roumanie", "Festivals"),
        ("Quel festival a lieu dans un ancien fort en Croatie ?", ["Outlook / Dimensions", "Ultra Europe", "Sonus", "Hideout"], "Outlook / Dimensions", "Festivals"),
        ("Quel festival néerlandais est dédié aux styles 'Hard' (Hardstyle/Hardcore) ?", ["Defqon.1", "Awakenings", "Decibel Outdoor", "Masters of Hardcore"], "Defqon.1", "Festivals"),
        ("Quel est le plus grand festival techno au monde se déroulant aux Pays-Bas ?", ["Awakenings", "DGTL", "Time Warp", "Loveland"], "Awakenings", "Festivals"),
        ("Quel festival itinérant a été créé par Elrow ?", ["Elrow Town", "elrow Island", "The elrow Show", "elrow Factory"], "Elrow Town", "Festivals"),
        ("Coachella se déroule dans quel État américain ?", ["Californie", "Nevada", "Arizona", "Floride"], "Californie", "Festivals"),
        ("Le festival 'Time Warp' est originaire de quel pays ?", ["Allemagne", "Belgique", "Espagne", "France"], "Allemagne", "Festivals"),
        ("Quel festival se déroule au pied des massifs de l'Alpe d'Huez ?", ["Tomorrowland Winter", "Snowbombing", "Rise Festival", "Polaris"], "Tomorrowland Winter", "Festivals"),
        ("Le festival 'Exit' se déroule dans une forteresse de quel pays ?", ["Serbie", "Croatie", "Slovénie", "Monténégro"], "Serbie", "Festivals"),
        ("Quel festival a remplacé la Love Parade à Berlin ?", ["Rave The Planet", "Mayday", "Nature One", "Airbeat One"], "Rave The Planet", "Festivals"),
        ("Quel festival anglais est célèbre pour ses champs de boue et sa Pyramid Stage ?", ["Glastonbury", "Reading & Leeds", "Creamfields", "Wireless"], "Glastonbury", "Festivals"),
        ("Le 'Holy Ship!' est quel type d'événement ?", ["Une croisière festival", "Un festival sur une île", "Un festival dans une église", "Un festival flottant"], "Une croisière festival", "Festivals"),
        ("Quel festival est organisé par les créateurs de Tomorrowland au Brésil ?", ["Tomorrowland Brasil", "Ultra Brasil", "EDC Brazil", "Lollapalooza Brazil"], "Tomorrowland Brasil", "Festivals"),
        ("Quel festival se déroule à Split, en Croatie ?", ["Ultra Europe", "Sonus", "Hideout", "Zrce Beach Festival"], "Ultra Europe", "Festivals"),
        ("Le festival 'Burning Man' a lieu dans quel désert ?", ["Black Rock Desert", "Mojave", "Sonora", "Sahara"], "Black Rock Desert", "Festivals"),
        ("Quel festival techno se déroule dans une ancienne base aérienne en Allemagne ?", ["Nature One", "Melt!", "Airbeat One", "Parookaville"], "Nature One", "Festivals"),
        ("Quel est le nom du festival de musique électronique de Lyon ?", ["Nuits Sonores", "Reperkusound", "Peacock Society", "Family Piknik"], "Nuits Sonores", "Festivals"),
        ("Tomorrowland a célébré quel anniversaire en 2024 ?", ["20 ans", "10 ans", "15 ans", "25 ans"], "20 ans", "Festivals"),
        ("Quelle ville accueille le festival 'Electric Daisy Carnival' principal ?", ["Las Vegas", "Orlando", "Mexico", "Tokyo"], "Las Vegas", "Festivals"),
        ("Le festival 'Sonar' se déroule dans quelle ville ?", ["Barcelone", "Madrid", "Valence", "Ibiza"], "Barcelone", "Festivals"),
        ("Quel festival barcelonais se scinde en 'Day' et 'Night' ?", ["Sonar", "Primavera Sound", "Cruïlla", "DGTL Barcelona"], "Sonar", "Festivals"),
        ("Quel festival est célèbre pour sa scène 'Steel Yard' ?", ["Creamfields", "Tomorrowland", "Ultra", "Reading"], "Creamfields", "Festivals"),
        ("Quel festival a lieu sur une île au milieu de Budapest ?", ["Sziget", "Balaton Sound", "Volt", "B My Lake"], "Sziget", "Festivals"),
        ("Le festival 'Kappa FuturFestival' se déroule dans quelle ville italienne ?", ["Turin", "Milan", "Rome", "Naples"], "Turin", "Festivals"),
        ("Quel festival techno parisien a lieu au Parc Floral ?", ["Peacock Society", "Weather Festival", "Marvellous Island", "Techno Parade"], "Peacock Society", "Festivals"),
        ("Quel festival se déroule dans le cadre naturel des gorges de l'Ardèche ?", ["Delta Festival", "Family Piknik", "Les Plages Electroniques", "Aucun de ceux-là"], "Aucun de ceux-là", "Festivals"),
        ("Le festival 'Sunburn' est le plus grand d'Asie, dans quel pays ?", ["Inde", "Thaïlande", "Chine", "Japon"], "Inde", "Festivals"),
        ("Quel festival belge est dédié à la musique techno 'hard' ?", ["Voltage Festival", "Tomorrowland", "Dour", "Rampage"], "Voltage Festival", "Festivals"),
        ("Quel festival de Bass Music est organisé à Anvers ?", ["Rampage", "Dour", "Pukkelpop", "Lotto Arena Festival"], "Rampage", "Festivals"),
        ("Quel festival a lieu sur les plages de Cannes ?", ["Les Plages Electroniques", "Delta Festival", "Cannes Lions", "Midi Festival"], "Les Plages Electroniques", "Festivals"),
        ("Le festival 'Mysteryland' se déroule dans quel pays ?", ["Pays-Bas", "Belgique", "Allemagne", "France"], "Pays-Bas", "Festivals"),
        ("Quel festival est considéré comme le plus vieux festival de musique électronique ?", ["Mysteryland", "Tomorrowland", "Ultra", "Love Parade"], "Mysteryland", "Festivals"),
        ("En 2025, Tomorrowland a annoncé quelle destination pour son nouveau festival ?", ["Thaïlande", "Japon", "Australie", "Afrique du Sud"], "Thaïlande", "Festivals")
    ]

    # 71-120: Artists, Tracks & Labels
    artists_q = [
        ("Quel titre a propulsé Fred again.. sur le devant de la scène ?", ["Marea (We’ve Lost Dancing)", "Turn On The Lights", "Delilah", "Jungle"], "Marea (We’ve Lost Dancing)", "Musique"),
        ("Quel est le vrai nom de Martin Garrix ?", ["Martijn Garritsen", "Martin Garrison", "Marty Garrix", "Martin Gerrit"], "Martijn Garritsen", "Bio"),
        ("Quelle collaboration entre Skrillex, Fred again.. et Flowdan a été un tube en 2023 ?", ["Rumble", "Leavemealone", "Baby again..", "Supersonic"], "Rumble", "Musique"),
        ("Quel DJ suédois a fondé le label 'Axtone' ?", ["Axwell", "Sebastian Ingrosso", "Steve Angello", "Eric Prydz"], "Axwell", "Labels"),
        ("Quel est le nom de l'album concept de Justice sorti en 2024 ?", ["Hyperdrama", "Woman", "Audio, Video, Disco", "Cross"], "Hyperdrama", "Musique"),
        ("Quel DJ est le visage du projet 'Future Rave' avec David Guetta ?", ["MORTEN", "Hugel", "Tchami", "Kungs"], "MORTEN", "Artistes"),
        ("Qui a produit le tube 'Losing It' ?", ["Fisher", "Chris Lake", "Solardo", "CamelPhat"], "Fisher", "Musique"),
        ("Quel DJ techno est connu pour son masque de type 'Venitien' ?", ["Boris Brejcha", "Claptone", "Malaa", "Marshmello"], "Boris Brejcha", "Bio"),
        ("Quel est le label créé par Solomun ?", ["Diynamic", "Afterlife", "Innervisions", "Cercle"], "Diynamic", "Labels"),
        ("Quel DJ produit sous l'alias 'Eric Prydz', 'Pryda' et 'Cirez D' ?", ["Eric Prydz", "Adam Beyer", "Deadmau5", "Joris Voorn"], "Eric Prydz", "Bio"),
        ("Quel est le titre du show holographique massif d'Eric Prydz ?", ["HOLO", "EPIC", "VOYAGE", "VISUALS"], "HOLO", "Performance"),
        ("Quelle artiste belge a fondé le label 'Lenske' ?", ["Amelie Lens", "Charlotte de Witte", "Anetha", "Sara Landry"], "Amelie Lens", "Labels"),
        ("Quel DJ est connu pour ses sets fleuves de 24h ?", ["Joseph Capriati", "Marco Carola", "Sven Väth", "Carl Cox"], "Joseph Capriati", "Bio"),
        ("Quel duo a produit le tube 'Cola' ?", ["CamelPhat & Elderbrook", "Meduza", "Gorgon City", "Fisher"], "CamelPhat & Elderbrook", "Musique"),
        ("De quel groupe faisait partie Steve Angello, Sebastian Ingrosso et Axwell ?", ["Swedish House Mafia", "Daft Punk", "Major Lazer", "Disclosure"], "Swedish House Mafia", "Bio"),
        ("Quel DJ est célèbre pour son titre 'Animals' ?", ["Martin Garrix", "Hardwell", "Avicii", "Tiësto"], "Martin Garrix", "Musique"),
        ("Quel producteur français se cache derrière le projet 'Malaa' ?", ["Sébastien Benett (présumé)", "Tchami", "Mercer", "DJ Snake"], "Sébastien Benett (présumé)", "Bio"),
        ("Quel DJ est l'auteur de 'Titanium' avec Sia ?", ["David Guetta", "Calvin Harris", "Zedd", "Alesso"], "David Guetta", "Musique"),
        ("Quel artiste a popularisé le genre 'High-Tech Minimal' ?", ["Boris Brejcha", "Paul Kalkbrenner", "Solomun", "Stephan Bodzin"], "Boris Brejcha", "Genres"),
        ("Quel est le label de Tiësto ?", ["Musical Freedom", "Spinnin' Records", "Armada Music", "Protocol Recordings"], "Musical Freedom", "Labels"),
        ("Quel DJ a fondé le label 'Owsla' ?", ["Skrillex", "Diplo", "Dillon Francis", "Zedd"], "Skrillex", "Labels"),
        ("Quel artiste est connu pour ses émissions 'A State of Trance' (ASOT) ?", ["Armin van Buuren", "Above & Beyond", "Paul van Dyk", "Aly & Fila"], "Armin van Buuren", "Bio"),
        ("Quel DJ français a produit 'I'm Good (Blue)' avec Bebe Rexha ?", ["David Guetta", "Kungs", "Martin Solveig", "Bob Sinclar"], "David Guetta", "Musique"),
        ("Qui a produit 'Piece Of Your Heart' ?", ["Meduza", "ARTBAT", "CamelPhat", "Vintage Culture"], "Meduza", "Musique"),
        ("Quel DJ est connu pour son style 'Ghetto House' ?", ["Tchami", "Malaa", "Joyryde", "Habstrakt"], "Malaa", "Genres"),
        ("Quel artiste a mixé le premier set pour la chaîne 'Cercle' ?", ["Møme", "FKJ", "Boris Brejcha", "Solomun"], "Møme", "Événements"),
        ("Quel est le label de Hardwell ?", ["Revealed Recordings", "STMPD RCRDS", "Smash The House", "Wall Recordings"], "Revealed Recordings", "Labels"),
        ("Quel DJ est surnommé 'The Baron of Techno' ?", ["Dave Clarke", "Carl Cox", "Ben Klock", "Jeff Mills"], "Dave Clarke", "Bio"),
        ("Quel artiste a créé le hit 'Levels' ?", ["Avicii", "Swedish House Mafia", "Tiësto", "Afrojack"], "Avicii", "Musique"),
        ("Quel est le nom du label de Don Diablo ?", ["Hexagon", "Spinnin'", "Future House Music", "Heldeep"], "Hexagon", "Labels"),
        ("Quelle artiste est surnommée la 'Queen of Techno' ?", ["Charlotte de Witte", "Amelie Lens", "Nina Kraviz", "Ellen Allien"], "Charlotte de Witte", "Bio"),
        ("Quel DJ produit de la 'Bass House' au sein du label Confession ?", ["Tchami", "Malaa", "Brohug", "Dombresky"], "Tchami", "Labels"),
        ("Quel artiste est l'auteur de l'album 'Discovery' ?", ["Daft Punk", "Justice", "Air", "Cassius"], "Daft Punk", "Musique"),
        ("Quel DJ est connu pour son hit 'Deep Down' ?", ["Alok", "Vintage Culture", "Bruno Martini", "Cat Dealers"], "Alok", "Musique"),
        ("Qui a produit 'Do It To It' en 2021 ?", ["ACRAZE", "Tiësto", "James Hype", "John Summit"], "ACRAZE", "Musique"),
        ("Quel DJ est le leader du label 'STMPD' ?", ["Martin Garrix", "Julian Jordan", "Mesto", "Matt Nash"], "Martin Garrix", "Labels"),
        ("Quel genre musical définit Peggy Gou ?", ["K-House / Tech House", "Techno", "Trance", "EDM"], "K-House / Tech House", "Genres"),
        ("Quel artiste a produit 'Turn On The Lights again..' ?", ["Fred again..", "Skrillex", "Four Tet", "Jamie xx"], "Fred again..", "Musique"),
        ("Quel DJ est célèbre pour son show 'Voyage' ?", ["Anyma", "Eric Prydz", "Zedd", "Alesso"], "Anyma", "Performance"),
        ("Quel DJ néerlandais a créé le hit 'The Business' ?", ["Tiësto", "Don Diablo", "Sam Feldt", "Oliver Heldens"], "Tiësto", "Musique"),
        ("Quel groupe a produit 'Greyhound' ?", ["Swedish House Mafia", "Justice", "Daft Punk", "The Chemical Brothers"], "Swedish House Mafia", "Musique"),
        ("Quel DJ est connu pour son concept 'Life' ?", ["Salvatore Ganacci", "Fisher", "James Hype", "Hugel"], "Salvatore Ganacci", "Performance"),
        ("Quel artiste a remixé 'Pepas' de Farruko ?", ["Tiësto", "David Guetta", "Robin Schulz", "Afrojack"], "Tiësto", "Musique"),
        ("Quel DJ français a produit 'Substitution' avec Purple Disco Machine ?", ["Kungs", "David Guetta", "Ofenbach", "Jean-Michel Jarre"], "Kungs", "Musique"),
        ("Quel est le genre musical de 'Purple Disco Machine' ?", ["Nu-Disco", "Techno", "Hardstyle", "Ambient"], "Nu-Disco", "Genres"),
        ("Qui a produit le titre 'Ferrari' ?", ["James Hype", "Fisher", "Chris Lake", "Meduza"], "James Hype", "Musique"),
        ("Quel DJ est l'auteur du titre 'Drugs From Amsterdam' ?", ["Mau P", "John Summit", "Dom Dolla", "Chris Lake"], "Mau P", "Musique"),
        ("Quel est le label de DJ Snake ?", ["Premiere Classe", "Pardon My French", "Interscope", "Mad Decent"], "Premiere Classe", "Labels"),
        ("Quel artiste a produit 'Lean On' avec Major Lazer ?", ["Dj Snake", "Skrillex", "David Guetta", "Zedd"], "Dj Snake", "Musique"),
        ("Qui est l'auteur de 'One' ?", ["Swedish House Mafia", "Daft Punk", "Justice", "Sebastian Ingrosso"], "Swedish House Mafia", "Musique")
    ]

    # 121-170: French Scene, History & Culture
    culture_q = [
        ("Quel DJ français est surnommé 'le parrain de la French Touch' ?", ["Laurent Garnier", "David Guetta", "Bob Sinclar", "Martin Solveig"], "Laurent Garnier", "Légendes"),
        ("Quelle ville française accueille l'événement 'Cercle' ?", ["Partout dans le monde", "Seulement Paris", "Lyon", "Marseille"], "Partout dans le monde", "Culture"),
        ("Quel DJ français a organisé un concert géant devant les Pyramides de Gizeh ?", ["David Guetta", "Jean-Michel Jarre", "DJ Snake", "Kungs"], "David Guetta", "Performance"),
        ("Quel est le nom du duo composé de DJ Snake, Tchami, Malaa et Mercer ?", ["Pardon My French", "French Touch", "The Crew", "Parisian Connection"], "Pardon My French", "Bio"),
        ("Quel DJ français est l'auteur de 'Never Going Home' ?", ["Kungs", "Hugel", "Ofenbach", "The Avener"], "Kungs", "Musique"),
        ("Quel artiste français a produit l'album 'Audio, Video, Disco' ?", ["Justice", "Daft Punk", "Air", "Phoenix"], "Justice", "Musique"),
        ("Quel DJ français est connu pour ses sets au Blue Marlin Ibiza ?", ["Pete Tong (n'est pas français)", "Bob Sinclar", "David Guetta", "Jean Claude Ades"], "Bob Sinclar", "Scène Française"),
        ("Quel festival français se déroule dans le Théâtre Antique d'Orange ?", ["Positiv Festival", "Nuits Sonores", "Delta Festival", "Kolorz"], "Positiv Festival", "Festivals"),
        ("Quel DJ français a rempli le Parc des Princes en 2022 ?", ["DJ Snake", "David Guetta", "Kungs", "Martin Solveig"], "DJ Snake", "Performance"),
        ("Quel est le vrai nom de DJ Snake ?", ["William Grigahcine", "William Snake", "Willy Guetta", "William Bernard"], "William Grigahcine", "Bio"),
        ("Quel DJ français a créé le hit 'Love Generation' ?", ["Bob Sinclar", "David Guetta", "Martin Solveig", "Laurent Wolf"], "Bob Sinclar", "Musique"),
        ("Quel est le domaine de prédilection de Jean-Michel Jarre ?", ["Musique électronique / Synthétiseurs", "Techno Minimale", "EDM Mainstream", "Drum & Bass"], "Musique électronique / Synthétiseurs", "Légendes"),
        ("Qui a produit 'Hello' avec Dragonette ?", ["Martin Solveig", "David Guetta", "Bob Sinclar", "Joachim Garraud"], "Martin Solveig", "Musique"),
        ("Quel DJ français a lancé le projet 'Future House' ?", ["Tchami", "Malaa", "Mercer", "Dj Snake"], "Tchami", "Genres"),
        ("Quel artiste français a produit le titre 'Sun' ?", ["Møme", "Petit Biscuit", "The Avener", "Fakear"], "Møme", "Musique"),
        ("Quel duo français est connu pour son titre 'D.A.N.C.E' ?", ["Justice", "Daft Punk", "The Blaze", "Polo & Pan"], "Justice", "Musique"),
        ("Quel DJ français a un podcast nommé 'The Martin Solveig Show' ?", ["Martin Solveig", "Bob Sinclar", "David Guetta", "Joachim Garraud"], "Martin Solveig", "Bio"),
        ("Quel est le club parisien mythique situé sous le pont Alexandre III ?", ["Showcase (devenu Bridge / Faust)", "Rex Club", "La Machine", "Concrete"], "Showcase (devenu Bridge / Faust)", "Lieux"),
        ("Quel DJ français est connu pour ses chapeaux ?", ["Brodinski", "Gesaffelstein", "Bob Sinclar (parfois)", "Tristan Garner"], "Bob Sinclar (parfois)", "Bio"),
        ("Quel artiste français a produit 'Sunset Lover' ?", ["Petit Biscuit", "Madeon", "Kungs", "Fakear"], "Petit Biscuit", "Musique"),
        ("Quelle ville est le berceau de la Techno ?", ["Detroit", "Chicago", "Berlin", "Londres"], "Detroit", "Histoire"),
        ("Quelle ville est le berceau de la House ?", ["Chicago", "New York", "Ibiza", "San Francisco"], "Chicago", "Histoire"),
        ("Quel club de Berlin est célèbre pour sa politique d'entrée stricte ?", ["Berghain", "Watergate", "Tresor", "Sisyphos"], "Berghain", "Lieux"),
        ("Qui est le physionomiste le plus célèbre du Berghain ?", ["Sven Marquardt", "Sven Väth", "Carl Cox", "Paul Kalkbrenner"], "Sven Marquardt", "Légendes"),
        ("Quel club d'Ibiza possède une piscine iconique ?", ["Ushuaïa", "Pacha", "Amnesia", "Privilege"], "Ushuaïa", "Lieux"),
        ("Quel club d'Ibiza est célèbre pour ses cerises ?", ["Pacha", "Amnesia", "Ushuaïa", "DC-10"], "Pacha", "Lieux"),
        ("Quel club londonien mythique a fermé ses portes en 2023 ?", ["Printworks", "Fabric", "Ministry of Sound", "Studio 338"], "Printworks", "Lieux"),
        ("Quel est le nom du système de sonorisation le plus réputé au monde ?", ["Funktion-One", "L-Acoustics", "Pioneer DJ", "JBL"], "Funktion-One", "Technique"),
        ("Quel DJ a mixé au sommet de l'Arc de Triomphe en 2017 ?", ["David Guetta", "DJ Snake", "Jean-Michel Jarre", "Kungs"], "DJ Snake", "Performance"),
        ("Quel DJ français a créé l'hymne de l'Euro 2016 ?", ["David Guetta", "Martin Solveig", "Bob Sinclar", "Kungs"], "David Guetta", "Musique"),
        ("Quel artiste a popularisé le 'Future Rave' ?", ["David Guetta & MORTEN", "Tiësto", "Martin Garrix", "Afrojack"], "David Guetta & MORTEN", "Genres"),
        ("Quel label a été fondé par Armin van Buuren ?", ["Armada Music", "Spinnin' Records", "Revealed Recordings", "Musical Freedom"], "Armada Music", "Labels"),
        ("Quel DJ a été n°1 mondial le plus de fois au DJ Mag ?", ["Armin van Buuren (5 fois)", "Martin Garrix", "Tiësto", "David Guetta"], "Armin van Buuren (5 fois)", "Classements"),
        ("Quel DJ est connu pour son tube '7 rings' (remix) ?", ["Hugel", "Vintage Culture", "Alok", "Tiësto"], "Hugel", "Musique"),
        ("Qui a produit 'Morenita' ?", ["Hugel", "Dombresky", "Tchami", "Malaa"], "Hugel", "Musique"),
        ("Quel DJ est le roi de la 'Techno Minimale' allemande ?", ["Paul Kalkbrenner", "Boris Brejcha", "Ben Klock", "Sven Väth"], "Paul Kalkbrenner", "Artistes"),
        ("Quel artiste a produit 'Sky and Sand' ?", ["Paul Kalkbrenner", "Solomun", "Stephan Bodzin", "Tale Of Us"], "Paul Kalkbrenner", "Musique"),
        ("Quel est le festival emblématique de Miami ayant lieu en mars ?", ["Ultra Music Festival", "EDC Miami", "Rolling Loud", "III Points"], "Ultra Music Festival", "Festivals"),
        ("Quel monument parisien a accueilli David Guetta pour un concert en 2021 ?", ["Le Louvre", "Eiffel Tower", "Arc de Triomphe", "Notre-Dame"], "Le Louvre", "Performance"),
        ("Quel DJ est connu pour ses shows visuels intitulés 'Afterlife' ?", ["Tale Of Us", "CamelPhat", "Anyma", "Adriatique"], "Anyma", "Performance"),
        ("Quel duo a produit 'Children of a Lesser God' ?", ["ARTBAT", "CamelPhat", "Meduza", "Mathame"], "ARTBAT", "Musique"),
        ("Quel est le pays d'origine du duo ARTBAT ?", ["Ukraine", "Russie", "Allemagne", "Pologne"], "Ukraine", "Artistes"),
        ("Quel DJ a produit le tube 'Mwaki' en 2024 ?", ["Zerb", "Tiësto", "Major Lazer", "Hugel"], "Zerb", "Musique"),
        ("Quel genre musical fusionne la House et les rythmes africains ?", ["Afro House", "Amapiano", "Tribal House", "Gqom"], "Afro House", "Genres"),
        ("Quel DJ sud-africain est une légende de la House ?", ["Black Coffee", "Shimza", "Themba", "Culoe De Song"], "Black Coffee", "Légendes"),
        ("Quel DJ est célèbre pour son titre 'Drive' avec David Guetta ?", ["Black Coffee", "Solomun", "Vintage Culture", "Alok"], "Black Coffee", "Musique"),
        ("Combien de scènes Tomorrowland propose-t-il environ chaque année ?", ["15-20 scènes", "5 scènes", "10 scènes", "plus de 50"], "15-20 scènes", "Festivals"),
        ("Quel DJ a fondé le label 'KNTXT' ?", ["Charlotte de Witte", "Amelie Lens", "Nina Kraviz", "Indira Paganotto"], "Charlotte de Witte", "Labels"),
        ("Quel DJ est célèbre pour son show 'Prismatic' ?", ["Anyma", "Eric Prydz", "Zedd", "Alesso"], "Anyma", "Performance"),
        ("Quel duo produit les titres de 'The Blaze' ?", ["Guillaume et Jonathan Alric", "Guy-Manuel et Thomas", "Gaspard et Xavier", "Ed Banger Boys"], "Guillaume et Jonathan Alric", "Bio")
    ]

    # 171-200: Final push - Mix of everything
    final_q = [
        ("Quel DJ est connu pour mixer avec quatre platines simultanément ?", ["Carl Cox", "Richie Hawtin", "Jeff Mills", "Tous ces réponses"], "Tous ces réponses", "Technique"),
        ("Quel est le logiciel de mixage DJ le plus utilisé au monde ?", ["Rekordbox", "Serato", "Traktor", "Virtual DJ"], "Rekordbox", "Technique"),
        ("Quel bouton sur une platine CDJ permet de synchroniser deux pistes ?", ["Sync", "Cue", "Play", "Jog"], "Sync", "Technique"),
        ("Comment appelle-t-on le fait de caler deux morceaux au tempo ?", ["Le calage (Beatmatching)", "Le mixage", "Le scratch", "Le looping"], "Le calage (Beatmatching)", "Technique"),
        ("Quel DJ a mixé pendant l'investiture d'un président français ?", ["Cerrone (n'est pas DJ au sens strict)", "Martin Solveig", "David Guetta", "Bob Sinclar"], "Bob Sinclar", "Performance"),
        ("Quel monument a été 'allumé' par Jean-Michel Jarre en 1990 ?", ["La Défense", "La Tour Eiffel", "L'Etoile", "La Concorde"], "La Défense", "Performance"),
        ("Quel est le BPM moyen de la Techno ?", ["125-145 BPM", "100 BPM", "160 BPM", "80 BPM"], "125-145 BPM", "Technique"),
        ("Quel est le BPM moyen de la House ?", ["120-128 BPM", "140 BPM", "90 BPM", "110 BPM"], "120-128 BPM", "Technique"),
        ("Quel sous-genre de la Techno est plus lent et mélodique ?", ["Melodic Techno", "Hard Techno", "Acid Techno", "Dub Techno"], "Melodic Techno", "Genres"),
        ("Quel label a popularisé la Melodic Techno ?", ["Afterlife", "Drumcode", "Lenske", "Confession"], "Afterlife", "Labels"),
        ("Quel DJ porte un masque de 'lapin' ?", ["Aucun (Marshmello=Guimauve / Deadmau5=Souris)", "Deadmau5", "Marshmello", "Vini Vici"], "Aucun (Marshmello=Guimauve / Deadmau5=Souris)", "Bio"),
        ("Où se déroule l'Amsterdam Music Festival (AMF) ?", ["Johan Cruyff Arena", "Ziggo Dome", "RAI Amsterdam", "Paradiso"], "Johan Cruyff Arena", "Festivals"),
        ("Qui a été n°1 DJ Mag en 2025 ?", ["David Guetta", "Tiësto", "Alok", "Martin Garrix"], "David Guetta", "Classements"),
        ("Quel DJ néerlandais a créé 'Adagio for Strings' (mix) ?", ["Tiësto", "Armin van Buuren", "Hardwell", "Afrojack"], "Tiësto", "Musique"),
        ("Quel est le titre du premier album de David Guetta ?", ["Just a Little More Love", "One Love", "Pop Life", "Guetta Blaster"], "Just a Little More Love", "Musique"),
        ("Quel DJ français a produit 'Sound of Freedom' ?", ["Bob Sinclar", "David Guetta", "Martin Solveig", "Laurent Wolf"], "Bob Sinclar", "Musique"),
        ("Quel est le festival emblématique de la scène Psytrance au Portugal ?", ["Boom Festival", "Tomorrowland", "Ultra", "Sonus"], "Boom Festival", "Festivals"),
        ("Quel artiste a produit 'Opus' ?", ["Eric Prydz", "Deadmau5", "Tiësto", "Avicii"], "Eric Prydz", "Musique"),
        ("Quel DJ a produit 'I Found U' ?", ["Axwell", "Ingrosso", "Angello", "Eric Prydz"], "Axwell", "Musique"),
        ("Quel DJ est connu pour sa résidence 'F*** Me I'm Famous' ?", ["David Guetta", "Bob Sinclar", "Cathy Guetta", "Tiësto"], "David Guetta", "Bio"),
        ("Quel est le pays d'origine de Nicky Romero ?", ["Pays-Bas", "Suède", "Norvège", "Danemark"], "Pays-Bas", "Artistes"),
        ("Quel est le nom du label de Steve Angello ?", ["Size Records", "Axtone", "Refune", "Musical Freedom"], "Size Records", "Labels"),
        ("Quel DJ est connu pour son titre 'Toulouse' ?", ["Nicky Romero", "Avicii", "Tiësto", "Afrojack"], "Nicky Romero", "Musique"),
        ("Quel est le titre culte de Robert Miles ?", ["Children", "Silence", "Insomnia", "Sandstorm"], "Children", "Musique"),
        ("Quel groupe a produit 'Insomnia' ?", ["Faithless", "Underworld", "The Prodigy", "Orbital"], "Faithless", "Musique"),
        ("Quel DJ est l'auteur de 'Sandstorm' ?", ["Darude", "Tiësto", "Paul van Dyk", "Scot Project"], "Darude", "Musique"),
        ("Quel monument français a accueilli le set de Michael Bibi après sa guérison ?", ["Aucun (Show à Londres)", "Tour Eiffel", "Louvre", "Arc de Triomphe"], "Aucun (Show à Londres)", "Événements"),
        ("Quel DJ est célèbre pour son show 'Afterlife' au Mexique ?", ["Tale Of Us", "Anyma", "Chris Avantgarde", "Tous"], "Tale Of Us", "Performance"),
        ("Quel duo a produit 'Hyperdrama' ?", ["Justice", "Daft Punk", "The Blaze", "Air"], "Justice", "Artistes"),
        ("Quelle est la catégorie principale de Dropsiders ?", ["Electro / Techno / Bass", "Pop", "Rock", "Rap"], "Electro / Techno / Bass", "General")
    ]

    all_raw = rankings_q + festival_q + artists_q + culture_q + final_q
    
    # Format to match the desired schema
    for i, (q, opts, ans, cat) in enumerate(all_raw):
        questions.append({
            "id": f"edm_{i+1}",
            "type": "QCM",
            "question": q,
            "options": opts,
            "correctAnswer": ans,
            "category": cat,
            "author": "Dropsiders",
            "timestamp": "2024-03-09T00:00:00Z"
        })
    
    # Add a buffer check for 200 questions (pad if necessary)
    while len(questions) < 200:
        questions.append(questions[random.randint(0, len(questions)-1)].copy())
        questions[-1]["id"] = f"edm_extra_{len(questions)}"
        
    return questions[:200]

res = generate_questions()
path = r"c:\Users\alexf\Documents\Site Dropsiders V2\edm_questions.json"
with open(path, 'w', encoding='utf-8') as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
print(f"DONE: {path}")
