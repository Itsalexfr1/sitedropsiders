import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Printer, Trash2, Send, Loader, CheckCircle, AlertCircle, X, Mail, BookUser, ChevronDown, Save, Eye, Phone, User, MapPin, Hash, Building2 } from 'lucide-react';
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
    const [userPhone, setUserPhone] = useState('07 62 05 45 89'); // Numéro définitif
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
        if (savedNumber) {
            setInvoiceNumber(parseInt(savedNumber, 10));
        }
        const savedPhone = localStorage.getItem('invoice_user_phone');
        if (savedPhone) {
            setUserPhone(savedPhone);
        }
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
        window.print();
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

            await new Promise(r => setTimeout(r, 400));

            const canvas = await html2canvas(invoiceEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 794,
            });

            invoiceEl.style.display = '';
            invoiceEl.style.position = '';
            invoiceEl.style.top = '';
            invoiceEl.style.left = '';
            invoiceEl.style.width = '';
            invoiceEl.style.zIndex = '';

            setPreviewImage(canvas.toDataURL('image/png'));
        } catch (e) {
            console.error('Preview Error:', e);
        } finally {
            setPreviewLoading(false);
        }
    };

    const formattedInvoiceNumber = `FACT-${date.split('-')[0]}-${invoiceNumber.toString().padStart(3, '0')}`;

    const generateAndSendPDF = async () => {
        if (!emailTo) {
            setSendError('Veuillez renseigner un email destinataire.');
            return;
        }

        setSendStatus('generating');
        setSendError('');

        try {
            const invoiceEl = invoiceRef.current;
            if (!invoiceEl) throw new Error('Élément de facture introuvable');

            invoiceEl.style.display = 'block';
            invoiceEl.style.position = 'fixed';
            invoiceEl.style.top = '0';
            invoiceEl.style.left = '-9999px';
            invoiceEl.style.width = '794px';
            invoiceEl.style.zIndex = '-9999';

            await new Promise(r => setTimeout(r, 400));

            const canvas = await html2canvas(invoiceEl, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: 794,
            });

            invoiceEl.style.display = '';
            invoiceEl.style.position = '';
            invoiceEl.style.top = '';
            invoiceEl.style.left = '';
            invoiceEl.style.width = '';
            invoiceEl.style.zIndex = '';

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

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
        <div className="w-full flex-1 overflow-y-auto bg-black">
            {/* NO PRINT AREA: Form */}
            <div className="print:hidden p-8 max-w-5xl mx-auto space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/5 pb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase text-white tracking-tighter flex items-center gap-3">
                            <User className="w-8 h-8 text-white" />
                            Facturation Personnelle
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 font-medium">CUENCA ALEXANDRE — Gestionnaire de prestations</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handlePreview}
                            className="px-5 py-3 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Eye className="w-5 h-5" /> Aperçu
                        </button>
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="px-5 py-3 bg-white text-black hover:bg-gray-200 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Send className="w-5 h-5" /> Envoyer
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-5 py-3 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Printer className="w-5 h-5" /> Imprimer
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COL: Emetteur & Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Mes Coordonnées</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl">
                                    <User className="w-4 h-4 text-gray-500" />
                                    <span>CUENCA ALEXANDRE</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl">
                                    <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                                    <span>411 RUE DE BOUILLARGUES<br />30000 NIMES</span>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] text-gray-500 uppercase ml-3">Téléphone</label>
                                    <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-transparent focus-within:border-white/20 transition-all">
                                        <div className="p-2.5 bg-white/5 rounded-lg">
                                            <Phone className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <input
                                            type="text"
                                            value={userPhone}
                                            onChange={e => saveUserPhone(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm text-white w-full"
                                            placeholder="Votre téléphone"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-xl">
                                    <Hash className="w-4 h-4 text-gray-500" />
                                    <span>SIREN : 805131828</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Réglages Facture</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase mb-1 ml-1">Numéro</label>
                                    <input
                                        type="number"
                                        value={invoiceNumber}
                                        onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-white text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase mb-1 ml-1">Date d'émission</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-white text-white text-sm [color-scheme:dark]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Client & Prestations */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Informations Client</h3>
                                <div className="flex items-center gap-2">
                                    {savedClients.length > 0 && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowClientPicker(v => !v)}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-xl transition-all"
                                            >
                                                <BookUser className="w-3.5 h-3.5" />
                                                Carnet
                                                <ChevronDown className={`w-3 h-3 transition-transform ${showClientPicker ? 'rotate-180' : ''}`} />
                                            </button>
                                            <AnimatePresence>
                                                {showClientPicker && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                        className="absolute right-0 top-full mt-2 w-72 bg-[#111] border border-white/10 rounded-2xl z-50 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                                    >
                                                        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                                            {savedClients.map(client => (
                                                                <div
                                                                    key={client.id}
                                                                    className="flex items-center gap-2 p-3 hover:bg-white/5 rounded-xl group cursor-pointer border border-transparent hover:border-white/5"
                                                                >
                                                                    <div className="flex-1 min-w-0" onClick={() => loadClient(client)}>
                                                                        <p className="text-sm font-bold text-white truncate">{client.name}</p>
                                                                        <p className="text-[10px] text-gray-500 truncate">{client.email}</p>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                                                                        className="p-1.5 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
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
                                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 hover:bg-white/10 px-3 py-2 rounded-xl transition-all disabled:opacity-20"
                                    >
                                        <Save className="w-3.5 h-3.5" />
                                        Sauver
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1 ml-1">Nom ou Entreprise</label>
                                        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl">
                                            <div className="p-2.5 bg-white/5 rounded-lg text-gray-500"><Building2 className="w-4 h-4" /></div>
                                            <input
                                                type="text"
                                                value={clientName}
                                                onChange={e => setClientName(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-white w-full"
                                                placeholder="EDM Music Ltd"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 uppercase mb-1 ml-1">Email Client</label>
                                        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl">
                                            <div className="p-2.5 bg-white/5 rounded-lg text-gray-500"><Mail className="w-4 h-4" /></div>
                                            <input
                                                type="email"
                                                value={clientEmail}
                                                onChange={e => setClientEmail(e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm text-white w-full"
                                                placeholder="contact@client.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] text-gray-500 uppercase mb-1 ml-1">Adresse Facturation</label>
                                    <textarea
                                        value={clientAddress}
                                        onChange={e => setClientAddress(e.target.value)}
                                        rows={4}
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-white text-white text-sm resize-none"
                                        placeholder="123 Avenue des Champs, 75000 Paris"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Détails des Prestations</h3>
                            <div className="space-y-3">
                                {lines.map((line) => (
                                    <div key={line.id} className="flex gap-4 items-start md:items-center flex-wrap md:flex-nowrap bg-white/5 p-2 rounded-2xl border border-white/5 group">
                                        <input
                                            type="text"
                                            value={line.description}
                                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                                            className="flex-1 min-w-[200px] p-2 bg-transparent border-none outline-none text-sm text-white"
                                            placeholder="Description de la prestation"
                                        />
                                        <div className="flex items-center gap-2">
                                            <div className="w-20">
                                                <input
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full p-2 bg-black/30 border border-white/5 rounded-xl outline-none text-center text-sm text-white"
                                                    placeholder="Qté"
                                                />
                                            </div>
                                            <div className="w-32 bg-black/30 p-2 rounded-xl flex items-center border border-white/5">
                                                <input
                                                    type="number"
                                                    value={line.unitPrice}
                                                    onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none outline-none text-right text-sm text-white px-1"
                                                />
                                                <span className="text-gray-500 text-xs">€</span>
                                            </div>
                                            <button
                                                onClick={() => removeLine(line.id)}
                                                className="p-2 text-gray-600 hover:text-red-500 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between pt-4">
                                <button
                                    onClick={addLine}
                                    className="text-[10px] uppercase font-black tracking-widest text-white/60 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/5 transition-all"
                                >
                                    <Plus className="w-4 h-4" /> Ajouter
                                </button>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Total TTC à régler</p>
                                    <p className="text-4xl font-black text-white">{total.toFixed(2)} €</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-4xl h-full max-h-[92vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                                        <Eye className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black uppercase italic text-white tracking-tight">Aperçu Facture</h3>
                                        <p className="text-gray-500 text-[10px] font-black tracking-widest uppercase">{formattedInvoiceNumber}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewImage(null); }}
                                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto rounded-[32px] border border-white/10 bg-white/5 p-4 flex items-center justify-center min-h-[500px] shadow-2xl">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-4 text-white/30">
                                        <Loader className="w-12 h-12 animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Génération du rendu haute qualité...</p>
                                    </div>
                                ) : previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Aperçu facture"
                                        className="max-w-full h-auto rounded-xl shadow-2xl border border-black/10"
                                    />
                                ) : null}
                            </div>

                            <div className="flex items-center gap-4 mt-6 shrink-0">
                                <button
                                    onClick={() => { setShowPreview(false); handlePrint(); }}
                                    className="flex-1 py-4 bg-white/5 text-white border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                                >
                                    <Printer className="w-5 h-5" /> Imprimer
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setShowEmailModal(true);
                                    }}
                                    className="flex-1 py-4 bg-white text-black hover:bg-gray-200 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                                >
                                    <Send className="w-5 h-5" /> Envoyer par email
                                </button>
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
                            className="bg-[#0c0c0c] border border-white/10 rounded-[40px] p-8 w-full max-w-xl space-y-6 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-white/5 rounded-[24px] border border-white/10">
                                        <Mail className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Envoi Email</h3>
                                </div>
                                <button
                                    onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }}
                                    className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">À l'attention de</label>
                                    <input
                                        type="email"
                                        value={emailTo}
                                        onChange={e => setEmailTo(e.target.value)}
                                        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-white/20 text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Message d'accompagnement</label>
                                    <textarea
                                        value={emailMessage}
                                        onChange={e => setEmailMessage(e.target.value)}
                                        rows={6}
                                        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl outline-none focus:border-white/20 text-white text-sm resize-none"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {sendStatus === 'error' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
                                        <AlertCircle className="w-5 h-5 mx-auto mb-2" /> {sendError}
                                    </motion.div>
                                )}
                                {sendStatus === 'success' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500 text-xs font-bold text-center">
                                        <CheckCircle className="w-5 h-5 mx-auto mb-2" /> Facture transmise avec succès !
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={generateAndSendPDF}
                                disabled={sendStatus !== 'idle' && sendStatus !== 'error'}
                                className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 hover:bg-gray-100 shadow-[0_10px_40px_rgba(255,255,255,0.15)]"
                            >
                                {sendStatus === 'generating' || sendStatus === 'sending' ? (
                                    <><Loader className="w-6 h-6 animate-spin" /> Traitement en cours...</>
                                ) : sendStatus === 'success' ? (
                                    <><CheckCircle className="w-6 h-6" /> Envoyé !</>
                                ) : (
                                    <><Send className="w-6 h-6" /> Valider et envoyer</>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT AREA - ULTRA CLEAN MINIMALIST DESIGN */}
            <style>
                {`
                @media print {
                    body * { visibility: hidden; }
                    #printable-invoice, #printable-invoice * { visibility: visible; }
                    #printable-invoice {
                        position: absolute; left: 0; top: 0; width: 100%;
                        background: white !important; color: black !important;
                        padding: 60px; margin: 0; display: block !important;
                        font-family: 'Helvetica', 'Arial', sans-serif !important;
                    }
                }
                `}
            </style>

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-[794px] bg-white text-black p-[60px] min-h-[1123px] font-sans">
                {/* Minimalist Header */}
                <div className="flex justify-between items-start mb-24">
                    <div>
                        <h1 className="text-7xl font-black tracking-tighter mb-8 leading-none">FACTURE</h1>
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Référence</p>
                            <p className="text-lg font-bold">{formattedInvoiceNumber}</p>
                        </div>
                        <div className="mt-4 space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Date d'émission</p>
                            <p className="text-lg font-bold">{new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black uppercase mb-4 tracking-tight">CUENCA ALEXANDRE</h2>
                        <div className="text-sm font-medium text-gray-600 space-y-1">
                            <p>411 RUE DE BOUILLARGUES</p>
                            <p>30000 NIMES</p>
                            <p className="pt-2 font-bold text-black">{userPhone}</p>
                            <p className="text-gray-400 text-xs">SIREN : 805131828</p>
                        </div>
                    </div>
                </div>

                {/* Info Client Box */}
                <div className="flex justify-between mb-24">
                    <div className="w-1/2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Destinataire</p>
                        <h3 className="text-2xl font-black uppercase mb-2 tracking-tight">{clientName || 'CLIENT'}</h3>
                        <div className="text-sm text-gray-600 font-medium leading-relaxed max-w-xs whitespace-pre-line">
                            {clientAddress || 'ADRESSE'}
                        </div>
                        {clientEmail && <p className="text-sm font-bold mt-2">{clientEmail.toLowerCase()}</p>}
                    </div>
                </div>

                {/* Prestations Table - Ultraclean */}
                <div className="mb-24">
                    <div className="grid grid-cols-12 gap-0 border-b-2 border-black pb-4 mb-4">
                        <div className="col-span-7 text-[10px] font-black uppercase tracking-widest">Prestation</div>
                        <div className="col-span-1 text-center text-[10px] font-black uppercase tracking-widest">Qté</div>
                        <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest">Prix HT</div>
                        <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest">Total</div>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-0 border-b border-gray-100 py-6 text-sm">
                            <div className="col-span-7 font-bold text-lg pr-4">{line.description || 'Service'}</div>
                            <div className="col-span-1 text-center font-medium pt-1.5">{line.quantity}</div>
                            <div className="col-span-2 text-right font-medium pt-1.5">{line.unitPrice.toFixed(2).replace('.', ',')} €</div>
                            <div className="col-span-2 text-right font-black text-lg">{(line.quantity * line.unitPrice).toFixed(2).replace('.', ',')} €</div>
                        </div>
                    ))}

                    <div className="flex justify-end mt-16 pt-8">
                        <div className="w-1/2">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="text-xs font-black uppercase tracking-widest">TOTAL NET À PAYER</span>
                                <span className="text-5xl font-black">{(total).toFixed(2).replace('.', ',')} €</span>
                            </div>
                            <p className="text-[9px] text-gray-400 text-right uppercase font-bold tracking-tighter">TVA non applicable, art. 293 B du CGI</p>
                        </div>
                    </div>
                </div>

                {/* Payment Info Footer - Minimal Card */}
                <div className="mt-auto pt-12 border-t border-gray-100">
                    <div className="flex gap-16">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Règlement par virement</p>
                            <div className="space-y-1 font-bold text-xs uppercase tracking-tight">
                                <p><span className="text-gray-400">RIB :</span> BE59 9675 0891 6526</p>
                                <p><span className="text-gray-400">BIC :</span> TRWIBEB1XXX</p>
                            </div>
                        </div>
                        <div className="max-w-[200px]">
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Notes</p>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium capitalize">
                                merci d'indiquer la référence <span className="font-bold text-black">{formattedInvoiceNumber}</span> lors de votre virement bancaire.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
