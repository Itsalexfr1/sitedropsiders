
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2\\src\\pages\\AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update clean function to remove leading numbers
content = content.replace(
    /const clean = \(str: string\) => \{\s+return str/g,
    "const clean = (str: string) => {\n                                                                             return str\n                                                                                 .replace(/^\\d+[\\s.-]+/, '')"
);

// 2. Remove the Category Select block I added in the previous turn
// The regex needs to be careful because of the complexity of the match
const categoryBlockRegex = /<div>\s+<label className="text-\[10px\] font-black text-gray-500 uppercase tracking-widest block mb-2">Catégorie<\/label>\s+<select[\s\S]*?<\/select>\s+<\/div>/;
content = content.replace(categoryBlockRegex, '');

// 3. Remove category display from Test Modal
content = content.replace(
    /<div className="flex items-center gap-2 mb-6">\s+<div className="w-2 h-2 rounded-full bg-neon-red animate-pulse" \/>\s+<span className="text-\[10px\] text-gray-500 font-black uppercase tracking-widest">\{testQuiz\.category\}<\/span>\s+<\/div>/g,
    ''
);

// 4. Ensure default category in processFile (bulk upload)
content = content.replace(
    /approved: true/g,
    "approved: true,\n                                                                                 category: 'Blind Test'"
);

// 5. Ensure default category in handleCreateQuiz (if not already there, but I added it in previous step)
if (!content.includes("category: 'Général',")) {
    content = content.replace(
        /options: \['', '', '', ''\],\s+correctAnswer: '',/g,
        "options: ['', '', '', ''],\n            correctAnswer: '',\n            category: 'Général',"
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx - Removed numbers and categories');
