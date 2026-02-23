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

// Charger la config
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

async function syncAccount(accountKey) {
    const acc = config.accounts[accountKey];
    console.log(`\n--- Synchronisation de ${acc.email} ---`);

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

                // Récupérer les 20 derniers messages
                const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 19)}:${box.messages.total}`, {
                    bodies: '',
                    struct: true
                });

                const newEmails = [];

                fetch.on('message', (msg, seqno) => {
                    msg.on('body', (stream, info) => {
                        simpleParser(stream, async (err, parsed) => {
                            if (err) return;
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
                        });
                    });
                });

                fetch.once('error', (err) => reject(err));
                fetch.once('end', () => {
                    imap.end();
                    resolve(newEmails);
                });
            });
        });

        imap.once('error', (err) => reject(err));
        imap.connect();
    });
}

async function sendPendingEmails() {
    console.log('\n--- Envoi des messages en attente ---');
    if (!fs.existsSync(SENT_PATH)) return;

    let sentData = JSON.parse(fs.readFileSync(SENT_PATH, 'utf8'));
    const pending = sentData.filter(e => e.status === 'pending');

    if (pending.length === 0) {
        console.log('Aucun message en attente.');
        return;
    }

    for (const email of pending) {
        const acc = config.accounts[email.account];
        if (!acc) continue;

        const transporter = nodemailer.createTransport({
            host: acc.host,
            port: acc.smtp_port,
            secure: acc.smtp_port === 465,
            auth: {
                user: acc.user,
                password: acc.pass
            },
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
            console.log(`✅ Envoyé : ${email.subject} (à ${email.to})`);
        } catch (err) {
            console.error(`❌ Échec envoi vers ${email.to} : ${err.message}`);
        }
    }

    fs.writeFileSync(SENT_PATH, JSON.stringify(sentData, null, 4));
}

async function run() {
    try {
        // 1. Envoyer les mails sortants
        await sendPendingEmails();

        // 2. Récupérer les mails entrants
        const allData = JSON.parse(fs.readFileSync(EMAILS_PATH, 'utf8'));

        for (const key of Object.keys(config.accounts)) {
            try {
                const fetched = await syncAccount(key);
                // Fusionner (garder les IDs uniques)
                const existingIds = new Set(allData[key].map(e => e.id));
                const uniqueNew = fetched.filter(e => !existingIds.has(e.id));

                allData[key] = [...uniqueNew, ...allData[key]].slice(0, 50); // Garder 50 max
                console.log(`✅ ${uniqueNew.length} nouveaux messages pour ${key}`);
            } catch (err) {
                console.error(`❌ Échec pour ${key} : ${err.message}`);
            }
        }

        fs.writeFileSync(EMAILS_PATH, JSON.stringify(allData, null, 4));
        console.log('\n--- Bilan de synchronisation terminé ---');
        console.log('Vous pouvez rafraîchir votre interface Dropsiders.');
    } catch (error) {
        console.error('\n❌ Erreur critique :', error.message);
    }
}

run();
