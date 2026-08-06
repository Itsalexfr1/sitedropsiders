import { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Loader, X, Mail, Save, History, CheckCircle, Clock, Download, Printer, ChevronRight, Building2, User, Users, Settings, BookOpen, RefreshCw, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperAdmin } from '../utils/auth';
import { WorkPlanning } from './WorkPlanning';

interface InvoiceLine {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface SavedClient {
    id: string;
    name: string;
    address: string;
    city: string;
    email: string;
}

interface SavedArticle {
    id: string;
    description: string;
    unitPrice: number;
}

interface Sender {
    name: string;
    siret: string;
    address: string;
    email: string;
    phone: string;
    legal: string;
}

const DEFAULT_SENDER: Sender = {
    name: 'CUENCA ALEXANDRE',
    siret: '805 131 828 00010',
    address: '411 Rue de Bouillargue, 30000 Nîmes',
    email: 'alexlight3034@icloud.com',
    phone: '07 62 05 45 89',
    legal: 'Auto-entrepreneur – TVA non applicable, art. 293 B du CGI',
};

function buildInvoiceHTML(data: {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    clientName: string;
    clientAddress: string;
    clientEmail: string;
    lines: InvoiceLine[];
    iban: string;
    bic: string;
    total: number;
    subtotal?: number;
    discount?: number;
    notes: string;
    sender: Sender;
    type?: 'devis' | 'facture';
}) {
    const { sender } = data;
    const rows = data.lines.map(l => `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;font-weight:700;font-style:italic">${l.description}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;text-align:center">${l.quantity}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;text-align:right">${l.unitPrice.toFixed(2)} €</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${(l.quantity * l.unitPrice).toFixed(2)} €</td>
        </tr>
    `).join('');

    const isDevis = data.type === 'devis';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>${isDevis ? 'Devis' : 'Facture'} ${data.invoiceNumber}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; padding: 20mm; background: #fff; margin: 0 auto; }
    @media print { body { margin: 0; } .page { padding: 15mm; width: 100%; } @page { margin: 0; size: A4; } }
</style>
</head>
<body>
<div class="page">
    <table style="width:100%;margin-bottom:40px">
        <tr>
            <td style="vertical-align:top">
                <div style="font-size:22px;font-weight:900;color:#000;letter-spacing:-1px;text-transform:uppercase">${sender.name}</div>
                <div style="font-size:11px;color:#666;margin-top:4px">SIRET : ${sender.siret}</div>
                <div style="font-size:11px;color:#666;margin-top:2px">${sender.address}</div>
                <div style="font-size:11px;color:#666;margin-top:2px">${sender.email}</div>
                <div style="font-size:11px;color:#666;margin-top:2px">${sender.phone}</div>
            </td>
            <td style="vertical-align:top;text-align:right">
                <div style="font-size:36px;font-weight:900;color:#000;letter-spacing:-2px;text-transform:uppercase">${isDevis ? 'DEVIS' : 'FACTURE'}</div>
                <div style="font-size:13px;color:#666;margin-top:6px">N° <strong style="color:#000">${data.invoiceNumber}</strong></div>
                <div style="font-size:13px;color:#666;margin-top:4px">Date : <strong style="color:#000">${new Date(data.date).toLocaleDateString('fr-FR')}</strong></div>
                ${data.dueDate ? `<div style="font-size:13px;color:#e00;margin-top:4px">Échéance : <strong>${new Date(data.dueDate).toLocaleDateString('fr-FR')}</strong></div>` : ''}
            </td>
        </tr>
    </table>
    <div style="height:2px;background:#000;margin-bottom:32px"></div>
    <table style="width:100%;margin-bottom:40px">
        <tr>
            <td style="width:50%">
                <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px">${isDevis ? 'Destinataire' : 'Facturé à'}</div>
                <div style="font-size:15px;font-weight:700;color:#000">${data.clientName || '—'}</div>
                <div style="font-size:12px;color:#666;margin-top:4px;white-space:pre-line">${data.clientAddress || ''}</div>
                ${data.clientEmail ? `<div style="font-size:12px;color:#666;margin-top:4px">${data.clientEmail}</div>` : ''}
            </td>
        </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
        <thead>
            <tr style="background:#000">
                <th style="padding:12px 16px;text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Description</th>
                <th style="padding:12px 16px;text-align:center;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Qté</th>
                <th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">P.U. HT</th>
                <th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Total HT</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
    <table style="width:100%;margin-bottom:48px">
        <tr>
            <td style="width:60%">
                ${data.notes ? `<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:6px">Notes</div><div style="font-size:12px;color:#444;line-height:1.6">${data.notes}</div>` : ''}
            </td>
            <td style="width:40%;vertical-align:bottom">
                <table style="width:100%">
                    <tr>
                        <td style="padding:8px 0;font-size:12px;color:#666;border-top:1px solid #f0f0f0">Sous-total HT</td>
                        <td style="padding:8px 0;font-size:12px;color:#000;font-weight:700;text-align:right;border-top:1px solid #f0f0f0">${(data.subtotal ?? data.total).toFixed(2)} €</td>
                    </tr>
                    ${(data.discount && data.discount > 0) ? `<tr>
                        <td style="padding:8px 0;font-size:12px;color:#e55">Réduction</td>
                        <td style="padding:8px 0;font-size:12px;color:#e55;font-weight:700;text-align:right">- ${data.discount.toFixed(2)} €</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding:8px 0;font-size:11px;color:#999">TVA</td>
                        <td style="padding:8px 0;font-size:11px;color:#999;text-align:right">Non applicable</td>
                    </tr>
                    <tr style="background:#3730a3">
                        <td style="padding:14px 16px;font-size:13px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:0.05em">TOTAL TTC</td>
                        <td style="padding:14px 16px;font-size:18px;font-weight:900;color:#fff;text-align:right">${data.total.toFixed(2)} €</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    ${data.iban ? `
    <div style="background:#f9f9f9;border:1px solid #eee;border-radius:12px;padding:20px;margin-bottom:32px">
        <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:12px">Coordonnées bancaires</div>
        <table style="width:100%">
            <tr>
                <td style="font-size:11px;color:#666">IBAN</td>
                <td style="font-size:12px;font-weight:700;color:#000;font-family:monospace">${data.iban}</td>
                <td style="font-size:11px;color:#666;padding-left:32px">BIC</td>
                <td style="font-size:12px;font-weight:700;color:#000;font-family:monospace">${data.bic}</td>
            </tr>
        </table>
    </div>` : ''}
    <div style="border-top:1px solid #eee;padding-top:16px">
        <div style="font-size:10px;color:#aaa;line-height:1.6">${sender.legal}</div>
    </div>
</div>
</body>
</html>`;
}

// Shared input class
const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white text-base md:text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all placeholder:text-white/20";
const labelCls = "text-[8px] md:text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5 block";
const cardCls = "bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 md:p-6";

export function InvoiceGenerator() {
    const [sender, setSender] = useState<Sender>(() => {
        try { return JSON.parse(localStorage.getItem('inv_sender') || 'null') || DEFAULT_SENDER; }
        catch { return DEFAULT_SENDER; }
    });
    const [senderDraft, setSenderDraft] = useState<Sender>(sender);

    const [invoiceNumber, setInvoiceNumber] = useState<number>(() => {
        const saved = localStorage.getItem('inv_number');
        return saved ? parseInt(saved) : 67;
    });
    const [docType, setDocType] = useState<'facture' | 'devis'>('facture');
    const [devisNumber, setDevisNumber] = useState<number>(() => {
        const saved = localStorage.getItem('dev_number');
        return saved ? parseInt(saved) : 1;
    });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientCity, setClientCity] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [iban, setIban] = useState(() => localStorage.getItem('inv_iban') || 'BE59 9675 0891 6526');
    const [bic, setBic] = useState(() => localStorage.getItem('inv_bic') || 'TRWIBEB1XXX');
    const [notes, setNotes] = useState('');
    const [discount, setDiscount] = useState<number>(0);
    const [lines, setLines] = useState<InvoiceLine[]>([
        { id: '1', description: 'Prestation de service', quantity: 1, unitPrice: 0 }
    ]);

    // Event auto-fill (club + dates → line description)
    const [eventClub, setEventClub] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventDate2, setEventDate2] = useState(''); // optional end date

