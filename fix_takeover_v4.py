import sys

file_path = r"c:\Users\alexf\Documents\Site Dropsiders V2\src\pages\TakeoverPage.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line numbers are 1-indexed, so 5210 is index 5209.
# Actually let's find the line index safely
for i, line in enumerate(lines):
    if "</AnimatePresence>" in line and 5200 < i < 5220:
        print(f"Fixing at index {i}")
        lines[i]   = "                                            </AnimatePresence>\n"
        lines[i+1] = "                                        </div>\n"
        lines[i+2] = "                                    </div>\n"
        lines[i+3] = "                                )}\n"
        lines[i+4] = "                            </div>\n"
        break

# Dedup buttons
btn_marker = 'onClick={() => setShowDownloader(true)}'
indices = [i for i, l in enumerate(lines) if btn_marker in l]
if len(indices) > 1:
    print(f"Deduping buttons at {indices}")
    # Remove the second one
    # Find start and end of that block
    idx = indices[1]
    # Remove lines from {hasModPowers && to }
    start = idx
    while "hasModPowers &&" not in lines[start]: start -= 1
    end = idx
    while "}" not in lines[end]: end += 1
    for k in range(start, end + 1):
        lines[k] = ""

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
