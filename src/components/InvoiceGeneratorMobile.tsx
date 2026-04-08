import { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { ChevronRight, Plus, Trash2, Send, Loader, X, CheckCircle, User, Calendar, FileText, Settings, History, Save, Clock, Download, Printer, RefreshCw, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface InvoiceLine { id: string; description: string; quantity: number; unitPrice: number; }
interface SavedClient { id: string; name: string; address: string; city: string; email: string; }
interface SavedArticle { id: string; description: string; unitPrice: number; }
interface Sender { name: string; siret: string; address: string; email: string; phone: string; legal: string; }

const DEFAULT_SENDER: Sender = {
    name: 'CUENCA ALEXANDRE', siret: '805 131 828 00010',
    address: '411 Rue de Bouillargue, 30000 Nîmes',
    email: 'alexlight3034@icloud.com', phone: '07 62 05 45 89',
    legal: 'Auto-entrepreneur – TVA non applicable, art. 293 B du CGI',
};


// ─── Shared styles ───────────────────────────────────────────────────────────
const ROW = "flex items-center justify-between px-4 py-4 bg-white/[0.04] border-b border-white/[0.06] active:bg-white/10 transition-colors cursor-pointer select-none";
const ROW_LABEL = "flex items-center gap-3 text-sm font-semibold text-white";
const ROW_VALUE = "flex items-center gap-2 text-sm text-white/40";
const SECTION_HEADER = "px-4 pt-6 pb-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]";
const INPUT = "w-full bg-transparent text-white text-base font-medium placeholder:text-white/20 focus:outline-none py-1";

// ─── Sheet overlay ────────────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children, fullscreen }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; fullscreen?: boolean }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col justify-end"
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
                        className={`bg-[#12141f] ${fullscreen ? 'h-screen rounded-none' : 'rounded-t-3xl max-h-[92vh]'} overflow-hidden flex flex-col`}
                    >
                        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/[0.06]">
                            <h2 className="text-base font-black text-white uppercase tracking-tight">{title}</h2>
                            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-4 h-4 text-white/60" />
                            </button>
                        </div>
                        <div className={`flex-1 overflow-y-auto ${fullscreen ? '' : 'px-5 py-4 space-y-4 pb-10'}`}>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">{label}</div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">{children}</div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InvoiceGeneratorMobile() {
    const [sender, setSender] = useState<Sender>(() => {
        try { return JSON.parse(localStorage.getItem('inv_sender') || 'null') || DEFAULT_SENDER; } catch { return DEFAULT_SENDER; }
    });

    const [invoiceNumber, setInvoiceNumber] = useState<number>(() => { const s = localStorage.getItem('inv_number'); return s ? parseInt(s) : 67; });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientCity, setClientCity] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [iban, setIban] = useState(() => localStorage.getItem('inv_iban') || 'BE59 9675 0891 6526');
    const [bic, setBic] = useState(() => localStorage.getItem('inv_bic') || 'TRWIBEB1XXX');
    const [notes] = useState('');
    const [eventClub, setEventClub] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [lines, setLines] = useState<InvoiceLine[]>([{ id: '1', description: 'Prestation Light', quantity: 1, unitPrice: 0 }]);

    const [savedClients, setSavedClients] = useState<SavedClient[]>(() => { try { return JSON.parse(localStorage.getItem('inv_clients') || '[]'); } catch { return []; } });
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>(() => {
        try {
            const s = JSON.parse(localStorage.getItem('inv_articles') || 'null');
            if (s && s.length > 0) return s;
            const d = [{ id: 'default-1', description: 'Prestation Light', unitPrice: 0 }];
            localStorage.setItem('inv_articles', JSON.stringify(d));
            return d;
        } catch { return []; }
    });

    // Sheet states
    const [view, setView] = useState<'edit' | 'archive' | 'clients' | 'settings'>('edit');
    const [sheet, setSheet] = useState<'none' | 'client' | 'date' | 'event' | 'details' | 'line' | 'settings' | 'email' | 'preview'>('none');
    const [previewKey, setPreviewKey] = useState(0);
    const [editingLine, setEditingLine] = useState<InvoiceLine | null>(null);
    const [senderDraft, setSenderDraft] = useState<Sender>(sender);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [ncName, setNcName] = useState('');
    const [ncAddress, setNcAddress] = useState('');
    const [ncCity, setNcCity] = useState('');
    const [ncEmail, setNcEmail] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        if (view === 'archive') fetchHistory();
    }, [view]);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const res = await fetch('/api/invoices?t=' + Date.now(), {
                headers: { 'X-Admin-Username': adminUser, 'X-Admin-Password': adminPass }
            });
            if (res.ok) setHistory(await res.json());
        } catch { } finally { setIsLoadingHistory(false); }
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

    const deleteInvoice = async (id: number) => {
        if (!confirm('Voulez-vous vraiment supprimer cette facture ?')) return;
        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const res = await fetch('/api/invoices/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Username': adminUser, 'X-Admin-Password': adminPass }, body: JSON.stringify({ id }) });
            if (res.ok) fetchHistory();
        } catch { }
    };

    useEffect(() => { fetchHistory(); }, []);

    const addNewClient = () => {
        if (!ncName.trim()) return;
        const nc = { id: Date.now().toString(), name: ncName, address: ncAddress, city: ncCity, email: ncEmail };
        const updated = [nc, ...savedClients];
        setSavedClients(updated);
        localStorage.setItem('inv_clients', JSON.stringify(updated));
        setNcName(''); setNcAddress(''); setNcCity(''); setNcEmail('');
        setSheet('none');
    };

    const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [sendError, setSendError] = useState('');
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');

    const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const formattedNumber = `INV-${new Date(date).getFullYear()}-${invoiceNumber.toString().padStart(3, '0')}`;
    const displayNumber = `Facture ${invoiceNumber.toString().padStart(3, '0')}`;

    useEffect(() => { localStorage.setItem('inv_number', invoiceNumber.toString()); }, [invoiceNumber]);
    useEffect(() => { localStorage.setItem('inv_iban', iban); localStorage.setItem('inv_bic', bic); }, [iban, bic]);

    const addLine = () => { const nl: InvoiceLine = { id: Date.now().toString(), description: 'Prestation Light', quantity: 1, unitPrice: 0 }; setLines(p => [...p, nl]); setEditingLine(nl); setSheet('line'); };
    const deleteLine = (id: string) => setLines(p => p.filter(l => l.id !== id));
    const deleteClient = (id: string) => { const u = savedClients.filter(c => c.id !== id); setSavedClients(u); localStorage.setItem('inv_clients', JSON.stringify(u)); };
    const updateEditingLine = (field: keyof InvoiceLine, value: string | number) => {
        if (!editingLine) return;
        const updated = { ...editingLine, [field]: value };
        setEditingLine(updated);
        setLines(p => p.map(l => l.id === updated.id ? updated : l));
    };

    const saveCurrentArticle = () => {
        if (!editingLine || !editingLine.description.trim()) return;
        const na = { id: Date.now().toString(), description: editingLine.description, unitPrice: editingLine.unitPrice };
        const updated = [na, ...savedArticles.filter(a => a.description !== na.description)];
        setSavedArticles(updated);
        localStorage.setItem('inv_articles', JSON.stringify(updated));
    };

    const saveClient = () => {
        if (!clientName.trim()) return;
        const nc: any = { id: Date.now().toString(), name: clientName, address: clientAddress, city: clientCity, email: clientEmail };
        const updated = [nc, ...savedClients.filter((c: any) => c.name !== clientName)];
        setSavedClients(updated); localStorage.setItem('inv_clients', JSON.stringify(updated));
    };

    const saveSenderSettings = () => { setSender(senderDraft); localStorage.setItem('inv_sender', JSON.stringify(senderDraft)); setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000); };

    const buildHTML = () => {
        const rows = lines.map(l => `<tr><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;font-style:italic;color:#1a1a1a">${l.description}</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;text-align:center">${l.quantity}</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#1a1a1a;text-align:right">${l.unitPrice.toFixed(2)} €</td><td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${(l.quantity * l.unitPrice).toFixed(2)} €</td></tr>`).join('');
        return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><title>Facture ${formattedNumber}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#fff;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;min-height:297mm;padding:20mm;background:#fff;margin:0 auto}@media print{body{margin:0}.page{padding:15mm;width:100%}@page{margin:0;size:A4}}</style></head><body><div class="page"><table style="width:100%;margin-bottom:40px"><tr><td style="vertical-align:top"><div style="font-size:22px;font-weight:900;color:#000;letter-spacing:-1px;text-transform:uppercase">${sender.name}</div><div style="font-size:11px;color:#666;margin-top:4px">SIRET : ${sender.siret}</div><div style="font-size:11px;color:#666;margin-top:2px">${sender.address}</div><div style="font-size:11px;color:#666;margin-top:2px">${sender.email}</div><div style="font-size:11px;color:#666;margin-top:2px">${sender.phone}</div></td><td style="vertical-align:top;text-align:right"><div style="font-size:36px;font-weight:900;color:#000;letter-spacing:-2px;text-transform:uppercase">FACTURE</div><div style="font-size:13px;color:#666;margin-top:6px">N° <strong style="color:#000">${formattedNumber}</strong></div><div style="font-size:13px;color:#666;margin-top:4px">Date : <strong style="color:#000">${new Date(date).toLocaleDateString('fr-FR')}</strong></div>${dueDate ? `<div style="font-size:13px;color:#e00;margin-top:4px">Échéance : <strong>${new Date(dueDate).toLocaleDateString('fr-FR')}</strong></div>` : ''}</td></tr></table><div style="height:2px;background:#000;margin-bottom:32px"></div><table style="width:100%;margin-bottom:40px"><tr><td style="width:50%"><div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:8px">Facturé à</div><div style="font-size:15px;font-weight:700;color:#000">${clientName || '—'}</div><div style="font-size:12px;color:#666;margin-top:4px">${clientAddress}${clientCity ? `, ${clientCity}` : ''}</div>${clientEmail ? `<div style="font-size:12px;color:#666;margin-top:4px">${clientEmail}</div>` : ''}</td></tr></table><table style="width:100%;border-collapse:collapse;margin-bottom:32px"><thead><tr style="background:#3730a3"><th style="padding:12px 16px;text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Description</th><th style="padding:12px 16px;text-align:center;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Qté</th><th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">P.U. HT</th><th style="padding:12px 16px;text-align:right;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#fff">Total HT</th></tr></thead><tbody>${rows}</tbody></table><table style="width:100%;margin-bottom:48px"><tr><td style="width:60%">${notes ? `<div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:6px">Notes</div><div style="font-size:12px;color:#444;line-height:1.6">${notes}</div>` : ''}</td><td style="width:40%;vertical-align:bottom"><table style="width:100%"><tr><td style="padding:8px 0;font-size:12px;color:#666;border-top:1px solid #f0f0f0">Sous-total HT</td><td style="padding:8px 0;font-size:12px;color:#000;font-weight:700;text-align:right;border-top:1px solid #f0f0f0">${total.toFixed(2)} €</td></tr><tr><td style="padding:8px 0;font-size:11px;color:#999">TVA</td><td style="padding:8px 0;font-size:11px;color:#999;text-align:right">Non applicable</td></tr><tr style="background:#3730a3"><td style="padding:14px 16px;font-size:13px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:0.05em">TOTAL TTC</td><td style="padding:14px 16px;font-size:18px;font-weight:900;color:#fff;text-align:right">${total.toFixed(2)} €</td></tr></table></td></tr></table>${iban ? `<div style="background:#f9f9f9;border:1px solid #eee;border-radius:12px;padding:20px;margin-bottom:32px"><div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#999;margin-bottom:12px">Coordonnées bancaires</div><table style="width:100%"><tr><td style="font-size:11px;color:#666">IBAN</td><td style="font-size:12px;font-weight:700;color:#000;font-family:monospace">${iban}</td><td style="font-size:11px;color:#666;padding-left:32px">BIC</td><td style="font-size:12px;font-weight:700;color:#000;font-family:monospace">${bic}</td></tr></table></div>` : ''}<div style="border-top:1px solid #eee;padding-top:16px"><div style="font-size:10px;color:#aaa;line-height:1.6">${sender.legal}</div></div></div></body></html>`;
    };

    const handlePrint = () => { const w = window.open('', '_blank'); if (!w) return; w.document.write(buildHTML()); w.document.close(); w.onload = () => { w.focus(); w.print(); }; };
    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([buildHTML()], { type: 'text/html' });
        element.href = URL.createObjectURL(file);
        element.download = `Facture_${formattedNumber}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    const openPreview = () => { setPreviewKey(k => k + 1); setSheet('preview'); };

    const openEmail = () => { setEmailTo(clientEmail); setEmailSubject(`Facture ${formattedNumber} – ${sender.name}`); setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver votre facture N° ${formattedNumber} — ${total.toFixed(2)} €.\n\nCordialement,\n${sender.name}`); setSendStatus('idle'); setSendError(''); setSheet('email'); };

    const handleSendEmail = async () => {
        if (!emailTo) { setSendError('Email requis'); return; }
        setSendStatus('sending'); setSendError('');
        try {
            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session_id') || '';
            
            // Generate PDF on frontend
            const element = document.createElement('div');
            element.innerHTML = buildHTML();
            const opt = { margin: 0, filename: `Facture_${formattedNumber}.pdf`, image: { type: 'jpeg' as const, quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const } };
            const pdfDataUri = await html2pdf().from(element).set(opt).outputPdf('datauristring');

            const res = await fetch('/api/facture/send', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'X-Admin-Username': adminUser, 'X-Admin-Password': adminPass, 'X-Session-ID': sessionId }, 
                body: JSON.stringify({ 
                    to: emailTo, 
                    subject: emailSubject, 
                    message: emailMessage, 
                    pdfBase64: pdfDataUri,
                    filename: `Facture_${formattedNumber}.pdf`, 
                    invoiceData: { number: formattedNumber, client: clientName, total, date } 
                }) 
            });
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Erreur'); }
            setSendStatus('success');
            fetchHistory();
            setInvoiceNumber(n => n + 1);
            setTimeout(() => { setSendStatus('idle'); setSheet('none'); }, 2500);
        } catch (e: any) { setSendStatus('error'); setSendError(e.message); }
    };

    const dueDateLabel = dueDate ? new Date(dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Aucune';
    const eventLabel = eventClub || eventDate ? [eventClub, eventDate ? new Date(eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''].filter(Boolean).join(' – ') : 'Aucun';

    const TABS = [
        { key: 'edit', icon: <Plus className="w-4 h-4" />, label: 'Facture' },
        { key: 'archive', icon: <History className="w-4 h-4" />, label: 'Archives' },
        { key: 'clients', icon: <User className="w-4 h-4" />, label: 'Clients' },
        { key: 'settings', icon: <Settings className="w-4 h-4" />, label: 'Compte' },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-[#0d0f1a] text-white overflow-hidden pb-[80px]">

            {/* ── TOP NAV ── */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#0d0f1a] border-b border-white/[0.06]">
                <Link to="/admin" className="flex items-center gap-1 text-indigo-400 font-semibold text-sm">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Admin
                </Link>
                <div className="flex gap-4">
                    {view === 'edit' && (
                        <>
                            <button onClick={openPreview} className="text-indigo-400 font-semibold text-sm">Aperçu</button>
                            <button onClick={handlePrint} className="text-indigo-400 font-semibold text-sm">Imprimer</button>
                        </>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ── */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {/* ========== FACTURE TAB ========== */}
                    {view === 'edit' && (
                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-10">
                            {/* Invoice title */}
                            <div className="px-4 pt-6 pb-4 border-b border-white/[0.05]">
                                <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-[0.25em] mb-1">{formattedNumber}</p>
                                <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-3">{displayNumber}</h1>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.06] rounded-full text-[11px] font-bold text-white/60">
                                        <User className="w-3 h-3 text-indigo-400" />
                                        {clientName || <span className="text-white/25 italic">Client</span>}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.06] rounded-full text-[11px] font-bold text-white/60">
                                        <Calendar className="w-3 h-3 text-indigo-400" />
                                        {new Date(date).toLocaleDateString('fr-FR')}
                                    </span>
                                    {dueDate && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full text-[11px] font-bold text-amber-400">
                                            <Calendar className="w-3 h-3" />
                                            Éch. {new Date(dueDate).toLocaleDateString('fr-FR')}
                                        </span>
                                    )}
                                    {total > 0 && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 rounded-full text-[11px] font-black text-indigo-300">
                                            {total.toFixed(2)} €
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="bg-white/[0.03] rounded-2xl mx-3 overflow-hidden mt-6 mb-1">
                                <button className={ROW} onClick={() => setSheet('client')}>
                                    <span className={ROW_LABEL}><User className="w-4 h-4 text-indigo-400" /> Client :</span>
                                    <span className={ROW_VALUE}>{clientName || 'Ajouter un client'}<ChevronRight className="w-4 h-4" /></span>
                                </button>
                                <button className={ROW} onClick={() => setSheet('date')}>
                                    <span className={ROW_LABEL}><Calendar className="w-4 h-4 text-indigo-400" /> Date d'échéance</span>
                                    <span className={ROW_VALUE}>{dueDateLabel}<ChevronRight className="w-4 h-4" /></span>
                                </button>
                                <button className={ROW + " border-b-0"} onClick={() => setSheet('details')}>
                                    <span className={ROW_LABEL}><FileText className="w-4 h-4 text-indigo-400" /> Détails</span>
                                    <span className={ROW_VALUE}><ChevronRight className="w-4 h-4" /></span>
                                </button>
                            </div>

                            <p className={SECTION_HEADER}>Auto-remplissage</p>
                            <div className="bg-white/[0.03] rounded-2xl mx-3 overflow-hidden mb-1">
                                <button className={ROW + " border-b-0"} onClick={() => setSheet('event')}>
                                    <span className={ROW_LABEL}><Calendar className="w-4 h-4 text-indigo-400" /> Événement</span>
                                    <span className={ROW_VALUE}><span className="truncate max-w-[120px]">{eventLabel}</span><ChevronRight className="w-4 h-4" /></span>
                                </button>
                            </div>

                            {/* Articles Section */}
                            <div className="bg-white/[0.03] rounded-2xl mx-3 overflow-hidden mt-3 mb-1">
                                {lines.map((line, i) => (
                                    <button key={line.id} className={ROW + (i === lines.length - 1 ? ' border-b-0' : '')}
                                        onClick={() => { setEditingLine(line); setSheet('line'); }}>
                                        <span className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-white truncate max-w-[200px]">{line.description || 'Article'}</span>
                                            <span className="text-xs text-white/30">Qté {line.quantity}</span>
                                        </span>
                                        <span className={ROW_VALUE}>
                                            {line.unitPrice > 0 ? `${(line.quantity * line.unitPrice).toFixed(2)} €` : '—'}
                                            <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </button>
                                ))}
                                <button className={ROW + " border-b-0"} onClick={addLine}>
                                    <span className={ROW_LABEL}><Plus className="w-4 h-4 text-indigo-400" /> Ajouter un article</span>
                                    <ChevronRight className="w-4 h-4 text-white/20" />
                                </button>
                            </div>

                            {/* Total */}
                            <div className="bg-white/[0.03] rounded-2xl mx-3 overflow-hidden mt-3 mb-1">
                                <div className="flex items-center justify-between px-4 py-4">
                                    <span className="text-base font-black text-white">Total</span>
                                    <span className="text-base font-black text-white">{total.toFixed(2)} €</span>
                                </div>
                            </div>
                            
                            {/* Send Action */}
                            <div className="p-4 mt-4">
                                <button onClick={openEmail}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:bg-indigo-700 transition-colors">
                                    <Send className="w-4 h-4" /> Envoyer la facture
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== ARCHIVES TAB ========== */}
                    {view === 'archive' && (
                        <motion.div key="archive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-white tracking-tight">Archives</h2>
                                <button onClick={fetchHistory} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/50 hover:text-white transition-all">
                                    <RefreshCw className={`w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-20"><Loader className="w-8 h-8 animate-spin text-indigo-400" /></div>
                            ) : (() => {
                                const stats = history.reduce((acc, inv) => {
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
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400/70 mb-1">Ce Mois</div>
                                                <div className="text-xl font-black text-indigo-400">{stats.thisMonth.toFixed(2)} €</div>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                                <div className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Cette Année</div>
                                                <div className="text-xl font-black text-white">{stats.thisYear.toFixed(2)} €</div>
                                            </div>
                                        </div>
                                        {history.length === 0 ? (
                                            <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl">
                                                <History className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                                <p className="text-sm font-black text-white/20 uppercase tracking-widest">Aucune facture</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 pb-20">
                                                {history.map((inv: any) => (
                                                    <div key={inv.id} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[10px] font-black text-indigo-400">#{inv.id}</span>
                                                                    <span className="text-xs font-bold text-white truncate">{inv.client || 'Client inconnu'}</span>
                                                                </div>
                                                                <div className="text-[10px] text-white/30">{inv.number} • {new Date(inv.date || inv.created_at).toLocaleDateString('fr-FR')}</div>
                                                                {inv.emailTo && <div className="text-[10px] text-white/50 mt-1 whitespace-nowrap overflow-hidden text-ellipsis truncate">{inv.emailTo}</div>}
                                                                <div className="font-black text-sm text-white mt-1">{parseFloat(inv.total || 0).toFixed(2)} €</div>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <button onClick={() => togglePaid(inv.id, inv.paid)}
                                                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all ${inv.paid ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-white/5 border border-white/10 text-white/30'}`}>
                                                                    {inv.paid ? <><CheckCircle className="w-3 h-3" /> Payée</> : <><Clock className="w-3 h-3" /> Attente</>}
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                                                            {inv.pdfUrl ? (
                                                                <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white hover:text-indigo-400">
                                                                    <BookOpen className="w-3 h-3" /> PDF
                                                                </a>
                                                            ) : (
                                                                <div className="flex-1" />
                                                            )}
                                                            <button onClick={() => deleteInvoice(inv.id)} className="p-3 border border-white/10 rounded-xl text-red-500/50 bg-white/5">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}

                    {/* ========== CLIENTS TAB ========== */}
                    {view === 'clients' && (
                        <motion.div key="clients" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-8">
                             <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 space-y-4">
                                <div className="flex items-center gap-2">
                                     <Plus className="w-3 h-3 text-indigo-400" />
                                     <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Nouveau Client</h3>
                                </div>
                                <div className="space-y-4">
                                    <input value={ncName} onChange={e => setNcName(e.target.value)} placeholder="Nom du client" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                    <input value={ncAddress} onChange={e => setNcAddress(e.target.value)} placeholder="Adresse" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                    <input value={ncCity} onChange={e => setNcCity(e.target.value)} placeholder="Code Postal / Ville" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                    <input value={ncEmail} onChange={e => setNcEmail(e.target.value)} placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white" />
                                    <button onClick={addNewClient} className="w-full py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">
                                        Ajouter au carnet
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pb-20">
                                <div className="flex items-center gap-2">
                                     <User className="w-3 h-3 text-white/40" />
                                     <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Carnet ({savedClients.length})</h3>
                                </div>
                                <div className="space-y-3">
                                    {savedClients.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed border-white/5 rounded-2xl">
                                            <User className="w-10 h-10 text-white/5 mx-auto mb-2" />
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Aucun client</p>
                                        </div>
                                    ) : savedClients.map(c => (
                                        <div key={c.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="min-w-0 flex-1 mr-4">
                                                <div className="font-bold text-sm text-white truncate">{c.name}</div>
                                                <div className="text-[10px] text-white/30 truncate">{c.city}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { 
                                                    setClientName(c.name); setClientAddress(c.address); setClientEmail(c.email); setClientCity(c.city || ''); setView('edit'); 
                                                }} className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-black uppercase">
                                                    Utiliser
                                                </button>
                                                <button onClick={() => deleteClient(c.id)} className="p-2 text-white/10"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== SETTINGS TAB ========== */}
                    {view === 'settings' && (
                        <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-4 pb-20">
                            <h2 className="text-2xl font-black text-white tracking-tight mb-6">Mon Compte</h2>
                            {(['name', 'siret', 'address', 'email', 'phone', 'legal'] as (keyof Sender)[]).map(k => {
                                const labels: Record<keyof Sender, string> = { name: 'Nom', siret: 'SIRET', address: 'Adresse', email: 'Email', phone: 'Téléphone', legal: 'Mention TVA' };
                                return (
                                    <Field key={k} label={labels[k]}>
                                        <input value={senderDraft[k]} onChange={e => setSenderDraft(d => ({ ...d, [k]: e.target.value }))} className={INPUT} />
                                    </Field>
                                );
                            })}
                            <button onClick={saveSenderSettings}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${settingsSaved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-indigo-600 text-white'}`}>
                                {settingsSaved ? <><CheckCircle className="w-4 h-4" /> Enregistré !</> : <><Save className="w-4 h-4" /> Enregistrer</>}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── FIXED BOTTOM TAB BAR ── */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] flex border-t border-white/10 bg-[#0d0f1a]/95 backdrop-blur-xl pb-safe">
                {TABS.map(t => (
                    <button key={t.key}
                        onClick={() => setView(t.key)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-black uppercase tracking-widest transition-all ${view === t.key ? 'text-indigo-400' : 'text-white/30'}`}>
                        <span className={`p-2 rounded-xl transition-all ${view === t.key ? 'bg-indigo-500/20' : ''}`}>{t.icon}</span>
                        {t.label}
                    </button>
                ))}
                <button onClick={handleDownload} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-black uppercase tracking-widest text-white/30">
                    <span className="p-2 rounded-xl"><Download className="w-4 h-4" /></span>
                    HTML
                </button>
                <button onClick={handlePrint} className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[9px] font-black uppercase tracking-widest text-white/30">
                    <span className="p-2 rounded-xl"><Printer className="w-4 h-4" /></span>
                    PDF
                </button>
            </div>

            {/* CLIENT */}
            <Sheet open={sheet === 'client'} onClose={() => setSheet('none')} title="Client">
                <Field label="Nom / Société">
                    <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nom du client" className={INPUT} />
                </Field>
                <Field label="Adresse">
                    <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="12 rue des Lilas" className={INPUT} />
                </Field>
                <Field label="Ville / Code postal">
                    <input value={clientCity} onChange={e => setClientCity(e.target.value)} placeholder="30000 Nîmes" className={INPUT} />
                </Field>
                <Field label="Email">
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@exemple.com" className={INPUT} />
                </Field>
                <div className="flex gap-3 pt-2">
                    <button onClick={() => { saveClient(); setSheet('none'); }} className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white/60 flex items-center justify-center gap-2">
                        <Save className="w-3.5 h-3.5" />  Sauvegarder
                    </button>
                </div>
            </Sheet>

            {/* DATE */}
            <Sheet open={sheet === 'date'} onClose={() => setSheet('none')} title="Dates">
                <Field label="Date de la facture">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT + " text-white [color-scheme:dark]"} />
                </Field>
                <Field label="Date d'échéance (optionnel)">
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={INPUT + " text-white [color-scheme:dark]"} />
                </Field>
                <div className="bg-indigo-500/10 rounded-xl px-4 py-2">
                    <p className="text-[10px] text-indigo-300 font-mono">Réf : <span className="font-black">{formattedNumber}</span></p>
                </div>
            </Sheet>

            {/* EVENT */}
            <Sheet open={sheet === 'event'} onClose={() => setSheet('none')} title="Événement (auto-remplissage)">
                <p className="text-xs text-white/30">Remplis les champs pour générer automatiquement la description de la prestation.</p>
                <Field label="Nom du Club / Lieu">
                    <input value={eventClub} onChange={e => setEventClub(e.target.value)} placeholder="Club XYZ, Salle Metropolis…" className={INPUT} />
                </Field>
                <Field label="Date de l'événement">
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={INPUT + " text-white [color-scheme:dark]"} />
                </Field>
                <button onClick={() => {
                    if (!eventClub && !eventDate) return;
                    const dateStr = eventDate ? new Date(eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                    const desc = [lines[0]?.description?.split(' – ')[0] || 'Prestation Light', eventClub, dateStr].filter(Boolean).join(' – ');
                    setLines(p => p.map((l, i) => i === 0 ? { ...l, description: desc } : l));
                    setSheet('none');
                }} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest">
                    ✦ Appliquer à la 1ère ligne
                </button>
            </Sheet>

            {/* DETAILS */}
            <Sheet open={sheet === 'details'} onClose={() => setSheet('none')} title="Coordonnées bancaires">
                <Field label="IBAN">
                    <input value={iban} onChange={e => setIban(e.target.value)} placeholder="FR76 0000 0000 0000…" className={INPUT + " font-mono"} />
                </Field>
                <Field label="BIC / SWIFT">
                    <input value={bic} onChange={e => setBic(e.target.value)} placeholder="REVOFR22XXX" className={INPUT + " font-mono"} />
                </Field>
            </Sheet>

            {/* LINE EDIT */}
            <Sheet open={sheet === 'line'} onClose={() => { setEditingLine(null); setSheet('none'); }} title="Article">
                {editingLine && (
                    <>
                        <Field label="Description">
                            <input value={editingLine.description} onChange={e => updateEditingLine('description', e.target.value)} placeholder="Prestation Light" className={INPUT} />
                        </Field>
                        {savedArticles.length > 0 && (
                            <div className="flex flex-wrap gap-2 py-2">
                                {savedArticles.map(a => (
                                    <button key={a.id} onClick={() => { updateEditingLine('description', a.description); updateEditingLine('unitPrice', a.unitPrice); }}
                                        className="px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs font-bold text-indigo-300">
                                        {a.description}
                                    </button>
                                ))}
                            </div>
                        )}
                        <Field label="Quantité">
                            <input type="number" value={editingLine.quantity} onChange={e => updateEditingLine('quantity', parseFloat(e.target.value) || 1)} className={INPUT + " font-black text-lg"} min="1" />
                        </Field>
                        <Field label="Prix unitaire (€)">
                            <input type="number" value={editingLine.unitPrice} onChange={e => updateEditingLine('unitPrice', parseFloat(e.target.value) || 0)} className={INPUT + " font-black text-lg"} step="0.01" />
                        </Field>
                        <div className="flex items-center justify-between p-4 bg-indigo-500/10 rounded-xl">
                            <span className="text-sm text-indigo-300 font-bold">Total ligne</span>
                            <span className="text-xl font-black text-white">{(editingLine.quantity * editingLine.unitPrice).toFixed(2)} €</span>
                        </div>
                        <button onClick={saveCurrentArticle} className="w-full py-3.5 bg-white/5 border border-white/10 text-white/40 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 lowercase">
                             <Save className="w-3.5 h-3.5 text-indigo-400" /> Sauvegarder article
                        </button>
                        {lines.length > 1 && (
                            <button onClick={() => { deleteLine(editingLine.id); setSheet('none'); }}
                                className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                                <Trash2 className="w-4 h-4" /> Supprimer
                            </button>
                        )}
                    </>
                )}
            </Sheet>

            {/* EMAIL */}
            <Sheet open={sheet === 'email'} onClose={() => setSheet('none')} title="Envoyer la facture">
                {sendStatus === 'success' ? (
                    <div className="flex flex-col items-center py-10 gap-4">
                        <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <p className="text-green-400 font-black text-lg uppercase">Envoyée !</p>
                    </div>
                ) : (
                    <>
                        <Field label="Destinataire">
                            <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} className={INPUT} />
                        </Field>
                        <Field label="Objet">
                            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className={INPUT} />
                        </Field>
                        <Field label="Message">
                            <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={5} className={INPUT + " resize-none"} />
                        </Field>
                        {sendError && <p className="text-red-400 text-xs font-bold px-4 py-3 bg-red-500/10 rounded-xl">{sendError}</p>}
                        <button onClick={handleSendEmail} disabled={sendStatus === 'sending'}
                            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50">
                            {sendStatus === 'sending' ? <><Loader className="w-4 h-4 animate-spin" /> Envoi…</> : <><Send className="w-4 h-4" /> Envoyer</>}
                        </button>
                    </>
                )}
            </Sheet>

            {/* PREVIEW */}
            <Sheet open={sheet === 'preview'} onClose={() => setSheet('none')} title="Aperçu" fullscreen>
                <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
                    <div className="flex-1 overflow-auto p-4 flex justify-center">
                        <div className="bg-white shadow-2xl origin-top" style={{ width: '210mm', minHeight: '297mm', transform: 'scale(0.40)' }}>
                            <iframe key={previewKey} srcDoc={buildHTML()} title="Aperçu" className="w-full h-full border-0" style={{ minHeight: '1122px' }} />
                        </div>
                    </div>
                </div>
            </Sheet>
        </div>
    );
}