    const [view, setView] = useState<'edit' | 'planning' | 'archive' | 'clients' | 'settings'>('edit');

    const currentUser = (localStorage.getItem('admin_user') || '').toLowerCase();
    const isAlex = currentUser === 'alex' || isSuperAdmin(currentUser);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'planning' && isAlex) {
            setView('planning');
        }
    }, [isAlex]);
    const [archiveSubTab, setArchiveSubTab] = useState<'factures' | 'devis'>('factures');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [sendError, setSendError] = useState('');

    const [previewInvoice, setPreviewInvoice] = useState<any | null>(null);

    const reconstructInvoiceData = (inv: any) => {
        const type = inv.type || (inv.number?.startsWith('DEV') ? 'devis' : 'facture');
        const invoiceNumber = inv.number || '';
        const dateVal = inv.date || inv.sentDate?.split('T')[0] || new Date().toISOString().split('T')[0];
        const dueDateVal = inv.dueDate || '';
        const clientNameVal = inv.client || '';
        const clientAddressVal = inv.clientAddress || '';
        const clientEmailVal = inv.clientEmail || inv.emailTo || '';
        const clientCityVal = inv.clientCity || '';
        
        const totalVal = parseFloat(inv.total) || 0;
        const linesVal = inv.lines && inv.lines.length > 0 ? inv.lines : [
            { id: '1', description: 'Prestation de service', quantity: 1, unitPrice: totalVal }
        ];
        
        const ibanVal = inv.iban || iban;
        const bicVal = inv.bic || bic;
        const notesVal = inv.notes || '';
        const senderVal = inv.sender || sender;

        return {
            invoiceNumber,
            date: dateVal,
            dueDate: dueDateVal,
            clientName: clientNameVal,
            clientAddress: clientAddressVal,
            clientEmail: clientEmailVal,
            clientCity: clientCityVal,
            lines: linesVal,
            iban: ibanVal,
            bic: bicVal,
            total: totalVal,
            notes: notesVal,
            sender: senderVal,
            type
        };
    };

    const downloadInvoicePDF = async (invData: any) => {
        try {
            const html = buildInvoiceHTML(invData);
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = (html2pdfModule as any).default || html2pdfModule;

            const element = document.createElement('div');
            element.style.position = 'fixed';
            element.style.left = '-9999px';
            element.style.top = '0';
            element.style.width = '210mm';
            element.innerHTML = html;
            document.body.appendChild(element);

            const prefix = invData.type === 'devis' ? 'Devis' : 'Facture';
            const opt = { 
                margin: 0, 
                filename: `${prefix}_${invData.invoiceNumber}.pdf`, 
                image: { type: 'jpeg' as const, quality: 0.98 }, 
                html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true }, 
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const } 
            };
            
            await html2pdf().set(opt).from(element).save();
            document.body.removeChild(element);
        } catch (e) {
            console.error('Error exporting to PDF', e);
        }
    };

    const downloadInvoiceHTMLFile = (invData: any) => {
        const html = buildInvoiceHTML(invData);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const prefix = invData.type === 'devis' ? 'Devis' : 'Facture';
        a.href = url; a.download = `${prefix}_${invData.invoiceNumber}.html`; a.click();
        URL.revokeObjectURL(url);
    };

    const printInvoice = (invData: any) => {
        const html = buildInvoiceHTML(invData);
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        w.document.write(html); w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    const [savedClients, setSavedClients] = useState<SavedClient[]>(() => {
        try { return JSON.parse(localStorage.getItem('inv_clients') || '[]'); } catch { return []; }
    });
    const [showClientPicker, setShowClientPicker] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ show: boolean, title: string, text: string, onConfirm: () => void } | null>(null);

    // Saved articles catalog — seed with Prestation Light if empty
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('inv_articles') || 'null');
            if (stored && stored.length > 0) return stored;
            // Default catalog
            const defaults: SavedArticle[] = [
                { id: 'default-1', description: 'Prestation Light', unitPrice: 0 },
            ];
            localStorage.setItem('inv_articles', JSON.stringify(defaults));
            return defaults;
        } catch { return []; }
    });
    const [showArticlePicker, setShowArticlePicker] = useState<string | null>(null); // line id
    const [newArticleDesc, setNewArticleDesc] = useState('');
    const [newArticlePrice, setNewArticlePrice] = useState<number>(0);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [ncName, setNcName] = useState('');
    const [ncAddress, setNcAddress] = useState('');
    const [ncCity, setNcCity] = useState('');
    const [ncEmail, setNcEmail] = useState('');

    const addNewClient = () => {
        if (!ncName.trim()) return;
        const nc = { id: Date.now().toString(), name: ncName, address: ncAddress, city: ncCity, email: ncEmail };
        const updated = [nc, ...savedClients];
        setSavedClients(updated);
        localStorage.setItem('inv_clients', JSON.stringify(updated));
        setNcName(''); setNcAddress(''); setNcCity(''); setNcEmail('');
    };

    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const total = Math.max(0, subtotal - discount);
    const formattedNumber = docType === 'facture'
        ? `INV-${new Date(date).getFullYear()}-${invoiceNumber.toString().padStart(3, '0')}`
        : `DEV-${new Date(date).getFullYear()}-${devisNumber.toString().padStart(3, '0')}`;

    useEffect(() => { localStorage.setItem('inv_number', invoiceNumber.toString()); }, [invoiceNumber]);
    useEffect(() => { localStorage.setItem('dev_number', devisNumber.toString()); }, [devisNumber]);
    useEffect(() => { localStorage.setItem('inv_iban', iban); localStorage.setItem('inv_bic', bic); }, [iban, bic]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            const res = await fetch('/api/invoices?t=' + Date.now(), {
                headers: { 
                    'X-Admin-Username': adminUser, 
                    'X-Admin-Password': adminPass,
                    'X-Session-ID': sessionId
                }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
                
                // Auto-update next invoice and devis numbers based on history
                if (data && data.length > 0) {
                    const invoiceRecords = data.filter((inv: any) => !inv.type || inv.type === 'facture');
                    const devisRecords = data.filter((inv: any) => inv.type === 'devis');

                    if (invoiceRecords.length > 0) {
                        const numbers = invoiceRecords.map((inv: any) => {
                            const parts = (inv.number || '').split('-');
                            return parseInt(parts[parts.length - 1]) || 0;
                        });
                        const maxNum = Math.max(...numbers);
                        if (maxNum >= invoiceNumber) {
                            setInvoiceNumber(maxNum + 1);
                        }
                    }

                    if (devisRecords.length > 0) {
                        const devNumbers = devisRecords.map((dev: any) => {
                            const parts = (dev.number || '').split('-');
                            return parseInt(parts[parts.length - 1]) || 0;
                        });
                        const maxDevNum = Math.max(...devNumbers);
                        if (maxDevNum >= devisNumber) {
                            setDevisNumber(maxDevNum + 1);
                        }
                    }
                }
            }
        } catch { } finally { setIsLoadingHistory(false); }
    };
    useEffect(() => { 
        fetchHistory(); 
    }, []);

    const saveSenderSettings = () => {
        setSender(senderDraft);
        localStorage.setItem('inv_sender', JSON.stringify(senderDraft));
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2500);
    };

    const addLine = () => setLines(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]);
    const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));
    const updateLine = (id: string, field: keyof InvoiceLine, value: string | number) =>
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

    const saveClient = () => {
        if (!clientName.trim()) return;
        const nc: SavedClient = { id: Date.now().toString(), name: clientName, address: clientAddress, email: clientEmail, city: clientCity } as any;
        const updated = [nc, ...savedClients.filter(c => c.name !== clientName)];
        setSavedClients(updated);
        localStorage.setItem('inv_clients', JSON.stringify(updated));
    };
    const loadClient = (c: any) => { setClientName(c.name); setClientAddress(c.address); setClientEmail(c.email); setClientCity(c.city || ''); setShowClientPicker(false); };
    const deleteClient = (id: string) => { const u = savedClients.filter(c => c.id !== id); setSavedClients(u); localStorage.setItem('inv_clients', JSON.stringify(u)); };

    const saveArticle = () => {
        if (!newArticleDesc.trim()) return;
        const na: SavedArticle = { id: Date.now().toString(), description: newArticleDesc, unitPrice: newArticlePrice };
        const updated = [na, ...savedArticles];
        setSavedArticles(updated);
        localStorage.setItem('inv_articles', JSON.stringify(updated));
        setNewArticleDesc('');
        setNewArticlePrice(0);
    };
    const deleteArticle = (id: string) => { const u = savedArticles.filter(a => a.id !== id); setSavedArticles(u); localStorage.setItem('inv_articles', JSON.stringify(u)); };
    const pickArticle = (lineId: string, article: SavedArticle) => {
        updateLine(lineId, 'description', article.description);
        updateLine(lineId, 'unitPrice', article.unitPrice);
        setShowArticlePicker(null);
    };
    const saveLineAsArticle = (line: InvoiceLine) => {
        if (!line.description.trim()) return;
        const na: SavedArticle = { id: Date.now().toString(), description: line.description, unitPrice: line.unitPrice };
        const updated = [na, ...savedArticles.filter(a => a.description !== na.description)];
        setSavedArticles(updated);
        localStorage.setItem('inv_articles', JSON.stringify(updated));
    };

    const getInvoiceData = () => ({ 
        invoiceNumber: formattedNumber, 
        date, 
        dueDate, 
        clientName, 
        clientAddress, 
        clientEmail, 
        clientCity,
        lines, 
        iban, 
        bic, 
        subtotal,
        discount,
        total, 
        notes, 
        sender,
        type: docType,
        status: docType === 'devis' ? 'pending' : undefined
    });

    const handlePrint = () => {
        const html = buildInvoiceHTML(getInvoiceData());
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) {
            setConfirmModal({
                show: true,
                title: 'Pop-ups Bloqués',
                text: 'Veuillez autoriser les pop-ups pour générer et imprimer la facture.',
                onConfirm: () => setConfirmModal(null)
            });
            return;
        }
        w.document.write(html); w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    const handleDownload = () => {
        const html = buildInvoiceHTML(getInvoiceData());
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const prefix = docType === 'devis' ? 'Devis' : 'Facture';
        a.href = url; a.download = `${prefix}_${formattedNumber}.html`; a.click();
        URL.revokeObjectURL(url);
    };

    const openEmail = () => {
        setEmailTo(clientEmail);
        if (docType === 'devis') {
            setEmailSubject(`Devis ${formattedNumber} – ${sender.name}`);
            setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre devis N° ${formattedNumber} d'un montant de ${total.toFixed(2)} €.\n\nCordialement,\n${sender.name}`);
        } else {
            setEmailSubject(`Facture ${formattedNumber} – ${sender.name}`);
            setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre facture N° ${formattedNumber} d'un montant de ${total.toFixed(2)} €.\n\nCordialement,\n${sender.name}`);
        }
        setSendStatus('idle'); setSendError(''); setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!emailTo) { setSendError('Veuillez saisir un email destinataire.'); return; }
        setSendStatus('sending'); setSendError('');
        try {
            const html = buildInvoiceHTML(getInvoiceData());
            
            // Generate PDF on frontend
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = (html2pdfModule as any).default || html2pdfModule;

            const element = document.createElement('div');
            element.style.position = 'fixed';
            element.style.left = '-9999px';
            element.style.top = '0';
            element.style.width = '210mm'; // Standard A4 width
            element.innerHTML = html;
            document.body.appendChild(element);

            const prefix = docType === 'devis' ? 'Devis' : 'Facture';
            const opt = { 
                margin: 0, 
                filename: `${prefix}_${formattedNumber}.pdf`, 
                image: { type: 'jpeg' as const, quality: 0.98 }, 
                html2canvas: { scale: 2, useCORS: true, logging: false, letterRendering: true }, 
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const } 
            };
            
            const pdfDataUri = await html2pdf().set(opt).from(element).outputPdf('datauristring');
            document.body.removeChild(element);

            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            const res = await fetch('/api/facture/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Username': adminUser, 'X-Admin-Password': adminPass, 'X-Session-ID': sessionId },
                body: JSON.stringify({ 
                    to: emailTo, 
                    subject: emailSubject, 
                    message: emailMessage, 
                    pdfBase64: pdfDataUri, 
                    filename: `${prefix}_${formattedNumber}.pdf`, 
                    invoiceData: getInvoiceData()
                })
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erreur serveur'); }
            setSendStatus('success');
            fetchHistory();
            if (docType === 'devis') {
                setDevisNumber(n => n + 1);
            } else {
                setInvoiceNumber(n => n + 1);
            }
            setTimeout(() => { setSendStatus('idle'); setShowEmailModal(false); }, 3000);
        } catch (e: any) { setSendStatus('error'); setSendError(e.message); }
    };

    const handleSaveOnly = async () => {
        try {
            setSendStatus('sending');
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            
            const res = await fetch('/api/facture/send', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Admin-Username': adminUser, 
                    'X-Admin-Password': adminPass, 
                    'X-Session-ID': sessionId 
                },
                body: JSON.stringify({ 
                    to: clientEmail || 'Archive Locale', 
                    skipEmail: true,
                    invoiceData: getInvoiceData()
                })
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erreur serveur'); }
            setSendStatus('success');
            fetchHistory();
            if (docType === 'devis') {
                setDevisNumber(n => n + 1);
            } else {
                setInvoiceNumber(n => n + 1);
            }
            setTimeout(() => { setSendStatus('idle'); }, 3000);
        } catch (e: any) { setSendStatus('error'); setSendError(e.message); }
    };

    const togglePaid = async (id: number, paid: boolean) => {
        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            await fetch('/api/invoices/update', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Admin-Username': adminUser, 
                    'X-Admin-Password': adminPass,
                    'X-Session-ID': sessionId
                }, 
                body: JSON.stringify({ id, paid: !paid }) 
            });
            setHistory(prev => prev.map(inv => inv.id === id ? { ...inv, paid: !paid } : inv));
        } catch { }
    };

    const updateDevisStatus = async (id: number, status: 'pending' | 'accepted' | 'declined' | 'invoiced') => {
        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            await fetch('/api/invoices/update', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Admin-Username': adminUser, 
                    'X-Admin-Password': adminPass,
                    'X-Session-ID': sessionId
                }, 
                body: JSON.stringify({ id, status }) 
            });
            setHistory(prev => prev.map(dev => dev.id === id ? { ...dev, status } : dev));
        } catch { }
    };

    const convertDevisToInvoice = async (dev: any) => {
        setClientName(dev.client || '');
        setClientAddress(dev.clientAddress || '');
        setClientCity(dev.clientCity || '');
        setClientEmail(dev.clientEmail || '');
        setNotes(dev.notes || '');
        if (dev.lines && dev.lines.length > 0) {
            setLines(dev.lines);
        } else {
            setLines([{ id: '1', description: dev.description || 'Prestation de service', quantity: 1, unitPrice: dev.total }]);
        }
        setIban(dev.iban || iban);
        setBic(dev.bic || bic);
        setDueDate(dev.dueDate || '');
        setDate(new Date().toISOString().split('T')[0]);

        setDocType('facture');
        setView('edit');

        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            await fetch('/api/invoices/update', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'X-Admin-Username': adminUser, 
                    'X-Admin-Password': adminPass,
                    'X-Session-ID': sessionId
                }, 
                body: JSON.stringify({ id: dev.id, status: 'invoiced' }) 
            });
            fetchHistory();
        } catch (e) {
            console.error('Failed to update devis status', e);
        }
    };

    const deleteInvoice = async (id: number) => {
        setConfirmModal({
            show: true,
            title: 'Suppression Fichier',
            text: 'Voulez-vous vraiment supprimer cet élément de l\'archive ? Cette action est irréversible.',
            onConfirm: async () => {
                try {
                    const adminUser = localStorage.getItem('admin_user') || '';
                    const adminPass = localStorage.getItem('admin_password') || '';
                    const sessionId = localStorage.getItem('admin_session_id') || '';
                    const res = await fetch('/api/invoices/delete', { 
                        method: 'POST', 
                        headers: { 
                            'Content-Type': 'application/json', 
                            'X-Admin-Username': adminUser, 
                            'X-Admin-Password': adminPass,
                            'X-Session-ID': sessionId
                        }, 
                        body: JSON.stringify({ id }) 
                    });
                    if (res.ok) fetchHistory();
                } catch { }
                setConfirmModal(null);
            }
        });
    };

    const visibleTabs = [
        { key: 'edit', icon: <Plus className="w-3 h-3" />, label: 'Nouvelle' },
        ...(isAlex ? [{ key: 'planning' as const, icon: <CalendarIcon className="w-3 h-3 text-emerald-400" />, label: 'Planning Alex' }] : []),
        { key: 'archive', icon: <History className="w-3 h-3" />, label: 'Archives' },
        { key: 'clients', icon: <User className="w-3 h-3" />, label: 'Clients' },
        { key: 'settings', icon: <Settings className="w-3 h-3" />, label: 'Paramètres' },
    ];

    return (
        <div className="w-full bg-[#0d0f1a] text-white flex flex-col" style={{ minHeight: '100dvh' }}>

            {/* HEADER DESKTOP ONLY */}
            <div className="hidden md:flex shrink-0 px-8 py-5 items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-white">Générateur de Factures & Devis</h1>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{sender.name} • {sender.siret}</p>
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl ml-4">
                        {visibleTabs.map(t => (
                            <button key={t.key} onClick={() => { setView(t.key as any); if (t.key === 'archive') fetchHistory(); if (t.key === 'settings') setSenderDraft(sender); }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}>
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleSaveOnly} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400/80 flex items-center gap-2 transition-all">
                        <Save className="w-4 h-4" /> Enregistrer ({docType === 'devis' ? 'Devis' : 'Archives'})
                    </button>
                    <button onClick={handleDownload} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-2 transition-all">
                        <Download className="w-4 h-4" /> Télécharger HTML
                    </button>
                    <button onClick={() => downloadInvoicePDF(getInvoiceData())} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                        <Download className="w-4 h-4" /> Télécharger PDF
                    </button>
                    <button onClick={handlePrint} className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-2 transition-all">
                        <Printer className="w-4 h-4" /> Imprimer / PDF
                    </button>
                    <button onClick={openEmail} className="px-6 py-3 bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-800 transition-all">
                        <Send className="w-4 h-4" /> Envoyer par mail
                    </button>
                </div>
            </div>

            {/* MOBILE HEADER: just sender name + ref */}
            <div className="flex md:hidden shrink-0 px-4 py-3 items-center justify-between border-b border-white/5 bg-black/60">
                <div>
                    <p className="text-xs font-black text-white uppercase">{sender.name}</p>
                    <p className="text-[10px] text-indigo-400 font-mono">{formattedNumber} • {total.toFixed(2)} €</p>
                </div>
                <button onClick={openEmail} className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
                    <Send className="w-3.5 h-3.5" /> Envoyer
                </button>
            </div>
            {/* MOBILE BOTTOM TAB BAR */}
            <div className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden border-t border-white/10 bg-[#0d0f1a]/95 backdrop-blur-xl">
                {visibleTabs.map(t => (
                    <button key={t.key}
                        onClick={() => { setView(t.key as any); if (t.key === 'archive') fetchHistory(); if (t.key === 'settings') setSenderDraft(sender); }}
                        className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-black uppercase tracking-widest transition-all ${view === t.key ? 'text-indigo-400' : 'text-white/30'}`}>
                        <span className={`p-2 rounded-xl transition-all ${view === t.key ? 'bg-indigo-500/20' : ''}`}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
                <button onClick={() => downloadInvoicePDF(getInvoiceData())} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                    <span className="p-2 rounded-xl bg-indigo-500/10"><Download className="w-3 h-3" /></span>
                    PDF
                </button>
                <button onClick={handlePrint} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-black uppercase tracking-widest text-white/30">
                    <span className="p-2 rounded-xl"><Printer className="w-3 h-3" /></span>
                    Imprimer
                </button>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto pb-28 md:pb-8">
                <AnimatePresence mode="wait">

                    {view === 'edit' && (
                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-8 items-start">

                            {/* LEFT: FORM (8 columns) */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* Invoice meta */}
                                <div className={cardCls + " space-y-4"}>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Numéro & Date</h3>
                                        <div className="flex items-center gap-1 p-0.5 bg-white/5 border border-white/10 rounded-xl">
                                            <button type="button" onClick={() => setDocType('facture')}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${docType === 'facture' ? 'bg-indigo-600 text-white' : 'text-white/30 hover:text-white/60'}`}>
                                                Facture
                                            </button>
                                            <button type="button" onClick={() => setDocType('devis')}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${docType === 'devis' ? 'bg-indigo-600 text-white' : 'text-white/30 hover:text-white/60'}`}>
                                                Devis
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelCls}>{docType === 'facture' ? 'N° Facture' : 'N° Devis'}</label>
                                                {docType === 'facture' ? (
                                                    <input type="number" value={invoiceNumber} onChange={e => setInvoiceNumber(parseInt(e.target.value) || 1)}
                                                        className={inputCls + " font-black text-lg"} />
                                                ) : (
                                                    <input type="number" value={devisNumber} onChange={e => setDevisNumber(parseInt(e.target.value) || 1)}
                                                        className={inputCls + " font-black text-lg"} />
                                                )}
                                            </div>
                                            <div>
                                                <label className={labelCls}>Date</label>
                                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Échéance (optionnel)</label>
                                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="bg-indigo-500/10 rounded-xl px-4 py-2 flex items-center justify-between">
                                        <p className="text-[10px] text-indigo-300 font-mono">Réf : <span className="text-indigo-200 font-black">{formattedNumber}</span></p>
                                        <div className="text-[10px] text-indigo-400/50 uppercase font-black">Année {new Date(date).getFullYear()}</div>
                                    </div>
                                </div>

                                {/* Client */}
                                <div className={cardCls + " space-y-4"}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Users className="w-4 h-4 text-indigo-400" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Destinataire</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={saveClient} className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1 transition-all">
                                                <Save className="w-3 h-3" /> SAUVEGARDER
                                            </button>
                                            {savedClients.length > 0 && (
                                                <button onClick={() => setShowClientPicker(true)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/50 flex items-center gap-1 transition-all">
                                                    <User className="w-3 h-3" /> CARNET ({savedClients.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-1">
                                            <label className={labelCls}>Nom / Société</label>
                                            <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Dropsiders" className={inputCls} />
                                        </div>
                                        <div className="md:col-span-1">
                                            <label className={labelCls}>Email</label>
                                            <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@exemple.com" className={inputCls} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={labelCls}>Adresse complète</label>
                                            <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="12 rue des Lilas..." className={inputCls + " h-20 resize-none"} />
                                        </div>
                                    </div>
                                </div>

                                {/* Lignes de Facturation */}
                                <div className={cardCls + " space-y-4"}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <Plus className="w-4 h-4 text-indigo-400" />
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Articles & Services</h3>
                                        </div>
                                        <button onClick={addLine} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                                            <Plus className="w-3 h-3" /> Ajouter une ligne
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {lines.map((line, i) => (
                                            <motion.div key={line.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                                className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-4 relative group">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex-1 space-y-3">
                                                        <div>
                                                            <label className={labelCls}>Description</label>
                                                            <div className="relative">
                                                                <input value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)}
                                                                    placeholder={`Prestation ${i + 1}`}
                                                                    className={inputCls + " pr-10"} />
                                                                <button onClick={() => setShowArticlePicker(showArticlePicker === line.id ? null : line.id)}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 transition-colors">
                                                                    <BookOpen className="w-4 h-4" />
                                                                </button>
                                                                {showArticlePicker === line.id && (
                                                                    <div className="absolute top-full left-0 mt-2 w-full bg-[#1e223a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                                                                        {savedArticles.map(a => (
                                                                            <button key={a.id} onClick={() => { pickArticle(line.id, a); setShowArticlePicker(null); }}
                                                                                className="w-full px-5 py-4 text-left hover:bg-white/5 flex justify-between items-center border-b border-white/5 last:border-0 transition-all">
                                                                                <span className="text-sm font-bold text-white">{a.description}</span>
                                                                                <span className="text-xs font-black text-indigo-400 ml-2 shrink-0">{a.unitPrice.toFixed(2)} €</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div>
                                                                <label className={labelCls}>Quantité</label>
                                                                <input type="number" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                    className={inputCls + " text-center"} />
                                                            </div>
                                                            <div>
                                                                <label className={labelCls}>Prix Unitaire (€)</label>
                                                                <input type="number" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                    className={inputCls + " text-right"} />
                                                            </div>
                                                            <div>
                                                                <label className={labelCls}>Total</label>
                                                                <div className="h-[46px] flex items-center justify-end px-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 font-black">
                                                                    {(line.quantity * line.unitPrice).toFixed(2)} €
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2 pt-6">
                                                        <button onClick={() => saveLineAsArticle(line)} title="Sauvegarder"
                                                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-indigo-400 transition-all">
                                                            <Save className="w-4 h-4" />
                                                        </button>
                                                        {lines.length > 1 && (
                                                            <button onClick={() => removeLine(line.id)}
                                                                className="p-2.5 bg-white/5 hover:bg-red-500/10 rounded-xl text-white/30 hover:text-red-500 transition-all">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    {/* Discount row */}
                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                        <div className="flex-1">
                                            <label className={labelCls}>Réduction (€)</label>
                                            <input type="number" min="0" step="0.01" value={discount || ''} placeholder="0.00"
                                                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                                className={inputCls} />
                                        </div>
                                        <div className="flex-1">
                                            <label className={labelCls}>Sous-total HT</label>
                                            <div className="h-[46px] flex items-center justify-end px-4 bg-white/5 border border-white/10 rounded-xl text-white/50 font-bold">
                                                {subtotal.toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: PREVIEW & TOTAL (4 columns, Sticky) */}
                            <div className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
                                {/* Total Card */}
                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                                    <div className="relative z-10">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total à régler</div>
                                        <div className="text-4xl font-black mb-1 flex items-baseline gap-2">
                                            {total.toFixed(2)}
                                            <span className="text-xl opacity-60">€</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="text-[11px] font-bold opacity-70 mt-1">
                                                Sous-total : {subtotal.toFixed(2)} € — Réduction : -{discount.toFixed(2)} €
                                            </div>
                                        )}
                                        <div className="h-px bg-white/10 my-4" />
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-relaxed">
                                            TVA non applicable<br/>Article 293 B du CGI
                                        </div>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                                </div>

                                {/* Quick Preview Box */}
                                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md">
                                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Aperçu interactif</h3>
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                                            <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                            <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-black/20 flex justify-center">
                                        {/* Scale down the A4 preview to fit sidebar */}
                                        <div className="bg-white shadow-2xl origin-top" style={{ width: '210mm', height: '297mm', transform: 'scale(0.25)', marginBottom: '-222mm' }}>
                                            <iframe srcDoc={buildInvoiceHTML(getInvoiceData())} title="Preview" className="w-full h-full border-0" style={{ pointerEvents: 'none' }} />
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-white/5 flex flex-col gap-3">
                                        <button onClick={() => downloadInvoicePDF(getInvoiceData())} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                                            <Download className="w-4 h-4" /> Télécharger PDF
                                        </button>
                                        <button onClick={handlePrint} className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                                            <Printer className="w-4 h-4" /> Imprimer / PDF
                                        </button>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={handleDownload} className="py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-all">
                                                <BookOpen className="w-3.5 h-3.5" /> HTML
                                            </button>
                                            <button onClick={openEmail} className="py-3 bg-indigo-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                                                <Send className="w-3.5 h-3.5" /> Email
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== PLANNING TAB ========== */}
                    {view === 'planning' && isAlex && (
                        <motion.div key="planning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <WorkPlanning
                                onConvertToInvoice={(planningLines, planningNotes) => {
                                    setLines(planningLines.map((l, i) => ({ ...l, id: `${Date.now()}-${i}` })));
                                    setNotes(planningNotes);
                                    setView('edit');
                                }}
                            />
                        </motion.div>
                    )}

                    {/* ========== ARCHIVE TAB ========== */}
                    {view === 'archive' && (
                        <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-6">
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white">Archives</h2>
                                    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
                                        <button onClick={() => setArchiveSubTab('factures')}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${archiveSubTab === 'factures' ? 'bg-indigo-600 text-white' : 'text-white/30 hover:text-white/60'}`}>
                                            Factures
                                        </button>
                                        <button onClick={() => setArchiveSubTab('devis')}
                                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${archiveSubTab === 'devis' ? 'bg-indigo-600 text-white' : 'text-white/30 hover:text-white/60'}`}>
                                            Devis
                                        </button>
                                    </div>
                                </div>
                                <button onClick={fetchHistory} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                                    <RefreshCw className={`w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center h-48"><Loader className="w-8 h-8 animate-spin text-indigo-400" /></div>
                            ) : (() => {
                                const invoices = history.filter(inv => !inv.type || inv.type === 'facture');
                                const devis = history.filter(inv => inv.type === 'devis');

                                if (archiveSubTab === 'factures') {
                                    const stats = invoices.reduce((acc, inv) => {
                                        const d = new Date(inv.date || inv.created_at || Date.now());
                                        const t = parseFloat(inv.total) || 0;
                                        acc.allTime += t;
                                        if (d.getFullYear() === new Date().getFullYear()) {
                                            acc.thisYear += t;
                                            if (d.getMonth() === new Date().getMonth()) acc.thisMonth += t;
                                        }
                                        return acc;
                                    }, { thisMonth: 0, thisYear: 0, allTime: 0 });

                                    return (
                                        <>
                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400/70 mb-1">Ce Mois</div>
                                                    <div className="text-xl font-black text-indigo-400">{stats.thisMonth.toFixed(2)} €</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cette Année</div>
                                                    <div className="text-xl font-black text-white">{stats.thisYear.toFixed(2)} €</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total CA</div>
                                                    <div className="text-xl font-black text-white">{stats.allTime.toFixed(2)} €</div>
                                                </div>
                                            </div>
                                            {invoices.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                                                    <Building2 className="w-12 h-12 mb-4" />
                                                    <p className="text-sm font-bold opacity-30">Aucune facture envoyée</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 pb-20">
                                                    {invoices.map((inv: any) => {
                                                        const shortNumber = inv.number ? inv.number.split('-').pop()?.replace(/^0+/, '') : inv.id;
                                                        return (
                                                            <div key={inv.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                                                                <div className="hidden lg:flex w-12 h-12 bg-indigo-500/10 rounded-xl items-center justify-center shrink-0 border border-indigo-500/20">
                                                                    <span className="text-sm font-black text-indigo-400">#{shortNumber}</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-black text-sm text-white truncate">{inv.client || 'Client inconnu'}</div>
                                                                    <div className="text-xs text-white/30">{inv.number} • {new Date(inv.date || inv.created_at).toLocaleDateString('fr-FR')}</div>
                                                                    {inv.emailTo && <div className="text-[10px] text-white/50 mt-1 truncate max-w-[250px]">{inv.emailTo}</div>}
                                                                </div>
                                                                <div className="text-left lg:text-right shrink-0">
                                                                    <div className="font-black text-lg text-indigo-400">{parseFloat(inv.total || 0).toFixed(2)} €</div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button onClick={() => setPreviewInvoice(reconstructInvoiceData(inv))}
                                                                        className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                                                                        <BookOpen className="w-3 h-3" /> Revoir / PDF
                                                                    </button>
                                                                    <button onClick={() => togglePaid(inv.id, inv.paid)}
                                                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${inv.paid ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 border border-white/10 text-white/30 hover:border-indigo-500/50'}`}>
                                                                        {inv.paid ? <><CheckCircle className="w-3 h-3" /> Payée</> : <><Clock className="w-3 h-3" /> En attente</>}
                                                                    </button>
                                                                    <button onClick={() => deleteInvoice(inv.id)} className="p-2 bg-white/5 border border-white/10 rounded-xl text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    );
                                } else {
                                    const stats = devis.reduce((acc, dev) => {
                                        const t = parseFloat(dev.total) || 0;
                                        acc.totalAmount += t;
                                        if (dev.status === 'accepted' || dev.status === 'invoiced') {
                                            acc.acceptedAmount += t;
                                        } else if (dev.status === 'declined') {
                                            acc.declinedAmount += t;
                                        } else {
                                            acc.pendingAmount += t;
                                        }
                                        return acc;
                                    }, { totalAmount: 0, acceptedAmount: 0, declinedAmount: 0, pendingAmount: 0 });

                                    return (
                                        <>
                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">En attente</div>
                                                    <div className="text-xl font-black text-amber-400">{stats.pendingAmount.toFixed(2)} €</div>
                                                </div>
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">Acceptés / Facturés</div>
                                                    <div className="text-xl font-black text-green-400">{stats.acceptedAmount.toFixed(2)} €</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Volume Total</div>
                                                    <div className="text-xl font-black text-white">{stats.totalAmount.toFixed(2)} €</div>
                                                </div>
                                            </div>
                                            {devis.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                                                    <Building2 className="w-12 h-12 mb-4" />
                                                    <p className="text-sm font-bold opacity-30">Aucun devis enregistré</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3 pb-20">
                                                    {devis.map((dev: any) => {
                                                        const shortNumber = dev.number ? dev.number.split('-').pop()?.replace(/^0+/, '') : dev.id;
                                                        const statusColors = {
                                                            pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                                                            accepted: 'bg-green-500/10 border-green-500/20 text-green-400',
                                                            declined: 'bg-red-500/10 border-red-500/20 text-red-400',
                                                            invoiced: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                        };
                                                        const status = dev.status || 'pending';

                                                        return (
                                                            <div key={dev.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                                                                <div className="hidden lg:flex w-12 h-12 bg-amber-500/10 rounded-xl items-center justify-center shrink-0 border border-amber-500/20">
                                                                    <span className="text-sm font-black text-amber-400">#{shortNumber}</span>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-black text-sm text-white truncate">{dev.client || 'Client inconnu'}</div>
                                                                    <div className="text-xs text-white/30">{dev.number} • {new Date(dev.date || dev.created_at).toLocaleDateString('fr-FR')}</div>
                                                                    {dev.emailTo && <div className="text-[10px] text-white/50 mt-1 truncate max-w-[250px]">{dev.emailTo}</div>}
                                                                </div>
                                                                <div className="text-left lg:text-right shrink-0">
                                                                    <div className="font-black text-lg text-amber-400">{parseFloat(dev.total || 0).toFixed(2)} €</div>
                                                                </div>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <button onClick={() => setPreviewInvoice(reconstructInvoiceData(dev))}
                                                                        className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                                                                        <BookOpen className="w-3 h-3" /> Revoir / PDF
                                                                    </button>
                                                                    
                                                                    <select
                                                                        value={status}
                                                                        onChange={(e) => updateDevisStatus(dev.id, e.target.value as any)}
                                                                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-[#16192c] transition-all cursor-pointer outline-none ${statusColors[status as keyof typeof statusColors] || ''}`}
                                                                    >
                                                                        <option value="pending">En attente</option>
                                                                        <option value="accepted">Accepté</option>
                                                                        <option value="declined">Refusé</option>
                                                                        <option value="invoiced">Facturé</option>
                                                                    </select>

                                                                    {status !== 'invoiced' && (
                                                                        <button 
                                                                            onClick={() => convertDevisToInvoice(dev)}
                                                                            className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                                                                        >
                                                                            <RefreshCw className="w-3 h-3" /> Facturer
                                                                        </button>
                                                                    )}

                                                                    <button onClick={() => deleteInvoice(dev.id)} className="p-2 bg-white/5 border border-white/10 rounded-xl text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    );
                                }
                            })()}
                        </motion.div>
                    )}

                    {/* ========== CLIENTS TAB ========== */}
                    {view === 'clients' && (
                        <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Add New Client */}
                            <div className={cardCls + " space-y-4"}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <Plus className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Nouveau Client</h3>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <label className={labelCls}>Nom / Société</label>
                                        <input value={ncName} onChange={e => setNcName(e.target.value)} placeholder="Dropsiders" className={inputCls} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Adresse</label>
                                        <input value={ncAddress} onChange={e => setNcAddress(e.target.value)} placeholder="1 rue du Festival" className={inputCls} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelCls}>Code Postal / Ville</label>
                                            <input value={ncCity} onChange={e => setNcCity(e.target.value)} placeholder="30000 Nîmes" className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Email</label>
                                            <input value={ncEmail} onChange={e => setNcEmail(e.target.value)} placeholder="contact@client.com" className={inputCls} />
                                        </div>
                                    </div>
                                    <button onClick={addNewClient} className="w-full py-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all mt-4 border border-indigo-500/30">
                                        <Save className="w-4 h-4" /> Enregistrer le client
                                    </button>
                                </div>
                            </div>

                            {/* Clients List */}
                            <div className={cardCls + " space-y-4"}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <User className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Carnet d'Adresses ({savedClients.length})</h3>
                                    </div>
                                </div>
                                
                                {savedClients.length === 0 ? (
                                    <div className="flex flex-col items-center py-16 text-white/10 border border-dashed border-white/5 rounded-2xl">
                                        <User className="w-12 h-12 mb-4 opacity-5" />
                                        <p className="text-xs font-bold uppercase tracking-tight">Aucun client enregistré</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {savedClients.map(c => (
                                            <div key={c.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-white truncate">{c.name}</div>
                                                    <div className="text-[10px] text-white/30 flex items-center gap-2 mt-0.5">
                                                        <span className="truncate">{c.city}</span>
                                                        {c.email && <span>• {c.email}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button onClick={() => { loadClient(c); setView('edit'); }} 
                                                        className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">
                                                        Utiliser
                                                    </button>
                                                    <button onClick={() => deleteClient(c.id)} className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ========== SETTINGS TAB ========== */}
                    {view === 'settings' && (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Sender info */}
                            <div className={cardCls + " space-y-4"}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Informations Émetteur</h3>
                                    <button onClick={saveSenderSettings}
                                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${settingsSaved ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-indigo-700 text-white hover:bg-indigo-800'}`}>
                                        {settingsSaved ? <><CheckCircle className="w-3 h-3" /> Enregistré !</> : <><Save className="w-3 h-3" /> Enregistrer</>}
                                    </button>
                                </div>
                                {[
                                    { label: 'Nom / Raison sociale', key: 'name', placeholder: 'CUENCA ALEXANDRE' },
                                    { label: 'SIRET', key: 'siret', placeholder: '805 131 828 00010' },
                                    { label: 'Adresse complète', key: 'address', placeholder: '411 Rue de Bouillargue, 30000 Nîmes' },
                                    { label: 'Email professionnel', key: 'email', placeholder: 'alexlight3034@icloud.com' },
                                    { label: 'Téléphone', key: 'phone', placeholder: '07 62 05 45 89' },
                                    { label: 'Mention légale TVA', key: 'legal', placeholder: 'Auto-entrepreneur – TVA non applicable, art. 293 B du CGI' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className={labelCls}>{f.label}</label>
                                        <input value={(senderDraft as any)[f.key]}
                                            onChange={e => setSenderDraft(d => ({ ...d, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder} className={inputCls} />
                                    </div>
                                ))}
                                
                                {/* Coordonnées Bancaires */}
                                <div className="pt-6 border-t border-white/5 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Coordonnées Bancaires</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>IBAN</label>
                                            <input value={iban} onChange={e => setIban(e.target.value)} placeholder="FR76 0000..." className={inputCls + " font-mono"} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>BIC / SWIFT</label>
                                            <input value={bic} onChange={e => setBic(e.target.value)} placeholder="REVOFR22..." className={inputCls + " font-mono"} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mt-2">
                                    <p className="text-[10px] text-indigo-400 font-bold">Ces informations apparaîtront sur toutes vos factures générées.</p>
                                </div>
                            </div>

                            {/* Articles catalog */}
                            <div className={cardCls + " space-y-4"}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Catalogue d'Articles</h3>
                                <p className="text-xs text-gray-400">Sauvegardez vos prestations récurrentes pour les retrouver rapidement lors de la création d'une facture.</p>

                                {/* Add new article */}
                                <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Nouvel article</p>
                                    <input value={newArticleDesc} onChange={e => setNewArticleDesc(e.target.value)}
                                        placeholder="Description (ex: Mix DJ 4h)" className={inputCls} />
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <input type="number" value={newArticlePrice} onChange={e => setNewArticlePrice(parseFloat(e.target.value) || 0)}
                                                placeholder="Prix unitaire (€)" className={inputCls} />
                                        </div>
                                        <button onClick={saveArticle} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shrink-0 border border-indigo-500/30">
                                            <Plus className="w-4 h-4" /> Ajouter
                                        </button>
                                    </div>
                                </div>

                                {/* Articles list */}
                                {savedArticles.length === 0 ? (
                                    <div className="flex flex-col items-center py-8 text-gray-300">
                                        <BookOpen className="w-10 h-10 mb-2" />
                                        <p className="text-sm font-bold">Aucun article sauvegardé</p>
                                        <p className="text-xs mt-1">Ajoutez des articles ci-dessus ou cliquez sur 💾 dans une ligne de facture</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                        {savedArticles.map(a => (
                                            <div key={a.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                                <div className="flex-1">
                                                    <div className="text-sm font-bold text-white">{a.description}</div>
                                                    <div className="text-[10px] text-indigo-400 font-black uppercase tracking-wider mt-0.5">{a.unitPrice.toFixed(2)} €</div>
                                                </div>
                                                <button onClick={() => deleteArticle(a.id)} className="p-2 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* CLIENT PICKER MODAL */}
            <AnimatePresence>
                {showClientPicker && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md bg-[#16192c] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
                            
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-white">Clients</h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Sélectionner un destinataire</p>
                                </div>
                                <button onClick={() => setShowClientPicker(false)} className="p-2 hover:bg-white/5 rounded-2xl transition-all">
                                    <X className="w-5 h-5 text-white/30" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {savedClients.map(c => (
                                    <div key={c.id} className="group relative">
                                        <button onClick={() => { loadClient(c); setShowClientPicker(false); }} 
                                            className="w-full flex items-center gap-4 p-5 bg-white/[0.03] border border-white/5 rounded-3xl hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-left">
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                                                <User className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-black text-sm text-white">{c.name}</div>
                                                <div className="text-[10px] text-white/30 truncate mt-0.5 uppercase tracking-wide">{c.email || c.city}</div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-indigo-400 transition-all" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {savedClients.length === 0 && (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-8 h-8 text-white/10" />
                                    </div>
                                    <p className="text-sm font-bold text-white/30 uppercase tracking-widest">Aucun client trouvé</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-lg bg-[#16192c] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
                            
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-white">Envoi Email</h3>
                                    <p className="text-[10px] text-indigo-400 mt-1 font-bold uppercase tracking-[0.2em]">{formattedNumber} • {total.toFixed(2)} €</p>
                                </div>
                                <button onClick={() => setShowEmailModal(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-white/30" />
                                </button>
                            </div>

                            {sendStatus === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-6 bg-green-500/5 border border-green-500/10 rounded-3xl">
                                    <div className="w-20 h-20 bg-green-500/20 border border-green-500/20 rounded-[2rem] flex items-center justify-center animate-pulse">
                                        <CheckCircle className="w-10 h-10 text-green-400" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-green-400 font-black text-xl uppercase tracking-widest">Facture envoyée !</p>
                                        <p className="text-green-400/50 text-[10px] uppercase font-bold mt-2">Le destinataire va la recevoir d'ici peu</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        {[
                                            { label: 'Destinataire', value: emailTo, setter: setEmailTo, type: 'email', placeholder: 'client@example.com' },
                                            { label: 'Objet de l\'email', value: emailSubject, setter: setEmailSubject, type: 'text' },
                                        ].map(f => (
                                            <div key={f.label}>
                                                <label className={labelCls}>{f.label}</label>
                                                <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} 
                                                    placeholder={f.placeholder} className={inputCls} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Message personnalisé</label>
                                        <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={5}
                                            className={inputCls + " resize-none py-4"} />
                                    </div>
                                    
                                    {sendError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                                            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest">{sendError}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => setShowEmailModal(false)} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/10 hover:text-white/60 transition-all">
                                            Annuler
                                        </button>
                                        <button onClick={handleSendEmail} disabled={sendStatus === 'sending'}
                                            className="flex-2 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50 border border-indigo-500/30">
                                            {sendStatus === 'sending' ? <><Loader className="w-5 h-5 animate-spin" /> Envoi en cours...</> : <><Mail className="w-5 h-5" /> Envoyer la facture</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ======= CUSTOM CONFIRM MODAL ======= */}
            <AnimatePresence>
                {confirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0d0f1a] border border-white/10 rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full relative z-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="relative z-10 space-y-6">
                                <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto mb-2">
                                    <Trash2 className="w-10 h-10 text-indigo-400" />
                                </div>
                                
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                        {confirmModal.title.toUpperCase()}
                                    </h3>
                                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                        {confirmModal.text}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => setConfirmModal(null)}
                                        className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        className="px-6 py-4 bg-red-600 hover:bg-red-700 shadow-[0_10px_30px_rgba(220,38,38,0.3)] rounded-2xl text-[11px] font-black text-white uppercase tracking-widest transition-all transform active:scale-95"
                                    >
                                        Confirmer
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ======= ARCHIVE PREVIEW MODAL ======= */}
            <AnimatePresence>
                {previewInvoice && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewInvoice(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0d0f1a] border border-white/10 rounded-[2.5rem] p-8 max-w-5xl w-full h-[85vh] relative z-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none" />

                            {/* Header */}
                            <div className="flex items-center justify-between pb-6 border-b border-white/5 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-display font-black text-white uppercase italic tracking-tighter">
                                        Aperçu {previewInvoice.type === 'devis' ? 'Devis' : 'Facture'}
                                    </h3>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">
                                        N° {previewInvoice.invoiceNumber} — {previewInvoice.clientName}
                                    </p>
                                </div>
                                <button onClick={() => setPreviewInvoice(null)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                                    <X className="w-6 h-6 text-white/30" />
                                </button>
                            </div>

                            {/* Content split */}
                            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 py-6 relative z-10">
                                {/* Left pane: PDF/HTML interactive preview */}
                                <div className="lg:col-span-8 bg-black/20 rounded-2xl p-4 flex justify-center items-start overflow-y-auto">
                                    <div className="bg-white shadow-2xl origin-top" style={{ width: '210mm', height: '297mm', transform: 'scale(0.70)', marginBottom: '-89mm' }}>
                                        <iframe srcDoc={buildInvoiceHTML(previewInvoice)} title="Archive Preview" className="w-full h-full border-0" />
                                    </div>
                                </div>

                                {/* Right pane: Details & Actions */}
                                <div className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
                                    <div className="space-y-4 font-sans">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
                                            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Informations</div>
                                            <div className="text-sm font-bold text-white truncate">{previewInvoice.clientName}</div>
                                            <div className="text-xs text-white/50">{previewInvoice.clientEmail}</div>
                                            {previewInvoice.clientAddress && <div className="text-xs text-white/30 whitespace-pre-wrap">{previewInvoice.clientAddress}</div>}
                                            <div className="h-px bg-white/5 my-2" />
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-white/40">Date:</span>
                                                <span className="font-bold text-white">{new Date(previewInvoice.date).toLocaleDateString('fr-FR')}</span>
                                            </div>
                                            {previewInvoice.dueDate && (
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-white/40">Échéance:</span>
                                                    <span className="font-bold text-amber-400">{new Date(previewInvoice.dueDate).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-5 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest font-sans">Total</span>
                                            <span className="text-2xl font-black text-indigo-400 font-sans">{previewInvoice.total.toFixed(2)} €</span>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="space-y-3 font-sans">
                                        <button 
                                            onClick={() => downloadInvoicePDF(previewInvoice)}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 border border-indigo-500/20"
                                        >
                                            <Download className="w-4 h-4" /> Télécharger PDF
                                        </button>
                                        <button 
                                            onClick={() => printInvoice(previewInvoice)}
                                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Printer className="w-4 h-4" /> Imprimer / PDF
                                        </button>
                                        <button 
                                            onClick={() => downloadInvoiceHTMLFile(previewInvoice)}
                                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white/60 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                        >
                                            <BookOpen className="w-4 h-4" /> Télécharger HTML
                                        </button>
                                        {previewInvoice.pdfUrl && (
                                            <a 
                                                href={previewInvoice.pdfUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-3.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-2xl text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Download className="w-4 h-4" /> Ouvrir l'original (R2)
                                            </a>
                                        )}
                                        <button 
                                            onClick={() => setPreviewInvoice(null)}
                                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 hover:text-white/60 uppercase tracking-widest transition-all"
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
