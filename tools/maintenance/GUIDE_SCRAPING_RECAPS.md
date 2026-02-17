# 🎬 GUIDE DE SCRAPING DES RÉCAPS DROPSIDERS

## 📋 Instructions Complètes

### Étape 1 : Ouvrir le Site
1. Ouvrez votre navigateur (Chrome ou Firefox recommandé)
2. Allez sur : **https://www.dropsiders.eu/recaps**

### Étape 2 : Ouvrir la Console
- **Windows/Linux** : Appuyez sur `F12` ou `Ctrl + Shift + J`
- **Mac** : Appuyez sur `Cmd + Option + J`
- Cliquez sur l'onglet **"Console"**

### Étape 3 : Exécuter le Script
1. Ouvrez le fichier `SCRAPE_RECAPS_MANUEL.js`
2. **Copiez TOUT le contenu** du fichier (Ctrl+A puis Ctrl+C)
3. **Collez** dans la console du navigateur (Ctrl+V)
4. Appuyez sur **Entrée**

### Étape 4 : Attendre le Scraping
- Le script va automatiquement :
  - Parcourir toutes les pages de récaps
  - Extraire les données de chaque article
  - Télécharger les informations (titre, date, photos, vidéos, etc.)
- ⏱️ **Durée estimée** : 2-5 minutes selon le nombre de récaps
- 📊 Vous verrez la progression dans la console

### Étape 5 : Récupérer les Données
- À la fin, un fichier **`recaps_data.json`** sera automatiquement téléchargé
- Vérifiez votre dossier de téléchargements

### Étape 6 : Installer les Données
1. Renommez le fichier téléchargé en **`recaps.json`** (si nécessaire)
2. Placez-le dans : `src/data/recaps.json`
3. Remplacez le fichier vide existant

### Étape 7 : Télécharger les Images
1. Exécutez le script de téléchargement d'images :
   ```bash
   node download_images.cjs
   ```
2. Les images seront téléchargées dans `public/images/imported/`

### Étape 8 : Vérifier le Résultat
1. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```
2. Allez sur : http://localhost:5173/recap
3. Vous devriez voir tous les récaps avec leurs photos !

## 🎯 Ce qui est Extrait

Pour chaque récap, le script récupère :
- ✅ **ID** unique
- ✅ **Titre** complet
- ✅ **Date** de publication
- ✅ **Contenu** HTML complet
- ✅ **Image de couverture**
- ✅ **Toutes les photos** de l'article
- ✅ **Vidéo YouTube** (si présente)
- ✅ **Festival** (détecté automatiquement)
- ✅ **Localisation** (détectée automatiquement)
- ✅ **URL** source

## 🎨 Fonctionnalités de la Page Récaps

### Page Liste (`/recap`)
- Grille responsive 3 colonnes
- Badges festival et localisation
- Compteur de photos
- Pagination élégante
- Effets hover premium
- Tri par date décroissante

### Page Détail (`/recap/:id`)
- Hero image plein écran
- Badges informatifs (festival, lieu, date)
- Vidéo YouTube intégrée
- Contenu texte formaté
- Galerie photos en grille
- Navigation fluide

## 🚨 Dépannage

### Le script ne démarre pas
- Vérifiez que vous avez copié **TOUT** le contenu du fichier
- Assurez-vous d'être sur la bonne page (dropsiders.eu/recaps)
- Essayez de rafraîchir la page et recommencer

### Le téléchargement ne se lance pas
- Vérifiez les paramètres de votre navigateur
- Autorisez les téléchargements automatiques pour dropsiders.eu
- Vérifiez la console pour les erreurs

### Pas assez de récaps
- Le script parcourt jusqu'à 20 pages
- Si vous pensez qu'il en manque, augmentez `maxPages` dans le script

### Les images ne s'affichent pas
- Vérifiez que `download_images.cjs` a bien été exécuté
- Vérifiez le dossier `public/images/imported/`
- Relancez le serveur de développement

## 📊 Statistiques Attendues

D'après vos indications, vous devriez obtenir environ **97 récaps uniques**.

Le script affichera à la fin :
```
✅ TERMINÉ! 97 récaps scrapés
💾 Fichier téléchargé: recaps_data.json
```

## 🎉 Résultat Final

Une fois terminé, vous aurez :
- ✨ Une page récaps magnifique et professionnelle
- 📸 Toutes les photos téléchargées localement
- 🎬 Vidéos YouTube intégrées
- 🏷️ Métadonnées complètes (festivals, lieux, dates)
- 🚀 Navigation ultra-rapide et fluide

---

**Besoin d'aide ?** Vérifiez la console du navigateur pour les messages d'erreur.
