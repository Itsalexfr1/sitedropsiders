import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import re
import os

# Configuration
WORKER_URL = os.environ.get("WORKER_URL", "https://dropsiders.fr")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "01061988")

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache'
}

def clean_text(text):
    if not text: return ""
    return re.sub(r'\s+', ' ', text).strip()

def get_beatport_top10():
    print("Fetching Beatport Top 10...")
    url = "https://www.beatport.com/top-100"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        # Target the cells with class containing 'title' within rows
        rows = soup.select('[role="row"]')
        if not rows:
            # Fallback for different grid structures
            rows = soup.select('div[class*="TrackList-style-ListItem"]')
        
        for i, row in enumerate(rows):
            if len(tracks) >= 10: break
            try:
                # Title link usually has /track/ in it
                title_link = row.select_one('a[href*="/track/"]')
                if not title_link: continue
                
                # Combine title and version if spans exist
                title_spans = title_link.select('span')
                if title_spans:
                    title = " ".join([clean_text(s.text) for s in title_spans])
                else:
                    title = clean_text(title_link.text)
                
                href = title_link.get('href', '')
                track_url = f"https://www.beatport.com{href}"
                
                # Extract ID from URL like /fr/track/name/12345
                id_match = re.search(r'/track/.*?/(\d+)', href)
                track_id = id_match.group(1) if id_match else f"bp-{i}"
                
                # Artists: multiple links possible
                artist_links = row.select('a[href*="/artist/"]')
                artists = [clean_text(a.text) for a in artist_links if a.text.strip()]
                artist_str = ", ".join(artists) if artists else "Various Artists"
                
                # Label
                label_link = row.select_one('a[href*="/label/"]')
                label = clean_text(label_link.text) if label_link else "Unknown Label"
                
                tracks.append({
                    "id": f"bp-{track_id}",
                    "rank": len(tracks) + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": track_url,
                    "embedUrl": f"https://embed.beatport.com/track/{track_id}"
                })
                print(f"  [Beatport] #{len(tracks)}: {title} - {artist_str}")
            except Exception as e:
                print(f"  Error parsing Beatport row: {e}")
        
        return tracks
    except Exception as e:
        print(f"Error fetching Beatport: {e}")
        return []

def get_traxsource_top10():
    print("Fetching Traxsource Top 10...")
    url = "https://www.traxsource.com/top/tracks"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        rows = soup.select('.track-row, .trk-row')[:15] # Take more for margin
        
        for i, row in enumerate(rows):
            if len(tracks) >= 10: break
            try:
                title_link = row.select_one('.title a, a[href^="/track/"]')
                if not title_link: continue
                
                title = clean_text(title_link.text)
                version = row.select_one('.version')
                if version: title += f" ({clean_text(version.text)})"
                
                href = title_link.get('href', '')
                track_url = f"https://www.traxsource.com{href}"
                
                # Extract ID from /track/12345/name
                id_match = re.search(r'/track/(\d+)/', href)
                track_id = id_match.group(1) if id_match else row.get('data-trkid', f"ts-{i}")
                
                # Artists
                artist_links = row.select('.artists a, a.com-artists')
                artists = [clean_text(a.text) for a in artist_links if a.text.strip()]
                artist_list = []
                for a in artists: # Basic deduplication
                    if a not in artist_list: artist_list.append(a)
                artist_str = ", ".join(artist_list) if artist_list else "Unknown Artist"
                
                # Label
                label_el = row.select_one('.label-name, a[href^="/label/"]')
                label = clean_text(label_el.text) if label_el else "Unknown Label"
                
                tracks.append({
                    "id": f"ts-{track_id}",
                    "rank": len(tracks) + 1,
                    "title": title,
                    "artist": artist_str,
                    "label": label,
                    "url": track_url,
                    "embedUrl": f"https://embed.traxsource.com/player/track/{track_id}"
                })
                print(f"  [Traxsource] #{len(tracks)}: {title} - {artist_str}")
            except Exception as e:
                print(f"  Error parsing Traxsource row: {e}")
                
        return tracks
    except Exception as e:
        print(f"Error fetching Traxsource: {e}")
        return []

