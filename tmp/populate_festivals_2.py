
import json
import os

filepath = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_festivals.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

existing_names = {item['name'].lower() for item in data}

extra_festivals = [
    ("Love International", "Tisno", "HR", "Un festival intime et magique sur la côte croate, célèbre pour ses boat parties et son ambiance bienveillante."),
    ("Medusa Sunbeach", "Cullera", "ES", "Un méga-festival espagnol sur la plage avec des scènes thématiques incroyables et une énergie EDM/Techno débordante."),
    ("Outlook Origins", "Tisno", "HR", "Le pèlerinage pour les amateurs de Sound System culture, Drum & Bass, Dub et Grime dans un cadre idyllique."),
    ("Electric Castle", "Bonțida", "RO", "Mélange unique de musique, technologie et art dans le cadre historique d'un château transylvanien."),
    ("Beonix Festival", "Limassol", "CY", "Un festival futuriste à Chypre qui allie musique électronique de pointe et installations artistiques numériques."),
    ("Ultra Europe", "Split", "HR", "La version européenne du mythique Ultra Music Festival, transformant le stade de Split en un océan d'énergie EDM."),
    ("Hideout Festival", "Zrće Beach", "HR", "Le festival qui a mis la plage de Zrće sur la carte mondiale, une semaine de fête non-stop dans les meilleurs clubs de l'île."),
    ("S2O Songkran", "Bangkok", "TH", "Le plus grand festival d'eau au monde, célébrant le Nouvel An thaïlandais avec des canons à eau géants et de l'EDM."),
    ("Djakarta Warehouse", "Jakarta", "ID", "Une expérience urbaine massive au cœur de l'Indonésie, rassemblant les plus grands noms de la scène électronique mondiale."),
    ("Sunburn Goa", "Goa", "IN", "L'événement électronique le plus emblématique d'Asie, une fusion de musique, d'art et de culture sur les plages de Goa."),
    ("World DJ Festival", "Séoul", "KR", "Le leader des festivals électroniques en Corée du Sud, connu pour sa production high-tech et son public passionné."),
    ("Blacklist Festival", "Oberhausen", "DE", "Le rendez-vous incontournable pour les amateurs de Bass Music et de Trap en Allemagne, dans un cadre industriel sombre."),
    ("Nibirii Festival", "Düren", "DE", "Un mélange unique de Goatrance, Techno et Drum & Bass au bord d'un lac, offrant une expérience immersive et colorée."),
    ("LMF Festival", "Zagreb", "HR", "Let the Music Be Free : un festival dynamique qui célèbre la liberté et la diversité électronique dans la capitale croate."),
    ("SAGA Festival", "Bucarest", "RO", "Une aventure visuelle et sonore au cœur de la Roumanie, avec des designs de scènes innovants et une ambiance électrique."),
    ("Terminal V Halloween", "Édimbourg", "GB", "La version automnale du célèbre festival écossais, transformant Halloween en une messe techno monumentale."),
    ("Time Warp", "Mannheim", "DE", "La référence absolue pour la techno depuis 30 ans, une expérience sensorielle où le son et la lumière ne font qu'un."),
    ("Movement", "Detroit", "US", "Le pèlerinage aux origines de la Techno, célébrant l'héritage de Detroit dans le cadre urbain du Hart Plaza."),
    ("CRSSD Festival", "San Diego", "US", "Un festival sophistiqué au bord de l'eau en Californie, privilégiant la House, la Techno et l'Indie de qualité."),
    ("Mysteryland", "Haarlemmermeer", "NL", "Le plus ancien festival électronique des Pays-Bas, un monde féerique de diversité musicale et de créativité débordante.")
]

next_id = len(data) + 1
for name, city, country, desc in extra_festivals:
    if name.lower() not in existing_names:
        data.append({
            "id": f"f{next_id}",
            "name": name,
            "city": city,
            "country": country,
            "djmag_rank": next_id,
            "description": desc,
            "image": f"https://images.unsplash.com/photo-1459749411177-042180ce673c?w=600&h=400&fit=crop&q=80&sig=f{next_id}",
            "website": f"https://www.{name.lower().replace(' ', '')}.com",
            "instagram": f"https://instagram.com/{name.lower().replace(' ', '')}",
            "votes": 0,
            "status": "published",
            "description_en": desc
        })
        next_id += 1

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
