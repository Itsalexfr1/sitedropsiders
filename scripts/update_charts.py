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

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
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
        
        # Beatport React Data Parsing (__NEXT_DATA__)
        # C'est la méthode la plus robuste car elle évite de dépendre des classes CSS volatiles
        next_data_script = soup.select_one('#__NEXT_DATA__')
        if next_data_script:
            try:
                data = json.loads(next_data_script.string)
                # On traverse la structure Next.js
                # Typiquement : props -> pageProps -> dehydrateState -> queries -> [0] -> state -> data
                # Ou on cherche simplement récursivement pour des objets qui ressemblent à des tracks
                
                # Approche par recherche récursive simple des objets 'results' ou 'tracks'
                def find_tracks(obj):
                    if isinstance(obj, list):
                        for item in obj:
                            res = find_tracks(item)
                            if res: return res
                    elif isinstance(obj, dict):
                        if 'results' in obj and isinstance(obj['results'], list) and len(obj['results']) > 10:
                            # On vérifie si ce sont des tracks
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
                        
                        artists = t.get('artists', [])
                        artist_str = ", ".join([a.get('name', '') for a in artists])
                        
                        label = t.get('label', {}).get('name', 'Unknown')
                        # On construit l'URL
                        slug = t.get('slug', '')
                        track_url = f"https://www.beatport.com/track/{slug}/{track_id}"
                        
                        tracks.append({
                            "id": f"bp-{track_id}",
                            "rank": i + 1,
                            "title": title,
                            "artist": artist_str,
                            "label": label,
                            "url": track_url,
                            "embedUrl": f"https://embed.beatport.com/track/{track_id}"
                        })
                    if tracks: 
                        print(f"  Successfully extracted {len(tracks)} tracks from __NEXT_DATA__")
                        return tracks
            except Exception as e:
                print(f"  Failed to parse __NEXT_DATA__: {e}")

        # Fallback Scraper HTML Classique
        tracks = []
        rows = soup.select('[role="row"], div[class*="TrackList-style-ListItem"]')
        if not rows: rows = soup.select('.bucket-item.track')
        
        for i, row in enumerate(rows[:10]):
            try:
                title_link = row.select_one('a[href*="/track/"]')
                if not title_link: continue
                
                title = clean_text(title_link.text)
                href = title_link.get('href', '')
                track_id_match = re.search(r'/track/.*?/(\d+)', href)
                track_id = track_id_match.group(1) if track_id_match else f"bp-{i}"
                
                artist_links = row.select('a[href*="/artist/"]')
                artists = [clean_text(a.text) for a in artist_links]
                artist_str = ", ".join(artists) if artists else "Unknown"
                
                label_link = row.select_one('a[href*="/label/"]')
                label = clean_text(label_link.text) if label_link else "Unknown"
                
                tracks.append({
                    "id": f"bp-{track_id}",
                    "rank": i + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": f"https://www.beatport.com{href}",
                    "embedUrl": f"https://embed.beatport.com/track/{track_id}"
                })
            except: continue
            
        print(f"  Extracted {len(tracks)} tracks via HTML selectors")
        return tracks
    except Exception as e:
        print(f"Error fetching Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        rows = soup.select('.trk-row, .track-row')[:10]
        for i, row in enumerate(rows):
            try:
                track_id = row.get('data-trkid')
                title_a = row.select_one('.title a')
                title = clean_text(title_a.text)
                version = row.select_one('.version')
                if version: title += f" ({clean_text(version.text)})"
                
                artists = [clean_text(a.text) for a in row.select('.artists a, .com-artists')]
                artist_str = ", ".join(dict.fromkeys(artists)) # Dedup
                
                label = clean_text(row.select_one('.label-name').text)
                
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
        print(f"Error fetching Traxsource: {e}")
        return []

def get_juno_top10():
    print("Fetching Juno Download Top 10...")
    url = "https://www.junodownload.com/all/charts/bestsellers/weeks-top/tracks/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        items = soup.select('.item, .juno-track')[:10]
        for i, item in enumerate(items):
            try:
                title_a = item.select_one('.juno-title, a[href*="/products/"]')
                title = clean_text(title_a.text)
                href = title_a.get('href')
                id_match = re.search(r'/(\d+-\d+)/', href)
                track_id = id_match.group(1) if id_match else f"jn-{i}"
                
                artist = clean_text(item.select_one('.juno-artist, .artists, .col-artist').text)
                label = clean_text(item.select_one('.juno-label, .col-label').text)
                
                tracks.append({
                    "id": f"jn-{track_id}",
                    "rank": i + 1,
                    "title": title,
                    "artist": artist,
                    "label": label,
                    "url": f"https://www.junodownload.com{href}",
                    "embedUrl": f"https://www.junodownload.com/player-embed/{track_id}.m3u/"
                })
            except: continue
        return tracks
    except Exception as e:
        print(f"Error fetching Juno: {e}")
        return []

def main():
    print(f"Update started for: {WORKER_URL}")
    
    charts = {
        "beatport": get_beatport_top10(),
        "traxsource": get_traxsource_top10(),
        "juno": get_juno_top10()
    }
    
    # On vérifie si on a au moins QUELQUE CHOSE
    if not any(charts.values()):
        print("CRITICAL: No data found for any source.")
        sys.exit(1)

    # Fallback pour les sources vides
    try:
        current = requests.get(f"{WORKER_URL}/api/musique/charts", timeout=10).json()
        for p in charts:
            if not charts[p] and p in current:
                print(f"Using fallback for {p}")
                charts[p] = current[p]
    except: pass

    # PUSH
    print(f"Pushing to worker with password length: {len(ADMIN_PASSWORD)}")
    try:
        r = requests.post(
            f"{WORKER_URL}/api/musique/charts/update",
            headers={"X-Admin-Password": ADMIN_PASSWORD, "Content-Type": "application/json"},
            json=charts,
            timeout=15
        )
        if r.ok:
            print("SUCCESS: Charts updated!")
        else:
            print(f"ERROR: {r.status_code} - {r.text}")
            sys.exit(1)
    except Exception as e:
        print(f"Push failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
