
import os
import re

files = [
    r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_festivals.json",
    r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_clubs.json",
    r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_djs.json"
]

def resolve_file(filepath):
    print(f"Resolving {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to take HEAD version in these specific JSON files
    # pattern: <<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+
    # Using flags=re.DOTALL to match across lines
    
    def replacement(match):
        return match.group(1)
    
    # This regex is a bit risky if there are nested markers (unlikely here)
    # The markers in the log look like:
    # <<<<<<< HEAD
    #     "status": "published",
    # =======
    # >>>>>>> 1d01eee89c47a483eb5d9d4710b8b02b1a57cfc2
    
    new_content = re.sub(r"<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-f0-9]+", replacement, content, flags=re.DOTALL)
    
    # Check if any markers left
    if "<<<<<<<" in new_content or "=======" in new_content or ">>>>>>>" in new_content:
        print(f"Warning: Some markers might remain in {filepath}")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Done with {filepath}")

for f in files:
    if os.path.exists(f):
        resolve_file(f)
    else:
        print(f"File not found: {f}")
