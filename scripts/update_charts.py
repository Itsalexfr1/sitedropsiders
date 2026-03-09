import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import re
import os

# Configuration
# On nettoie l'URL pour éviter les doublons de slashs
WORKER_URL = os.environ.get("WORKER_URL", "https://dropsiders.fr").strip().rstrip('/')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "01061988").strip()

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
}

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

def get_beatport_top10():
    print("Fetching Beatport Top 10...")
    url = "https://www.beatport.com/top-100"
    try:
        r = requests.get(url, headers=HEADERS, timeout=25)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Method 1: __NEXT_DATA__
        next_data_script = soup.select_one('#__NEXT_DATA__')
        if next_data_script:
            try:
                data = json.loads(next_data_script.string)
                def find_tracks(obj):
                    if isinstance(obj, list):
                        for item in obj:
                            res = find_tracks(item)
                            if res: return res
                    elif isinstance(obj, dict):
                        if 'results' in obj and isinstance(obj['results'], list) and len(obj['results']) > 5:
                            return obj['results']
                        for v in obj.values():
                            res = find_tracks(v)
                            if res: return res
                    return None

                results = find_tracks(data)
                if results:
                    tracks = []
                    for i, t in enumerate(results[:10]):
                        track_id = t.get('id')
                        title = t.get('name')
                        mix = t.get('mix_name')
                        if mix: title += f" ({mix})"
                        artist_str = ", ".join([a.get('name', '') for a in t.get('artists', [])])
                        label = t.get('label', {}).get('name', 'Unknown')
                        slug = t.get('slug', '')
                        tracks.append({
                            "id": f"bp-{track_id}",
                            "rank": i + 1,
                            "title": title,
                            "artist": artist_str,
                            "label": label,
                            "url": f"https://www.beatport.com/track/{slug}/{track_id}",
                            "embedUrl": f"https://embed.beatport.com/track/{track_id}"
                        })
                    return tracks
            except: pass
        return []
    except Exception as e:
        print(f"Error Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        time.sleep(1)
        r = requests.get(url, headers=HEADERS, timeout=25)
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        # Traxsource rows are often .trk-row or .play-track
        rows = soup.select('.trk-row, .track-row, .play-track')
        for i, row in enumerate(rows):
            if len(tracks) >= 10: break
            try:
                title_a = row.select_one('.title a, a[href^="/track/"]')
                if not title_a: continue
                
                href = title_a.get('href')
                id_match = re.search(r'/track/(\d+)/', href)
                track_id = id_match.group(1) if id_match else row.get('data-trkid')
                
                title = clean_text(title_a.text)
                version = row.select_one('.version')
                if version: title += f" ({clean_text(version.text)})"
                
                artists = [clean_text(a.text) for a in row.select('.artists a, .com-artists')]
                artist_str = ", ".join(dict.fromkeys(artists))
                
                label_el = row.select_one('.label-name, .label a, a[href^="/label/"]')
                label = clean_text(label_el.text) if label_el else "Unknown"
                
                tracks.append({
                    "id": f"ts-{track_id}",
                    "rank": len(tracks) + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": f"https://www.traxsource.com{href}",
                    "embedUrl": f"https://embed.traxsource.com/player/track/{track_id}"
                })
            except: continue
        return tracks
    except Exception as e:
        print(f"Error Traxsource: {e}")
        return []

def get_juno_top10():
    print("Fetching Juno Download Top 10...")
    # New URL for Juno Charts
    url = "https://www.junodownload.com/all/charts/bestsellers/tracks/"
    try:
        time.sleep(1)
        r = requests.get(url, headers=HEADERS, timeout=25)
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        # Support for Juno's newer grid
        items = soup.select('.item, .juno-track, div[class*="product-list-item"]')
        if not items:
            # Fallback based on typical product links
            items = [el.find_parent('div') for el in soup.select('a[href*="/products/"]') if el.find_parent('div')]
            # Grouping to avoid duplicates
            items = list(dict.fromkeys(items))

        for i, item in enumerate(items):
            if len(tracks) >= 10: break
            try:
                title_a = item.select_one('.juno-title, a[href*="/products/"]')
                if not title_a: continue
                
                href = title_a.get('href')
                id_match = re.search(r'/(\d+-\d+)/', href)
                if not id_match: continue
                track_id = id_match.group(1)
                
                title = clean_text(title_a.text)
                if not title: continue
                
                artist_el = item.select_one('.juno-artist, .artists, .col-artist, a[href*="/artists/"]')
                artist = clean_text(artist_el.text) if artist_el else "Unknown Artist"
                
                label_el = item.select_one('.juno-label, .col-label, a[href*="/labels/"]')
                label = clean_text(label_el.text) if label_el else "Unknown Label"
                
                tracks.append({
                    "id": f"jn-{track_id}",
                    "rank": len(tracks) + 1,
                    "title": title,
                    "artist": artist,
                    "label": label,
                    "url": f"https://www.junodownload.com{href}",
                    "embedUrl": f"https://www.junodownload.com/player-embed/{track_id}.m3u/"
                })
            except: continue
        return tracks
    except Exception as e:
        print(f"Error Juno: {e}")
        return []

def main():
    print(f"Server Target: {WORKER_URL}")
    print(f"Auth Token Length: {len(ADMIN_PASSWORD)}")
    
    beatport = get_beatport_top10()
    traxsource = get_traxsource_top10()
    juno = get_juno_top10()
    
    charts = {
        "beatport": beatport,
        "traxsource": traxsource,
        "juno": juno
    }
    
    for p, data in charts.items():
        print(f"  {p}: {len(data)} tracks found")

    if not any(charts.values()):
        print("CRITICAL: Scrapers failed to find any data. Aborting.")
        sys.exit(1)

    # Use existing data as fallback for individual failed sources
    try:
        curr_r = requests.get(f"{WORKER_URL}/api/musique/charts", timeout=10)
        if curr_r.ok:
            curr = curr_r.json()
            for p in charts:
                if not charts[p] and p in curr:
                    print(f"  -> Using fallback backup for {p}")
                    charts[p] = curr[p]
    except: pass

    # PUSH TO SITE
    print("Pushing data to Dropsiders...")
    try:
        resp = requests.post(
            f"{WORKER_URL}/api/musique/charts/update",
            headers={
                "X-Admin-Password": ADMIN_PASSWORD,
                "Content-Type": "application/json"
            },
            json=charts,
            timeout=20
        )
        if resp.ok:
            print("DONE: Charts successfully updated on Dropsiders!")
        else:
            print(f"FAILURE: Server returned {resp.status_code}")
            print(f"Details: {resp.text}")
            if resp.status_code == 401:
                print("ACTION REQUIRED: Check your 'ADMIN_PASSWORD' secret on GitHub.")
                print("It must match '01061988' precisely.")
            sys.exit(1)
    except Exception as e:
        print(f"Network error during push: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
