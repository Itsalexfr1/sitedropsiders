
const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\alexf\\Documents\\Site Dropsiders V2\\src\\pages\\AdminDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add isSavingQuiz state
content = content.replace(
    'const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);',
    'const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);\n    const [isSavingQuiz, setIsSavingQuiz] = useState(false);'
);

// 2. Fix handleCreateQuiz
content = content.replace(
    /options: \['', '', '', ''\],\s+correctAnswer: '',\s+author: username,/g,
    "options: ['', '', '', ''],\n            correctAnswer: '',\n            category: 'Général',\n            author: username,"
);

// 3. Update handleUpdateQuiz
const oldHandleUpdate = `    const handleUpdateQuiz = async (quiz: any) => {
        try {
            const endpoint = quiz.id ? '/api/quiz/update' : '/api/quiz/submit';
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(quiz)
            });
            if (res.ok) {
                setIsEditQuizModalOpen(false);
                fetchQuizzes();
            }
        } catch (err) {
            console.error("Error updating quiz:", err);
        }
    };`;

const newHandleUpdate = `    const handleUpdateQuiz = async (quiz: any) => {
        if (isSavingQuiz) return;
        setIsSavingQuiz(true);
        try {
            const endpoint = quiz.id ? '/api/quiz/update' : '/api/quiz/submit';
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(quiz)
            });

            if (res.ok) {
                setIsEditQuizModalOpen(false);
                fetchQuizzes();
            } else {
                const errData = await res.json();
                alert(\`Erreur lors de la sauvegarde: \${errData.error || 'Erreur inconnue'}\`);
            }
        } catch (err) {
            console.error("Error updating quiz:", err);
            alert("Erreur réseau lors de la sauvegarde.");
        } finally {
            setIsSavingQuiz(false);
        }
    };`;

content = content.replace(oldHandleUpdate, newHandleUpdate);

// 4. Update Save button
const oldButton = `<button onClick={() => handleUpdateQuiz(quizToEdit)}
                                        className="flex-1 py-4 bg-neon-red text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-neon-red/20 transition-all hover:scale-[1.02] active:scale-[0.98]">Enregistrer</button>`;

const newButton = `<button
                                        onClick={() => handleUpdateQuiz(quizToEdit)}
                                        disabled={isSavingQuiz}
                                        className={\`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 \${isSavingQuiz ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-neon-red text-white shadow-neon-red/20 hover:scale-[1.02] active:scale-[0.98]'}\`}
                                    >
                                        {isSavingQuiz ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Enregistrer
                                            </>
                                        )}
                                    </button>`;

content = content.replace(oldButton, newButton);


// 5. Update labels
content = content.replace(
    /\{quizToEdit\.type === 'BLIND_TEST' \? 'Titre \(Utilisée comme Bonne Réponse\)' : 'Question'\}/g,
    "{quizToEdit.type === 'BLIND_TEST' ? 'Question / Titre' : 'Question'}"
);

content = content.replace(
    /placeholder=\{quizToEdit\.type === 'BLIND_TEST' \? 'Ex: Martin Garrix - Animals' : 'Ex: Quel DJ est headliner \?'\}/g,
    "placeholder={quizToEdit.type === 'BLIND_TEST' ? 'Ex: Quel est ce morceau ?' : 'Ex: Quel DJ est headliner ?'}"
);

// 6. Add Category Select
content = content.replace(
    /setQuizToEdit\(\{ \.\.\.quizToEdit, question: e\.target\.value \}\)\}\s+className="w-full bg-black border border-white\/10 rounded-xl p-3 text-white focus:border-neon-red outline-none text-xs"\s+placeholder=\{quizToEdit\.type === 'BLIND_TEST' \? 'Ex: Quel est ce morceau \?' : 'Ex: Quel DJ est headliner \?'\}\s+\/>\s+<\/div>/g,
    (match) => match + `\n\n                                    <div>\n                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Catégorie</label>\n                                        <select\n                                            value={quizToEdit.category || 'Général'}\n                                            onChange={(e) => setQuizToEdit({ ...quizToEdit, category: e.target.value })}\n                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-neon-red outline-none text-xs"\n                                        >\n                                            <option value="Général">Général</option>\n                                            <option value="Artistes">Artistes</option>\n                                            <option value="Festivals">Festivals</option>\n                                            <option value="Culture">Culture</option>\n                                            <option value="Musique">Musique</option>\n                                            <option value="Classements">Classements</option>\n                                            <option value="Genres">Genres</option>\n                                            <option value="Lieux">Lieux</option>\n                                            <option value="Performance">Performance</option>\n                                            <option value="Labels">Labels</option>\n                                        </select>\n                                    </div>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AdminDashboard.tsx');
