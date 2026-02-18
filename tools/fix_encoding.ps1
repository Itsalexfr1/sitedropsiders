# Script de correction des caractères mal encodés (Latin-1 -> UTF-8)
# Ces erreurs surviennent quand un fichier UTF-8 est lu comme Latin-1

$filesToFix = @(
    "src\data\news.json",
    "src\data\recaps.json",
    "src\data\interviews.json",
    "src\data\agenda.json",
    "src\data\tail_verify_final.txt"
)

# Table de correspondance des caractères mal encodés -> corrects
$replacements = [ordered]@{
    # Séquences doubles (à faire en premier)
    "Ã©"  = "é"
    "Ã¨"  = "è"
    "Ã "  = "à"
    "Ã¢"  = "â"
    "Ã®"  = "î"
    "Ã´"  = "ô"
    "Ã»"  = "û"
    "Ã§"  = "ç"
    "Ã«"  = "ë"
    "Ã¯"  = "ï"
    "Ã¹"  = "ù"
    "Ã¼"  = "ü"
    "Ã‰"  = "É"
    "Ã€"  = "À"
    "Ã‚"  = "Â"
    "Ã'"  = "Ó"
    "Ã›"  = "Û"
    "Ã‡"  = "Ç"
    "Ã¦"  = "æ"
    "Å"   = "Œ"
    "Å"   = "œ"
    "â€™" = "'"
    "â€œ" = """
    "â€"  = """
    "â€"  = "–"
    "â€""  = "—"
    "Â«"  = "«"
    "Â»"  = "»"
    "Â "  = " "
    "Ã¨re" = "ère"
    "Ã©e"  = "ée"
    "Ã©s"  = "és"
    "Ã©"   = "é"
    "Ã¨"   = "è"
    "Ã "   = "à"
    "Ã¢"   = "â"
    "Ã®"   = "î"
    "Ã´"   = "ô"
    "Ã»"   = "û"
    "Ã§"   = "ç"
    "Ã«"   = "ë"
    "Ã¯"   = "ï"
    "Ã¹"   = "ù"
    "Ã¼"   = "ü"
    "Ãœ"   = "Ü"
    "Ã"    = "à"
    "â"    = "'"
    "â¯"   = " "
    "Å"    = "Œ"
    "Å"    = "œ"
    "Ã´"   = "ô"
    "Ã¦"   = "æ"
    "Ã±"   = "ñ"
    "Ã³"   = "ó"
    "Ã¡"   = "á"
    "Ã­"   = "í"
    "Ã¤"   = "ä"
    "Ã¶"   = "ö"
    "Ã"    = "Ã"
}

$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path }

Write-Host "Répertoire racine: $rootDir" -ForegroundColor Cyan

foreach ($relPath in $filesToFix) {
    $fullPath = Join-Path $rootDir $relPath
    if (-not (Test-Path $fullPath)) {
        Write-Host "Fichier non trouvé: $fullPath" -ForegroundColor Yellow
        continue
    }

    Write-Host "Traitement de: $relPath" -ForegroundColor Green
    
    # Lire le fichier en UTF-8
    $content = Get-Content -Path $fullPath -Raw -Encoding UTF8
    $original = $content
    
    # Appliquer les remplacements
    foreach ($key in $replacements.Keys) {
        $content = $content.Replace($key, $replacements[$key])
    }
    
    if ($content -ne $original) {
        # Sauvegarder sans BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($fullPath, $content, $utf8NoBom)
        Write-Host "  ✓ Fichier corrigé et sauvegardé" -ForegroundColor Green
    } else {
        Write-Host "  - Aucune correction nécessaire" -ForegroundColor Gray
    }
}

Write-Host "`nTerminé !" -ForegroundColor Cyan
