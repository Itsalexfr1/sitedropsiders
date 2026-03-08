const fs = require('fs');

const path = 'src/pages/TakeoverPage.tsx';
let file = fs.readFileSync(path, 'utf-8');

// 1. Rename tab from SONDAGES to SONDAGES / QUIZ
const tabsRegex = /\s*\{?\['GENERAL', 'PLANNING', 'SHAZAM', 'SONDAGES', 'QUIZ', 'DROPS', 'BOT', 'MODERATION'\]/g;
file = file.replace(tabsRegex, " {['GENERAL', 'PLANNING', 'SHAZAM', 'SONDAGES / QUIZ', 'DROPS', 'BOT', 'MODERATION']");

// Replace onClick setAdminActiveTab
file = file.replace(
    /onClick=\{\(\) => setAdminActiveTab\(t\.toLowerCase\(\)\)\}/,
    `onClick={() => setAdminActiveTab(t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase())}`
);

// Replace className adminActiveTab condition
file = file.replace(
    /className=\{\`px-4 py-2 rounded-xl text-\[10px\] font-black uppercase tracking-widest transition-all \$\{adminActiveTab === t\.toLowerCase\(\) \? 'bg-white\/10 text-white border border-white\/20' : 'text-gray-500 hover:text-white'\}\`\}/,
    `className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${adminActiveTab === (t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase()) ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-white'}\`}`
);

// 2. Fix Chat tabs logic
file = file.replace(
    /isConnected && activeChatTab === 'chat' && \(/,
    `isConnected && (`
);

file = file.replace(
    /\} \: adminActiveTab === 'shazam' \? \(/,
    `} ) : adminActiveTab === 'shazam' ? (` // just normalize
);

// 3. Move Quiz block inside Sondage block
const quizStart = `                                        ) : adminActiveTab === 'quiz' ? (`
const botStart = `                                        ) : adminActiveTab === 'bot' ? (`

const p1 = file.indexOf(quizStart);
const p2 = file.indexOf(botStart, p1);

if (p1 !== -1 && p2 !== -1) {
    const quizBlockStr = file.substring(p1, p2);

    // Extract inner quiz card
    const cardStartMatch = `<div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">`;
    const innerStartIdx = quizBlockStr.indexOf(cardStartMatch);

    // find end of inner card
    const innerEndIdx = quizBlockStr.lastIndexOf('</div>', quizBlockStr.lastIndexOf('</div>', quizBlockStr.lastIndexOf('</div>') - 1) - 1);

    if (innerStartIdx !== -1 && innerEndIdx !== -1) {
        let innerQuizCard = quizBlockStr.substring(innerStartIdx, innerEndIdx + '</div>'.length);

        // Remove the original quiz block entirely from `file`
        let newFile = file.substring(0, p1) + botStart + file.substring(p2 + botStart.length);

        // Now find where to insert inside SONDAGES (`newFile` context)
        const shazamStart = `                                        ) : adminActiveTab === 'shazam' ? (`
        const shazamIdx = newFile.indexOf(shazamStart);

        if (shazamIdx !== -1) {
            const beforeShazam = newFile.substring(0, shazamIdx);

            // SONDAGES ends with `</div>\n</div>\n</div>`
            const sEnd3 = beforeShazam.lastIndexOf('</div>');
            const sEnd2 = beforeShazam.lastIndexOf('</div>', sEnd3 - 1);

            // Insert innerQuizCard
            const finalBeforeShazam = beforeShazam.substring(0, sEnd3) + `\n                                                    {/* BOITE QUIZ */}\n` + innerQuizCard + "\n" + beforeShazam.substring(sEnd3);

            newFile = finalBeforeShazam + newFile.substring(shazamIdx);
            fs.writeFileSync(path, newFile);
            console.log('SUCCESS');
        } else {
            console.log('SHAZAM NOT FOUND');
        }
    } else {
        console.log('INNER QUIZ NOT EXTRACTED');
    }
} else {
    console.log('QUIZ OR BOT NOT FOUND');
}
