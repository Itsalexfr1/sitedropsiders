# 🌐 GUIDE SCRAPING CHROME - VERSION ULTRA SIMPLE

## 📺 TUTORIEL PAS À PAS POUR GOOGLE CHROME

### ÉTAPE 1 : Ouvrir le site
1. Ouvrez **Google Chrome**
2. Allez sur cette adresse : `https://www.dropsiders.eu/recaps`
3. Attendez que la page se charge complètement

---

### ÉTAPE 2 : Ouvrir la Console Chrome

**3 façons de faire :**

#### Option A (Raccourci clavier) ⌨️
- Appuyez sur **F12** sur votre clavier

#### Option B (Menu) 🖱️
1. Cliquez sur les **3 petits points** en haut à droite de Chrome
2. Allez dans **"Plus d'outils"**
3. Cliquez sur **"Outils de développement"**

#### Option C (Clic droit) 🖱️
1. Faites un **clic droit** n'importe où sur la page
2. Cliquez sur **"Inspecter"**

➡️ **Une grande fenêtre s'ouvre sur le côté ou en bas de votre navigateur**

---

### ÉTAPE 3 : Aller dans l'onglet Console

Dans la fenêtre qui vient de s'ouvrir :
1. Cherchez les onglets en haut : **Elements**, **Console**, **Sources**, etc.
2. Cliquez sur **"Console"**

➡️ **Vous voyez maintenant une zone noire ou blanche avec peut-être du texte**

---

### ÉTAPE 4 : Copier le script

1. Ouvrez le fichier **`SCRAPE_RECAPS_MANUEL.js`** dans VS Code
2. Sélectionnez **TOUT** le contenu :
   - Cliquez dans le fichier
   - Appuyez sur **Ctrl + A** (tout sélectionner)
3. Copiez :
   - Appuyez sur **Ctrl + C**

---

### ÉTAPE 5 : Coller dans la Console

1. Retournez dans **Google Chrome**
2. Cliquez dans la **Console** (la zone noire/blanche)
3. Collez le script :
   - Appuyez sur **Ctrl + V**

➡️ **Vous devriez voir tout le code apparaître dans la console**

---

### ÉTAPE 6 : Lancer le script

1. Appuyez sur la touche **Entrée** de votre clavier
2. **C'EST TOUT !** Le script démarre automatiquement

➡️ **Vous allez voir des messages défiler dans la console :**
```
🎬 SCRAPING DES RÉCAPS DROPSIDERS
====================================
📄 Page 1
   Trouvé: 10 récaps
   [1/10] tomorrowland-winter-2024
      ✅ TOMORROWLAND WINTER 2024...
```

---

### ÉTAPE 7 : Attendre (2-5 minutes)

⏱️ **NE FERMEZ PAS LA FENÊTRE !**

Le script va :
- Parcourir toutes les pages
- Extraire les données de chaque récap
- Télécharger les photos
- Créer un fichier JSON

➡️ **Vous verrez la progression en temps réel dans la console**

---

### ÉTAPE 8 : Récupérer le fichier

Quand vous verrez ce message :
```
✅ TERMINÉ! 97 récaps scrapés
💾 Fichier téléchargé: recaps_data.json
```

➡️ **Un fichier `recaps_data.json` a été téléchargé automatiquement !**

Vérifiez votre dossier **Téléchargements** (Downloads)

---

### ÉTAPE 9 : Installer le fichier

1. Allez dans votre dossier **Téléchargements**
2. Trouvez le fichier **`recaps_data.json`**
3. **Renommez-le** en `recaps.json` (si nécessaire)
4. **Copiez** ce fichier
5. **Collez-le** dans : `c:\Users\alexf\Documents\Site Dropsiders V2\src\data\`
6. Remplacez le fichier vide existant

---

### ÉTAPE 10 : Télécharger les images

1. Ouvrez **PowerShell** ou **Terminal**
2. Allez dans le dossier du projet :
   ```bash
   cd "c:\Users\alexf\Documents\Site Dropsiders V2"
   ```
3. Lancez le téléchargement des images :
   ```bash
   node download_images.cjs
   ```

---

### ÉTAPE 11 : Vérifier le résultat ✅

1. Le serveur dev tourne déjà !
2. Ouvrez votre navigateur
3. Allez sur : **http://localhost:5173/recap**

➡️ **Vous devriez voir tous vos récaps magnifiquement affichés ! 🎉**

---

## 🆘 PROBLÈMES COURANTS

### ❌ "La console ne s'ouvre pas"
- Essayez **F12** plusieurs fois
- Ou faites **clic droit → Inspecter**

### ❌ "Je ne vois pas l'onglet Console"
- Regardez bien en haut de la fenêtre des outils de développement
- Parfois il faut cliquer sur **>>** pour voir plus d'onglets

### ❌ "Rien ne se passe quand j'appuie sur Entrée"
- Vérifiez que vous avez bien copié **TOUT** le script
- Le script commence par `(async function() {`
- Et se termine par `})();`

### ❌ "Le fichier ne se télécharge pas"
- Vérifiez que Chrome peut télécharger des fichiers
- Regardez dans la console s'il y a des messages d'erreur en rouge

### ❌ "Le script s'arrête au milieu"
- C'est normal si le site bloque temporairement
- Relancez simplement le script

---

## 📸 CAPTURE D'ÉCRAN DE LA CONSOLE

Voici à quoi ressemble la console Chrome :

```
┌─────────────────────────────────────────────┐
│ Elements  Console  Sources  Network  ...   │ ← Onglets
├─────────────────────────────────────────────┤
│                                             │
│ > 🎬 SCRAPING DES RÉCAPS DROPSIDERS        │
│ > ====================================      │
│ > 📄 Page 1                                │
│ >    Trouvé: 10 récaps                     │
│ >    [1/10] tomorrowland-winter-2024       │
│ >       ✅ TOMORROWLAND WINTER 2024...     │
│                                             │
│ ▼ (Votre code collé ici)                   │ ← Zone de saisie
└─────────────────────────────────────────────┘
```

---

## 🎯 RÉSUMÉ EN 3 ÉTAPES

1. **F12** dans Chrome sur dropsiders.eu/recaps
2. **Copier-coller** le script dans la Console
3. **Entrée** et attendre le téléchargement

**C'est tout ! 🚀**

---

Besoin d'aide ? Dites-moi où vous bloquez exactement ! 💬
