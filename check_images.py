import json
import os
import re
import requests
from concurrent.futures import ThreadPoolExecutor

data_dir = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data"
files_to_check = [
    "agenda.json", "galerie.json", "news.json", "shop.json", 
    "wiki_djs.json", "wiki_clubs.json", "wiki_festivals.json", "team.json"
]

def find_urls(data):
    urls = set()
    if isinstance(data, dict):
        for key, value in data.items():
            urls.update(find_urls(value))
    elif isinstance(data, list):
        for item in data:
            urls.update(find_urls(item))
    elif isinstance(data, str):
        # Match both absolute URLs and potential relative paths if needed
        # But we're mainly interested in hosted images
        if data.startswith("http"):
            urls.add(data)
    return urls

def check_url(url):
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        if response.status_code >= 400:
            return url, response.status_code
    except Exception as e:
        return url, str(e)
    return None

def main():
    all_urls = set()
    url_found_in = {}

    for file_name in files_to_check:
        file_path = os.path.join(data_dir, file_name)
        if not os.path.exists(file_path):
            continue
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                file_urls = find_urls(data)
                for url in file_urls:
                    if url not in url_found_in:
                        url_found_in[url] = []
                    url_found_in[url].append(file_name)
                all_urls.update(file_urls)
        except Exception as e:
            print(f"Error reading {file_name}: {e}")

    print(f"Found {len(all_urls)} unique URLs. Checking...")

    broken_images = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(check_url, all_urls))
        for res in results:
            if res:
                broken_images.append(res)

    if not broken_images:
        print("\nNo broken images found! All good. ✅")
    else:
        print(f"\nFound {len(broken_images)} potentially broken images:\n")
        for url, reason in broken_images:
            files = ", ".join(url_found_in.get(url, ["Unknown"]))
            print(f"- {url} | Reason: {reason} | Found in: {files}")

if __name__ == "__main__":
    main()
