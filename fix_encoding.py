import os
import json
import re

def fix_content(content):
    if not isinstance(content, str):
        return content
    
    # HTML Entities
    replacements = {
        '&eacute;': 'é',
        '&egrave;': 'è',
        '&agrave;': 'à',
        '&acirc;': 'â',
        '&icirc;': 'î',
        '&ocirc;': 'ô',
        '&ugrave;': 'ù',
        '&euml;': 'ë',
        '&ccedil;': 'ç',
        '&rsquo;': "'",
        '&nbsp;': ' ',
        '&laquo;': '«',
        '&raquo;': '»',
        '&deg;': '°',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '…',
        '&ldquo;': '“',
        '&rdquo;': '”',
        '&trade;': '™',
        '&copy;': '©',
        '&reg;': '®',
        '&euro;': '€',
        '&Eacute;': 'É',
        '&Agrave;': 'À',
        '&Egrave;': 'È',
    }
    
    # Common broken UTF-8 patterns
    utf8_broken = {
        'Ã…Â“': 'œ',
        'Ã©': 'é',
        'Ã¨': 'è',
        'Ã\xa0': 'à',
        'Ã¢': 'â',
        'Ã´': 'ô',
        'Ã®': 'î',
        'Ã¯': 'ï',
        'Ã»': 'û',
        'Ã¹': 'ù',
        'Ã§': 'ç',
        'Ã‰': 'É',
        'Ã€': 'À',
        'Ã‚': 'Â',
        'Ã”': 'Ô',
        'Ã‡': 'Ç',
        'â\x80\x99': "'",
        'â\x80\x93': '–',
        'â\x80\x94': '—',
        'â\x80\xa6': '…',
        'â\x80\x9c': '“',
        'â\x80\x9d': '”',
        'Â': '', # Often a stray character from &nbsp; conversion
    }
    
    for k, v in replacements.items():
        content = content.replace(k, v)
    
    for k, v in utf8_broken.items():
        content = content.replace(k, v)
        
    return content

def process_file(filepath):
    print(f"Processing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON in {filepath}: {e}")
        return

    def walk(obj):
        if isinstance(obj, dict):
            for k, v in obj.items():
                obj[k] = walk(v)
        elif isinstance(obj, list):
            for i in range(len(obj)):
                obj[i] = walk(obj[i])
        elif isinstance(obj, str):
            return fix_content(obj)
        return obj

    fixed_data = walk(data)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(fixed_data, f, ensure_ascii=False, indent=2)


data_dir = r'c:\Users\alexf\Documents\Site Dropsiders V2\src\data'
for filename in os.listdir(data_dir):
    if filename.endswith('.json'):
        process_file(os.path.join(data_dir, filename))
