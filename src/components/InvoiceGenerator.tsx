import { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Trash2, Send, Loader, X, Mail, BookUser, Save, Eye, Phone, Building2 } from 'lucide-react';
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

    const formattedInvoiceNumber = `123-${invoiceNumber.toString().padStart(3, '0')}-${date.split('-')[0]}`;

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
                onclone: (clonedDoc) => {
                    const styles = clonedDoc.querySelectorAll('style');
                    styles.forEach(s => {
                        if (s.textContent) {
                            s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#000000');
                        }
                    });
                }
            });

            invoiceEl.style.display = '';
            invoiceEl.style.position = '';

            setPreviewImage(canvas.toDataURL('image/png'));
        } catch (e) {
            console.error('Preview Error:', e);
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
                onclone: (clonedDoc) => {
                    const styles = clonedDoc.querySelectorAll('style');
                    styles.forEach(s => {
                        if (s.textContent) {
                            s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#000000');
                        }
                    });
                }
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
            if (!res.ok || data.error) throw new Error(data.error || 'Erreur envoi');

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
        <div className="w-full flex-1 overflow-y-auto bg-[#080808] font-sans text-white">
            {/* UI PART - FORM AREA */}
            <div className="print:hidden p-8 max-w-6xl mx-auto space-y-12">
                <div className="flex items-center justify-between flex-wrap gap-8 border-b border-white/10 pb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl shadow-lg">
                            <span className="text-black text-4xl font-black">C</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-2">
                                CUENCA <span className="text-white/30">ALEXANDRE</span>
                            </h2>
                            <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">Studio de Création & Conseil</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <button
                            onClick={handlePreview}
                            className="px-6 py-4 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Eye className="w-5 h-5" /> Aperçu
                        </button>
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="px-10 py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-white/5"
                        >
                            <Send className="w-5 h-5" /> EXPÉDIER
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-4 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Printer className="w-5 h-5" /> Imprimer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-[#111] p-10 rounded-[40px] border border-white/5 space-y-8">
                            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] border-b border-white/5 pb-4">INFO ÉMETTEUR</h3>
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-gray-600 uppercase font-black ml-1">Ligne Directe</label>
                                    <div className="flex items-center gap-4 bg-white/5 p-5 rounded-3xl border border-white/5">
                                        <Phone className="w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={userPhone}
                                            onChange={e => saveUserPhone(e.target.value)}
                                            className="bg-transparent border-none outline-none text-base text-white w-full font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl space-y-2 border border-white/5">
                                    <p className="text-[10px] text-gray-600 uppercase font-black">Adresse Studio</p>
                                    <p className="text-sm text-white font-bold leading-relaxed italic">
                                        411 RUE DE BOUILLARGUES<br />30000 NIMES
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#111] p-10 rounded-[40px] border border-white/5 space-y-8">
                            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] border-b border-white/5 pb-4">LOGISTIQUE</h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase font-black mb-3 ml-1">N° de Facture</label>
                                    <input
                                        type="number"
                                        value={invoiceNumber}
                                        onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                        className="w-full p-5 bg-black/50 border border-white/10 rounded-[24px] outline-none focus:border-white text-white font-black text-xl"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase font-black mb-3 ml-1">Date Émission</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-5 bg-black/50 border border-white/10 rounded-[24px] outline-none focus:border-white text-white text-sm [color-scheme:dark] font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-[#111] p-12 rounded-[50px] border border-white/5 space-y-12 shadow-2xl">
                            <div className="flex items-center justify-between pb-8 border-b border-white/5">
                                <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">DESTINATAIRE</h3>
                                <div className="flex items-center gap-4">
                                    {savedClients.length > 0 && (
                                        <div className="relative">
                                            <button onClick={() => setShowClientPicker(v => !v)} className="flex items-center gap-3 text-[10px] font-black uppercase text-gray-500 border border-white/10 px-5 py-3 rounded-2xl hover:bg-white/5 transition-all">
                                                <BookUser className="w-5 h-5" /> ANNUAIRE
                                            </button>
                                            <AnimatePresence>
                                                {showClientPicker && (
                                                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute right-0 top-full mt-4 w-80 bg-[#0c0c0c] border border-white/10 rounded-[32px] z-[100] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,1)]">
                                                        <div className="p-4 space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                                                            {savedClients.map(client => (
                                                                <div key={client.id} className="flex items-center gap-4 p-5 hover:bg-white/5 rounded-3xl group cursor-pointer border border-transparent hover:border-white/10 transition-all" onClick={() => loadClient(client)}>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-black text-white truncate">{client.name}</p>
                                                                        <p className="text-[10px] text-gray-500 font-bold truncate mt-0.5">{client.email}</p>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }} className="p-2.5 text-red-900/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white/5 rounded-xl">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    <button onClick={saveCurrentClient} disabled={!clientName.trim()} className="p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 disabled:opacity-5 transition-all">
                                        <Save className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <label className="block text-[10px] text-gray-600 uppercase font-black mb-4 ml-1">Raison Sociale / Nom</label>
                                        <div className="bg-white/5 p-2 rounded-[28px] border border-white/5 flex items-center gap-4">
                                            <div className="p-4 bg-white/5 rounded-2xl"><Building2 className="w-6 h-6 text-gray-500" /></div>
                                            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="bg-transparent border-none outline-none text-lg text-white w-full font-black tracking-tight" placeholder="Client Name" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-600 uppercase font-black mb-4 ml-1">E-mail Destinataire</label>
                                        <div className="bg-white/5 p-2 rounded-[28px] border border-white/5 flex items-center gap-4">
                                            <div className="p-4 bg-white/5 rounded-2xl"><Mail className="w-6 h-6 text-gray-500" /></div>
                                            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="bg-transparent border-none outline-none text-base text-white w-full font-bold" placeholder="contact@pro.com" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-600 uppercase font-black mb-4 ml-1">Adresse de Facturation</label>
                                    <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={6} className="w-full p-8 bg-white/5 border border-white/5 rounded-[40px] outline-none focus:border-white/20 text-white font-medium resize-none leading-relaxed text-sm" placeholder="Rue, ville, CP..." />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#111] p-12 rounded-[50px] border border-white/5 space-y-12">
                            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] border-b border-white/5 pb-8">LIGNES DE SERVICES</h3>
                            <div className="space-y-6">
                                {lines.map((line) => (
                                    <div key={line.id} className="flex gap-6 items-center bg-white/5 p-5 rounded-[32px] border border-white/5 group hover:border-white/10 transition-all">
                                        <input type="text" value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} className="flex-1 min-w-[200px] px-4 bg-transparent border-none outline-none text-base text-white font-black" placeholder="Description de l'acte" />
                                        <div className="flex items-center gap-6">
                                            <div className="w-24">
                                                <input type="number" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full p-4 bg-black/50 border border-white/5 rounded-2xl outline-none text-center font-black" />
                                            </div>
                                            <div className="w-40 bg-black/50 p-4 rounded-2xl flex items-center border border-white/5">
                                                <input type="number" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-none outline-none text-right font-black px-2" />
                                                <span className="text-gray-600 font-black text-[10px] uppercase pl-1">EUR</span>
                                            </div>
                                            <button onClick={() => removeLine(line.id)} className="p-3.5 text-red-900/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-white/5 rounded-xl">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-10">
                                <button onClick={addLine} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/40 hover:bg-white/10 transition-all tracking-[0.2em]">
                                    <Plus className="w-5 h-5" /> ADD MISSION
                                </button>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-white/20 uppercase tracking-widest mb-3">GRAND TOTAL TTC</p>
                                    <p className="text-7xl font-black text-white italic tracking-tighter leading-none">{total.toFixed(2)}€</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/98 backdrop-blur-3xl print:hidden">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl h-full flex flex-col">
                            <div className="flex items-center justify-between mb-10 shrink-0">
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">PREVIEW TEMPLATE</h3>
                                <button onClick={() => { setShowPreview(false); setPreviewImage(null); }} className="p-5 bg-white/5 hover:bg-white/10 rounded-3xl transition-all hover:rotate-90">
                                    <X className="w-8 h-8" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto rounded-[60px] border border-white/10 bg-[#060606] p-12 flex items-center justify-center shadow-3xl">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-8 text-white/10 animate-pulse">
                                        <Loader className="w-24 h-24 animate-spin" />
                                        <p className="text-sm font-black tracking-[1.5em] uppercase">Rendering Graphic</p>
                                    </div>
                                ) : previewImage ? (
                                    <img src={previewImage} alt="Preview" className="max-w-full h-auto rounded-[32px] shadow-2xl" />
                                ) : null}
                            </div>
                            <div className="flex gap-8 mt-10 shrink-0">
                                <button onClick={() => { setShowPreview(false); handlePrint(); }} className="flex-1 py-8 bg-white/5 border border-white/20 rounded-[40px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">PRINT PROCESS</button>
                                <button onClick={() => { setShowPreview(false); setShowEmailModal(true); }} className="flex-1 py-8 bg-white text-black rounded-[40px] font-black uppercase tracking-[0.3em] hover:bg-gray-200 transition-all">SEND BY EMAIL</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/95 backdrop-blur-3xl print:hidden">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="bg-[#0a0a0a] border border-white/10 rounded-[60px] p-12 w-full max-w-2xl space-y-10 shadow-3xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">DISPATCH</h3>
                                <button onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }} className="p-5 bg-white/5 rounded-3xl"><X className="w-8 h-8" /></button>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-white/10 uppercase tracking-[0.5em] ml-2">RECIPIENT EMAIL</label>
                                    <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} className="w-full p-6 bg-white/5 border border-white/10 rounded-[30px] outline-none font-black text-lg focus:border-white/30" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-white/10 uppercase tracking-[0.5em] ml-2">MESSAGE BODY</label>
                                    <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={8} className="w-full p-8 bg-white/5 border border-white/10 rounded-[40px] outline-none text-base resize-none font-medium leading-relaxed" />
                                </div>
                            </div>
                            {sendStatus === 'error' && <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-xs font-black text-center italic uppercase">{sendError}</div>}
                            <button onClick={generateAndSendPDF} disabled={sendStatus !== 'idle' && sendStatus !== 'error'} className="w-full py-8 bg-white text-black rounded-[40px] font-black uppercase shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {sendStatus === 'generating' || sendStatus === 'sending' ? <Loader className="animate-spin inline mr-3 w-7 h-7" /> : <Send className="inline mr-3 w-7 h-7" />}
                                EXECUTE DISPATCH
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT AREA - THE NEW TEMPLATE (NOMADE STYLE) */}
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

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-[794px] bg-white text-black p-[60px] min-h-[1123px] font-sans" style={{ backgroundColor: '#ffffff', color: '#000000', position: 'relative', overflow: 'hidden' }}>
                {/* Visual Elements (Pink Shapes) from Nomade Template */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '18px', height: '100%', backgroundColor: '#fef2f2' }} />
                <div style={{ position: 'absolute', bottom: '30px', right: '30px', width: '80px', height: '80px', display: 'flex', flexWrap: 'wrap' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#fee2e2', opacity: 0.6 }} />
                    <div style={{ width: '40px', height: '40px' }} />
                    <div style={{ width: '40px', height: '40px' }} />
                    <div style={{ width: '40px', height: '40px', backgroundColor: '#fee2e2' }} />
                </div>

                {/* Header Grid */}
                <div className="flex justify-between items-start mb-20 pt-10">
                    <div className="flex items-center gap-6">
                        <div style={{ border: '3px solid #000', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px' }}>
                            <span className="font-black text-3xl" style={{ transform: 'scaleX(0.9)', color: '#000' }}>C</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase mb-[-4px]" style={{ letterSpacing: '-0.05em', color: '#000' }}>CUENCA</h1>
                            <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: '#000' }}>STUDIO CRÉATIF</p>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-[100px] font-black uppercase leading-none tracking-tighter" style={{ transform: 'scaleY(1.3)', display: 'inline-block', letterSpacing: '-0.03em', color: '#000' }}>FACTURE</h1>
                    </div>
                </div>

                {/* Meta Data Row */}
                <div className="flex justify-between items-end border-b-2 border-black pb-10 mb-14">
                    <div className="space-y-1.5 font-black text-[11px] uppercase">
                        <p>DATE : {new Date(date).toLocaleDateString('fr-FR')}</p>
                        <p>ÉCHÉANCE : {new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black uppercase" style={{ color: '#000' }}>FACTURE N° : {formattedInvoiceNumber}</p>
                    </div>
                </div>

                {/* Addresses Grid */}
                <div className="grid grid-cols-2 gap-24 mb-24">
                    <div>
                        <p className="text-[11px] font-black uppercase mb-5 border-b border-gray-100 pb-1.5 w-fit" style={{ color: '#000' }}>ÉMETTEUR :</p>
                        <p className="text-base font-black mb-1 uppercase">CUENCA ALEXANDRE</p>
                        <div className="text-xs font-bold leading-relaxed text-gray-500 space-y-1">
                            <p>{userPhone}</p>
                            <p>alexflex30@gmail.com</p>
                            <p>411 RUE DE BOUILLARGUES</p>
                            <p>30000 NIMES</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <p className="text-[11px] font-black uppercase mb-5 border-b border-gray-100 pb-1.5 w-fit" style={{ color: '#000' }}>DESTINATAIRE :</p>
                        <p className="text-base font-black mb-1 uppercase">{clientName || 'NC'}</p>
                        <div className="text-xs font-bold leading-relaxed text-gray-500 space-y-1">
                            {clientEmail && <p>{clientEmail.toLowerCase()}</p>}
                            <div className="whitespace-pre-line">{clientAddress}</div>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="mb-20">
                    <div className="grid grid-cols-12 gap-0 border-b-2 border-black pb-4 mb-8">
                        <div className="col-span-7 text-[11px] font-black uppercase" style={{ color: '#000' }}>Description :</div>
                        <div className="col-span-2 text-right text-[11px] font-black uppercase" style={{ color: '#000' }}>Prix Unitaire :</div>
                        <div className="col-span-1 text-center text-[11px] font-black uppercase" style={{ color: '#000' }}>Qté :</div>
                        <div className="col-span-2 text-right text-[11px] font-black uppercase" style={{ color: '#000' }}>Total :</div>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-0 py-6 border-b border-gray-50 items-baseline">
                            <div className="col-span-7 font-black text-base" style={{ color: '#000' }}>{line.description}</div>
                            <div className="col-span-2 text-right font-bold text-sm" style={{ color: '#52525b' }}>{line.unitPrice.toFixed(2).replace('.', ',')}€</div>
                            <div className="col-span-1 text-center font-bold text-sm" style={{ color: '#52525b' }}>{line.quantity}</div>
                            <div className="col-span-2 text-right font-black text-base" style={{ color: '#000' }}>{(line.quantity * line.unitPrice).toFixed(2).replace('.', ',')}€</div>
                        </div>
                    ))}
                </div>

                {/* Summary Section */}
                <div className="flex justify-between items-start">
                    <div className="w-1/2">
                        <p className="text-[13px] font-black uppercase mb-6" style={{ textDecoration: 'underline', textUnderlineOffset: '6px', textDecorationThickness: '2px', color: '#000' }}>RÈGLEMENT :</p>
                        <div className="text-xs font-bold space-y-2 text-gray-800">
                            <p><span style={{ color: '#a1a1aa', fontSize: '10px', textTransform: 'uppercase' }}>Virement bancaire</span></p>
                            <p className="font-black text-sm uppercase">Banque : Revolut</p>
                            <p className="font-black">IBAN : <span className="tracking-wide">BE59 9675 0891 6526</span></p>
                            <p className="font-black">BIC : <span className="tracking-wide">TRWIBEB1XXX</span></p>
                        </div>
                    </div>
                    <div className="w-[280px]">
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase">
                                <span style={{ color: '#a1a1aa' }}>TOTAL HT :</span>
                                <span style={{ color: '#000' }}>{(total).toFixed(2).replace('.', ',')}€</span>
                            </div>
                            <div className="flex justify-between text-xs font-black uppercase border-b border-gray-100 pb-4">
                                <span style={{ color: '#a1a1aa' }}>TVA 0% :</span>
                                <span style={{ color: '#000' }}>0,00€</span>
                            </div>
                            <div className="flex justify-between text-2xl font-black uppercase pt-4" style={{ color: '#000' }}>
                                <span>TOTAL TTC :</span>
                                <span>{(total).toFixed(2).replace('.', ',')}€</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer Disclaimer Disclaimer */}
                <div className="mt-32 pt-12 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-[550px] mb-4">
                        Conformément à l'article L 441-6 du code de commerce, des pénalités de retard sont exigibles le jour suivant la date de règlement figurant sur la facture dans le cas où les sommes dues sont réglées après cette date. Frais de recouvrement forfaitaire de 40€.
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#d1d5db' }}>
                        Auto-entrepreneur — TVA non applicable, art. 293 B du CGI — SIRET : 805131828 00010
                    </p>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
