import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import re
import os

# Configuration
# On lit d'abord les variables d'environnement (GitHub Actions / Secrets)
WORKER_URL = os.environ.get("WORKER_URL", "https://dropsiders.fr")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "01061988")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
}

def get_beatport_top10():
    print("Fetching Beatport Top 10...")
    url = "https://www.beatport.com/top-100"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Beatport nouveau design (2024+)
        # On cherche souvent les titres dans des <a> qui contiennent "/track/"
        tracks = []
        
        # On essaye de trouver les lignes du tableau
        # Les lignes ont souvent des classes comme 'TrackList-style-ListItem' ou simplement des structures répétitives
        # Une approche plus stable est de parser le script __NEXT_DATA__ sil existe
        next_data = soup.select_one('#__NEXT_DATA__')
        if next_data:
            try:
                data = json.loads(next_data.string)
                # La structure du JSON de Beatport est complexe mais riche
                # On cherche dans props -> pageProps -> dehydrateState -> queries ...
                # Ou plus simplement, on scanne le JSON pour des objets de type "track"
                # Pour faire simple et robuste, on va rester sur du parsing HTML amélioré
                pass
            except: pass

        # Parsing HTML manuel basé sur les observations actuelles
        # Les titres sont dans des liens contenant "/track/"
        # Les artistes dans des liens contenant "/artist/"
        # Les labels dans des liens contenant "/label/"
        
        # Selection des conteneurs de tracks
        # Souvent dans des éléments avec des classes comme 'Track-style-TrackContainer'
        # On va chercher tous les éléments qui ressemblent à une ligne de track
        rows = soup.select('div[class*="TrackList-style-ListItem"], li[class*="TrackList-style-ListItem"], .bucket-item.track')
        if not rows:
            # Fallback sur une recherche plus large
            rows = soup.select('tr') # Parfois cest encore un <table>
            if not rows:
                # Si toujours rien, on cherche par les liens
                all_track_links = soup.select('a[href*="/track/"]')
                # On filtre pour garder les 10 premiers uniques
                seen_urls = set()
                rows = []
                for link in all_track_links:
                    url_part = link.get('href')
                    if url_part not in seen_urls:
                        seen_urls.add(url_part)
                        # On essaye de trouver le parent qui contient tout
                        parent = link.find_parent('div') or link.find_parent('li') or link.find_parent('tr')
                        if parent: rows.append(parent)
                    if len(rows) >= 10: break

        for i, row in enumerate(rows[:10]):
            try:
                title_el = row.select_one('a[href*="/track/"]')
                if not title_el: continue
                
                title = title_el.text.strip()
                track_url = "https://www.beatport.com" + title_el.get('href')
                
                # Extraction de lID pour l'embed
                # URL type: /track/nom-du-titre/1234567
                track_id_match = re.search(r'/track/.*?/(\d+)', track_url)
                track_id = track_id_match.group(1) if track_id_match else f"bp-{i}"
                
                # Artistes : souvent plusieurs
                artist_els = row.select('a[href*="/artist/"]')
                artists = [a.text.strip() for a in artist_els]
                artist_str = ", ".join(artists) if artists else "Unknown Artist"
                
                # Label
                label_el = row.select_one('a[href*="/label/"]')
                label = label_el.text.strip() if label_el else "Unknown Label"
                
                embed_url = f"https://embed.beatport.com/track/{track_id}"
                
                tracks.append({
                    "id": f"bp-{track_id}",
                    "rank": i + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": track_url,
                    "embedUrl": embed_url
                })
            except Exception as row_e:
                print(f"Error parsing Beatport row {i}: {row_e}")
        
        return tracks
    except Exception as e:
        print(f"Error fetching Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        # Traxsource est assez stable avec .trk-row
        track_elements = soup.select('.trk-row')[:10]
        
        for i, el in enumerate(track_elements):
            try:
                track_id = el.get('data-trkid')
                if not track_id:
                    # Try to extract from play button
                    play_btn = el.select_one('.play-trk')
                    track_id = play_btn.get('data-trkid') if play_btn else f"ts-{i}"

                title_el = el.select_one('.title a')
                title = title_el.text.strip() if title_el else "Unknown Title"
                
                # Mix names if available
                version_el = el.select_one('.version')
                if version_el:
                    title += f" ({version_el.text.strip()})"

                # Artists
                artist_els = el.select('.artists a')
                artists = [a.text.strip() for a in artist_els if a.text.strip()]
                artist_str = ", ".join(artists) if artists else "Unknown Artist"
                
                # Label
                label_el = el.select_one('.label-name')
                label = label_el.text.strip() if label_el else "Unknown Label"
                
                track_url = "https://www.traxsource.com" + title_el.get('href') if title_el else "#"
                embed_url = f"https://embed.traxsource.com/player/track/{track_id}"
                
                tracks.append({
                    "id": f"ts-{track_id}",
                    "rank": i + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": track_url,
                    "embedUrl": embed_url
                })
            except Exception as row_e:
                print(f"Error parsing Traxsource row {i}: {row_e}")
                
        return tracks
    except Exception as e:
        print(f"Error fetching Traxsource: {e}")
        return []

def get_juno_top10():
    print("Fetching Juno Download Top 10...")
    # URL plus fiable pour les tracks
    url = "https://www.junodownload.com/all/charts/bestsellers/weeks-top/tracks/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        # Juno utilise désormais des classes plus claires
        # Chaque track est un .juno-chart-row ou similaire
        # Ou on cherche par les liens de titres
        items = soup.select('.item')
        if not items:
            # Fallback sur une recherche de structure
            items = [el.find_parent('div', class_='item') for el in soup.select('.juno-title')]
            items = [i for i in items if i]

        for i, el in enumerate(items[:10]):
            try:
                title_el = el.select_one('.juno-title')
                if not title_el: continue
                
                title = title_el.text.strip()
                track_url = "https://www.junodownload.com" + title_el.get('href')
                
                artist_el = el.select_one('.juno-artist')
                artist = artist_el.text.strip() if artist_el else "Unknown Artist"
                
                label_el = el.select_one('.juno-label')
                label = label_el.text.strip() if label_el else "Unknown Label"
                
                # ID Juno pour l'embed
                # URL type: /products/nom/7425809-02/
                match = re.search(r'/(\d+-\d+)/', track_url)
                track_id = match.group(1) if match else f"jn-{i}"
                
                embed_url = f"https://www.junodownload.com/player-embed/{track_id}.m3u/"
                
                tracks.append({
                    "id": f"jn-{track_id}",
                    "rank": i + 1,
                    "title": title,
                    "artist": artist,
                    "label": label,
                    "url": track_url,
                    "embedUrl": embed_url
                })
            except Exception as row_e:
                print(f"Error parsing Juno row {i}: {row_e}")
                
        return tracks
    except Exception as e:
        print(f"Error fetching Juno: {e}")
        return []

def main():
    if len(sys.argv) > 1:
        global WORKER_URL
        WORKER_URL = sys.argv[1].rstrip('/')
    
    print(f"Starting update for {WORKER_URL}")
    
    beatport = get_beatport_top10()
    traxsource = get_traxsource_top10()
    juno = get_juno_top10()
    
    charts = {
        "beatport": beatport,
        "traxsource": traxsource,
        "juno": juno
    }
    
    # Vérification : on n'envoie que si on a au moins une source qui marche
    # Mais on prévient si une source est vide
    source_counts = {p: len(data) for p, data in charts.items()}
    print(f"Results: {source_counts}")
    
    if all(len(data) == 0 for data in charts.values()):
        print("Error: All sources returned 0 tracks. Aborting update.")
        sys.exit(1)

    # Récupération des anciennes données pour ne pas écraser par du vide si un site a échoué
    try:
        current_resp = requests.get(f"{WORKER_URL}/api/musique/charts", timeout=10)
        if current_resp.ok:
            old_charts = current_resp.json()
            for p in charts:
                if not charts[p] and p in old_charts:
                    print(f"Keeping existing data for {p} due to scrape failure.")
                    charts[p] = old_charts[p]
    except:
        print("Could not fetch current charts for fallback. Proceeding with new data.")

    # Envoi au Worker
    print("Pushing data to Cloudflare Worker...")
    try:
        resp = requests.post(
            f"{WORKER_URL}/api/musique/charts/update",
            headers={
                "X-Admin-Password": ADMIN_PASSWORD,
                "Content-Type": "application/json"
            },
            json=charts,
            timeout=15
        )
        if resp.ok:
            print("Successfully updated charts!")
        else:
            print(f"Failed to update: {resp.status_code} - {resp.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Error pushing to worker: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
