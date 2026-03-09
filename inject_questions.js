
import fs from 'fs';

const workerPath = 'worker.ts';
const questionsPath = 'edm_questions.json';

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
let workerContent = fs.readFileSync(workerPath, 'utf-8');

const replacement = `const defaultQuizzes = ${JSON.stringify(questions, null, 4)};`;
workerContent = workerContent.replace('const defaultQuizzes = []; // Removed all example quizzes', replacement);

fs.writeFileSync(workerPath, workerContent, 'utf-8');
console.log('Worker updated with 200 questions.');
