
import json
import os

files = [
    'src/data/news_content_1.json',
    'src/data/news_content_2.json',
    'src/data/news_content_3.json',
    'src/data/recaps_content_1.json',
    'src/data/recaps_content_2.json'
]

base_path = r'c:\Users\alexf\Documents\Site Dropsiders V2'

for file in files:
    full_path = os.path.join(base_path, file)
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
            ids = {}
            duplicates = []
            for item in data:
                item_id = str(item.get('id'))
                if item_id in ids:
                    duplicates.append(item_id)
                ids[item_id] = item
            
            if duplicates:
                print(f"Duplicates in {file}: {duplicates}")
        except Exception as e:
            print(f"Error reading {file}: {e}")
