const fs = require('fs');

let file = fs.readFileSync('src/pages/TakeoverPage.tsx', 'utf-8');

// Update tabs array
file = file.replace(
    "{['GENERAL', 'PLANNING', 'SHAZAM', 'SONDAGES', 'QUIZ', 'DROPS', 'BOT', 'MODERATION'].map(t => (",
    "{['GENERAL', 'PLANNING', 'SHAZAM', 'SONDAGES / QUIZ', 'DROPS', 'BOT', 'MODERATION'].map(t => ("
);

// Update onClick
file = file.replace(
    `onClick={() => setAdminActiveTab(t.toLowerCase())}`,
    `onClick={() => setAdminActiveTab(t === 'SONDAGES / QUIZ' ? 'sondages' : t.toLowerCase())}`
);

// Update className
file = file.replace(
    'className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminActiveTab === t.toLowerCase() ? \'bg-white/10 text-white border border-white/20\' : \'text-gray-500 hover:text-white\'}`}',
    'className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminActiveTab === (t === \'SONDAGES / QUIZ\' ? \'sondages\' : t.toLowerCase()) ? \'bg-white/10 text-white border border-white/20\' : \'text-gray-500 hover:text-white\'}`}'
);

// Fix chat tab visibility
file = file.replace(
    `isConnected && activeChatTab === 'chat' && (`,
    `isConnected && (`
);

// Extract Quiz Block and Insert into Sondages Block
const botStartMatch = /\} \: adminActiveTab === 'bot' \? \(/;
file = file.replace(botStartMatch, ") : adminActiveTab === 'bot' ? (");

const shazamStartMatch = /\} \: adminActiveTab === 'shazam' \? \(/;
file = file.replace(shazamStartMatch, ") : adminActiveTab === 'shazam' ? (");

const quizMatch = file.match(/\s*\) : adminActiveTab === 'quiz' \? \([\s\S]*?(?=\s*\) : adminActiveTab === 'bot' \? \()/);

if (quizMatch) {
    const fullQuizBlock = quizMatch[0];

    // We want the inner card part of quiz
    // It is everything inside the 'space-y-8 animate-in...' div
    const innerCardRegex = /<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">([\s\S]*?)<\/div>\s*$/;
    const innerMatch = fullQuizBlock.match(innerCardRegex);

    if (innerMatch) {
        let innerQuizCard = innerMatch[1].trim();

        // Remove the </div> closure from the exact last bit if it exists
        // Actually, innerMatch[1] matches inside the <div> ... </div>. So the </div> closing the space-y-8 animate-in is NOT captured.
        // Therefore, innerQuizCard is exactly the inner contents!

        // Now find SONDAGE end.
        // It ends before ") : adminActiveTab === 'shazam' ? ("

        const sondageRegex = /([\s\S]*?)(<\/div>\s*)(?=\) : adminActiveTab === 'shazam' \? \()/;
        const sondageMatch = file.match(sondageRegex);

        if (sondageMatch) {
            // Replace the full match of Sondage
            // To be precise, let's just use string replace on `file`
            // The sondage block has `<div className="space-y-8...">` and ends with `</div>`
            const shazamIndex = file.indexOf(") : adminActiveTab === 'shazam' ? (");
            let beforeShazam = file.substring(0, shazamIndex);

            // At the end of beforeShazam, there's `</div>\n                                            `
            // We want to insert `innerQuizCard` right before that last `</div>`
            const lastDivIdx = beforeShazam.lastIndexOf('</div>');

            if (lastDivIdx !== -1) {
                beforeShazam = beforeShazam.substring(0, lastDivIdx) + '    ' + innerQuizCard + '\n' + beforeShazam.substring(lastDivIdx);

                let newFile = beforeShazam + file.substring(shazamIndex);

                // Now remove the quiz block
                newFile = newFile.replace(fullQuizBlock, '');

                fs.writeFileSync('src/pages/TakeoverPage.tsx', newFile);
                console.log('Successfully completed the modification!');
            } else {
                console.log('Could not find last div of sondages');
            }
        } else {
            console.log('sondage match failed');
        }

    } else {
        console.log('Inner Quiz match failed');
    }
} else {
    console.log('Quiz block not found');
}
