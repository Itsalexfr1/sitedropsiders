
import json
import os

filepath = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_clubs.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

existing_names = {item['name'].lower() for item in data}

extra_clubs = [
    ("Space Riccione", "Riccione", "IT", "La renaissance italienne de la marque légendaire Space, un club futuriste sur la côte adriatique."),
    ("Nitsa Club", "Barcelone", "ES", "Le cœur battant de l'électronique alternative à Barcelone, niché dans la mythique salle Apolo."),
    ("Razzmatazz", "Barcelone", "ES", "Un complexe industriel massif avec cinq salles aux ambiances radicalement différentes, véritable institution catalane."),
    ("Il Muretto", "Jesolo", "IT", "Considéré comme l'un des plus beaux clubs d'Italie, il attire les plus grands noms de la tech-house chaque été."),
    ("Space Miami", "Miami", "US", "Célèbre pour ses 'After Hours' sur la terrasse qui durent jusqu'au lendemain midi, c'est le cœur de la nuit à Miami."),
    ("LIV Miami", "Miami", "US", "Le summum du luxe et du glamour à South Beach, un lieu où les performances live et le clubbing haut de gamme se rencontrent."),
    ("E11EVEN", "Miami", "US", "Un club 24/7 unique en son genre, mêlant spectacle de cabaret, méga-club et hospitalité de luxe."),
    ("Brooklyn Mirage", "Brooklyn", "US", "Un sanctuaire en plein air avec un mur LED monumental, offrant l'une des expériences audiovisuelles les plus immersives au monde."),
    ("De School", "Amsterdam", "NL", "Héritier du Trouw, ce club installé dans une ancienne école est devenu une référence mondiale pour sa liberté et son audace musicale."),
    ("Paradiso", "Amsterdam", "NL", "Ancienne église transformée en salle de concert et club, un lieu chargé d'histoire et doté d'une acoustique magique."),
    ("Melkweg", "Amsterdam", "NL", "Un centre culturel multidisciplinaire qui accueille des soirées clubbing légendaires comme 'Techno Tuesday'."),
    ("Egg London", "Londres", "GB", "Un labyrinthe sur trois étages à Kings Cross, célèbre pour ses soirées marathons et son superbe jardin."),
    ("XOYO", "Londres", "GB", "Situé à Shoreditch, ce club est connu pour ses résidences de DJs visionnaires et son ambiance intime et électrique."),
    ("Lux Fragil", "Lisbonne", "PT", "Le club le plus iconique du Portugal, avec une vue imprenable sur le Tage et une programmation toujours à la pointe."),
    ("Womb", "Tokyo", "JP", "Niché à Shibuya, Womb est célèbre pour son système sonore impeccable et sa boule à facettes géante, icône du clubbing nippon."),
    ("Contact Tokyo", "Tokyo", "JP", "Un club souterrain sophistiqué avec une politique stricte sur les photos pour préserver l'immersion musicale."),
    ("Zouk Singapore", "Singapour", "SG", "Une légende asiatique qui a défini le clubbing dans la région depuis plus de 30 ans, désormais installé à Clarke Quay."),
    ("Laroc Club", "Valinhos", "BR", "Le premier sunset club du Brésil, une arène gigantesque en plein air avec une production digne d'un festival."),
    ("Surreal Park", "Camboriú", "BR", "Un parc thématique dédié à la musique électronique, mêlant art, nature et techno dans un cadre onirique."),
    ("Watergate", "Berlin", "DE", "Célèbre pour son plafond LED iconique et sa terrasse sur la Spree, c'est le bastion de la house et de la techno mélodique à Berlin.")
]

next_id = len(data) + 1
for name, city, country, desc in extra_clubs:
    if name.lower() not in existing_names:
        data.append({
            "id": f"c{next_id}",
            "name": name,
            "city": city,
            "country": country,
            "djmag_rank": next_id,
            "description": desc,
            "image": f"https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&h=400&fit=crop&q=80&sig=c{next_id}",
            "website": f"https://www.{name.lower().replace(' ', '')}.com",
            "instagram": f"https://instagram.com/{name.lower().replace(' ', '')}",
            "votes": 0,
            "status": "published",
            "description_en": desc
        })
        next_id += 1

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
