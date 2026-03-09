import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import re
import os

# Configuration
WORKER_URL = os.environ.get("WORKER_URL", "https://dropsiders.fr").rstrip('/')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "01061988")

# On utilise un User-Agent très réaliste pour éviter d'être bloqué
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
    'Upgrade-Insecure-Requests': '1'
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
        
        # Method 1: __NEXT_DATA__ (Solid)
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
                            if 'name' in obj['results'][0] and 'artists' in obj['results'][0]:
                                return obj['results']
                        for k, v in obj.items():
                            res = find_tracks(v)
                            if res: return res
                    return None

                results = find_tracks(data)
                if results:
                    tracks = []
                    for i, t in enumerate(results[:10]):
                        track_id = t.get('id', f"bp-{i}")
                        title = t.get('name', 'Unknown')
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
                    if tracks: return tracks
            except: pass

        # Method 2: HTML Selectors
        tracks = []
        rows = soup.select('[role="row"], .bucket-item.track')
        for i, row in enumerate(rows[:10]):
            try:
                title_link = row.select_one('a[href*="/track/"]')
                if not title_link: continue
                href = title_link.get('href', '')
                track_id = re.search(r'/track/.*?/(\d+)', href).group(1)
                tracks.append({
                    "id": f"bp-{track_id}",
                    "rank": i + 1,
                    "title": clean_text(title_link.text),
                    "artist": ", ".join([a.text for a in row.select('a[href*="/artist/"]')]),
                    "label": row.select_one('a[href*="/label/"]').text,
                    "url": f"https://www.beatport.com{href}",
                    "embedUrl": f"https://embed.beatport.com/track/{track_id}"
                })
            except: continue
        return tracks
    except Exception as e:
        print(f"Error Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        # On ajoute un petit délai pour simuler un humain
        time.sleep(1)
        r = requests.get(url, headers=HEADERS, timeout=25)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        # Traxsource utilise .trk-row ou .track-row
        rows = soup.select('.trk-row, .track-row, .play-track')
        for i, row in enumerate(rows[:10]):
            try:
                title_a = row.select_one('.title a, a[href^="/track/"]')
                if not title_a: continue
                track_id = row.get('data-trkid') or re.search(r'/track/(\d+)/', title_a.get('href')).group(1)
                
                title = clean_text(title_a.text)
                version = row.select_one('.version')
                if version: title += f" ({clean_text(version.text)})"
                
                artists = [clean_text(a.text) for a in row.select('.artists a, .com-artists')]
                artist_str = ", ".join(dict.fromkeys(artists))
                
                label_el = row.select_one('.label-name, .label a')
                label = clean_text(label_el.text) if label_el else "Unknown"
                
                tracks.append({
                    "id": f"ts-{track_id}",
                    "rank": i + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": f"https://www.traxsource.com{title_a.get('href')}",
                    "embedUrl": f"https://embed.traxsource.com/player/track/{track_id}"
                })
            except: continue
        return tracks
    except Exception as e:
        print(f"Error Traxsource: {e}")
        return []

def get_juno_top10():
    print("Fetching Juno Download Top 10...")
    # Plus stable d'aller sur la page "All genres bestsellers"
    url = "https://www.junodownload.com/all/charts/bestsellers/weeks-top/tracks/"
    try:
        time.sleep(1)
        r = requests.get(url, headers=HEADERS, timeout=25)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        # Juno utilise des divs avec classe .item
        items = soup.select('.item, .juno-track')
        for i, item in enumerate(items[:10]):
            try:
                title_a = item.select_one('.juno-title, a[href*="/products/"]')
                if not title_a: continue
                href = title_a.get('href')
                track_id = re.search(r'/(\d+-\d+)/', href).group(1)
                
                artist = clean_text(item.select_one('.juno-artist, .artists, .col-artist').text)
                label = clean_text(item.select_one('.juno-label, .col-label').text)
                
                tracks.append({
                    "id": f"jn-{track_id}",
                    "rank": i + 1,
                    "title": clean_text(title_a.text),
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
    print(f"Target: {WORKER_URL}")
    
    charts = {
        "beatport": get_beatport_top10(),
        "traxsource": get_traxsource_top10(),
        "juno": get_juno_top10()
    }
    
    # Statistiques
    for p, data in charts.items():
        print(f"  {p}: {len(data)} tracks found")

    if not any(charts.values()):
        print("CRITICAL: Failed to scrape any source.")
        sys.exit(1)

    # Récupération fallback
    try:
        curr_r = requests.get(f"{WORKER_URL}/api/musique/charts", timeout=10)
        if curr_r.ok:
            curr = curr_r.json()
            for p in charts:
                if not charts[p] and p in curr:
                    print(f"  Using fallback for {p}")
                    charts[p] = curr[p]
    except: pass

    # PUSH
    print(f"Pushing to site (Password length: {len(ADMIN_PASSWORD)})")
    try:
        resp = requests.post(
            f"{WORKER_URL}/api/musique/charts/update",
            headers={"X-Admin-Password": ADMIN_PASSWORD, "Content-Type": "application/json"},
            json=charts,
            timeout=20
        )
        if resp.ok:
            print("SUCCESS: Charts updated successfully!")
        else:
            print(f"FAILED: {resp.status_code} - {resp.text}")
            if resp.status_code == 401:
                print("HINT: The ADMIN_PASSWORD secret on GitHub does not match the Worker.")
            sys.exit(1)
    except Exception as e:
        print(f"Push error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
