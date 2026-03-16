
import os

files = [
    r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_festivals.json",
    r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_clubs.json",
    r"c:\Users\alexf\Documents\Site Dropsiders V2\src\data\wiki_djs.json"
]

def resolve_simple(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    in_head = False
    in_remote = False
    
    for line in lines:
        if line.startswith("<<<<<<<"):
            in_head = True
            continue
        if line.startswith("======="):
            in_head = False
            in_remote = True
            continue
        if line.startswith(">>>>>>>"):
            in_remote = False
            continue
        
        if in_head:
            new_lines.append(line)
        elif in_remote:
            continue
        else:
            new_lines.append(line)
            
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Saved {filepath}")

for f in files:
    if os.path.exists(f):
        resolve_simple(f)
