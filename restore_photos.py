import json
import subprocess
import re

file_path = "c:\\Users\\alexf\\Documents\\Site Dropsiders V2\\src\\data\\wiki_clubs.json"
with open(file_path, "r", encoding="utf-8") as f:
    clubs = json.load(f)

waiting_ids = [c["id"] for c in clubs if c.get("status") == "waiting"]
print(f"Found {len(waiting_ids)} clubs in waiting state.")

restored_count = 0
for club in clubs:
    if club.get("status") == "waiting" or "static.ra.co" in club.get("image", ""):
        # Search git history for previous /uploads/ URL for this ID
        # We search specifically for the line that added the upload
        cmd = ["git", "log", "-p", "-G", "/uploads/", "--oneline", file_path]
        try:
            # This is slow, but we'll do it for the recent history
            # Actually, let's just use git log -S and -p for that ID
            # It's better to search the entire diff for the ID
            pass
        except:
            continue

# Actually, let's just use a more efficient way: get ALL 'Update photo' commits and parse them once
commits_cmd = ["git", "log", "--grep=Update photo", "--pretty=format:%H", file_path]
commits = subprocess.check_output(commits_cmd).decode("utf-8").splitlines()

update_map = {} # id -> latest upload image
for commit in commits:
    diff = subprocess.check_output(["git", "show", commit, file_path]).decode("utf-8")
    # Parse diff for ID and new image
    # A diff for a photo update usually looks like:
    # - "image": "...",
    # + "image": "/uploads/...",
    # Along with context that identifies the ID
    
    # Simple regex search in the diff hunk
    hunks = diff.split("@@")
    for hunk in hunks:
        if "/uploads/" in hunk:
            id_match = re.search(r'\"id\": \"(\d+|c\d+)\"', hunk)
            img_match = re.search(r'\+    \"image\": \"(/uploads/[^\"]+)\"', hunk)
            if id_match and img_match:
                cid = id_match.group(1)
                img = img_match.group(1)
                if cid not in update_map:
                    update_map[cid] = img

print(f"Discovered {len(update_map)} manual updates in history.")

for club in clubs:
    cid = club["id"]
    if cid in update_map:
        if "/uploads/" not in club["image"]:
            print(f"Restoring {club['name']} (ID {cid}): {update_map[cid]}")
            club["image"] = update_map[cid]
            if club.get("status") == "waiting":
                del club["status"]
                print(f"  -> Marked as published.")
            restored_count += 1

if restored_count > 0:
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(clubs, f, indent=2, ensure_ascii=False)
    print(f"Successfully restored {restored_count} images.")
else:
    print("No images were found to restore.")
