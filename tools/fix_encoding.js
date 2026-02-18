import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2';

// Corrections ciblées pour les séquences restantes après la première passe
// Ces séquences n'ont PAS encore été corrigées
const REMAINING_FIXES = [
    // Ã suivi d'un espace = à (très courant en français)
    // ATTENTION: "Ã " avec espace normale ASCII (0x20)
    ['Ã\u00a0', 'à'],  // Ã + espace insécable
    // Ãª = ê
    ['Ãª', 'ê'],
    // Ã suivi d'espace normale = à
    // On doit être prudent ici car "Ã " peut être "à " (à suivi d'espace)
    // Contexte: "Ã  Coachella" = "à Coachella", "Ã  Miami" = "à Miami"
    // Mais aussi: "Ã " en fin de mot peut être problématique
    // Approche: remplacer "Ã  " (Ã + 2 espaces) par "à " d'abord
    // puis "Ã " (Ã + 1 espace) par "à "

    // Séquences spécifiques restantes dans le fichier
    ['â¯', '\u202f'],  // espace fine insécable
    ['ÃDEN', 'ÆDEN'],  // Nom propre spécifique
    ['Ã\u0089', 'É'],
    ['Ã\u0080', 'À'],
    ['Ã\u0082', 'Â'],
    ['Ã\u009b', 'Û'],
    ['Ã\u0087', 'Ç'],
    ['Ã\u009c', 'Ü'],
];

// Corrections pour "Ã " (à) - doit être fait avec précaution
// On remplace "Ã  " par "à " (deux espaces -> une espace)
// et "Ã " par "à" suivi d'espace

function fixRemainingEncoding(text) {
    let result = text;

    // D'abord les séquences spécifiques
    for (const [bad, good] of REMAINING_FIXES) {
        result = result.split(bad).join(good);
    }

    // Ensuite "Ã " -> "à " (Ã suivi d'espace = à)
    // Mais seulement si c'est vraiment un "à" (contexte français)
    // On utilise une regex pour être plus précis
    result = result.replace(/Ã /g, 'à ');

    // "Ãª" -> "ê"  
    result = result.replace(/Ãª/g, 'ê');

    // "Ã¨re" -> "ère" (déjà fait mais au cas où)
    // "mÃªlant" -> "mêlant"
    // "Ãªtre" -> "être"

    return result;
}

function hasMojibake(text) {
    return /Ã[ª ]/.test(text) || /â¯/.test(text) || /ÃDEN/.test(text);
}

function fixFile(filepath) {
    try {
        if (!fs.existsSync(filepath)) {
            console.log(`  ! Fichier non trouvé: ${path.basename(filepath)}`);
            return false;
        }

        const content = fs.readFileSync(filepath, 'utf8');

        if (!hasMojibake(content)) {
            console.log(`  - Pas de mojibake restant: ${path.basename(filepath)}`);
            return false;
        }

        const fixed = fixRemainingEncoding(content);

        if (fixed !== content) {
            fs.writeFileSync(filepath, fixed, 'utf8');
            console.log(`  ✓ Corrigé: ${path.basename(filepath)}`);
            return true;
        } else {
            console.log(`  - Aucun changement: ${path.basename(filepath)}`);
            return false;
        }
    } catch (e) {
        console.log(`  ✗ Erreur pour ${filepath}: ${e.message}`);
        return false;
    }
}

const filesToFix = [
    path.join(ROOT, 'src', 'data', 'news.json'),
    path.join(ROOT, 'src', 'data', 'recaps.json'),
    path.join(ROOT, 'src', 'data', 'agenda.json'),
    path.join(ROOT, 'src', 'data', 'galerie.json'),
    path.join(ROOT, 'src', 'data', 'team.json'),
    path.join(ROOT, 'src', 'data', 'translations.ts'),
    path.join(ROOT, 'worker.ts'),
];

console.log('=== Correction des mojibakes restants ===\n');
let fixedCount = 0;
for (const f of filesToFix) {
    if (fixFile(f)) fixedCount++;
}
console.log(`\n=== ${fixedCount} fichier(s) corrigé(s) ===`);
