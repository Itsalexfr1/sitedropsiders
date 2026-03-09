import { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Trash2, Send, Loader, CheckCircle, AlertCircle, X, Mail, BookUser, Save, Eye, Phone, User, Building2, CreditCard } from 'lucide-react';
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
    }, [clientEmail, clientName, invoiceNumber, date]);

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
        <div className="w-full flex-1 overflow-y-auto bg-[#050505] font-sans text-white">
            {/* UI PART - FORM AREA */}
            <div className="print:hidden p-8 max-w-6xl mx-auto space-y-12">
                <div className="flex items-center justify-between flex-wrap gap-6 border-b border-white/5 pb-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white flex items-center justify-center rounded-2xl">
                            <span className="text-black text-3xl font-black">C</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter">
                                CUENCA <span className="text-white/40">ALEXANDRE</span>
                            </h2>
                            <p className="text-gray-500 text-[10px] font-black tracking-[0.3em] uppercase">Conseil & Prestations Créatives</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <button
                            onClick={handlePreview}
                            className="px-6 py-4 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Eye className="w-5 h-5" /> Aperçu
                        </button>
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="px-8 py-4 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl"
                        >
                            <Send className="w-5 h-5" /> Envoyer
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-4 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Printer className="w-5 h-5" /> Imprimer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white/[0.03] p-8 rounded-[32px] border border-white/5 space-y-6">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2 underline underline-offset-4 decoration-white/20">IDENTITÉ ÉMETTEUR</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                                    <p className="text-[9px] text-gray-600 uppercase font-black">Coordonnées</p>
                                    <p className="text-xs text-white font-bold leading-loose">411 RUE DE BOUILLARGUES<br />30000 NIMES</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] text-gray-600 uppercase font-black ml-1">Contact</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            value={userPhone}
                                            onChange={e => saveUserPhone(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm text-white w-full font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] p-8 rounded-[32px] border border-white/5 space-y-6">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] underline underline-offset-4 decoration-white/20">MÉTADONNÉES</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Facture N°</label>
                                    <input
                                        type="number"
                                        value={invoiceNumber}
                                        onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                        className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-white text-white text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Date d'édition</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none focus:border-white text-white text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white/[0.03] p-10 rounded-[40px] border border-white/5 space-y-10">
                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">DESTINATAIRE</h3>
                                <div className="flex items-center gap-3">
                                    {savedClients.length > 0 && (
                                        <div className="relative">
                                            <button onClick={() => setShowClientPicker(v => !v)} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5 transition-all">
                                                <BookUser className="w-4 h-4" /> ANNIARE
                                            </button>
                                            <AnimatePresence>
                                                {showClientPicker && (
                                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 top-full mt-3 w-80 bg-[#0c0c0c] border border-white/10 rounded-3xl z-50 overflow-hidden shadow-2xl">
                                                        <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
                                                            {savedClients.map(client => (
                                                                <div key={client.id} className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl group cursor-pointer" onClick={() => loadClient(client)}>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-bold text-white truncate">{client.name}</p>
                                                                        <p className="text-[10px] text-gray-500 truncate">{client.email}</p>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }} className="p-2 text-gray-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
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
                                    <button onClick={saveCurrentClient} disabled={!clientName.trim()} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-10 transition-all">
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[9px] text-gray-600 uppercase font-black mb-3 ml-1">Nom / Entreprise</label>
                                        <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex items-center gap-4">
                                            <div className="p-3 bg-white/5 rounded-xl"><Building2 className="w-5 h-5 text-gray-500" /></div>
                                            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full font-bold" placeholder="Nom du client" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-gray-600 uppercase font-black mb-3 ml-1">Email de contact</label>
                                        <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex items-center gap-4">
                                            <div className="p-3 bg-white/5 rounded-xl"><Mail className="w-5 h-5 text-gray-500" /></div>
                                            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full" placeholder="email@client.com" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] text-gray-600 uppercase font-black mb-3 ml-1">Adresse Facturation</label>
                                    <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} rows={5} className="w-full p-6 bg-white/5 border border-white/5 rounded-[32px] outline-none focus:border-white/20 text-white text-sm font-medium resize-none leading-relaxed" placeholder="Lieu de résidence..." />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.03] p-10 rounded-[40px] border border-white/5 space-y-10">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] border-b border-white/5 pb-6">DÉTAILS DES PRESTATIONS</h3>
                            <div className="space-y-4">
                                {lines.map((line) => (
                                    <div key={line.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-3xl border border-white/5 group transition-all">
                                        <input type="text" value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} className="flex-1 min-w-[200px] px-3 bg-transparent border-none outline-none text-sm text-white font-bold" placeholder="Description courte" />
                                        <div className="flex items-center gap-5">
                                            <div className="w-20">
                                                <input type="number" value={line.quantity} onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full p-3 bg-black/40 border border-white/5 rounded-2xl outline-none text-center text-sm text-white font-black" />
                                            </div>
                                            <div className="w-36 bg-black/40 p-3 rounded-2xl flex items-center border border-white/5">
                                                <input type="number" value={line.unitPrice} onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent border-none outline-none text-right text-sm text-white px-2 font-black" />
                                                <span className="text-gray-600 text-[10px] font-black tracking-widest pl-1">€</span>
                                            </div>
                                            <button onClick={() => removeLine(line.id)} className="p-3 text-red-900/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-10">
                                <button onClick={addLine} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/40 hover:bg-white/10 transition-all">
                                    <Plus className="w-4 h-4" /> AJOUTER LIGNE
                                </button>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-2">TOTAL TTC À RÉGLER</p>
                                    <p className="text-6xl font-black text-white italic tracking-tighter">{total.toFixed(2)}€</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl print:hidden">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-5xl h-full flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-3xl font-black uppercase italic tracking-tight">RENDU HAUTE DÉFINITION</h3>
                                <button onClick={() => { setShowPreview(false); setPreviewImage(null); }} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl">
                                    <X className="w-7 h-7" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto rounded-[48px] border border-white/10 bg-[#080808] p-10 flex items-center justify-center shadow-2xl">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-6 text-white/20 animate-pulse">
                                        <Loader className="w-16 h-16 animate-spin" />
                                        <p className="text-xs font-black tracking-[1em] uppercase">Processing Template</p>
                                    </div>
                                ) : previewImage ? (
                                    <img src={previewImage} alt="Preview" className="max-w-full h-auto rounded-3xl" />
                                ) : null}
                            </div>
                            <div className="flex gap-6 mt-10">
                                <button onClick={() => { setShowPreview(false); handlePrint(); }} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-[32px] font-black uppercase">IMPRIMER</button>
                                <button onClick={() => { setShowPreview(false); setShowEmailModal(true); }} className="flex-1 py-6 bg-white text-black rounded-[32px] font-black uppercase">EXPÉDIER PAR EMAIL</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl print:hidden">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#0a0a0a] border border-white/10 rounded-[48px] p-10 w-full max-w-2xl space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">EXPÉDITION DOC</h3>
                                <button onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }} className="p-4 bg-white/5 rounded-2xl"><X className="w-7 h-7" /></button>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">DESTINATAIRE (TO)</label>
                                    <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} className="w-full p-5 bg-white/5 border border-white/10 rounded-3xl outline-none font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">MESSAGE</label>
                                    <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)} rows={7} className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl outline-none text-sm resize-none" />
                                </div>
                            </div>
                            {sendStatus === 'error' && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">{sendError}</div>}
                            <button onClick={generateAndSendPDF} disabled={sendStatus !== 'idle' && sendStatus !== 'error'} className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase shadow-white/10 shadow-lg">
                                {sendStatus === 'generating' || sendStatus === 'sending' ? <Loader className="animate-spin inline mr-2" /> : <Send className="inline mr-2" />}
                                VALIDER ET ENVOYER
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT AREA - THE NEW TEMPLATE (NOMADE STYLE) */}
            <style>
                {`
                @media print {
                    @page { margin: 0; size: A4; }
                    body > * { display: none !important; }
                    body #printable-invoice { display: block !important; position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
                }
                `}
            </style>

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-[794px] bg-white text-black p-[50px] min-h-[1123px] font-sans" style={{ backgroundColor: '#ffffff', color: '#000000', position: 'relative' }}>
                {/* Visual Elements (Pink Shapes) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '15px', height: '100%', backgroundColor: '#fdf2f2' }} />
                <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '60px', height: '60px', backgroundColor: '#fdf2f2', display: 'flex', flexWrap: 'wrap' }}>
                    <div style={{ width: '30px', height: '30px', backgroundColor: '#f9dada', opacity: 0.6 }} />
                    <div style={{ width: '30px', height: '30px' }} />
                    <div style={{ width: '30px', height: '30px' }} />
                    <div style={{ width: '30px', height: '30px', backgroundColor: '#f9dada' }} />
                </div>

                {/* Header Grid */}
                <div className="flex justify-between items-start mb-16 pt-10">
                    <div className="flex items-center gap-4">
                        <div style={{ border: '2.5px solid #000', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="font-black text-2xl" style={{ transform: 'scaleX(0.9)' }}>C</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black uppercase mb-[-4px]" style={{ letterSpacing: '-0.03em' }}>CUENCA</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: '#000' }}>Conseil & Créa</p>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-[90px] font-black uppercase leading-none tracking-tighter" style={{ transform: 'scaleY(1.2)', display: 'inline-block' }}>FACTURE</h1>
                    </div>
                </div>

                {/* Meta Data Row */}
                <div className="flex justify-between items-end border-b-2 border-black pb-8 mb-12">
                    <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase">DATE : {new Date(date).toLocaleDateString('fr-FR')}</p>
                        <p className="text-[11px] font-black uppercase">ÉCHÉANCE : {new Date(new Date(date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[15px] font-black uppercase">FACTURE N° : {formattedInvoiceNumber}</p>
                    </div>
                </div>

                {/* Addresses Grid */}
                <div className="grid grid-cols-2 gap-20 mb-20">
                    <div>
                        <p className="text-[11px] font-black uppercase mb-4 border-b border-gray-200 pb-1 w-fit">ÉMETTEUR :</p>
                        <p className="text-sm font-black mb-1">CUENCA ALEXANDRE</p>
                        <div className="text-xs font-bold leading-relaxed text-gray-700 space-y-1">
                            <p>{userPhone}</p>
                            <p>alexflex30@gmail.com</p>
                            <p>411 RUE DE BOUILLARGUES</p>
                            <p>30000 NIMES</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-black uppercase mb-4 border-b border-gray-200 pb-1 w-fit ml-auto">DESTINATAIRE :</p>
                        <p className="text-sm font-black mb-1 uppercase">{clientName || 'CLIENT INCONNU'}</p>
                        <div className="text-xs font-bold leading-relaxed text-gray-700 space-y-1">
                            <p>{clientEmail.toLowerCase()}</p>
                            <div className="whitespace-pre-line">{clientAddress}</div>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="mb-16">
                    <div className="grid grid-cols-12 gap-0 border-b border-black pb-3 mb-6">
                        <div className="col-span-7 text-[11px] font-black uppercase">Description :</div>
                        <div className="col-span-2 text-right text-[11px] font-black uppercase">Prix Unitaire :</div>
                        <div className="col-span-1 text-right text-[11px] font-black uppercase">Quantité :</div>
                        <div className="col-span-2 text-right text-[11px] font-black uppercase">Total :</div>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-0 py-5 border-b border-gray-100 items-baseline">
                            <div className="col-span-7 font-bold text-sm" style={{ color: '#000' }}>{line.description}</div>
                            <div className="col-span-2 text-right font-medium text-sm">{line.unitPrice.toFixed(2).replace('.', ',')}€</div>
                            <div className="col-span-1 text-right font-medium text-sm">{line.quantity}</div>
                            <div className="col-span-2 text-right font-black text-sm">{(line.quantity * line.unitPrice).toFixed(2).replace('.', ',')}€</div>
                        </div>
                    ))}
                </div>

                {/* Summary Section */}
                <div className="flex justify-between items-start">
                    <div className="w-1/2">
                        <p className="text-[13px] font-black uppercase mb-4 underline decoration-2 underline-offset-4">RÈGLEMENT :</p>
                        <div className="text-[11px] font-bold space-y-2">
                            <p><span className="text-gray-400">Par virement bancaire :</span></p>
                            <p>Banque : Revolut</p>
                            <p>IBAN : BE59 9675 0891 6526</p>
                            <p>BIC : TRWIBEB1XXX</p>
                        </div>
                    </div>
                    <div className="w-[220px] pt-4">
                        <div className="space-y-3">
                            <div className="flex justify-between text-[11px] font-black uppercase">
                                <span>TOTAL HT :</span>
                                <span>{(total).toFixed(2).replace('.', ',')}€</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-black uppercase border-b border-gray-100 pb-3">
                                <span className="text-gray-400">TVA 0% :</span>
                                <span>0,00€</span>
                            </div>
                            <div className="flex justify-between text-[17px] font-black uppercase pt-2">
                                <span>TOTAL TTC :</span>
                                <span>{(total).toFixed(2).replace('.', ',')}€</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Legal */}
                <div className="mt-32 pt-10 border-t border-gray-100">
                    <div className="space-y-4">
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed max-w-[500px]">
                            En cas de retard de paiement, une indemnité de 10% par jour de retard ainsi que des frais de recouvrement de 40 euros seront exigibles.
                        </p>
                        <p className="text-[10px] font-black text-gray-300">
                            TVA non applicable, art. 293 B du CGI • SIRET : 805131828 00010
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