def get_juno_top10():
    print("Fetching Juno Download Top 10...")
    url = "https://www.junodownload.com/all/charts/bestsellers/weeks-top/tracks/"
    try:
        r = requests.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, 'html.parser')
        
        tracks = []
        rows = soup.select('.juno-track, div.item')
        if not rows:
            rows = [el.find_parent('div') for el in soup.select('.juno-title')]
        
        for i, row in enumerate(rows):
            if len(tracks) >= 10: break
            try:
                title_link = row.select_one('.juno-title, a[href*="/products/"]')
                if not title_link: continue
                
                title = clean_text(title_link.text)
                href = title_link.get('href', '')
                track_url = f"https://www.junodownload.com{href}"
                
                # ID example: 7489180-02
                id_match = re.search(r'/(\d+-\d+)/', href)
                track_id = id_match.group(1) if id_match else f"jn-{i}"
                
                # Artist
                artist_el = row.select_one('.juno-artist, .artists, .col-artist')
                artist = clean_text(artist_el.text) if artist_el else "Unknown Artist"
                
                # Label
                label_el = row.select_one('.juno-label, .col-label')
                label = clean_text(label_el.text) if label_el else "Unknown Label"
                
                tracks.append({
                    "id": f"jn-{track_id}",
                    "rank": len(tracks) + 1,
                    "title": title,
                    "artist": artist,
                    "label": label,
                    "url": track_url,
                    "embedUrl": f"https://www.junodownload.com/player-embed/{track_id}.m3u/"
                })
                print(f"  [Juno] #{len(tracks)}: {title} - {artist}")
            except Exception as e:
                print(f"  Error parsing Juno row: {e}")
                
        return tracks
    except Exception as e:
        print(f"Error fetching Juno: {e}")
        return []

def main():
    print(f"Starting update for {WORKER_URL}")
    
    # Try all sources
    beatport = get_beatport_top10()
    traxsource = get_traxsource_top10()
    juno = get_juno_top10()
    
    charts = {
        "beatport": beatport,
        "traxsource": traxsource,
        "juno": juno
    }
    
    # Validation
    final_charts = {}
    valid_count = 0
    for p, data in charts.items():
        if data and len(data) >= 5: # At least 5 tracks to consider it valid
            final_charts[p] = data
            valid_count += 1
        else:
            print(f"Warning: Source '{p}' returned insufficient data ({len(data)} tracks).")

    if valid_count == 0:
        print("CRITICAL ERROR: No valid data scraped from any source. Aborting.")
        sys.exit(1)

    # Fallback for empty sources
    try:
        current_resp = requests.get(f"{WORKER_URL}/api/musique/charts", timeout=10)
        if current_resp.ok:
            old_charts = current_resp.json()
            for p in charts:
                if (p not in final_charts or not final_charts[p]) and p in old_charts:
                    print(f"Using fallback data for source '{p}' from live site.")
                    final_charts[p] = old_charts[p]
    except Exception as e:
        print(f"Could not connect to {WORKER_URL} for fallback: {e}")

    # Final check
    if not any(final_charts.values()):
        print("No charts to push. Exiting.")
        sys.exit(1)

    # Push to worker
    print(f"Pushing to {WORKER_URL}/api/musique/charts/update...")
    try:
        resp = requests.post(
            f"{WORKER_URL}/api/musique/charts/update",
            headers={"X-Admin-Password": ADMIN_PASSWORD, "Content-Type": "application/json"},
            json=final_charts,
            timeout=20
        )
        if resp.ok:
            print("SUCCESS: Charts updated successfully!")
        else:
            print(f"FAILURE: Server returned {resp.status_code}: {resp.text}")
            sys.exit(1)
    except Exception as e:
        print(f"CRITICAL: Failed to push data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
