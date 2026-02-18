import json

filepath = r'c:\Users\alexf\Documents\Site Dropsiders V2\src\data\recaps_scraped.json'

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find ID 1
for item in data:
    if item.get('id') == 1:
        # Remove second image from array
        if 'images' in item and len(item['images']) > 1:
            second_img = item['images'][1]
            print(f"Removing {second_img} from images array")
            item['images'].pop(1)
            
        # Remove the image from content HTML
        # In this specific case, we saw it was inside a 50% column
        # To be safe and simple, let's just remove the specific column block if we can identify it.
        # The column for -2.jpg starts around id="jw-element-586330613"
        
        content = item['content']
        # Let's find the specific column structure for the second image
        # It's a div with id="jw-element-586330613"
        import re
        pattern = r'<div[^>]*id="jw-element-586330613"[^>]*>.*?</div>\s*</div>(?=.*id="jw-element-586330614")'
        # Wait, the structure is nested. 
        # A simpler way: just remove the image tag and maybe the empty column?
        # Actually, let's just remove the first 50% column block.
        
        # We'll use a more precise replacement based on the viewed content
        target_col = '<div\\n    id="jw-element-586330613"[^>]*>.*?</div>\\s*</div>'
        # This is getting complicated. Let's just do a string replace for the image entry.
        
        # In recaps_scraped.json, the image is at:
        # /images/recaps/recap-escape-psycho-circus-2025-2.jpg
        
        # Let's just remove the specific column div by finding it.
        start_idx = content.find('id="jw-element-586330613"')
        if start_idx != -1:
            # Find the start of the div
            div_start = content.rfind('<div', 0, start_idx)
            # Find the end of this div (it has nested divs, so we need to count)
            depth = 0
            pos = div_start
            while pos < len(content):
                if content.startswith('<div', pos):
                    depth += 1
                    pos += 4
                elif content.startswith('</div>', pos):
                    depth -= 1
                    pos += 6
                    if depth == 0:
                        div_end = pos
                        break
                else:
                    pos += 1
            
            print(f"Removing column div from {div_start} to {div_end}")
            item['content'] = content[:div_start] + content[div_end:]

# Handle recaps.json
filepath_main = r'c:\Users\alexf\Documents\Site Dropsiders V2\src\data\recaps.json'
with open(filepath_main, 'r', encoding='utf-8') as f:
    data_main = json.load(f)

for item in data_main:
    if item.get('id') == 1:
        if 'images' in item and len(item['images']) > 1:
            print(f"Removing index 1 from recaps.json images array: {item['images'][1]}")
            item['images'].pop(1)

with open(filepath_main, 'w', encoding='utf-8') as f:
    json.dump(data_main, f, ensure_ascii=False, indent=2)

