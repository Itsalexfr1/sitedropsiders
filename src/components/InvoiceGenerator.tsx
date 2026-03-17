import { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Loader, X, Mail, Save, History, CheckCircle, Clock, Download, Printer, ChevronRight, Building2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    email: string;
}

const SENDER = {
    name: 'CUENCA ALEXANDRE',
    siret: '805 131 828 00010',
    address: '123 Rue de la Musique, 75001 Paris',
    email: 'contact@dropsiders.fr',
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
    notes: string;
}) {
    const rows = data.lines.map(l => `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a">${l.description}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;text-align:center">${l.quantity}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;text-align:right">${l.unitPrice.toFixed(2)} €</td>
            <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${(l.quantity * l.unitPrice).toFixed(2)} €</td>
        </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Facture ${data.invoiceNumber}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: 210mm; min-height: 297mm; padding: 20mm; background: #fff; margin: 0 auto; }
    @media print { body { margin: 0; } .page { padding: 15mm; width: 100%; } @page { margin: 0; size: A4; } }
</style>
</head>
<body>
<div class="page">

    <!-- HEADER -->
    <table style="width:100%;margin-bottom:40px">
        <tr>
            <td style="vertical-align:top">
                <div style="width:56px;height:56px;background:#000;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:16px">
                    <span style="color:#fff;font-weight:900;font-size:20px;letter-spacing:-1px">CA</span>
                </div>
                <div style="font-size:22px;font-weight:900;color:#000;letter-spacing:-1px;text-transform:uppercase">${SENDER.name}</div>
                <div style="font-size:11px;color:#666;margin-top:4px">SIRET : ${SENDER.siret}</div>
                <div style="font-size:11px;color:#666;margin-top:2px">${SENDER.address}</div>
                <div style="font-size:11px;color:#666;margin-top:2px">${SENDER.email}</div>
                <div style="font-size:11px;color:#666;margin-top:2px">${SENDER.phone}</div>
            </td>
            <td style="vertical-align:top;text-align:right">
                <div style="font-size:36px;font-weight:900;color:#000;letter-spacing:-2px;text-transform:uppercase">FACTURE</div>
                <div style="font-size:13px;color:#666;margin-top:6px">N° <strong style="color:#000">${data.invoiceNumber}</strong></div>
                <div style="font-size:13px;color:#666;margin-top:4px">Date : <strong style="color:#000">${new Date(data.date).toLocaleDateString('fr-FR')}</strong></div>
                ${data.dueDate ? `<div style="font-size:13px;color:#e00;margin-top:4px">Échéance : <strong>${new Date(data.dueDate).toLocaleDateString('fr-FR')}</strong></div>` : ''}
            </td>
        </tr>
    </table>

    <!-- SEPARATOR -->
    <div style="height:2px;background:#000;margin-bottom:32px"></div>

    <!-- CLIENT -->
    <table style="width:100%;margin-bottom:40px">
        <tr>
            <td style="width:50%">
                <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px">Facturé à</div>
                <div style="font-size:15px;font-weight:700;color:#000">${data.clientName || '—'}</div>
                <div style="font-size:12px;color:#666;margin-top:4px;white-space:pre-line">${data.clientAddress || ''}</div>
                ${data.clientEmail ? `<div style="font-size:12px;color:#666;margin-top:4px">${data.clientEmail}</div>` : ''}
            </td>
        </tr>
    </table>

    <!-- LINES TABLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:32px">
        <thead>
            <tr style="background:#000">
                <th style="padding:12px 16px;text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Description</th>
                <th style="padding:12px 16px;text-align:center;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Qté</th>
                <th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">P.U. HT</th>
                <th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Total HT</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>

    <!-- TOTAL -->
    <table style="width:100%;margin-bottom:48px">
        <tr>
            <td style="width:60%">
                ${data.notes ? `<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:6px">Notes</div><div style="font-size:12px;color:#444;line-height:1.6">${data.notes}</div>` : ''}
            </td>
            <td style="width:40%;vertical-align:bottom">
                <table style="width:100%">
                    <tr>
                        <td style="padding:8px 0;font-size:12px;color:#666;border-top:1px solid #f0f0f0">Sous-total HT</td>
                        <td style="padding:8px 0;font-size:12px;color:#000;font-weight:700;text-align:right;border-top:1px solid #f0f0f0">${data.total.toFixed(2)} €</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;font-size:11px;color:#999">TVA</td>
                        <td style="padding:8px 0;font-size:11px;color:#999;text-align:right">Non applicable</td>
                    </tr>
                    <tr style="background:#000">
                        <td style="padding:14px 16px;font-size:13px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:0.05em">TOTAL TTC</td>
                        <td style="padding:14px 16px;font-size:18px;font-weight:900;color:#fff;text-align:right">${data.total.toFixed(2)} €</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- BANK -->
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

    <!-- FOOTER -->
    <div style="border-top:1px solid #eee;padding-top:16px">
        <div style="font-size:10px;color:#aaa;line-height:1.6">${SENDER.legal}</div>
    </div>

</div>
</body>
</html>`;
}

export function InvoiceGenerator() {
    const [invoiceNumber, setInvoiceNumber] = useState<number>(() => {
        const saved = localStorage.getItem('inv_number');
        return saved ? parseInt(saved) : 67;
    });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [iban, setIban] = useState(() => localStorage.getItem('inv_iban') || 'BE59 9675 0891 6526');
    const [bic, setBic] = useState(() => localStorage.getItem('inv_bic') || 'TRWIBEB1XXX');
    const [notes, setNotes] = useState('');
    const [lines, setLines] = useState<InvoiceLine[]>([
        { id: '1', description: 'Prestation de service', quantity: 1, unitPrice: 0 }
    ]);

    const [view, setView] = useState<'edit' | 'archive'>('edit');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [sendError, setSendError] = useState('');

    const [savedClients, setSavedClients] = useState<SavedClient[]>(() => {
        try { return JSON.parse(localStorage.getItem('inv_clients') || '[]'); } catch { return []; }
    });
    const [showClientPicker, setShowClientPicker] = useState(false);

    const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const formattedNumber = `INV-${new Date(date).getFullYear()}-${invoiceNumber.toString().padStart(3, '0')}`;

    useEffect(() => {
        localStorage.setItem('inv_number', invoiceNumber.toString());
    }, [invoiceNumber]);

    useEffect(() => {
        localStorage.setItem('inv_iban', iban);
        localStorage.setItem('inv_bic', bic);
    }, [iban, bic]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/invoices');
            if (res.ok) setHistory(await res.json());
        } catch { } finally { setIsLoadingHistory(false); }
    };

    useEffect(() => { fetchHistory(); }, []);

    const addLine = () => setLines(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]);
    const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));
    const updateLine = (id: string, field: keyof InvoiceLine, value: string | number) =>
        setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

    const saveClient = () => {
        if (!clientName.trim()) return;
        const nc: SavedClient = { id: Date.now().toString(), name: clientName, address: clientAddress, email: clientEmail };
        const updated = [nc, ...savedClients.filter(c => c.name !== clientName)];
        setSavedClients(updated);
        localStorage.setItem('inv_clients', JSON.stringify(updated));
    };

    const loadClient = (c: SavedClient) => {
        setClientName(c.name); setClientAddress(c.address); setClientEmail(c.email);
        setShowClientPicker(false);
    };

    const deleteClient = (id: string) => {
        const updated = savedClients.filter(c => c.id !== id);
        setSavedClients(updated);
        localStorage.setItem('inv_clients', JSON.stringify(updated));
    };

    const getInvoiceData = () => ({
        invoiceNumber: formattedNumber,
        date, dueDate, clientName, clientAddress, clientEmail,
        lines, iban, bic, total, notes
    });

    // Open invoice in new window and trigger print (always works, no blank page)
    const handlePrint = () => {
        const html = buildInvoiceHTML(getInvoiceData());
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) { alert('Autoriser les pop-ups pour générer la facture.'); return; }
        w.document.write(html);
        w.document.close();
        w.onload = () => { w.focus(); w.print(); };
    };

    // Download as HTML (reliable fallback)
    const handleDownload = () => {
        const html = buildInvoiceHTML(getInvoiceData());
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Facture_${formattedNumber}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Open email modal with pre-filled data
    const openEmail = () => {
        setEmailTo(clientEmail);
        setEmailSubject(`Facture ${formattedNumber} – ${SENDER.name}`);
        setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre facture N° ${formattedNumber} d'un montant de ${total.toFixed(2)} €.\n\nCordialement,\n${SENDER.name}`);
        setSendStatus('idle');
        setSendError('');
        setShowEmailModal(true);
    };

    const handleSendEmail = async () => {
        if (!emailTo) { setSendError('Veuillez saisir un email destinataire.'); return; }
        setSendStatus('sending');
        setSendError('');
        try {
            const html = buildInvoiceHTML(getInvoiceData());
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';

            const res = await fetch('/api/facture/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Username': adminUser,
                    'X-Admin-Password': adminPass,
                    'X-Session-ID': sessionId,
                },
                body: JSON.stringify({
                    to: emailTo,
                    subject: emailSubject,
                    message: emailMessage,
                    invoiceHtml: html,
                    filename: `Facture_${formattedNumber}.html`,
                    invoiceData: { number: formattedNumber, client: clientName, total, date }
                })
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || 'Erreur serveur');
            }
            setSendStatus('success');
            fetchHistory();
            setInvoiceNumber(n => n + 1);
            setTimeout(() => { setSendStatus('idle'); setShowEmailModal(false); }, 3000);
        } catch (e: any) {
            setSendStatus('error');
            setSendError(e.message);
        }
    };

    const togglePaid = async (id: number, paid: boolean) => {
        try {
            const adminPass = localStorage.getItem('admin_password') || '';
            await fetch('/api/invoices/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Admin-Password': adminPass },
                body: JSON.stringify({ id, paid: !paid })
            });
            setHistory(prev => prev.map(inv => inv.id === id ? { ...inv, paid: !paid } : inv));
        } catch { }
    };

    return (
        <div className="w-full h-full bg-[#060606] text-white flex flex-col overflow-hidden">

            {/* HEADER */}
            <div className="shrink-0 px-8 py-5 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                        <span className="text-black font-black text-lg tracking-tight">CA</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight">Générateur de Factures</h1>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{SENDER.name} • {SENDER.siret}</p>
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/5 rounded-xl ml-4">
                        {(['edit', 'archive'] as const).map(v => (
                            <button key={v} onClick={() => { setView(v); if (v === 'archive') fetchHistory(); }}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === v ? 'bg-white text-black' : 'text-white/30 hover:text-white/60'}`}>
                                {v === 'edit' ? <><Plus className="w-3 h-3" /> Nouvelle</> : <><History className="w-3 h-3" /> Archive</>}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownload}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                        <Download className="w-4 h-4" /> Télécharger HTML
                    </button>
                    <button onClick={handlePrint}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                        <Printer className="w-4 h-4" /> Imprimer / PDF
                    </button>
                    <button onClick={openEmail}
                        className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all">
                        <Send className="w-4 h-4" /> Envoyer par mail
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {view === 'edit' ? (
                        <motion.div key="edit"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* LEFT COLUMN */}
                            <div className="lg:col-span-5 space-y-6">

                                {/* Invoice meta */}
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Numéro & Date</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">N° Facture</label>
                                            <input type="number" value={invoiceNumber}
                                                onChange={e => setInvoiceNumber(parseInt(e.target.value) || 1)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-black text-lg focus:outline-none focus:border-white/30 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">Date</label>
                                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">Échéance (optionnel)</label>
                                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-white/30 transition-all [color-scheme:dark]" />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl px-4 py-2">
                                        <p className="text-[10px] text-white/30 font-mono">Réf : <span className="text-white font-black">{formattedNumber}</span></p>
                                    </div>
                                </div>

                                {/* Client */}
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Client</h3>
                                        <div className="flex gap-2">
                                            <button onClick={saveClient}
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all">
                                                <Save className="w-3 h-3" /> Sauvegarder
                                            </button>
                                            {savedClients.length > 0 && (
                                                <button onClick={() => setShowClientPicker(true)}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all">
                                                    <User className="w-3 h-3" /> Clients ({savedClients.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Nom / Société', value: clientName, setter: setClientName, placeholder: 'Nom du client' },
                                            { label: 'Adresse', value: clientAddress, setter: setClientAddress, placeholder: '12 rue des Lilas, 75001 Paris' },
                                            { label: 'Email', value: clientEmail, setter: setClientEmail, placeholder: 'client@exemple.com' },
                                        ].map(f => (
                                            <div key={f.label}>
                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">{f.label}</label>
                                                <input value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Bank */}
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Coordonnées Bancaires</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">IBAN</label>
                                            <input value={iban} onChange={e => setIban(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-white/30 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">BIC / SWIFT</label>
                                            <input value={bic} onChange={e => setBic(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-white/30 transition-all" />
                                        </div>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Notes (optionnel)</h3>
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                        placeholder="Conditions de paiement, remarques..."
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 resize-none h-24" />
                                </div>
                            </div>

                            {/* RIGHT COLUMN - Lines */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Lignes de Facturation</h3>
                                        <button onClick={addLine}
                                            className="px-4 py-2 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all">
                                            <Plus className="w-3 h-3" /> Ajouter
                                        </button>
                                    </div>

                                    {/* Header row */}
                                    <div className="grid grid-cols-12 gap-2 px-2">
                                        <div className="col-span-5 text-[9px] font-black text-white/30 uppercase tracking-widest">Description</div>
                                        <div className="col-span-2 text-[9px] font-black text-white/30 uppercase tracking-widest text-center">Qté</div>
                                        <div className="col-span-3 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">P.U. (€)</div>
                                        <div className="col-span-2 text-[9px] font-black text-white/30 uppercase tracking-widest text-right">Total</div>
                                    </div>

                                    <div className="space-y-2">
                                        {lines.map((line, i) => (
                                            <motion.div key={line.id}
                                                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                                className="grid grid-cols-12 gap-2 items-center">
                                                <div className="col-span-5">
                                                    <input value={line.description}
                                                        onChange={e => updateLine(line.id, 'description', e.target.value)}
                                                        placeholder={`Prestation ${i + 1}`}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20" />
                                                </div>
                                                <div className="col-span-2">
                                                    <input type="number" value={line.quantity}
                                                        onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-white/30 transition-all" />
                                                </div>
                                                <div className="col-span-3">
                                                    <input type="number" value={line.unitPrice}
                                                        onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm text-right focus:outline-none focus:border-white/30 transition-all" />
                                                </div>
                                                <div className="col-span-1 text-right text-sm font-bold text-white/60">
                                                    {(line.quantity * line.unitPrice).toFixed(0)}€
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    {lines.length > 1 && (
                                                        <button onClick={() => removeLine(line.id)}
                                                            className="p-1.5 text-white/20 hover:text-red-400 transition-colors">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Total */}
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-white/40">Sous-total HT</span>
                                            <span className="text-sm font-bold text-white/60">{total.toFixed(2)} €</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs text-white/20">TVA</span>
                                            <span className="text-xs text-white/20">Non applicable (art. 293B CGI)</span>
                                        </div>
                                        <div className="bg-white rounded-2xl px-6 py-4 flex justify-between items-center">
                                            <span className="text-black font-black uppercase tracking-widest text-sm">Total TTC</span>
                                            <span className="text-black font-black text-2xl">{total.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Preview card */}
                                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Aperçu de la facture</h3>
                                    <div className="bg-white rounded-xl p-6 text-black">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="font-black text-base uppercase">{SENDER.name}</div>
                                                <div className="text-xs text-gray-500">SIRET : {SENDER.siret}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-lg uppercase">FACTURE</div>
                                                <div className="text-xs text-gray-500">{formattedNumber}</div>
                                                <div className="text-xs text-gray-500">{new Date(date).toLocaleDateString('fr-FR')}</div>
                                            </div>
                                        </div>
                                        <div className="h-px bg-black mb-3" />
                                        <div className="text-xs text-gray-500 mb-1">Facturé à</div>
                                        <div className="font-bold text-sm">{clientName || '—'}</div>
                                        <div className="text-xs text-gray-400">{clientAddress}</div>
                                        <div className="h-px bg-gray-100 my-3" />
                                        {lines.filter(l => l.description).map(l => (
                                            <div key={l.id} className="flex justify-between text-xs py-1">
                                                <span>{l.description}</span>
                                                <span className="font-bold">{(l.quantity * l.unitPrice).toFixed(2)} €</span>
                                            </div>
                                        ))}
                                        <div className="h-px bg-gray-100 my-3" />
                                        <div className="flex justify-between font-black">
                                            <span>TOTAL TTC</span>
                                            <span>{total.toFixed(2)} €</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="archive"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="p-8">
                            <h2 className="text-xl font-black uppercase tracking-tight mb-6">Historique des Factures</h2>
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center h-48">
                                    <Loader className="w-8 h-8 animate-spin text-white/20" />
                                </div>
                            ) : history.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                                    <Building2 className="w-12 h-12 mb-4" />
                                    <p className="text-sm font-bold">Aucune facture envoyée</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {history.map((inv: any) => (
                                        <div key={inv.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-6">
                                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                                <span className="text-xs font-black text-white/40">#{inv.id}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-black text-sm">{inv.client || 'Client inconnu'}</div>
                                                <div className="text-xs text-white/30">{inv.number} • {new Date(inv.date || inv.created_at).toLocaleDateString('fr-FR')}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-lg">{parseFloat(inv.total || 0).toFixed(2)} €</div>
                                            </div>
                                            <button onClick={() => togglePaid(inv.id, inv.paid)}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${inv.paid
                                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                                    : 'bg-white/5 border border-white/10 text-white/30 hover:border-white/30'}`}>
                                                {inv.paid ? <><CheckCircle className="w-3 h-3" /> Payée</> : <><Clock className="w-3 h-3" /> En attente</>}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* CLIENT PICKER MODAL */}
            <AnimatePresence>
                {showClientPicker && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black uppercase tracking-tight">Clients Sauvegardés</h3>
                                <button onClick={() => setShowClientPicker(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {savedClients.map(c => (
                                    <div key={c.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group">
                                        <button onClick={() => loadClient(c)} className="flex-1 text-left">
                                            <div className="font-bold text-sm">{c.name}</div>
                                            <div className="text-xs text-white/30">{c.email}</div>
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => loadClient(c)}
                                                className="px-3 py-1.5 bg-white text-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                <ChevronRight className="w-3 h-3" /> Sélectionner
                                            </button>
                                            <button onClick={() => deleteClient(c.id)}
                                                className="p-1.5 text-white/20 hover:text-red-400 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Envoyer la Facture</h3>
                                    <p className="text-xs text-white/30 mt-1">{formattedNumber} • {total.toFixed(2)} €</p>
                                </div>
                                <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {sendStatus === 'success' ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-400" />
                                    </div>
                                    <p className="text-green-400 font-black text-lg uppercase">Facture envoyée !</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {[
                                        { label: 'Destinataire', value: emailTo, setter: setEmailTo, type: 'email' },
                                        { label: 'Objet', value: emailSubject, setter: setEmailSubject, type: 'text' },
                                    ].map(f => (
                                        <div key={f.label}>
                                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">{f.label}</label>
                                            <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all" />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 block">Message</label>
                                        <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={5}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-white/30 transition-all resize-none" />
                                    </div>

                                    {sendError && (
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                            <p className="text-red-400 text-xs font-bold">{sendError}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setShowEmailModal(false)}
                                            className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            Annuler
                                        </button>
                                        <button onClick={handleSendEmail} disabled={sendStatus === 'sending'}
                                            className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50">
                                            {sendStatus === 'sending' ? <><Loader className="w-4 h-4 animate-spin" /> Envoi...</> : <><Mail className="w-4 h-4" /> Envoyer</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
