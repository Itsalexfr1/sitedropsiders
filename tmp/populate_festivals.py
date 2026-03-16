
import json
import os

filepath = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_festivals.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Set all existing to published
for item in data:
    item['status'] = 'published'

existing_names = {item['name'].lower() for item in data}

# Search results top 20 + extras
new_festivals = [
    ("Glastonbury Festival", "Somerset", "GB", "Glastonbury est le plus grand festival de plein air au monde, icône de la culture hippie et de la diversité musicale. Plus qu'un festival, c'est une ville temporaire qui célèbre l'art sous toutes ses formes."),
    ("Kappa FuturFestival", "Turin", "IT", "Kappa FuturFestival est le rendez-vous techno incontournable d'Italie, se déroulant dans le cadre industriel impressionnant du Parco Dora à Turin."),
    ("World Club Dome", "Francfort", "DE", "Surnommé 'le plus grand club du monde', le World Club Dome transforme le stade de Francfort en un méga-club épique pour un weekend de pure EDM."),
    ("Coachella Valley Music & Arts Festival", "Indio", "US", "Coachella est le festival le plus glamour au monde, mêlant programmation de pointe, installations artistiques massives et défilé de célébrités dans le désert californien."),
    ("Sunburn Festival", "Goa", "IN", "Sunburn est le plus grand festival d'Asie, apportant l'énergie de l'EDM sur les plages paradisiaques de Goa pour une célébration unique en son genre."),
    ("AMF (Amsterdam Music Festival)", "Amsterdam", "NL", "Se déroulant pendant l'Amsterdam Dance Event, l'AMF est le point culminant de la semaine, accueillant le couronnement du Top 100 DJs dans un stade surchauffé."),
    ("Parookaville", "Weeze", "DE", "Parookaville n'est pas qu'un festival, c'est une ville éphémère avec sa propre monnaie, son église et ses passeports, dédiée à la musique électronique."),
    ("Parklife", "Manchester", "GB", "Parklife est le festival urbain par excellence de Manchester, offrant une programmation éclectique allant du hip-hop à la house la plus pointue."),
    ("Sziget Festival", "Budapest", "HU", "Situé sur l'île de la Liberté à Budapest, le Sziget est une aventure culturelle de 7 jours mêlant musique, théâtre, cirque et bien-être."),
    ("Balaton Sound", "Zamárdi", "HU", "Balaton Sound est le festival de plage ultime d'Europe centrale, se tenant sur les rives du lac Balaton avec une ambiance estivale et festive incomparable."),
    ("Monegros Desert Festival", "Fraga", "ES", "Monegros est une rave de 24 heures en plein désert espagnol, offrant une expérience brute et radicale autour des meilleurs sons techno et drum & bass."),
    ("Neversea Festival", "Constanța", "RO", "Neversea est le plus grand festival de plage de Roumanie, une épopée musicale au bord de la mer Noire qui dure jusqu'au lever du soleil."),
    ("Boomtown", "Winchester", "GB", "Boomtown est un festival narratif immersif, une cité imaginaire construite pour célébrer l'art, la musique et le changement social."),
    ("Dekmantel Festival", "Amsterdam", "NL", "Dekmantel est la référence absolue pour les puristes, un festival à taille humaine qui met l'accent sur la qualité musicale et l'exploration sonore."),
    ("Lollapalooza", "Chicago", "US", "Lollapalooza est une institution de Chicago, un méga-festival multi-genres qui a su conquérir le monde avec des éditions internationales."),
    ("Electric Love", "Salzbourg", "AT", "Electric Love est le plus grand festival d'Autriche, niché dans les montagnes près du circuit Red Bull Ring pour une expérience EDM spectaculaire."),
    ("EDC Orlando", "Orlando", "US", "EDC Orlando apporte l'énergie et la magie de l'Electric Daisy Carnival sous le soleil de Floride, avec une production visuelle féerique."),
    ("Sonus Festival", "Novalja", "HR", "Sonus est le rendez-vous des techno-lovers en Croatie, une semaine de fête non-stop entre clubs de plage et boat parties sur l'île de Pag."),
    ("808 Festival", "Bangkok", "TH", "808 Festival est le pilier de la scène EDM thaïlandaise, attirant chaque année les plus grands noms mondiaux à Bangkok."),
    ("Veld Music Festival", "Toronto", "CA", "Veld est l'événement électronique majeur du Canada, transformant le Downsview Park de Toronto en un océan de basses et d'énergie."),
    ("Bonnaroo Music & Arts Festival", "Manchester", "US", "Bonnaroo est une célébration de la musique et de la communauté dans le Tennessee, connue pour son ambiance positive 'Radiate Positivity'."),
    ("Lovefest", "Vrnjačka Banja", "RS", "Lovefest est le joyau caché de Serbie, un festival intime et passionné qui a été nommé parmi les meilleurs événements européens."),
    ("Terminal V", "Édimbourg", "GB", "Terminal V est le titan de la techno écossaise, transformant le Royal Highland Centre en un entrepôt futuriste pour des raves massives."),
    ("Arc Music Festival", "Chicago", "US", "Arc célèbre les racines de la House music à Chicago, proposant un line-up sophistiqué dans le cadre urbain d'Union Park."),
    ("Snowbombing", "Mayrhofen", "AT", "Snowbombing est le festival le plus fou sur les pistes, alliant ski, snowboard et fêtes d'altitude dans les Alpes autrichiennes."),
    ("Panorama Festival", "Calabre", "IT", "Panorama apporte les meilleurs sons underground sur les côtes ensoleillées de Calabre, créant une expérience estivale italienne authentique."),
    ("Les Plages Electroniques", "Cannes", "FR", "Le plus grand festival de plage de la Côte d'Azur, transformant la plage du Palais des Festivals en un dancefloor géant à ciel ouvert."),
    ("Burning Man", "Black Rock City", "US", "Plus qu'un festival, une expérience de vie basée sur l'expression de soi et la participation radicale au milieu du désert du Nevada."),
    ("Airbeat One", "Neustadt-Glewe", "DE", "Airbeat One est célèbre pour sa mainstage thématique géante, représentant chaque année un monument mondial différent pour le délice des fans d'EDM."),
    ("Ravolution Music Festival", "Ho Chi Minh", "VN", "Le leader des festivals électroniques au Viêt Nam, apportant le son 'Rave' aux fans passionnés d'Asie du Sud-Est."),
    ("EDC Mexico", "Mexico", "MX", "La version mexicaine de l'EDC est devenue l'un des plus grands événements musicaux du pays, vibrant d'une énergie électrique incomparable."),
    ("Nameless Festival", "Annone di Brianza", "IT", "Nameless est la fierté de l'Italie du Nord, un festival dynamique qui mélange EDM, house et pop au pied des montagnes."),
    ("Ava Festival", "Belfast", "GB", "AVA est le carrefour de l'art et de l'électronique en Irlande du Nord, mettant en avant les talents locaux et les stars internationales."),
    ("Lost Village", "Lincolnshire", "GB", "Un festival immersif dans une forêt oubliée, où la gastronomie et l'art rencontrent une programmation électronique de niche."),
    ("Saga Festival", "Bucarest", "RO", "Saga est l'expérience visuelle ultime de Bucarest, proposant des scènes futuristes et une énergie débordante au cœur de la capitale roumaine."),
    ("A State Of Trance Festival", "Utrecht", "NL", "Le pèlerinage annuel des fans de trance, célébrant l'émission radio d'Armin van Buuren avec une production et une émotion hors normes."),
    ("Hard Summer", "Los Angeles", "US", "Hard Summer est le garant du son 'Heavy' en Californie, mêlant habilement Bass Music, House et Hip-Hop urbain."),
    ("Defected Croatia", "Tisno", "HR", "Le festival de la House music par excellence, une semaine hédoniste sous le soleil croate centrée sur le groove et la communauté Defected."),
    ("Mdlbeast Soundstorm", "Riyad", "SA", "Soundstorm est le plus grand festival du Moyen-Orient, une démonstration de puissance et d'unité musicale sans précédent dans le désert."),
    ("Tomorrowland Winter", "Alpe d'Huez", "FR", "La version hivernale de Tomorrowland transforme les Alpes françaises en un monde féerique de neige et de musique électronique."),
    ("Houghton Festival", "Norfolk", "GB", "Houghton est un festival d'art et de musique sans fin, célèbre pour ses sets prolongés et sa programmation underground sans compromis."),
    ("Glitch Festival", "Malte", "MT", "Glitch transforme l'île de Malte en un bastion techno, avec des fêtes dans des forts médiévaux et des sessions en mer."),
    ("Beyond The Valley", "Hesse", "AU", "Le festival de référence pour le Nouvel An en Australie, offrant une expérience musicale et camping premium dans un cadre verdoyant."),
    ("Baum Festival", "Bogota", "CO", "Baum est le pilier de la scène électronique colombienne, apportant le meilleur de la techno et de la house à Bogota."),
    ("Oasis Festival", "Marrakech", "MA", "Oasis allie musique électronique de classe mondiale et culture marocaine dans le cadre luxueux des jardins de Marrakech."),
    ("Sónar Lisboa", "Lisbonne", "PT", "L'extension portugaise du célèbre Sónar barcelonais, explorant les liens entre technologie, art et nouveaux sons électroniques."),
    ("Djakarta Warehouse Project", "Jakarta", "ID", "DWP est l'un des plus grands festivals d'Asie, une méga-fête urbaine qui attire des fans de tout le continent en Indonésie."),
    ("Groove Cruise", "Miami", "US", "La plus grande croisière électronique au monde, transformant un paquebot de luxe en un festival flottant 24h/24 vers les Bahamas."),
    ("Holy Ship!", "Miami", "US", "Une autre croisière mythique qui a défini le genre 'festival en mer', célèbre pour sa communauté de fans dévoués, les Shipfam."),
    ("Beyond Wonderland", "San Bernardino", "US", "Beyond Wonderland plonge les fans dans un univers inspiré d'Alice au Pays des Merveilles, avec une production Insomniac féerique.")
]

next_id = 41
for name, city, country, desc in new_festivals:
    if name.lower() not in existing_names:
        data.append({
            "id": f"f{next_id}",
            "name": name,
            "city": city,
            "country": country,
            "djmag_rank": next_id,
            "description": desc,
            "image": f"https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop&q=80&sig=f{next_id}",
            "website": f"https://www.{name.lower().replace(' ', '')}.com",
            "instagram": f"https://instagram.com/{name.lower().replace(' ', '')}",
            "votes": 0,
            "status": "published",
            "description_en": desc
        })
        next_id += 1

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Added {next_id - 41} new festivals. Total: {len(data)}")
