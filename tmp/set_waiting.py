
import json
import os

files = [
    (r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_festivals.json", "f", 40),
    (r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_clubs.json", "c", 45),
    (r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_djs.json", "", 108)
]

def update_status(filepath, prefix, threshold):
    print(f"Updating {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    count = 0
    for item in data:
        item_id_str = str(item['id'])
        # Extract numeric part
        numeric_part = "".join(filter(str.isdigit, item_id_str))
        if numeric_part:
            numeric_id = int(numeric_part)
            if numeric_id > threshold:
                item['status'] = 'waiting'
                count += 1
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Updated {count} items in {filepath}")

for f, p, t in files:
    if os.path.exists(f):
        update_status(f, p, t)
