
import json
import os

filepath = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_clubs.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    item['status'] = 'published'

existing_names = {item['name'].lower() for item in data}

new_clubs = [
    ("Green Valley", "Camboriú", "BR", "Élu plusieurs fois meilleur club au monde, Green Valley est un temple de l'EDM situé dans une jungle luxuriante au Brésil."),
    ("Echostage", "Washington DC", "US", "Echostage est le plus grand club de la côte Est américaine, réputé pour son système sonore massif et ses productions visuelles spectaculaires."),
    ("Ushuaïa Ibiza", "Ibiza", "ES", "Ushuaïa est le plus célèbre club en plein air d'Ibiza, offrant une expérience festive luxueuse autour de sa piscine iconique."),
    ("Bootshaus", "Cologne", "DE", "Bootshaus est une institution allemande célèbre pour ses soirées EDM, Hardstyle et Techno dans une ancienne base navale."),
    ("Savaya", "Bali", "ID", "Savaya est un club de plage spectaculaire perché sur les falaises d'Uluwatu, offrant une vue imprenable sur l'océan Indien."),
    ("Laroc Club", "Valinhos", "BR", "Laroc est le premier 'sunset club' du Brésil, un lieu immense à ciel ouvert qui accueille les plus grandes stars mondiales."),
    ("Illuzion", "Phuket", "TH", "Illuzion est le leader de la nuit en Thaïlande, un club aux dimensions pharaoniques avec un système visuel de pointe."),
    ("Noa Beach Club", "Zrće Beach", "HR", "Noa est le joyau de l'île de Pag, un club construit sur l'eau avec des terrasses, des piscines et une ambiance estivale survoltée."),
    ("Papaya Club", "Zrće Beach", "HR", "Papaya est l'un des plus anciens et des plus respectés clubs de Croatie, symbole de la renaissance de la scène festive de Novalja."),
    ("PLAY HOUSE", "Chengdu", "CN", "PLAY HOUSE est un méga-club chinois qui repousse les limites de la technologie avec des scènes mobiles et des lasers futuristes."),
    ("FABRIK", "Madrid", "ES", "FABRIK est le temple de la techno à Madrid, une salle immense capable d'accueillir des milliers de clubbers pour des soirées marathon."),
    ("Opium Barcelone", "Barcelone", "ES", "Situé sur la plage, l'Opium est le club le plus chic de Barcelone, mêlant restaurant haut de gamme et dancefloor glamour."),
    ("Eden Ibiza", "Ibiza", "ES", "Eden est le bastion de San Antonio, un club rénové avec un système Void Incubus stupéfiant et une programmation house et techno solide."),
    ("Elsewhere", "Brooklyn", "US", "Elsewhere est un espace multi-salles à Brooklyn dédié à la culture club underground, aux concerts et à l'art visuel."),
    ("Tenax Club", "Florence", "IT", "Tenax est une légende italienne, pionnier de la scène house et techno à Florence depuis les années 80."),
    ("Il Muretto", "Jesolo", "IT", "Il Muretto est l'un des plus anciens clubs d'Italie, une institution de l'été vénitien célèbre pour son toit ouvrant."),
    ("Yalta Club", "Sofia", "BG", "Yalta est le berceau de la culture club en Bulgarie, ayant accueilli les premiers DJs internationaux après la chute du régime."),
    ("D-Edge", "São Paulo", "BR", "D-Edge est célèbre pour son design futuriste avec des milliers de LED et son acoustique impeccable, hub de l'underground brésilien."),
    ("Warung Beach Club", "Itajaí", "BR", "Le 'temple' du Brésil, Warung est un club en bois exotique face à la mer, célèbre pour ses levers de soleil magiques."),
    ("Output", "Brooklyn", "US", "Bien qu'ayant officiellement fermé, Output reste dans les mémoires comme le club qui a interdit les photos pour privilégier l'expérience musicale pure."),
    ("Cavo Paradiso", "Mykonos", "GR", "Perché sur les falaises de Paradise Beach, Cavo Paradiso est l'un des plus beaux clubs au monde, face au coucher de soleil sur l'Égée."),
    ("Paradise Club", "Mykonos", "GR", "Paradise Club est le cœur battant de Mykonos, un lieu festif mondialement connu pour ses pool parties et ses guests de renom."),
    ("Culture Club", "Gand", "BE", "Culture Club est une référence belge pour la house et l'électronique de qualité, avec une esthétique design et une programmation soignée."),
    ("Fuse", "Bruxelles", "BE", "Fuse est le plus ancien club techno de Belgique, une institution bruxelloise respectée dans le monde entier pour son authenticité."),
    ("La Terrazza", "Barcelone", "ES", "Situé dans le Poble Espanyol, La Terrazza est un club en plein air magnifique qui célèbre l'été barcelonais depuis des décennies."),
    ("Village Underground", "Londres", "GB", "Lieu hybride installé dans d'anciens wagons de métro et entrepôts, c'est l'un des cœurs de la scène créative et club de Shoreditch."),
    ("Kater Blau", "Berlin", "DE", "Héritier de l'esprit du Bar25, Kater Blau est un lieu onirique au bord de la Spree avec une ambiance festival et des sets infinis."),
    ("Sisyphos", "Berlin", "DE", "Ancienne usine de biscuits pour chiens, Sisyphos est un terrain de jeu géant où l'on se perd pendant des jours au son d'une techno solaire."),
    ("About Blank", "Berlin", "DE", "Un club militant et underground situé à Ostkreuz, réputé pour son superbe jardin et ses soirées techno et house radicales."),
    ("Robert Johnson", "Offenbach", "DE", "Situé près de Francfort, le Robert Johnson est adoré par les puristes pour son minimalisme, son système sonore d'exception et sa vue sur le Main."),
    ("Tulum Jungle", "Tulum", "MX", "La scène de Tulum a créé des clubs éphémères et permanents dans la jungle, où la spiritualité rencontre la techno mélodique."),
    ("Zouk Las Vegas", "Las Vegas", "US", "Le nouveau titan de Las Vegas, apportant l'expérience Zouk de Singapour dans la cité du jeu avec une technologie de pointe."),
    ("Marquee LV", "Las Vegas", "US", "Le Marquee de Las Vegas est un complexe monumental avec beach club de jour et méga-club de nuit, symbole de la démesure locale."),
    ("Omini Club", "Chengdu", "CN", "Un autre joyau de la scène club chinoise en pleine explosion, avec une production visuelle qui défie l'imagination."),
    ("L'Héritage", "Paris", "FR", "Un club parisien élégant et feutré qui perpétue l'esprit de la nuit parisienne sélective et musicale."),
    ("Badaboum", "Paris", "FR", "Badaboum est un lieu hybride entre salle de concert, club et bar à cocktails, hub de la scène house et disco à Bastille."),
    ("Djoon", "Paris", "FR", "Le temple de la soul et de la deep house à Paris, réputé pour son dancefloor en bois et ses soirées aux rythmes afro-house."),
    ("Zig Zag", "Paris", "FR", "Situé près des Champs-Élysées, Zig Zag était un club spacieux accueillant les grands noms de la tech-house internationale."),
    ("Yoyo", "Paris", "FR", "Installé sous le Palais de Tokyo, le Yoyo offre un cadre brut et contemporain pour des soirées électroniques et des événements mode."),
    ("Nitsa", "Barcelone", "ES", "Le club résident de l'Apolo à Barcelone, une institution qui programme le meilleur de l'électronique mondiale depuis les années 90."),
    ("Input BCN", "Barcelone", "ES", "Input est conçu comme un hub sonore à Barcelone, avec un système acoustique Meyer Sound qui est parmi les meilleurs d'Europe."),
    ("Tobacco Dock", "Londres", "GB", "Grand espace industriel qui accueille des événements majeurs comme Junction 2 ou des soirées LWE dans un cadre magnifique."),
    ("Printworks", "Londres", "GB", "Ancienne imprimerie devenue le club le plus spectaculaire de Londres avant sa fermeture temporaire, célèbre pour ses jeux de lumières axiaux."),
    ("E1 London", "Londres", "GB", "E1 est un entrepôt à Wapping doté d'un système sonore Funktion-One sur mesure, rendez-vous des amateurs de techno intense."),
    ("Phonox", "Londres", "GB", "Phonox à Brixton privilégie l'intimité, avec un seul dancefloor et pour mission de ramener le DJing à ses racines les plus pures."),
    ("Egg London", "Londres", "GB", "Véritable labyrinthe sur trois étages à Kings Cross, l'Egg est resté fidèle aux soirées qui durent jusqu'au petit matin."),
    ("Sub Club", "Glasgow", "GB", "Ouvert depuis 1987, le Sub Club est une icône mondiale, ayant les enceintes dans le sol pour faire vibrer physiquement les danseurs."),
    ("Stereo", "Montréal", "CA", "Stereo est mondialement connu pour son acoustique parfaite et ses sets marathons de 10h ou plus par les techniciens les plus respectés."),
    ("Radion", "Amsterdam", "NL", "Radion est un espace culturel et club à Amsterdam installé dans une ancienne cafétéria, hub de l'innovation techno."),
    ("Shelter", "Amsterdam", "NL", "Club souterrain caché sous l'A'DAM Toren, Shelter est un bastion de la nuit amstellodamoise accessible par une trappe métallique.")
]

next_id = 46
for name, city, country, desc in new_clubs:
    if name.lower() not in existing_names:
        data.append({
            "id": f"c{next_id}",
            "name": name,
            "city": city,
            "country": country,
            "djmag_rank": next_id,
            "description": desc,
            "image": f"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80&sig=c{next_id}",
            "website": f"https://www.{name.lower().replace(' ', '')}.com",
            "instagram": f"https://instagram.com/{name.lower().replace(' ', '')}",
            "votes": 0,
            "status": "published",
            "description_en": desc
        })
        next_id += 1

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Added {next_id - 46} new clubs. Total: {len(data)}")
