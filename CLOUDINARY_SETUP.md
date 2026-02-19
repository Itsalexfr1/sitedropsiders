# 🖼️ Guide Configuration Cloudinary – Dropsiders

## Pourquoi Cloudinary ?

- **Gratuit** : 25 GB stockage + 25 GB bandwidth/mois
- **CDN mondial** : images servies rapidement partout dans le monde
- **Transformation automatique** : redimensionnement, optimisation, conversion WebP
- **Stable** : pas de limite de repo comme GitHub

---

## Étape 1 : Créer un compte Cloudinary

1. Va sur **https://cloudinary.com/users/register_free**
2. Crée un compte gratuit (avec ton email)
3. Une fois connecté, va sur le **Dashboard**
4. Note les infos suivantes :
   - **Cloud Name** (ex: `dxabcdef1`)
   - **API Key**
   - **API Secret**

---

## Étape 2 : Créer un Upload Preset

1. Dans le Dashboard Cloudinary, va dans **Settings** → **Upload**
2. Scroll jusqu'à **Upload presets**
3. Clique sur **Add upload preset**
4. Configure :
   - **Preset name** : `dropsiders_unsigned`
   - **Signing Mode** : **Unsigned** ⚠️ (important !)
   - **Folder** : `dropsiders` (optionnel)
   - **Allowed formats** : jpg, jpeg, png, webp, gif
5. Clique **Save**
6. Note le **Preset name** : `dropsiders_unsigned`

---

## Étape 3 : Ajouter les variables dans Cloudflare Pages

1. Va sur **https://dash.cloudflare.com**
2. → **Workers & Pages** → **sitedropsiders**
3. → **Settings** → **Environment Variables**
4. Clique **Add variable** pour chaque ligne :

| Variable | Valeur |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | ton Cloud Name (ex: `dxabcdef1`) |
| `CLOUDINARY_UPLOAD_PRESET` | `dropsiders_unsigned` |

5. Clique **Save**
6. **Redéploie** l'application (ou push un nouveau commit)

---

## ✅ Résultat attendu

Après configuration, dans l'admin :
- Upload une image → elle va directement sur Cloudinary
- L'URL retournée sera du type : `https://res.cloudinary.com/dxabcdef1/image/upload/dropsiders/galerie/...`
- Vitesse d'affichage optimale + CDN mondial

---

## 🔄 Fallback GitHub

Si Cloudinary n'est pas configuré, l'upload continue à fonctionner vers GitHub (comportement actuel). Aucune action requise pour faire fonctionner l'existant.

---

## Structure des dossiers Cloudinary

Les images seront organisées automatiquement :
- `dropsiders/galerie/` → photos galeries
- `dropsiders/news/` → images des articles
- `dropsiders/recaps/` → images des recaps
- `dropsiders/interviews/` → images interviews
- `dropsiders/uploads/` → autres uploads
