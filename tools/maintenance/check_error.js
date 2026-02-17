import { execSync } from 'child_process';
try {
    const html = execSync('curl.exe -L -s https://www.dropsiders.eu/news?page=2', { encoding: 'utf8' });
    console.log('Success, length:', html.length);
} catch (e) {
    console.error('Error:', e.message);
}
