
const BASE_URL = 'https://dropsiders.fr';

async function resetBlindTest() {
    console.log('Resetting Blind Test quizzes...');
    const url = `${BASE_URL}/api/quiz/reset-blind-test`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'X-Session-ID': 'initial-session-id',
            'X-Admin-Username': 'alex'
        }
    });
    if (!res.ok) {
        throw new Error(`Failed to reset: ${res.status} ${await res.text()}`);
    }
    const data = await res.json();
    console.log('Success:', data);
}

resetBlindTest().catch(console.error);
