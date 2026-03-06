import json
import os

files = [
    r'c:\Users\alexf\Documents\Site Dropsiders V2\src\data\news.json',
    r'c:\Users\alexf\Documents\Site Dropsiders V2\src\data\subscribers.json'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    # Try to parse it to ensure it's valid
    try:
        data = json.loads(content)
        # Re-save it cleanly
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Fixed {file_path}")
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
