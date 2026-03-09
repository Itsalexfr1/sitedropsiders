import { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Trash2, Send, Loader, CheckCircle, AlertCircle, X, Mail, BookUser, ChevronDown, Save, Eye, Phone, User, MapPin, Hash, Building2, CreditCard } from 'lucide-react';
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

    const formattedInvoiceNumber = `FACT-${date.split('-')[0]}-${invoiceNumber.toString().padStart(3, '0')}`;

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

            // Temporarily make it visible for capture BUT outside viewport
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
        <div className="w-full flex-1 overflow-y-auto bg-black font-sans">
            {/* UI PART - FORM AREA */}
            <div className="print:hidden p-8 max-w-6xl mx-auto space-y-12">
                <div className="flex items-center justify-between flex-wrap gap-6 border-b border-white/5 pb-10">
                    <div>
                        <h2 className="text-4xl font-black uppercase text-white tracking-tight flex items-center gap-3 italic">
                            CUENCA <span className="text-white/40 not-italic">ALEXANDRE</span>
                        </h2>
                        <p className="text-gray-500 text-xs mt-2 font-bold tracking-[0.2em] uppercase">Facturation Service & Conseil</p>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <button
                            onClick={handlePreview}
                            className="px-6 py-4 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Eye className="w-5 h-5" /> Aperçu
                        </button>
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
                        >
                            <Send className="w-5 h-5" /> Envoyer
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-4 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                        >
                            <Printer className="w-5 h-5" /> Imprimer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 space-y-6">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                <User className="w-3 h-3" /> Mon Profil
                            </h3>
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] text-gray-600 uppercase font-black ml-1">Téléphone Direct</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 focus-within:border-white/20 transition-all">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={userPhone}
                                            onChange={e => saveUserPhone(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm text-white w-full font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                                    <p className="text-[9px] text-gray-600 uppercase font-black">Siret</p>
                                    <p className="text-xs text-white font-bold tracking-widest">805131828 00010</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl space-y-1">
                                    <p className="text-[9px] text-gray-600 uppercase font-black">Adresse</p>
                                    <p className="text-xs text-white font-bold">411 RUE DE BOUILLARGUES<br />30000 NIMES</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 space-y-6">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Paramètres de Vente</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Numéro Chrono</label>
                                    <input
                                        type="number"
                                        value={invoiceNumber}
                                        onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                        className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl outline-none focus:border-white text-white text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Date Facturation</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl outline-none focus:border-white text-white text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Client & Destination</h3>
                                <div className="flex items-center gap-3">
                                    {savedClients.length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowClientPicker(v => !v)}
                                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-2xl transition-all"
                                            >
                                                <BookUser className="w-4 h-4" /> Annuaire
                                            </button>
                                            <AnimatePresence>
                                                {showClientPicker && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                        className="absolute right-0 top-full mt-3 w-80 bg-[#0c0c0c] border border-white/10 rounded-3xl z-50 overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
                                                    >
                                                        <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
                                                            {savedClients.map(client => (
                                                                <div
                                                                    key={client.id}
                                                                    className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl group cursor-pointer border border-transparent hover:border-white/5"
                                                                >
                                                                    <div className="flex-1 min-w-0" onClick={() => loadClient(client)}>
                                                                        <p className="text-sm font-bold text-white truncate">{client.name}</p>
                                                                        <p className="text-[10px] text-gray-500 truncate">{client.email}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                                                                        className="p-2 text-gray-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    >
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
                                    <button
                                        onClick={saveCurrentClient}
                                        disabled={!clientName.trim()}
                                        className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase text-white/40 disabled:opacity-10 transition-all"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Raison Sociale</label>
                                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                                            <div className="p-3 bg-white/5 rounded-xl text-gray-500"><Building2 className="w-5 h-5" /></div>
                                            <input
                                                type="text"
                                                value={clientName}
                                                onChange={e => setClientName(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-white w-full font-bold"
                                                placeholder="L'entreprise destinataire"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Email Client</label>
                                        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                                            <div className="p-3 bg-white/5 rounded-xl text-gray-500"><Mail className="w-5 h-5" /></div>
                                            <input
                                                type="email"
                                                value={clientEmail}
                                                onChange={e => setClientEmail(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-white w-full"
                                                placeholder="client@domaine.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] text-gray-600 uppercase font-black mb-2 ml-1">Adresse de facturation</label>
                                    <textarea
                                        value={clientAddress}
                                        onChange={e => setClientAddress(e.target.value)}
                                        rows={5}
                                        className="w-full p-6 bg-white/5 border border-white/5 rounded-[32px] outline-none focus:border-white/20 text-white text-sm resize-none font-medium leading-relaxed"
                                        placeholder="Adresse complète..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-10 rounded-[40px] border border-white/10 space-y-8">
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Détails Prestations</h3>
                            <div className="space-y-4">
                                {lines.map((line) => (
                                    <div key={line.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-[24px] border border-white/5 group hover:border-white/10 transition-all">
                                        <input
                                            type="text"
                                            value={line.description}
                                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                                            className="flex-1 min-w-[200px] px-4 py-2 bg-transparent border-none outline-none text-sm text-white font-bold"
                                            placeholder="Libellé du service"
                                        />
                                        <div className="flex items-center gap-4">
                                            <div className="w-20">
                                                <input
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full p-3 bg-black/40 border border-white/5 rounded-2xl outline-none text-center text-sm text-white font-black"
                                                />
                                            </div>
                                            <div className="w-36 bg-black/40 p-3 rounded-2xl flex items-center border border-white/5">
                                                <input
                                                    type="number"
                                                    value={line.unitPrice}
                                                    onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none outline-none text-right text-sm text-white px-2 font-black"
                                                />
                                                <span className="text-gray-600 text-xs font-bold">€</span>
                                            </div>
                                            <button
                                                onClick={() => removeLine(line.id)}
                                                className="p-3 text-gray-800 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-6">
                                <button
                                    onClick={addLine}
                                    className="px-6 py-3 bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Ajouter ligne
                                </button>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Net à payer</p>
                                    <p className="text-5xl font-black text-white tracking-tighter italic">{total.toFixed(2)}€</p>
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
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 40 }}
                            className="relative w-full max-w-5xl h-full flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                                        <Eye className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic text-white tracking-tight">Rendu Facture</h3>
                                        <p className="text-gray-500 text-[10px] font-black tracking-[0.4em] uppercase">{formattedInvoiceNumber}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewImage(null); }}
                                    className="p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl text-white transition-all hover:rotate-90"
                                >
                                    <X className="w-7 h-7" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto rounded-[48px] border border-white/10 bg-[#080808] p-10 flex items-center justify-center min-h-[600px] shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-6 animate-pulse text-white/20">
                                        <Loader className="w-16 h-16 animate-spin" />
                                        <p className="text-xs font-black uppercase tracking-[0.5em]">Génération du visuel...</p>
                                    </div>
                                ) : previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Aperçu facture"
                                        className="max-w-full h-auto rounded-3xl shadow-2xl border border-black/20"
                                    />
                                ) : (
                                    <div className="text-red-500 flex items-center gap-2">
                                        <AlertCircle /> Erreur de rendu
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6 mt-10 shrink-0">
                                <button
                                    onClick={() => { setShowPreview(false); handlePrint(); }}
                                    className="flex-1 py-6 bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                                >
                                    <Printer className="w-6 h-6" /> Imprimer direct
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setShowEmailModal(true);
                                    }}
                                    className="flex-1 py-6 bg-white text-black hover:bg-gray-200 rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                                >
                                    <Send className="w-6 h-6" /> Envoyer maintenant
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl print:hidden text-white">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-[48px] p-10 w-full max-w-2xl space-y-8 relative overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,1)]"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-white/5 rounded-[32px] border border-white/10">
                                        <Mail className="w-10 h-10 text-white" />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Expédition</h3>
                                </div>
                                <button
                                    onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }}
                                    className="p-4 hover:bg-white/5 rounded-[24px] text-gray-700 transition-colors"
                                >
                                    <X className="w-8 h-8" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">Destinataire</label>
                                    <input
                                        type="email"
                                        value={emailTo}
                                        onChange={e => setEmailTo(e.target.value)}
                                        className="w-full p-5 bg-white/5 border border-white/10 rounded-3xl outline-none focus:border-white/20 text-white font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-white/20 uppercase tracking-[0.4em] ml-2">Message</label>
                                    <textarea
                                        value={emailMessage}
                                        onChange={e => setEmailMessage(e.target.value)}
                                        rows={7}
                                        className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl outline-none focus:border-white/20 text-white text-sm font-medium resize-none leading-relaxed"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {sendStatus === 'error' && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-xs font-bold text-center flex items-center justify-center gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" /> {sendError}
                                    </motion.div>
                                )}
                                {sendStatus === 'success' && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-green-500/10 border border-green-500/20 rounded-3xl text-green-500 text-xs font-bold text-center flex items-center justify-center gap-3">
                                        <CheckCircle className="w-5 h-5 flex-shrink-0" /> Facture transmise avec succès !
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={generateAndSendPDF}
                                disabled={sendStatus !== 'idle' && sendStatus !== 'error'}
                                className="w-full py-6 bg-white text-black rounded-[32px] font-black uppercase tracking-widest flex items-center justify-center gap-4 transition-all disabled:opacity-50 hover:bg-gray-100 shadow-[0_15px_60px_rgba(255,255,255,0.15)]"
                            >
                                {sendStatus === 'generating' || sendStatus === 'sending' ? (
                                    <><Loader className="w-7 h-7 animate-spin" /> Transmission...</>
                                ) : sendStatus === 'success' ? (
                                    <><CheckCircle className="w-7 h-7" /> Terminé</>
                                ) : (
                                    <><Send className="w-7 h-7" /> Valider l'envoi</>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT AREA - ULTRA PREMIUM MINIMALIST DESIGN */}
            <style>
                {`
                @media print {
                    body > * { display: none !important; }
                    body #printable-invoice { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; }
                    #printable-invoice {
                        visibility: visible !important;
                        position: absolute; left: 0; top: 0; width: 100%;
                        background: white !important; color: black !important;
                        padding: 0; margin: 0;
                        font-family: 'Inter', 'Helvetica', 'Arial', sans-serif !important;
                    }
                    /* Removes Dropsiders from the print header/footer */
                    @page { margin: 1cm; size: auto; }
                }
                `}
            </style>

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-[794px] bg-white text-black p-[60px] min-h-[1123px] font-sans" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
                {/* Minimalist Top Header */}
                <div className="flex justify-between items-start mb-20">
                    <div>
                        <h1 className="text-5xl font-black tracking-tight mb-2 italic" style={{ color: '#000000' }}>FACTURE</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#a1a1aa' }}>DOCUMENT OFFICIEL</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black uppercase mb-2 tracking-tight" style={{ color: '#000000' }}>CUENCA ALEXANDRE</h2>
                        <div className="text-[11px] font-bold space-y-0.5" style={{ color: '#71717a' }}>
                            <p>411 RUE DE BOUILLARGUES</p>
                            <p>30000 NIMES</p>
                            <p className="pt-2 font-black text-black" style={{ color: '#000000' }}>{userPhone}</p>
                            <p className="text-[9px]" style={{ color: '#a1a1aa' }}>SIRET : 805131828 00010</p>
                        </div>
                    </div>
                </div>

                {/* Info Blocks Grid */}
                <div className="flex justify-between mb-24 items-end">
                    <div className="w-1/2">
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-4" style={{ color: '#a1a1aa' }}>Facturé à</p>
                        <h3 className="text-2xl font-black uppercase mb-1 tracking-tight" style={{ color: '#000000' }}>{clientName || 'CLIENT'}</h3>
                        <div className="text-xs font-bold leading-relaxed max-w-[280px] whitespace-pre-line" style={{ color: '#52525b' }}>
                            {clientAddress || 'ADRESSE'}
                        </div>
                        {clientEmail && <p className="text-xs font-black mt-2 underline" style={{ color: '#000000' }}>{clientEmail.toLowerCase()}</p>}
                    </div>
                    <div className="text-right space-y-4">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#a1a1aa' }}>Numéro</p>
                            <p className="text-sm font-black" style={{ color: '#000000' }}>{formattedInvoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#a1a1aa' }}>Date</p>
                            <p className="text-sm font-black" style={{ color: '#000000' }}>{new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="mb-20">
                    <div className="grid grid-cols-12 gap-0 pb-3 mb-6" style={{ borderBottom: '3px solid #000000' }}>
                        <div className="col-span-7 text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#000000' }}>Description des prestations</div>
                        <div className="col-span-1 text-center text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#000000' }}>Qté</div>
                        <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#000000' }}>Unitaire HT</div>
                        <div className="col-span-2 text-right text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: '#000000' }}>Montant</div>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-0 py-6" style={{ borderBottom: '1px solid #f4f4f5' }}>
                            <div className="col-span-7 font-bold text-base pr-6" style={{ color: '#18181b' }}>{line.description || 'Prestation sans titre'}</div>
                            <div className="col-span-1 text-center font-black pt-1" style={{ color: '#52525b' }}>{line.quantity}</div>
                            <div className="col-span-2 text-right font-bold pt-1" style={{ color: '#52525b' }}>{line.unitPrice.toFixed(2).replace('.', ',')} €</div>
                            <div className="col-span-2 text-right font-black text-lg" style={{ color: '#000000' }}>{(line.quantity * line.unitPrice).toFixed(2).replace('.', ',')} €</div>
                        </div>
                    ))}
                </div>

                {/* Total Section */}
                <div className="flex justify-end pt-10">
                    <div className="w-[300px]">
                        <div className="flex justify-between items-center bg-black p-6 rounded-2xl" style={{ backgroundColor: '#000000' }}>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Total Net à payer</span>
                            <span className="text-2xl font-black text-white">{(total).toFixed(2).replace('.', ',')} €</span>
                        </div>
                        <p className="text-[9px] text-right uppercase font-black tracking-tight mt-4" style={{ color: '#a1a1aa' }}>
                            TVA non applicable, ART. 293 B du CGI
                        </p>
                    </div>
                </div>

                {/* Payment Info Footer */}
                <div className="mt-auto pt-16" style={{ borderTop: '2px solid #000000' }}>
                    <div className="grid grid-cols-3 gap-10">
                        <div className="col-span-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: '#a1a1aa' }}>Coordonnées Bancaires</p>
                            <div className="bg-[#f8f8f8] p-5 rounded-2xl flex items-center gap-6" style={{ backgroundColor: '#f8f8f8' }}>
                                <div className="p-3 bg-white rounded-xl shadow-sm"><CreditCard className="w-6 h-6" /></div>
                                <div className="space-y-1 font-black text-[11px] uppercase tracking-wide" style={{ color: '#000000' }}>
                                    <p><span style={{ color: '#a1a1aa' }}>IBAN ESPAGNE :</span> BE59 9675 0891 6526</p>
                                    <p><span style={{ color: '#a1a1aa' }}>BIC / SWIFT :</span> TRWIBEB1XXX</p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-4" style={{ color: '#a1a1aa' }}>Support</p>
                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic">
                                Pour toute question, merci de me contacter directement au via mon adresse mail personnelle.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
