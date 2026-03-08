import os
import re

def find_cloudinary_urls(directory):
    cloudinary_urls = set()
    regex = r'https?://res\.cloudinary\.com/[a-zA-Z0-9_-]+/image/upload/[^"\')\s]+'
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.json', '.tsx', '.ts', '.js', '.html')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        matches = re.findall(regex, content)
                        for match in matches:
                            cloudinary_urls.add(match)
                except Exception as e:
                    print(f"Error reading {path}: {e}")
    return cloudinary_urls

if __name__ == "__main__":
    src_dir = r"c:\Users\alexf\Documents\Site Dropsiders V2\src"
    urls = find_cloudinary_urls(src_dir)
    for url in sorted(urls):
        print(url)
