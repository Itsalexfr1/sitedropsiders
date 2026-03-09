import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import re

import os

# Configuration
# On lit d'abord les variables d'environnement (GitHub Actions / Secrets)
WORKER_URL = os.environ.get("WORKER_URL", "http://localhost:8787")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "01061988")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
}

def get_beatport_top10():
    print("Fetching Beatport Top 10...")
    url = "https://www.beatport.com/top-100"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Beatport cache souvent ses données dans un script JSON __NEXT_DATA__
        # Mais on peut aussi parser le HTML classique des "Tracks"
        tracks = []
        track_elements = soup.select('.bucket-item.ec-item.track')[:10]
        
        for i, el in enumerate(track_elements):
            track_id = el.get('data-ec-id', f"bp-{i}")
            title = el.select_one('.buk-track-title .buk-track-primary-title').text.strip()
            # On ajoute le mix si présent
            mix = el.select_one('.buk-track-title .buk-track-remixed')
            if mix: title += f" ({mix.text.strip()})"
            
            artist = el.select_one('.buk-track-artists').text.strip()
            label = el.select_one('.buk-track-labels').text.strip()
            track_url = "https://www.beatport.com" + el.select_one('.buk-track-title a').get('href')
            
            # Pour l'embed Beatport, c'est souvent https://embed.beatport.com/track/ID
            embed_url = f"https://embed.beatport.com/track/{track_id}"
            
            tracks.append({
                "id": f"bp-{track_id}",
                "rank": i + 1,
                "title": title,
                "artist": artist,
                "label": label,
                "url": track_url,
                "embedUrl": embed_url
            })
        return tracks
    except Exception as e:
        print(f"Error fetching Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        # Les tracks sont dans .trk-row
        track_elements = soup.select('.trk-row.play-trk')[:10]
        
        for i, el in enumerate(track_elements):
            track_id = el.get('data-trkid', f"ts-{i}")
            title = el.select_one('.title').text.strip()
            # Artistes
            artists_el = el.select('.artists a')
            artist = ", ".join([a.text.strip() for a in artists_el])
            
            label = el.select_one('.label-name').text.strip()
            track_url = "https://www.traxsource.com" + el.select_one('.title a').get('href')
            
            # Embed Traxsource: https://embed.traxsource.com/player/track/ID
            embed_url = f"https://embed.traxsource.com/player/track/{track_id}"
            
            tracks.append({
                "id": f"ts-{track_id}",
                "rank": i + 1,
                "title": title,
                "artist": artist,
                "label": label,
                "url": track_url,
                "embedUrl": embed_url
            })
        return tracks
    except Exception as e:
        print(f"Error fetching Traxsource: {e}")
        return []

def get_juno_top10():
    print("Fetching Juno Download Top 10...")
    url = "https://www.junodownload.com/charts/top-10/all/all/1/yesterday/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        # Dans Juno, c'est souvent .item
        track_elements = soup.select('.item')[:10]
        
        for i, el in enumerate(track_elements):
            # Juno utilise souvent track_number ou un id dans l'URL
            link_el = el.select_one('.col-track-title a')
            if not link_el: continue
            
            title = link_el.text.strip()
            artist = el.select_one('.col-artist').text.strip()
            label = el.select_one('.col-label').text.strip()
            track_url = "https://www.junodownload.com" + link_el.get('href')
            
            # On extrait l'ID de l'URL pour l'embed
            # Ex: junodownload.com/products/xxx/7425809-02/ -> ID=7425809-02
            match = re.search(r'/(\d+-\d+)/', track_url)
            track_id = match.group(1) if match else f"jn-{i}"
            
            # Embed Juno: https://www.junodownload.com/player-embed/ID.m3u/
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
        return tracks
    except Exception as e:
        print(f"Error fetching Juno: {e}")
        return []

def main():
    if len(sys.argv) > 1:
        global WORKER_URL
        WORKER_URL = sys.argv[1].rstrip('/')
    
    print(f"Starting update for {WORKER_URL}")
    
    charts = {
        "beatport": get_beatport_top10(),
        "traxsource": get_traxsource_top10(),
        "juno": get_juno_top10()
    }
    
    # Vérification qu'on a bien des données
    for p, data in charts.items():
        if not data:
            print(f"Warning: No data for {p}, cancelling update to avoid empty charts.")
            return

    # Envoi au Worker
    print("Pushing data to Cloudflare Worker...")
    try:
        resp = requests.post(
            f"{WORKER_URL}/api/musique/charts/update",
            headers={"X-Admin-Password": ADMIN_PASSWORD},
            json=charts,
            timeout=10
        )
        if resp.ok:
            print("Successfully updated charts!")
        else:
            print(f"Failed to update: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Error pushing to worker: {e}")

if __name__ == "__main__":
    main()
