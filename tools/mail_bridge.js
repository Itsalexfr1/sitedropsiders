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
        authTimeout: 15000,
        connTimeout: 15000
    });

    const newEmails = [];
    return new Promise((resolve, reject) => {
        // Timeout global de 30s par compte
        const timeout = setTimeout(() => {
            console.error(`⏱ Timeout IMAP pour ${acc.email}`);
            try { imap.destroy(); } catch (_) { }
            resolve([]);
        }, 30000);

        imap.once('ready', () => {
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    clearTimeout(timeout);
                    return reject(err);
                }

                if (box.messages.total === 0) {
                    imap.end();
                    clearTimeout(timeout);
                    return resolve([]);
                }

                const fetchFrom = Math.max(1, box.messages.total - 29); // 30 derniers
                const fetch = imap.seq.fetch(`${fetchFrom}:${box.messages.total}`, {
                    bodies: '',
                    struct: true
                });

                let completed = 0;
                let total = 0;

                fetch.on('message', (msg, seqno) => {
                    total++;
                    msg.on('body', (stream) => {
                        simpleParser(stream, (err, parsed) => {
                            completed++;
                            if (!err && parsed) {
                                newEmails.push({
                                    id: parsed.messageId || `${acc.email}-${seqno}`,
                                    from: parsed.from?.text || '',
                                    fromName: parsed.from?.value?.[0]?.name || parsed.from?.text?.split('<')[0].trim() || 'Inconnu',
                                    subject: parsed.subject || '(Sans objet)',
                                    preview: (parsed.text?.substring(0, 150) || '').replace(/\n/g, ' ') + '...',
                                    content: parsed.html || parsed.text || '',
                                    date: parsed.date?.toISOString() || new Date().toISOString(),
                                    read: false,
                                    starred: false,
                                    labels: []
                                });
                            }
                            if (completed >= total) {
                                imap.end();
                            }
                        });
                    });
                });

                fetch.once('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
                fetch.once('end', () => {
                    if (total === 0) {
                        clearTimeout(timeout);
                        imap.end();
                        resolve([]);
                    }
                });
            });
        });

        imap.once('close', () => {
            clearTimeout(timeout);
            resolve(newEmails);
        });
        imap.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });
        imap.connect();
    });
}

async function syncAllInbox() {
    try {
        // Charger le fichier existant avec fallback
        let allData = { contact: [], alex: [] };
        if (fs.existsSync(EMAILS_PATH)) {
            try {
                const raw = fs.readFileSync(EMAILS_PATH, 'utf8');
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    allData = parsed;
                }
            } catch (e) {
                console.error('⚠️ Impossible de lire emails.json, réinitialisation:', e.message);
            }
        }

        // S'assurer que chaque clé de compte existe
        for (const key of Object.keys(config.accounts)) {
            if (!Array.isArray(allData[key])) {
                allData[key] = [];
                console.log(`⚠️ Clé "${key}" manquante dans emails.json — initialisée à []`);
            }
        }

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
                } else {
                    console.log(`ℹ️ Aucun nouveau message pour ${key}`);
                }
            } catch (err) {
                console.error(`❌ Échec IMAP pour ${key} : ${err.message}`);
            }
        }

        if (hasChanges) {
            fs.writeFileSync(EMAILS_PATH, JSON.stringify(allData, null, 4));
            console.log('💾 emails.json mis à jour');
        }
    } catch (error) {
        console.error('Erreur réception :', error.message);
    }
}

async function sendPendingEmails() {
    if (!fs.existsSync(SENT_PATH)) {
        console.log('ℹ️ Pas de fichier emails_sent.json, skip envoi.');
        return;
    }

    let sentData;
    try {
        const raw = fs.readFileSync(SENT_PATH, 'utf8');
        sentData = JSON.parse(raw);
    } catch (e) {
        console.error('⚠️ Impossible de lire emails_sent.json:', e.message);
        return;
    }

    // Support tableau plat OU objet avec clé "content"
    if (!Array.isArray(sentData)) {
        if (sentData && Array.isArray(sentData.content)) {
            sentData = sentData.content;
        } else {
            sentData = [];
        }
    }

    const pending = sentData.filter(e => e.status === 'pending');

    if (pending.length === 0) {
        console.log('ℹ️ Aucun email en attente d\'envoi.');
        return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Envoi de ${pending.length} message(s)...`);

    for (const email of sentData) {
        if (email.status !== 'pending') continue;

        const accKey = email.account || 'contact';
        const acc = config.accounts[accKey];
        if (!acc) {
            console.error(`❌ Compte inconnu : ${accKey}`);
            email.status = 'error';
            continue;
        }

        const transporter = nodemailer.createTransport({
            host: acc.host,
            port: acc.smtp_port,
            secure: acc.smtp_port === 465,
            auth: { user: acc.user, pass: acc.pass },
            tls: { rejectUnauthorized: false }
        });

        try {
            await transporter.sendMail({
                from: `Dropsiders <${acc.email}>`,
                to: email.to,
                subject: email.subject,
                text: email.content,
                html: email.content ? `<div style="font-family:Arial,sans-serif;color:#333;white-space:pre-wrap;">${email.content}</div>` : undefined
            });
            email.status = 'sent';
            console.log(`✅ Envoyé : "${email.subject}" → ${email.to} (via ${acc.email})`);
        } catch (err) {
            console.error(`❌ Échec SMTP vers ${email.to} : ${err.message}`);
            email.status = 'error';
        }
    }

    fs.writeFileSync(SENT_PATH, JSON.stringify(sentData, null, 4));
    console.log('💾 emails_sent.json mis à jour');
}

async function run() {
    if (!WATCH_MODE) {
        console.log('=== Mode Manuel — Dropsiders Mail Bridge ===');
        await sendPendingEmails();
        await syncAllInbox();
        console.log('=== Terminé. ===');
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
