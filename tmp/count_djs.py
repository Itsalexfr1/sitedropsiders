import json
with open('c:/Users/alexf/Documents/Site Dropsiders V2/src/data/wiki_djs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(len(data))
