const fs = require('fs');
let file = fs.readFileSync('src/pages/TakeoverPage.tsx', 'utf-8');

// 1. Remove 'QUIZ' from admin tabs
file = file.replace(
    `{['GENERAL', 'PLANNING', 'SHAZAM', 'SONDAGES', 'QUIZ', 'DROPS', 'BOT', 'MODERATION'].map(t => (`,
    `{['GENERAL', 'PLANNING', 'SHAZAM', 'SONDAGES / QUIZ', 'DROPS', 'BOT', 'MODERATION'].map(t => (`
);

file = file.replace(
    `onClick={() => setAdminActiveTab(t.toLowerCase())}`,
    `onClick={() => setAdminActiveTab(t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase())}`
);

// We need to also fix the tab comparison logic
// Because adminActiveTab is 'sondages' when we click 'SONDAGES / QUIZ'
file = file.replace(
    `className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${adminActiveTab === t.toLowerCase()`,
    `className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${adminActiveTab === (t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase())`
);

// 2. Fix the chat tabs not showing when activeChatTab is not 'chat'
file = file.replace(
    `isConnected && activeChatTab === 'chat' && (`,
    `isConnected && (`
);

// 3. Extract the Quiz section and put it inside Sondages.
const quizStrStart = `                                        ) : adminActiveTab === 'quiz' ? (`;
const quizCardStart = `                                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-8">`;
const botTabStart = `                                        ) : adminActiveTab === 'bot' ? (`;

const quizBlockStartIdx = file.indexOf(quizStrStart);
const botTabStartIdx = file.indexOf(botTabStart);

if (quizBlockStartIdx !== -1 && botTabStartIdx !== -1) {
    const quizBlock = file.substring(quizBlockStartIdx, botTabStartIdx);
    // Find the inner quiz card
    if (quizBlock.includes(quizCardStart)) {
        const quizCardEndIdx = quizBlock.lastIndexOf(`</div>`);
        const pureQuizCard = quizBlock.substring(quizBlock.indexOf(quizCardStart), quizCardEndIdx);
        // Clean off the closing div elements
        const lastDivIndexForCard = pureQuizCard.lastIndexOf('</div>');
        const beforeLastDivIndexForCard = pureQuizCard.lastIndexOf('</div>', lastDivIndexForCard - 1);
        const reallyPureCard = pureQuizCard.substring(0, beforeLastDivIndexForCard) + '</div>\\n';

        // Let's just do an easier hack.
        // We know exactly what the Quiz card starts and ends with.

        // Actually it's easier to just match from '<div className="p-8...' to just before '</div></div></div>'
    }
}

// SIMPLER METHOD
// Find everything between "adminActiveTab === 'quiz'" and "adminActiveTab === 'bot'"
const quizContentMatch = file.match(/\) : adminActiveTab === 'quiz' \? \([\s\S]*?(?=\) : adminActiveTab === 'bot' \? \()/);

if (quizContentMatch) {
    let fullQuizBlock = quizContentMatch[0];

    // Extract everything inside "animate-in fade-in..."
    const innerQuizMatch = fullQuizBlock.match(/<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">([\s\S]*)<\/div>\s*$/);

    if (innerQuizMatch) {
        // innerQuizMatch[1] contains the actual <div className="p-8 bg-white..."> ... </div>
        let quizBody = innerQuizMatch[1].trim();

        // 4. Inject it into the Sondages section
        const shazamMatch = file.match(/\) : adminActiveTab === 'shazam' \? \(/);
        if (shazamMatch) {
            // Find the end of Sondages section
            const sondagesBlockStr = file.substring(0, shazamMatch.index);
            // Replace the end of Sondages block with Sondages + Quiz
            // Sondages ends with:
            //                                                 </div>
            //                                             </div>
            const replaceTarget = `                                                </div>\n                                            </div>`;
            const replacement = `                                                </div>\n\n                                            {/* SECTION QUIZ BASCULÉE ICI */}\n                                            ` + quizBody + `\n                                            </div>`;

            // Actually it's better to just replace the last 2 `</div>` inside the Sondages block.
            let firstSplit = file.substring(0, shazamMatch.index);
            let secondSplit = file.substring(shazamMatch.index);

            // Find last `</div>\n                                            </div>` in firstSplit
            const sondageEndRegex = /<\/div>\s*<\/div>\s*$/;
            firstSplit = firstSplit.replace(sondageEndRegex, `</div>\n\n                                              ` + quizBody + `\n                                            </div>\n                                            </div>\n`);

            file = firstSplit + secondSplit;

            // Now remove the quiz block
            file = file.replace(quizContentMatch[0], '');

            fs.writeFileSync('src/pages/TakeoverPage.tsx', file);
            console.log('SUCCESS');
        } else {
            console.log('Shazam match not found');
        }
    } else {
        console.log('Inner quiz match not found');
    }
} else {
    console.log('Quiz block not found');
}
