import json
import re
import os

# Répertoire racine du projet
ROOT = r"c:\Users\alexf\Documents\Site Dropsiders V2"

# Table de correspondance des séquences mal encodées (UTF-8 lu en Latin-1)
# Ces séquences sont générées quand du texte UTF-8 est interprété comme Latin-1
FIXES = [
    # Caractères accentués minuscules
    ("Ã©", "é"),
    ("Ã¨", "è"),
    ("Ã ", "à"),
    ("Ã¢", "â"),
    ("Ã®", "î"),
    ("Ã´", "ô"),
    ("Ã»", "û"),
    ("Ã§", "ç"),
    ("Ã«", "ë"),
    ("Ã¯", "ï"),
    ("Ã¹", "ù"),
    ("Ã¼", "ü"),
    ("Ã¦", "æ"),
    ("Ã±", "ñ"),
    ("Ã³", "ó"),
    ("Ã¡", "á"),
    ("Ã­", "í"),
    ("Ã¤", "ä"),
    ("Ã¶", "ö"),
    # Caractères accentués majuscules
    ("Ã‰", "É"),
    ("Ã€", "À"),
    ("Ã‚", "Â"),
    ("Ã›", "Û"),
    ("Ã‡", "Ç"),
    ("Ãœ", "Ü"),
    # Ligatures et caractères spéciaux
    ("Å\x93", "œ"),
    ("Å\x92", "Œ"),
    ("Ã\x89", "É"),
    # Guillemets et apostrophes typographiques
    ("â€™", "'"),
    ("â€˜", "'"),
    ("â€œ", "\u201c"),
    ("â€\x9d", "\u201d"),
    ("â€"", "\u2013"),
    ("â€"", "\u2014"),
    ("â€¦", "…"),
    # Guillemets français
    ("Â«", "«"),
    ("Â»", "»"),
    # Espace insécable
    ("Â\xa0", "\u00a0"),
    ("Â ", " "),
    # Apostrophe courbe (souvent mal encodée)
    ("â\x80\x99", "'"),
    ("â\x80\x98", "'"),
    # Tirets
    ("â\x80\x93", "–"),
    ("â\x80\x94", "—"),
    # Points de suspension
    ("â\x80\xa6", "…"),
    # Espace fine insécable
    ("â¯", "\u202f"),
    # Caractère Ã seul (souvent = À)
    ("Ã\x80", "À"),
    # Autres
    ("Ã\xb4", "ô"),
    ("Ã\xbb", "û"),
    ("Ã\xa9", "é"),
    ("Ã\xa8", "è"),
    ("Ã\xa0", "à"),
    ("Ã\xa2", "â"),
    ("Ã\xae", "î"),
    ("Ã\xa7", "ç"),
    ("Ã\xab", "ë"),
    ("Ã\xaf", "ï"),
    ("Ã\xb9", "ù"),
    ("Ã\xbc", "ü"),
]

def fix_encoding(text):
    """Corrige les erreurs d'encodage dans un texte."""
    for bad, good in FIXES:
        text = text.replace(bad, good)
    return text

def fix_file(filepath):
    """Corrige les erreurs d'encodage dans un fichier."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        fixed = fix_encoding(content)
        
        if fixed != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"  ✓ Corrigé: {os.path.basename(filepath)}")
            return True
        else:
            print(f"  - Pas de correction nécessaire: {os.path.basename(filepath)}")
            return False
    except Exception as e:
        print(f"  ✗ Erreur pour {filepath}: {e}")
        return False

# Fichiers à corriger
files_to_fix = [
    os.path.join(ROOT, "src", "data", "news.json"),
    os.path.join(ROOT, "src", "data", "recaps.json"),
    os.path.join(ROOT, "src", "data", "agenda.json"),
    os.path.join(ROOT, "src", "data", "galerie.json"),
    os.path.join(ROOT, "src", "data", "team.json"),
    os.path.join(ROOT, "src", "data", "translations.ts"),
    os.path.join(ROOT, "src", "data", "tail_verify_final.txt"),
    os.path.join(ROOT, "worker.ts"),
]

print("=== Correction des erreurs d'encodage ===\n")
fixed_count = 0
for f in files_to_fix:
    if os.path.exists(f):
        if fix_file(f):
            fixed_count += 1
    else:
        print(f"  ! Fichier non trouvé: {f}")

print(f"\n=== {fixed_count} fichier(s) corrigé(s) ===")
