import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF();

// Colors
const red = [255, 18, 65];
const dark = [5, 5, 5];
const gray = [100, 100, 100];

// Header
doc.setFillColor(5, 5, 5);
doc.rect(0, 0, 210, 40, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(24);
doc.setFont("helvetica", "bold");
doc.text("DROPSIDERS MEDIA", 20, 20);

doc.setFontSize(10);
doc.setTextColor(255, 18, 65);
doc.text("GRILLE TARIFAIRE 2026", 20, 30);

// Section: Tarifs a la carte
doc.setTextColor(0, 0, 0);
doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("1. TARIFS A LA CARTE", 20, 55);

doc.setFontSize(10);
doc.setFont("helvetica", "normal");
const placements = [
    ["Article Sponsorise (SEO)", "125 HT"],
    ["Instagram Post (Feed)", "90 HT"],
    ["Pack Stories (3 slides + Lien)", "45 HT"],
    ["Video TikTok / Reel", "110 HT"],
    ["Mise en avant Agenda (1 semaine)", "60 HT"],
    ["Placement Newsletter", "75 HT"]
];

let y = 65;
placements.forEach(p => {
    doc.text(p[0], 25, y);
    doc.text(p[1] + " euros", 150, y, { align: "right" });
    doc.setDrawColor(230, 230, 230);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;
});

// Section: Formules de partenariat
y += 15;
doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("2. FORMULES DE PARTENARIAT", 20, y);

const formulas = [
    { name: "STARDUST", price: "90", items: "1 Post Insta + 1 Story + 1 Mention News" },
    { name: "SPOTLIGHT", price: "180", items: "1 Article + 1 Post Insta + 1 Story" },
    { name: "PULSE", price: "320", items: "1 Article + 2 Posts Insta + 3 Stories + Newsletter" },
    { name: "IMMERSIVE", price: "700", items: "1 Post Insta + 1 Story + Couverture Live + Recap Video (Team)" }
];

y += 10;
formulas.forEach(f => {
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y, 170, 20, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 18, 65);
    doc.text(f.name, 25, y + 8);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(f.items, 25, y + 14);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(f.price + " euros HT", 185, y + 12, { align: "right" });
    
    y += 25;
});

// Footer
doc.setFontSize(8);
doc.setTextColor(150, 150, 150);
doc.setFont("helvetica", "italic");
doc.text("Document confidentiel - Dropsiders Media Group 2026", 105, 285, { align: "center" });

const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync("c:/Users/alexf/Documents/Site Dropsiders V2/Dropsiders_Tarifs_2026.pdf", buffer);

console.log("PDF genere avec succes : Dropsiders_Tarifs_2026.pdf");
