import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'src/data/mail_setup.json');
const EMAILS_PATH = path.join(ROOT, 'src/data/emails.json');
const SENT_PATH = path.join(ROOT, 'src/data/emails_sent.json');

// Mode auto si flag --watch présent
const WATCH_MODE = process.argv.includes('--watch');

// Charger la config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

async function syncAccount(accountKey) {
    const acc = config.accounts[accountKey];
    console.log(`[${new Date().toLocaleTimeString()}] Synchronisation de ${acc.email}...`);

    const imap = new Imap({
        user: acc.user,
        password: acc.pass,
        host: acc.host,
        port: acc.imap_port,
        tls: acc.imap_port === 993,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
    });

    return new Promise((resolve, reject) => {
        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) return reject(err);

                if (box.messages.total === 0) {
                    imap.end();
                    return resolve([]);
                }

                const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 19)}:${box.messages.total}`, {
                    bodies: '',
                    struct: true
                });

                const newEmails = [];
                let completed = 0;
                let total = 0;

                fetch.on('message', (msg, seqno) => {
                    total++;
                    msg.on('body', (stream, info) => {
                        simpleParser(stream, async (err, parsed) => {
                            completed++;
                            if (!err) {
                                newEmails.push({
                                    id: parsed.messageId || seqno.toString(),
                                    from: parsed.from?.text || '',
                                    fromName: parsed.from?.value[0]?.name || parsed.from?.text.split('<')[0].trim() || 'Inconnu',
                                    subject: parsed.subject || '(Sans objet)',
                                    preview: parsed.text?.substring(0, 150).replace(/\n/g, ' ') + '...',
                                    content: parsed.text || parsed.html || '',
                                    date: parsed.date?.toISOString() || new Date().toISOString(),
                                    read: true,
                                    starred: false,
                                    labels: []
                                });
                            }
                            if (completed === total) {
                                imap.end();
                            }
                        });
                    });
                });

                fetch.once('error', (err) => reject(err));
                fetch.once('end', () => {
                    if (total === 0) {
                        imap.end();
                        resolve([]);
                    }
                });
            });
        });

        imap.once('close', () => resolve(newEmails));
        imap.once('error', (err) => reject(err));
        imap.connect();
    });
}

async function syncAllInbox() {
    try {
        const allData = JSON.parse(fs.readFileSync(EMAILS_PATH, 'utf8'));
        let hasChanges = false;

        for (const key of Object.keys(config.accounts)) {
            try {
                const fetched = await syncAccount(key);
                const existingIds = new Set(allData[key].map(e => e.id));
                const uniqueNew = fetched.filter(e => !existingIds.has(e.id));

                if (uniqueNew.length > 0) {
                    allData[key] = [...uniqueNew, ...allData[key]].slice(0, 50);
                    console.log(`✅ ${uniqueNew.length} nouveaux messages pour ${key}`);
                    hasChanges = true;
                }
            } catch (err) {
                console.error(`❌ Échec IMAP pour ${key} : ${err.message}`);
            }
        }

        if (hasChanges) {
            fs.writeFileSync(EMAILS_PATH, JSON.stringify(allData, null, 4));
        }
    } catch (error) {
        console.error('Erreur réception :', error.message);
    }
}

async function sendPendingEmails() {
    if (!fs.existsSync(SENT_PATH)) return;

    let sentData = JSON.parse(fs.readFileSync(SENT_PATH, 'utf8'));
    const pending = sentData.filter(e => e.status === 'pending');

    if (pending.length === 0) return;

    console.log(`[${new Date().toLocaleTimeString()}] Envoi de ${pending.length} message(s)...`);

    for (const email of pending) {
        const acc = config.accounts[email.account];
        if (!acc) continue;

        const transporter = nodemailer.createTransport({
            host: acc.host,
            port: acc.smtp_port,
            secure: acc.smtp_port === 465,
            auth: { user: acc.user, pass: acc.pass },
            tls: { rejectUnauthorized: false }
        });

        try {
            await transporter.sendMail({
                from: acc.email,
                to: email.to,
                subject: email.subject,
                text: email.content
            });
            email.status = 'sent';
            console.log(`✅ Envoyé : ${email.subject} vers ${email.to}`);
        } catch (err) {
            console.error(`❌ Échec SMTP vers ${email.to} : ${err.message}`);
        }
    }

    fs.writeFileSync(SENT_PATH, JSON.stringify(sentData, null, 4));
}

async function run() {
    if (!WATCH_MODE) {
        console.log('--- Mode Manuel ---');
        await sendPendingEmails();
        await syncAllInbox();
        console.log('Terminé.');
        process.exit(0);
    }

    console.log('🚀 BOÎTE AUX LETTRES DROPSIDERS ACTIVÉE');
    console.log('- Sortants : Surveillance en temps réel (5s)');
    console.log('- Entrants : Synchronisation automatique (2 min)');
    console.log('------------------------------------------');

    // Premier passage
    await sendPendingEmails();
    await syncAllInbox();

    // Boucles
    setInterval(sendPendingEmails, 5000);
    setInterval(syncAllInbox, 120000);
}

run();
