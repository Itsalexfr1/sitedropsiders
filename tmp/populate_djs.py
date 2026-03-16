
import json
import os

filepath = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_djs.json"

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Ensure no hidden "waiting" ones
for item in data:
    if 'status' in item:
        item['status'] = 'published'

existing_names = {item['name'].lower() for item in data}

new_djs = [
    ("Martin Garrix", "Martin Garrix est le prodige de l'électronique néerlandaise, élu plusieurs fois numéro 1 mondial. Il a conquis la planète avec son tube 'Animals' et continue de dominer les mainstages mondiaux avec une énergie et un smile incomparables."),
    ("Peggy Gou", "Icône de la mode et de la musique originaire de Corée du Sud, Peggy Gou a créé son propre genre 'K-House'. Sa personnalité vibrante et son hit 'It Makes You Forget' l'ont propulsée au sommet de la scène mondiale."),
    ("Vintage Culture", "Lukas Ruiz, alias Vintage Culture, est le titan de la scène house brésilienne. Connu pour ses productions percutantes et ses sets marathons, il est devenu un acteur incontournable des clubs du monde entier."),
    ("Steve Aoki", "Le fondateur de Dim Mak Records est célèbre pour son énergie débordante, ses lancers de gâteaux légendaires et sa capacité à fusionner l'EDM avec toutes les influences culturelles modernes."),
    ("Skrillex", "Sonny Moore, alias Skrillex, est le révolutionnaire de la Bass Music qui a su se réinventer sans cesse. Lauréat de nombreux Grammy Awards, il reste l'un des producteurs les plus innovants de notre génération."),
    ("Tiësto", "Considéré par beaucoup comme le plus grand DJ de tous les temps, Tiësto a traversé les époques, de la trance à l'electro-pop, en restant toujours au sommet et en influençant des générations d'artistes."),
    ("Lost Frequencies", "Felix De Laet, alias Lost Frequencies, a conquis le monde avec ses mélodies mélancoliques et ses productions raffinées comme 'Are You With Me'. C'est le maître de la house tropicale et élégante."),
    ("Nicky Romero", "Le fondateur du label Protocol Recordings est un pilier de la Progressive House, célèbre pour son talent de producteur et ses sets puissants qui font vibrer les mainstages internationales."),
    ("Nervo", "Les sœurs jumelles Mim et Liv Nervo sont les DJs féminines les plus célèbres au monde, ayant écrit des hits pour les plus grandes stars avant d'embrasser une carrière flamboyante sur scène."),
    ("Adriatique", "Le duo zurichois composé d'Adrian et Adrian est la référence absolue de la techno mélodique profonde. Leurs productions sur Afterlife et Diynamic sont des chefs-d'œuvre de sophistication sonore."),
    ("Tale Of Us", "Karm et Matteo, les fondateurs du label Afterlife, ont créé un univers sonore et visuel mélancolique qui a redéfini la techno contemporaine, transformant chaque set en voyage cinématographique."),
    ("Solid Grooves (PAWSA & Michael Bibi)", "Leaders du mouvement Tech-House moderne, ils ont créé un son 'Groovy' addictif qui domine les dancefloors de Londres à Ibiza, avec une énergie brute et authentique."),
    ("Solomun", "Le boss du label Diynamic est réputé pour ses sets marathons et sa capacité incroyable à lire le dancefloor. Ses résidences à Ibiza sont devenues des moments cultes de la culture clubbing."),
    ("Keinemusik (&ME, Rampa, Adam Port)", "Ce collectif berlinois a insufflé un vent de fraîcheur sur la house mondiale, mêlant influences organiques et mélodies envoûtantes qui captivent une communauté de fans passionnés."),
    ("Mochakk", "Le jeune prodige brésilien est la nouvelle sensation de la house, apportant un charisme et une technique de mixage spectaculaire qui enflamment les réseaux sociaux et les clubs mondiaux."),
    ("Maddix", "Maddix a créé un pont unique entre le Big Room et la Techno, forgeant le son 'Techno-Rave' qui domine aujourd'hui les mainstages de festivals comme Tomorrowland."),
    ("Deborah De Luca", "La reine de la techno napolitaine est célèbre pour ses sets énergiques et sa présence scénique magnétique. Elle a su bâtir un empire musical indépendant grâce à un talent brut et une détermination sans faille."),
    ("Reinier Zonneveld", "Le maître du 'Live Techno' est capable d'improviser des sets entiers avec ses machines, offrant une expérience puissante et unique qui repousse les limites du genre."),
    ("Vini Vici", "Duo israélien précurseur de la Psytrance sur les scènes Mainstage, ils ont su marier mélodies tribales et puissance électronique avec des tubes comme 'Great Spirit'."),
    ("Oliver Heldens", "Pionnier de la Future House sous son propre nom et maître de la techno sombre sous l'alias HI-LO, Oliver est l'un des producteurs les plus polyvalents et respectés de l'industrie."),
    ("Marshmello", "Le DJ masqué à l'univers onirique a su transcender la musique électronique pour devenir une icône pop mondiale, captivant un public jeune et fidèle à travers le globe."),
    ("Paul van Dyk", "Légende vivante et architecte de la musique Trance, l'Allemand continue de porter le message d'une musique électronique émotionnelle et puissante depuis plus de trois décennies."),
    ("Swedish House Mafia", "Axwell, Steve Angello et Sebastian Ingrosso forment le trio le plus iconique de l'EDM. Leur retour a marqué le monde avec un son plus sombre et sophistiqué, confirmant leur statut de légendes."),
    ("Kaaze", "Le protégé de Hardwell a su se forger un style 'Rock-EDM' unique, apportant une dimension épique et mélodique à la scène Big Room moderne."),
    ("Korolova", "La DJ ukrainienne est devenue l'une des artistes les plus en vue de la scène Melodic Techno, offrant des sets chargés d'émotion et de visuels spectaculaires."),
    ("Dubdogz", "Le duo brésilien est réputé pour ses remixes house survitaminés et son énergie débordante, faisant vibrer les plus grands clubs d'Amérique du Sud."),
    ("Julian Jordan", "Signé sur STMPD RCRDS, Julian est le maître d'une électronique percutante et futuriste, collaborant régulièrement avec son ami Martin Garrix."),
    ("Nora En Pure", "La reine de la Deep House mélodique apporte une touche organique et classique à la musique électronique, transportant son public dans des paysages sonores sereins et majestueux."),
    ("Sara Landry", "Nouvelle icône de la Hard Techno, Sara Landry impose des sets brutaux et rapides qui captivent la nouvelle génération de clubbers en quête d'intensité pure."),
    ("Mike Williams", "L'un des précurseurs du son 'Future Bounce', Mike continue de distiller des productions joyeuses et mélodiques qui ravissent les fans d'EDM du monde entier."),
    ("Kölsch", "Le producteur danois Rune Reilly Kölsch crée une techno mélodique émotionnelle unique sous son chapeau emblématique, signant des hymnes sur le label Kompakt."),
    ("Mau P", "Révélation fulgurante avec son hit 'Drugs from Amsterdam', Mau P est devenu en un clin d'œil la nouvelle coqueluche de la tech-house mondiale."),
    ("Meduza", "Le trio italien a remis la house mélodique au sommet des charts mondiaux avec des tubes comme 'Piece of Your Heart', alliant pop et crédibilité club."),
    ("W&W", "Le duo néerlandais est synonyme d'énergie Mainstage, mêlant Trance, Big Room et Happy Hardcore pour des sets d'une puissance acoustique dévastatrice."),
    ("R3HAB", "L'un des artistes les plus prolifiques de la scène mondiale, R3HAB multiplie les hits et les collaborations pop, restant une figure centrale des festivals EDM."),
    ("Black Coffee", "Le maître de l'Afro House a porté les sons d'Afrique du Sud sur toutes les scènes mondiales, de sa résidence à Ibiza à ses collaborations avec Drake."),
    ("Fedde Le Grand", "Pionnier de la house hollandaise, Fedde est une légende vivante célèbre pour son hit 'Put Your Hands Up for Detroit' et sa technique de mixage exemplaire."),
    ("The Chainsmokers", "Duo au succès planétaire mêlant EDM et Indie-Pop, ils ont marqué l'histoire avec des records d'écoutes et des tournées mondiales spectaculaires."),
    ("Bassjackers", "Spécialistes du son 'Club' énergique, ils continuent de livrer des bombes pour les dancefloors et de brûler les planches des plus grands festivals."),
    ("ATB", "André Tanneberger est l'un des piliers de l'électronique allemande, immortalisé par son classique '9 PM (Till I Come)' et ses mélodies trance intemporelles."),
    ("Zedd", "Producteur méticuleux et perfectionniste, Zedd a su fusionner la complexité de l'électro avec une efficacité pop redoutable, accumulant les succès mondiaux."),
    ("Deborah De Luca", "Maîtresse de la techno napolitaine, ses sets sont réputés pour leur énergie brute et leur précision technique, faisant d'elle une figure incontournable de l'underground."),
    ("Tujamo", "Le roi du son 'Bounce' percutant, Tujamo a créé une signature sonore unique qui fait vibrer les clubs de la planète entière depuis des années."),
    ("Mochakk", "Véritable performer, il apporte une théâtralité et une passion communicative à la house music, devenant une icône pour la nouvelle génération."),
    ("Lucas & Steve", "Le duo néerlandais est la référence de la House mélodique et joyeuse, apportant un smile et une énergie solaire à chaque festival."),
    ("Danny Avila", "Passé de l'EDM à une techno 3.0 sombre et audacieuse, Danny Avila prouve sa capacité incroyable à évoluer et à maîtriser tous les codes de l'électronique."),
    ("Mike Williams", "Toujours à la pointe de l'innovation mélodique, il reste l'un des artistes les plus appréciés pour sa créativité et sa proximité avec ses fans."),
    ("DubVision", "Le duo expert des mélodies Progressive House épiques, signant des hymnes qui restent gravés dans la mémoire des festivaliers de Tomorrowland."),
    ("Cat Dealers", "Duo brésilien incontournable mêlant house et influences pop, ils sont les ambassadeurs du son électronique festif d'Amérique Latine."),
    ("Jax Jones", "Le roi de la house pop britannique, créant des tubes entêtants qui dominent les ondes et les clubs avec un groove inimitable.")
]

next_id = 109
for name, bio in new_djs:
    if name.lower() not in existing_names:
        data.append({
            "id": str(next_id),
            "name": name,
            "bio": bio,
            "country": "Intl",
            "image": f"https://cdn-images.dzcdn.net/images/artist/{next_id}/1000x1000-000000-80-0-0.jpg",
            "rating": "0",
            "spotify": f"https://open.spotify.com/search/{name.replace(' ', '%20')}",
            "instagram": f"https://instagram.com/{name.lower().replace(' ', '')}",
            "facebook": f"https://facebook.com/{name.lower().replace(' ', '')}",
            "soundcloud": f"https://soundcloud.com/{name.lower().replace(' ', '')}",
            "beatport": f"https://www.beatport.com/search?q={name.replace(' ', '%20')}",
            "bio_en": bio,
            "status": "published"
        })
        next_id += 1

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Added {next_id - 109} new DJs. Total: {len(data)}")
