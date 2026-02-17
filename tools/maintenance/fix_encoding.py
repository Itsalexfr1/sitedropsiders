import json
import os

file_path = 'src/data/agenda.json'

def fix_string(s):
    if not isinstance(s, str):
        return s
    
    curr = s
    # Try multiple iterations of decoding
    for _ in range(5):
        try:
            # Try to reverse the Mojibake: 
            # Treat characters as if they were Latin-1 bytes of a UTF-8 string
            new_s = curr.encode('latin-1').decode('utf-8')
            if new_s == curr:
                break
            curr = new_s
        except (UnicodeEncodeError, UnicodeDecodeError):
            # Fallback for common partially broken sequences
            # Some characters might have been double-encoded differently
            break
    
    # Manual final cleanup for common leftovers
    replacements = {
        'Ã©': 'é', 'Ã¨': 'è', 'Ãª': 'ê', 'Ã«': 'ë',
        'Ã´': 'ô', 'Ã®': 'î', 'Ã¯': 'ï', 'Ã»': 'û',
        'Ã¹': 'ù', 'Ã ': 'à', 'Ã§': 'ç', 'Ã¢': 'â',
        'Ã‰': 'É', 'Ã€': 'À', 'Ãˆ': 'È', 'Ã‡': 'Ç',
        'Â©': '©', 'Â®': '®', 'â€œ': '“', 'â€': '”',
        'â€™': "'", 'â€¦': '…', 'Â ': ' ', 'Â': 'à' # This one is risky but often Â space or Â at end of word means à
    }
    
    for old, new in replacements.items():
        curr = curr.replace(old, new)
        
    return curr

def process_data(data):
    if isinstance(data, list):
        return [process_data(item) for item in data]
    elif isinstance(data, dict):
        return {k: process_data(v) for k, v in data.items()}
    elif isinstance(data, str):
        return fix_string(data)
    else:
        return data

if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        try:
            content = json.load(f)
            fixed_content = process_data(content)
            with open(file_path, 'w', encoding='utf-8') as f_out:
                json.dump(fixed_content, f_out, indent=2, ensure_ascii=False)
            print(f"Successfully fixed {file_path}")
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
else:
    print(f"File not found: {file_path}")
