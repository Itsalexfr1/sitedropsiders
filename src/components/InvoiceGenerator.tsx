import { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Trash2, Send, Loader, X, Mail, BookUser, Save, Eye, Phone, Building2, CreditCard, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

export function InvoiceGenerator() {
    const [invoiceNumber, setInvoiceNumber] = useState<number>(66);
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [userPhone, setUserPhone] = useState('07 62 05 45 89');
    const invoiceRef = useRef<HTMLDivElement>(null);

    // Client info
    const [clientName, setClientName] = useState('');
    const [clientAddress, setClientAddress] = useState('');
    const [clientEmail, setClientEmail] = useState('');

    // Email modal
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [sendStatus, setSendStatus] = useState<'idle' | 'generating' | 'sending' | 'success' | 'error'>('idle');
    const [sendError, setSendError] = useState('');

    // Preview
    const [showPreview, setShowPreview] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Lines
    const [lines, setLines] = useState<InvoiceLine[]>([
        { id: Date.now().toString(), description: 'Prestation de service', quantity: 1, unitPrice: 0 }
    ]);

    // Saved clients
    const [savedClients, setSavedClients] = useState<SavedClient[]>(() => {
        try {
            return JSON.parse(localStorage.getItem('dropsiders_saved_clients') || '[]');
        } catch { return []; }
    });
    const [showClientPicker, setShowClientPicker] = useState(false);

    useEffect(() => {
        const savedNumber = localStorage.getItem('dropsiders_last_invoice_number');
        if (savedNumber) setInvoiceNumber(parseInt(savedNumber, 10));
        const savedPhone = localStorage.getItem('invoice_user_phone');
        if (savedPhone) setUserPhone(savedPhone);
    }, []);

    const saveUserPhone = (val: string) => {
        setUserPhone(val);
        localStorage.setItem('invoice_user_phone', val);
    };

    const saveCurrentClient = () => {
        if (!clientName.trim()) return;
        const existing = savedClients.find(c => c.email === clientEmail && c.name === clientName);
        if (existing) return;
        const newClient: SavedClient = {
            id: Date.now().toString(),
            name: clientName,
            address: clientAddress,
            email: clientEmail,
        };
        const updated = [newClient, ...savedClients];
        setSavedClients(updated);
        localStorage.setItem('dropsiders_saved_clients', JSON.stringify(updated));
    };

    const loadClient = (client: SavedClient) => {
        setClientName(client.name);
        setClientAddress(client.address);
        setClientEmail(client.email);
        setShowClientPicker(false);
    };

    const deleteClient = (id: string) => {
        const updated = savedClients.filter(c => c.id !== id);
        setSavedClients(updated);
        localStorage.setItem('dropsiders_saved_clients', JSON.stringify(updated));
    };

    const formattedInvoiceNumber = `INV-${date.split('-')[0]}-${invoiceNumber.toString().padStart(3, '0')}`;

    useEffect(() => {
        setEmailTo(clientEmail);
        setEmailSubject(`Facture ${formattedInvoiceNumber}`);
        setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre facture N° ${formattedInvoiceNumber} d'un montant de ${total.toFixed(2)} €.\n\nCordialement,\nCUENCA ALEXANDRE`);
    }, [clientEmail, clientName, invoiceNumber, date, formattedInvoiceNumber]);

    const saveInvoiceNumber = (num: number) => {
        setInvoiceNumber(num);
        localStorage.setItem('dropsiders_last_invoice_number', num.toString());
    };

    const addLine = () => {
        setLines([...lines, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }]);
    };

    const updateLine = (id: string, field: keyof InvoiceLine, value: string | number) => {
        setLines(lines.map(line => line.id === id ? { ...line, [field]: value } : line));
    };

    const removeLine = (id: string) => {
        setLines(lines.filter(line => line.id !== id));
    };

    const total = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);

    const handlePrint = () => {
        const originalTitle = document.title;
        document.title = `Facture_${formattedInvoiceNumber}_CUENCA_ALEXANDRE`;
        window.print();
        setTimeout(() => { document.title = originalTitle; }, 1000);
    };

    // Helper to sanitize any document from oklch colors (which crash html2canvas)
    const sanitizeColors = (doc: Document) => {
        const styles = doc.querySelectorAll('style');
        styles.forEach(s => {
            if (s.textContent) {
                s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#000000');
            }
        });
        const allElements = doc.querySelectorAll('*');
        allElements.forEach(el => {
            if (el instanceof HTMLElement) {
                const styleAttr = el.getAttribute('style');
                if (styleAttr && styleAttr.includes('oklch')) {
                    el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/g, '#000000'));
                }
            }
        });
    };

    const handlePreview = async () => {
        setPreviewLoading(true);
        setShowPreview(true);
        setPreviewImage(null);
        try {
            const invoiceEl = invoiceRef.current;
            if (!invoiceEl) throw new Error('Introuvable');

            invoiceEl.style.display = 'block';
            invoiceEl.style.position = 'fixed';
            invoiceEl.style.top = '0';
            invoiceEl.style.left = '-9999px';
            invoiceEl.style.width = '794px';
            invoiceEl.style.zIndex = '-9999';

            await new Promise(r => setTimeout(r, 600));

            const canvas = await html2canvas(invoiceEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                onclone: (clonedDoc) => sanitizeColors(clonedDoc)
            });

            invoiceEl.style.display = '';
            invoiceEl.style.position = '';

            setPreviewImage(canvas.toDataURL('image/png'));
        } catch (e: any) {
            console.error('Preview Error:', e);
            setSendError(e.message || 'Erreur de rendu');
        } finally {
            setPreviewLoading(false);
        }
    };

    const generateAndSendPDF = async () => {
        if (!emailTo) {
            setSendError('Veuillez renseigner un email destinataire.');
            return;
        }

        setSendStatus('generating');
        setSendError('');

        try {
            const invoiceEl = invoiceRef.current;
            if (!invoiceEl) throw new Error('Introuvable');

            invoiceEl.style.display = 'block';
            invoiceEl.style.position = 'fixed';
            invoiceEl.style.top = '0';
            invoiceEl.style.left = '-9999px';
            invoiceEl.style.width = '794px';

            await new Promise(r => setTimeout(r, 600));

            const canvas = await html2canvas(invoiceEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
                onclone: (clonedDoc) => sanitizeColors(clonedDoc)
            });

            invoiceEl.style.display = '';
            invoiceEl.style.position = '';

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);

            const pdfBase64 = pdf.output('datauristring');

            setSendStatus('sending');

            const adminUser = localStorage.getItem('admin_user') || '';
            const adminPass = localStorage.getItem('admin_password') || '';
            const sessionId = localStorage.getItem('admin_session') || '';

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
                    message: `<p>${emailMessage.replace(/\n/g, '<br>')}</p>`,
                    pdfBase64,
                    filename: `${formattedInvoiceNumber}.pdf`,
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Erreur envoi (Vérifiez votre connexion admin)');

            setSendStatus('success');
            saveInvoiceNumber(invoiceNumber + 1);
            setTimeout(() => {
                setSendStatus('idle');
                setShowEmailModal(false);
            }, 3000);
        } catch (e: any) {
            setSendStatus('error');
            setSendError(e.message || 'Erreur inconnue');
        }
    };

    return (
        <div className="w-full h-full bg-[#0a0a0a] text-white font-sans overflow-hidden flex flex-col">
            {/* HEADER / NAVIGATION */}
            <div className="shrink-0 px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center group cursor-default">
                        <span className="text-black font-black text-2xl tracking-tighter">CA</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tighter leading-none">ALEXANDRE CUENCA</h1>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Management & Studio</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePreview}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center gap-2 group"
                    >
                        <Eye className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        <span className="text-xs font-black uppercase tracking-widest px-2">Aperçu</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                    >
                        <Printer className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-2" />
                    <button
                        onClick={() => setShowEmailModal(true)}
                        className="px-8 py-3.5 bg-white text-black rounded-xl font-black uppercase tracking-widest shadow-lg shadow-white/5 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                    >
                        <Send className="w-4 h-4" /> Finaliser & Envoyer
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">

                    {/* LEFT COLUMN: SETUP */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Profile Card */}
                        <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">MON PROFIL</h3>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Numéro Personnel</label>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 focus-within:border-white/20 transition-all">
                                        <Phone className="w-4 h-4 text-gray-600" />
                                        <input
                                            type="text"
                                            value={userPhone}
                                            onChange={e => saveUserPhone(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm font-bold w-full"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Facture N° Chrono</label>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                        <input
                                            type="number"
                                            value={invoiceNumber}
                                            onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                            className="bg-transparent border-none outline-none text-2xl font-black w-full tracking-tighter"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Date d'édition</label>
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={e => setDate(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm font-bold w-full [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4 text-gray-600">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Save className="w-4 h-4" /></div>
                                    <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wide">Auto-entrepreneur<br />SIRET : 805131828 00010</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-[32px] p-8">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6">INFO PAIEMENT</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-4">
                                    <CreditCard className="w-5 h-5 text-gray-500 shrink-0" />
                                    <div className="text-[10px] font-bold text-gray-400 leading-relaxed">
                                        Virement Revolut configuré par défaut. Vérifiez les coordonnées bancaires en pied de page.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: CONTENT */}
                    <div className="lg:col-span-8 space-y-8 pb-12">

                        {/* DESTINATION SECTION */}
                        <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 space-y-10 shadow-xl">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">CLIENT & DESTINATION</h3>
                                <div className="flex items-center gap-3">
                                    {savedClients.length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowClientPicker(!showClientPicker)}
                                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                            >
                                                <BookUser className="w-4 h-4" /> Carnet
                                            </button>
                                            <AnimatePresence>
                                                {showClientPicker && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute right-0 top-full mt-4 w-72 bg-[#0c0c0c] border border-white/10 rounded-[28px] z-[100] shadow-2xl overflow-hidden"
                                                    >
                                                        <div className="p-3 max-h-60 overflow-y-auto no-scrollbar space-y-1">
                                                            {savedClients.map(c => (
                                                                <div key={c.id} className="p-4 hover:bg-white/5 rounded-2xl cursor-pointer group flex items-center justify-between" onClick={() => loadClient(c)}>
                                                                    <div>
                                                                        <p className="text-xs font-black truncate">{c.name}</p>
                                                                        <p className="text-[9px] text-gray-500 font-bold">{c.email}</p>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    <button
                                        onClick={saveCurrentClient}
                                        disabled={!clientName.trim()}
                                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-10 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Nom du client / Société</label>
                                        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                            <Building2 className="w-5 h-5 text-gray-700" />
                                            <input
                                                type="text"
                                                value={clientName}
                                                onChange={e => setClientName(e.target.value)}
                                                placeholder="EDF, Orange, etc..."
                                                className="bg-transparent border-none outline-none font-bold w-full text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">E-mail de facturation</label>
                                        <div className="bg-black/20 border border-white/5 p-4 rounded-2xl flex items-center gap-4">
                                            <Mail className="w-5 h-5 text-gray-700" />
                                            <input
                                                type="email"
                                                value={clientEmail}
                                                onChange={e => setClientEmail(e.target.value)}
                                                placeholder="compta@client.fr"
                                                className="bg-transparent border-none outline-none text-sm w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-1">Adresse Complète</label>
                                    <textarea
                                        value={clientAddress}
                                        onChange={e => setClientAddress(e.target.value)}
                                        rows={6}
                                        placeholder="Rue, Code Postal, Ville..."
                                        className="bg-black/20 border border-white/5 p-6 rounded-[32px] outline-none text-sm w-full resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* LINE ITEMS */}
                        <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-xl">
                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">PRESTATIONS & SERVICES</h3>
                                <button
                                    onClick={addLine}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Ajouter prestataire
                                </button>
                            </div>

                            <div className="space-y-4">
                                {lines.map((line) => (
                                    <div key={line.id} className="grid grid-cols-12 gap-4 items-center bg-black/40 p-4 rounded-[28px] border border-white/5 group hover:border-white/10 transition-all">
                                        <div className="col-span-12 md:col-span-7">
                                            <input
                                                type="text"
                                                value={line.description}
                                                onChange={e => updateLine(line.id, 'description', e.target.value)}
                                                placeholder="Titre de la mission..."
                                                className="bg-transparent border-none outline-none text-sm font-bold w-full px-2"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                                <input
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="bg-transparent border-none outline-none text-[10px] font-black w-full text-center"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <div className="flex items-center gap-2 px-2">
                                                <input
                                                    type="number"
                                                    value={line.unitPrice}
                                                    onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="bg-transparent border-none outline-none text-right font-black w-full"
                                                />
                                                <span className="text-gray-600 font-bold text-[10px]">€</span>
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1 text-right">
                                            <button onClick={() => removeLine(line.id)} className="p-2 text-gray-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTAL AREA */}
                            <div className="pt-8 flex justify-between items-end border-t border-white/5">
                                <div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">
                                        <ChevronRight className="w-3 h-3" /> Auto-liq. TVA (Art. 293B)
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-700 max-w-xs">Le montant total affiché est le montant net à régler (Hors Taxes).</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 block mb-2">NET À RÉGLER</span>
                                    <span className="text-6xl font-black italic tracking-tighter leading-none">{total.toFixed(2)}€</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 30 }}
                            className="relative w-full max-w-5xl h-full flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8 shrink-0">
                                <h3 className="text-4xl font-black uppercase tracking-tighter italic">Preview Mode</h3>
                                <button onClick={() => { setShowPreview(false); setPreviewImage(null); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                    <X className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar rounded-[48px] border border-white/10 bg-[#080808] p-10 flex items-center justify-center shadow-3xl">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-8 text-white/10 animate-pulse">
                                        <Loader className="w-20 h-20 animate-spin" />
                                        <p className="text-xs font-black tracking-[1em] uppercase">RENDERING TEMPLATE</p>
                                    </div>
                                ) : previewImage ? (
                                    <img src={previewImage} alt="Facture Preview" className="max-w-full h-auto rounded-[24px] shadow-2xl transition-transform hover:scale-[1.01]" />
                                ) : (
                                    <div className="text-red-500 font-bold uppercase tracking-widest text-center px-10">
                                        {sendError || "Rendering failed. Check logs."}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-8 mt-10 shrink-0">
                                <button onClick={() => { setShowPreview(false); handlePrint(); }} className="flex-1 py-8 bg-white/5 border border-white/10 rounded-[40px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Lancer l'impression</button>
                                <button onClick={() => { setShowPreview(false); setShowEmailModal(true); }} className="flex-1 py-8 bg-white text-black rounded-[40px] font-black uppercase tracking-[0.3em] hover:bg-gray-200 transition-all shadow-xl shadow-white/5">Expédition Client</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl print:hidden text-white">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0f0f0f] border border-white/10 rounded-[60px] p-12 w-full max-w-2xl space-y-10 shadow-3xl relative overflow-hidden"
                        >
                            <div className="flex justify-between items-center relative z-10">
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">DISPATCH</h3>
                                <button onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }} className="p-4 hover:bg-white/5 rounded-2xl"><X className="w-8 h-8" /></button>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] ml-2">RECIPIENT EMAIL</label>
                                    <input
                                        type="email"
                                        value={emailTo}
                                        onChange={e => setEmailTo(e.target.value)}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] outline-none font-black text-lg focus:border-white/30"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-white/10 uppercase tracking-[0.5em] ml-2">MESSAGE BODY</label>
                                    <textarea
                                        value={emailMessage}
                                        onChange={e => setEmailMessage(e.target.value)}
                                        rows={8}
                                        className="w-full p-8 bg-white/5 border border-white/10 rounded-[40px] outline-none text-base resize-none font-medium leading-relaxed"
                                    />
                                </div>
                            </div>

                            {sendStatus === 'error' && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-xs font-black text-center italic uppercase leading-relaxed relative z-10">
                                    {sendError}
                                </motion.div>
                            )}

                            {sendStatus === 'success' && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-white/10 border border-white/20 rounded-3xl text-white text-xs font-black text-center uppercase tracking-widest relative z-10">
                                    Expédié avec succès !
                                </motion.div>
                            )}

                            <button
                                onClick={generateAndSendPDF}
                                disabled={sendStatus !== 'idle' && sendStatus !== 'error'}
                                className="w-full py-8 bg-white text-black rounded-[40px] font-black uppercase shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] relative z-10"
                            >
                                {sendStatus === 'generating' || sendStatus === 'sending' ? (
                                    <Loader className="animate-spin inline mr-3 w-7 h-7" />
                                ) : (
                                    <Send className="inline mr-3 w-7 h-7" />
                                )}
                                EXECUTE DISPATCH
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT AREA - THE LUXE STUDIO TEMPLATE (FINAL VERSION) */}
            <style>
                {`
                @media print {
                    @page { margin: 0; size: 210mm 297mm; }
                    body > * { display: none !important; }
                    body #printable-invoice { display: block !important; position: absolute; left: 0; top: 0; width: 210mm; min-height: 297mm; }
                    #printable-invoice { visibility: visible !important; }
                }
                `}
            </style>

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-[794px] bg-white text-black p-[50px] min-h-[1123px] font-sans" style={{ backgroundColor: '#ffffff', color: '#000000', position: 'relative' }}>

                {/* Header Decoration */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10px', background: '#000' }} />

                {/* Main Header */}
                <div className="flex justify-between items-start mb-24 pt-16">
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                            <div style={{ padding: '20px', background: '#000', borderRadius: '4px' }}>
                                <span style={{ color: '#fff', fontSize: '32px', fontWeight: '900', letterSpacing: '-2px' }}>AC</span>
                            </div>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1.5px', textTransform: 'uppercase', lineHeight: '0.9' }}>ALEXANDRE<br /><span style={{ opacity: 0.3 }}>CUENCA</span></h1>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <p style={{ fontSize: '9px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '15px' }}>EXPÉDITEUR</p>
                            <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>{userPhone}</p>
                            <p style={{ fontSize: '12px', fontWeight: '700', opacity: 0.6 }}>alexflex30@gmail.com</p>
                            <p style={{ fontSize: '11px', fontWeight: '700', opacity: 0.6, marginTop: '5px' }}>411 RUE DE BOUILLARGUES<br />30000 NIMES</p>
                        </div>
                    </div>

                    <div className="text-right">
                        <h2 style={{ fontSize: '80px', fontWeight: '900', letterSpacing: '-5px', lineHeight: '0.8', margin: '0 0 40px 0', textTransform: 'uppercase' }}>FACTURE</h2>

                        <div style={{ display: 'inline-block', textAlign: 'left', borderLeft: '3px solid #000', paddingLeft: '20px' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <p style={{ fontSize: '8px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px' }}>RÉFÉRENCE</p>
                                <p style={{ fontSize: '14px', fontWeight: '900' }}>{formattedInvoiceNumber}</p>
                            </div>
                            <div>
                                <p style={{ fontSize: '8px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px' }}>DATE D'ÉMISSION</p>
                                <p style={{ fontSize: '14px', fontWeight: '900' }}>{new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Destination Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', marginBottom: '80px' }}>
                    <div style={{ background: '#f8f8f8', padding: '40px', borderRadius: '12px' }}>
                        <p style={{ fontSize: '8px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px' }}>DESTINATAIRE</p>
                        <h3 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px' }}>{clientName || 'CLIENT'}</h3>
                        <p style={{ fontSize: '12px', fontWeight: '700', lineHeight: '1.6', color: '#444', whiteSpace: 'pre-line' }}>{clientAddress}</p>
                        {clientEmail && <p style={{ fontSize: '11px', fontWeight: '900', marginTop: '15px', textDecoration: 'underline' }}>{clientEmail}</p>}
                    </div>

                    <div style={{ paddingTop: '40px' }}>
                        <p style={{ fontSize: '8px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px' }}>MODALITÉS</p>
                        <p style={{ fontSize: '12px', fontWeight: '700', lineHeight: '1.8' }}>
                            <span style={{ color: '#a1a1aa' }}>Échéance :</span> 30 jours (Le {new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')})<br />
                            <span style={{ color: '#a1a1aa' }}>Mode :</span> Virement Bancaire<br />
                            <span style={{ color: '#a1a1aa' }}>Devise :</span> EUR (€)
                        </p>
                    </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '60px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '7fr 1fr 2fr 2fr', paddingBottom: '15px', borderBottom: '2px solid #000' }}>
                        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>DESCRIPTION DU SERVICE</p>
                        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>QTÉ</p>
                        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'right' }}>PRIX U. HT</p>
                        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'right' }}>TOTAL HT</p>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '7fr 1fr 2fr 2fr', padding: '25px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                            <p style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>{line.description}</p>
                            <p style={{ fontSize: '13px', fontWeight: '900', textAlign: 'center', opacity: 0.4 }}>{line.quantity}</p>
                            <p style={{ fontSize: '13px', fontWeight: '700', textAlign: 'right' }}>{line.unitPrice.toFixed(2).replace('.', ',')} €</p>
                            <p style={{ fontSize: '14px', fontWeight: '900', textAlign: 'right' }}>{(line.quantity * line.unitPrice).toFixed(2).replace('.', ',')} €</p>
                        </div>
                    ))}
                </div>

                {/* Total & Summary Area */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ width: '350px' }}>
                        <p style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px', color: '#a1a1aa' }}>RÈGLEMENT & BANQUE</p>
                        <div style={{ background: '#000', color: '#fff', padding: '30px', borderRadius: '12px' }}>
                            <p style={{ fontSize: '14px', fontWeight: '900', marginBottom: '15px', color: '#fff' }}>REVOLUT STUDIO</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>IBAN (ESPAGNE)</p>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff', letterSpacing: '1px', marginBottom: '10px' }}>BE59 9675 0891 6526</p>
                                <p style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase' }}>CODE BIC / SWIFT</p>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>TRWIBEB1XXX</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '280px', textAlign: 'right' }}>
                        <div style={{ padding: '0 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase' }}>TOTAL HT</span>
                                <span style={{ fontSize: '14px', fontWeight: '700' }}>{total.toFixed(2).replace('.', ',')} €</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid #eee' }}>
                                <span style={{ fontSize: '10px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase' }}>TAXES (TVA 0%)</span>
                                <span style={{ fontSize: '14px', fontWeight: '700' }}>0,00 €</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>TOTAL NET</span>
                                <span style={{ fontSize: '42px', fontWeight: '900', letterSpacing: '-2px', textTransform: 'uppercase', fontStyle: 'italic', color: '#000' }}>{total.toFixed(2).replace('.', ',')}€</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Legal */}
                <div style={{ position: 'absolute', bottom: '50px', left: '50px', right: '50px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', paddingTop: '30px' }}>
                        <div style={{ maxWidth: '450px' }}>
                            <p style={{ fontSize: '8px', fontWeight: '900', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>MENTIONS LÉGALES</p>
                            <p style={{ fontSize: '8px', fontWeight: '700', color: '#777', lineHeight: '1.6' }}>
                                TVA non applicable, article 293 B du Code général des impôts (CGI). En cas de retard de paiement, une indemnité forfaitaire de 40€ pour frais de recouvrement sera appliquée. Pénalités de retard : 10% par mois de retard. SIRET : 805131828 00010.
                            </p>
                        </div>
                        <div className="text-right">
                            <p style={{ fontSize: '9px', fontWeight: '900', letterSpacing: '4px' }}>MERCI POUR VOTRE CONFIANCE</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
