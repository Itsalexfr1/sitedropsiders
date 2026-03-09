import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import re
import os

# Configuration
WORKER_URL = os.environ.get("WORKER_URL", "https://dropsiders.fr").strip().rstrip('/')
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "01061988").strip()

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
}

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

def get_beatport_top10():
    print("Fetching Beatport Top 10...")
    url = "https://www.beatport.com/top-100"
    try:
        r = requests.get(url, headers=HEADERS, timeout=25)
        soup = BeautifulSoup(r.text, 'html.parser')
        
        next_data_script = soup.select_one('#__NEXT_DATA__')
        if next_data_script:
            data = json.loads(next_data_script.string)
            
            # Navigate to tracks in NextData
            def find_tracks(obj):
                if isinstance(obj, list):
                    for item in obj:
                        res = find_tracks(item)
                        if res: return res
                elif isinstance(obj, dict):
                    if 'results' in obj and isinstance(obj['results'], list) and len(obj['results']) > 10:
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
                    if mix and mix.lower() not in title.lower():
                        title += f" ({mix})"
                    
                    artists = [a.get('name', '') for a in t.get('artists', [])]
                    artist_str = ", ".join(artists)
                    
                    # Beatport Label handling
                    label_data = t.get('label', {})
                    label = label_data.get('name') if isinstance(label_data, dict) else str(label_data)
                    if not label: label = "Beatport"
                    
                    slug = t.get('slug', 'track')
                    tracks.append({
                        "id": f"bp-{track_id}",
                        "rank": i + 1,
                        "title": title,
                        "artist": artist_str,
                        "label": label,
                        "url": f"https://www.beatport.com/track/{slug}/{track_id}",
                        "embedUrl": f"https://embed.beatport.com/?id={track_id}&type=track"
                    })
                return tracks
        return []
    except Exception as e:
        print(f"Error Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        r = requests.get(url, headers=HEADERS, timeout=25)
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        rows = soup.select('.trk-row, .track-row, .play-track')
        for row in rows:
            if len(tracks) >= 10: break
            try:
                title_a = row.select_one('.title a')
                if not title_a: continue
                
                href = title_a.get('href')
                track_id = re.search(r'/track/(\d+)/', href).group(1)
                
                title = clean_text(title_a.text)
                version = row.select_one('.version')
                if version: title += f" ({clean_text(version.text)})"
                
                artists = [clean_text(a.text) for a in row.select('.artists a')]
                artist_str = ", ".join(dict.fromkeys(artists))
                
                # Improved Label detection for Traxsource
                label_el = row.select_one('.label-name, .com-label, .label a')
                label = clean_text(label_el.text) if label_el else "Traxsource"
                
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
    url = "https://www.junodownload.com/all/charts/bestsellers/tracks/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=25)
        soup = BeautifulSoup(r.text, 'html.parser')
        tracks = []
        
        # Juno often uses a grid with product links
        items = soup.select('.item, [class*="product-list-item"]')
        for item in items:
            if len(tracks) >= 10: break
            try:
                title_a = item.select_one('a[href*="/products/"]')
                if not title_a: continue
                
                href = title_a.get('href')
                # Juno IDs are like product/123456-02
                id_match = re.search(r'/products/([\d-]+)/', href)
                if not id_match: continue
                track_id = id_match.group(1)
                
                title = clean_text(title_a.text)
                artist_el = item.select_one('.artists, a[href*="/artists/"]')
                artist = clean_text(artist_el.text) if artist_el else "Unknown"
                
                label_el = item.select_one('.label, a[href*="/labels/"]')
                label = clean_text(label_el.text) if label_el else "Juno Download"
                
                tracks.append({
                    "id": f"jn-{track_id}",
                    "rank": len(tracks) + 1,
                    "title": title,
                    "artist": artist,
                    "label": label,
                    "url": f"https://www.junodownload.com{href}",
                    "embedUrl": f"https://www.junodownload.com/player-embed/{track_id}/"
                })
            except: continue
        return tracks
    except Exception as e:
        print(f"Error Juno: {e}")
        return []

def main():
    print(f"Target: {WORKER_URL}")
    
    beatport = get_beatport_top10()
    traxsource = get_traxsource_top10()
    juno = get_juno_top10()
    
    charts = {
        "beatport": beatport or [],
        "traxsource": traxsource or [],
        "juno": juno or []
    }
    
    # Validation
    for p, data in charts.items():
        print(f" {p}: {len(data)} tracks found")
        if data:
            print(f"   Example: {data[0]['title']} / {data[0]['label']} / {data[0]['embedUrl']}")

    if not any(charts.values()):
        print("Error: No data scraped.")
        sys.exit(1)

    # Push to Site
    resp = requests.post(
        f"{WORKER_URL}/api/musique/charts/update",
        headers={"X-Admin-Password": ADMIN_PASSWORD, "Content-Type": "application/json"},
        json=charts,
        timeout=20
    )
    
    if resp.ok:
        print("Success: Charts updated!")
    else:
        print(f"Failed: {resp.status_code} - {resp.text}")
        sys.exit(1)

if __name__ == "__main__":
    main()
