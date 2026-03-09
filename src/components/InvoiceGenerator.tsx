import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Printer, Trash2, Send, Loader, CheckCircle, AlertCircle, X, Mail, BookUser, ChevronDown, Save, Eye } from 'lucide-react';
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
    }, []);

    const saveCurrentClient = () => {
        if (!clientName.trim()) return;
        const existing = savedClients.find(c => c.email === clientEmail && c.name === clientName);
        if (existing) return; // already saved
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

    // Pre-fill email fields when client email changes
    useEffect(() => {
        setEmailTo(clientEmail);
        setEmailSubject(`Facture ${formattedInvoiceNumber} - Dropsiders`);
        setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre facture N° ${formattedInvoiceNumber} d'un montant de ${total.toFixed(2)} €.\n\nPour tout règlement, merci d'effectuer un virement sur le compte :\nRIB : BE59 9675 0891 6526\nBIC SWIFT : TRWIBEB1XXX\n\nCordialement,\nCUENCA ALEXANDRE`);
    }, [clientEmail, clientName]);

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

            // Force visibility for capture
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

            // Reset visibility
            invoiceEl.style.display = '';
            invoiceEl.style.position = '';
            invoiceEl.style.top = '';
            invoiceEl.style.left = '';
            invoiceEl.style.width = '';
            invoiceEl.style.zIndex = '';

            setPreviewImage(canvas.toDataURL('image/png'));
        } catch (e) {
            console.error('Preview Error:', e);
            setSendError("Erreur lors de la génération de l'aperçu");
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

            // Force visibility for capture
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

            // Reset visibility
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

            const pdfBase64 = pdf.output('datauristring'); // data:application/pdf;base64,...

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
            saveInvoiceNumber(invoiceNumber + 1); // auto-increment
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
        <div className="w-full flex-1 overflow-y-auto">
            {/* NO PRINT AREA: Form */}
            <div className="print:hidden p-8 max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-2xl font-black uppercase text-white italic tracking-widest flex items-center gap-2">
                        <FileText className="w-6 h-6 text-neon-cyan" />
                        Générateur de Facture
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={handlePreview}
                            className="px-5 py-3 bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Eye className="w-5 h-5" />
                            Aperçu
                        </button>
                        <button
                            onClick={() => {
                                setEmailTo(clientEmail);
                                setEmailSubject(`Facture ${formattedInvoiceNumber}`);
                                setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre facture N° ${formattedInvoiceNumber} d'un montant de ${total.toFixed(2)} €.\n\nPour tout règlement, merci d'effectuer un virement sur le compte :\nRIB : BE59 9675 0891 6526\nBIC SWIFT : TRWIBEB1XXX\n\nCordialement,\nCUENCA ALEXANDRE`);
                                setShowEmailModal(true);
                            }}
                            className="px-5 py-3 bg-neon-purple/20 text-neon-purple border border-neon-purple/50 hover:bg-neon-purple/40 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Send className="w-5 h-5" />
                            Envoyer par e-mail
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-5 py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan/40 rounded-xl font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimer / PDF
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase">Détails Facture</h3>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Numéro (démarre à 066)</label>
                            <input
                                type="number"
                                value={invoiceNumber}
                                onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-400 uppercase">Détails Client</h3>
                            <div className="flex items-center gap-2">
                                {savedClients.length > 0 && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowClientPicker(v => !v)}
                                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            <BookUser className="w-3.5 h-3.5" />
                                            Clients sauvegardés
                                            <ChevronDown className={`w-3 h-3 transition-transform ${showClientPicker ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {showClientPicker && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -8 }}
                                                    className="absolute right-0 top-full mt-1 w-72 bg-[#111] border border-white/10 rounded-2xl z-50 overflow-hidden shadow-2xl"
                                                >
                                                    <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                                                        {savedClients.map(client => (
                                                            <div
                                                                key={client.id}
                                                                className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl group cursor-pointer"
                                                            >
                                                                <div
                                                                    className="flex-1 min-w-0"
                                                                    onClick={() => loadClient(client)}
                                                                >
                                                                    <p className="text-sm font-bold text-white truncate">{client.name}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                                                                    className="p-1 text-gray-600 hover:text-neon-red transition-colors opacity-0 group-hover:opacity-100 shrink-0"
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
                                    title="Sauvegarder ce client"
                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-neon-green border border-neon-green/30 hover:bg-neon-green/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Nom / Entreprise</label>
                            <input
                                type="text"
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                                placeholder="Nom du client"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Adresse</label>
                            <input
                                type="text"
                                value={clientAddress}
                                onChange={e => setClientAddress(e.target.value)}
                                className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                                placeholder="Adresse complète"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Email</label>
                            <input
                                type="email"
                                value={clientEmail}
                                onChange={e => setClientEmail(e.target.value)}
                                className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                                placeholder="Client email"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase">Prestations</h3>
                    {lines.map((line) => (
                        <div key={line.id} className="flex gap-4 items-center">
                            <input
                                type="text"
                                value={line.description}
                                onChange={e => updateLine(line.id, 'description', e.target.value)}
                                className="flex-1 p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                                placeholder="Description"
                            />
                            <div className="w-24">
                                <input
                                    type="number"
                                    value={line.quantity}
                                    onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                                    placeholder="Qté"
                                />
                            </div>
                            <div className="w-32">
                                <input
                                    type="number"
                                    value={line.unitPrice}
                                    onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full p-2 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-cyan text-white"
                                    placeholder="Prix unitaire"
                                />
                            </div>
                            <button
                                onClick={() => removeLine(line.id)}
                                className="p-2 text-neon-red hover:bg-neon-red/10 rounded-lg transition-all"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addLine}
                        className="text-xs uppercase font-bold text-neon-cyan hover:bg-neon-cyan/10 px-4 py-2 rounded-lg flex items-center gap-2 border border-neon-cyan/20"
                    >
                        <Plus className="w-4 h-4" /> Ajouter une ligne
                    </button>

                    <div className="text-right mt-4 pt-4 border-t border-white/10">
                        <span className="text-gray-400 uppercase text-xs mr-4">Total à payer</span>
                        <span className="text-2xl font-black text-white">{total.toFixed(2)} €</span>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-3xl max-h-[90vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                                        <Eye className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase italic text-white tracking-tight">
                                        Aperçu de la Facture — <span className="text-gray-400">{formattedInvoiceNumber}</span>
                                    </h3>
                                </div>
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewImage(null); }}
                                    className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-gray-100 flex items-center justify-center min-h-[400px]">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-3 text-gray-500">
                                        <Loader className="w-8 h-8 animate-spin" />
                                        <p className="text-sm font-bold uppercase tracking-widest">Génération de l'aperçu...</p>
                                    </div>
                                ) : previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Aperçu facture"
                                        className="w-full h-auto rounded-2xl shadow-2xl"
                                    />
                                ) : null}
                            </div>

                            <div className="flex items-center gap-3 mt-4 shrink-0">
                                <button
                                    onClick={() => { setShowPreview(false); setPreviewImage(null); handlePrint(); }}
                                    className="flex-1 py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                >
                                    <Printer className="w-4 h-4" /> Imprimer
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setPreviewImage(null);
                                        setEmailTo(clientEmail);
                                        setEmailSubject(`Facture ${formattedInvoiceNumber}`);
                                        setEmailMessage(`Bonjour ${clientName || ''},\n\nVeuillez trouver en pièce jointe votre facture N° ${formattedInvoiceNumber} d'un montant de ${total.toFixed(2)} €.\n\nPour tout règlement, merci d'effectuer un virement sur le compte :\nRIB : BE59 9675 0891 6526\nBIC SWIFT : TRWIBEB1XXX\n\nCordialement,\nCUENCA ALEXANDRE`);
                                        setShowEmailModal(true);
                                    }}
                                    className="flex-1 py-3 bg-neon-purple text-white hover:bg-neon-purple/80 shadow-[0_0_20px_rgba(168,85,247,0.3)] rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                >
                                    <Send className="w-4 h-4" /> Envoyer par e-mail
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EMAIL MODAL */}
            <AnimatePresence>
                {showEmailModal && (

                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#111] border border-white/10 rounded-3xl p-8 w-full max-w-xl space-y-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-white to-neon-purple" />

                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-neon-purple/10 rounded-2xl border border-neon-purple/20">
                                        <Mail className="w-6 h-6 text-neon-purple" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic text-white tracking-tight">
                                        Envoyer la <span className="text-neon-purple">Facture</span>
                                    </h3>
                                </div>
                                <button
                                    onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }}
                                    className="p-2 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Destinataire *</label>
                                    <input
                                        type="email"
                                        value={emailTo}
                                        onChange={e => setEmailTo(e.target.value)}
                                        placeholder="email@client.com"
                                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-purple text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Objet</label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={e => setEmailSubject(e.target.value)}
                                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-purple text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Message</label>
                                    <textarea
                                        value={emailMessage}
                                        onChange={e => setEmailMessage(e.target.value)}
                                        rows={6}
                                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl outline-none focus:border-neon-purple text-white text-sm resize-none"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {sendStatus === 'error' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                                    >
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        {sendError}
                                    </motion.div>
                                )}
                                {sendStatus === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm"
                                    >
                                        <CheckCircle className="w-5 h-5 shrink-0" />
                                        Facture envoyée avec succès ! Numéro incrémenté.
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={generateAndSendPDF}
                                disabled={sendStatus === 'generating' || sendStatus === 'sending' || sendStatus === 'success'}
                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${sendStatus === 'success'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-neon-purple text-white hover:bg-neon-purple/80 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {sendStatus === 'generating' ? (
                                    <><Loader className="w-5 h-5 animate-spin" /> Génération du PDF...</>
                                ) : sendStatus === 'sending' ? (
                                    <><Loader className="w-5 h-5 animate-spin" /> Envoi en cours...</>
                                ) : sendStatus === 'success' ? (
                                    <><CheckCircle className="w-5 h-5" /> Envoyé !</>
                                ) : (
                                    <><Send className="w-5 h-5" /> Générer et envoyer la facture</>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PRINT AREA */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        color: black !important;
                        padding: 40px;
                        margin: 0;
                        display: block !important;
                    }
                    .print-border {
                        border-color: #e5e7eb !important;
                    }
                    .print-bg {
                        background-color: #f9fafb !important;
                    }
                }
                `}
            </style>

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-full max-w-4xl mx-auto bg-white text-black p-12 min-h-[1056px] font-sans">
                {/* Header */}
                <div className="flex justify-between items-start mb-16">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter mb-4">FACTURE</h1>
                        <p className="text-sm text-gray-500 font-bold mb-1">N° {formattedInvoiceNumber}</p>
                        <p className="text-sm text-gray-500 font-bold">Date : {new Date(date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold mb-2">CUENCA ALEXANDRE</h2>
                        <p className="text-sm">411 RUE DE BOUILLARGUES</p>
                        <p className="text-sm">30000 NIMES</p>
                        <p className="text-sm mt-2">SIREN : 805131828</p>
                        <p className="text-sm font-bold mt-2">ALEXFLEX30@GMAIL.COM</p>
                    </div>
                </div>

                {/* Client Info */}
                <div className="mb-16 print-bg p-6 rounded-lg print-border border border-gray-200">
                    <p className="text-xs uppercase text-gray-500 mb-2 font-bold tracking-widest">Facturé à</p>
                    <h3 className="text-xl font-bold mb-1">{clientName || 'Nom du client'}</h3>
                    <p className="text-sm mb-1">{clientAddress || 'Adresse du client'}</p>
                    <p className="text-sm">{clientEmail || 'Email du client'}</p>
                </div>

                {/* Table */}
                <div className="mb-16">
                    <div className="grid grid-cols-12 gap-4 border-b-2 border-black pb-2 mb-4">
                        <div className="col-span-6 font-bold uppercase text-xs tracking-widest">Description</div>
                        <div className="col-span-2 text-center font-bold uppercase text-xs tracking-widest">Qté</div>
                        <div className="col-span-2 text-right font-bold uppercase text-xs tracking-widest">Prix Unitaire</div>
                        <div className="col-span-2 text-right font-bold uppercase text-xs tracking-widest">Total</div>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-12 gap-4 print-border border-b border-gray-200 py-3 text-sm">
                            <div className="col-span-6">{line.description}</div>
                            <div className="col-span-2 text-center">{line.quantity}</div>
                            <div className="col-span-2 text-right">{line.unitPrice.toFixed(2)} €</div>
                            <div className="col-span-2 text-right font-bold">{(line.quantity * line.unitPrice).toFixed(2)} €</div>
                        </div>
                    ))}

                    <div className="flex justify-end mt-8">
                        <div className="w-1/3">
                            <div className="flex justify-between border-t-2 border-black pt-2">
                                <span className="font-bold">Total TTC</span>
                                <span className="font-black text-xl">{total.toFixed(2)} €</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 italic text-right">TVA non applicable, art. 293 B du CGI</p>
                        </div>
                    </div>
                </div>

                {/* Footer details (RIB etc) */}
                <div className="mt-24 pt-8 print-border border-t border-gray-200">
                    <p className="text-xs font-bold uppercase tracking-widest mb-4">Informations de paiement</p>
                    <p className="text-sm"><span className="font-bold">RIB :</span> BE59 9675 0891 6526</p>
                    <p className="text-sm"><span className="font-bold">BIC SWIFT :</span> TRWIBEB1XXX</p>
                    <p className="text-xs text-gray-500 mt-4">Veuillez indiquer le numéro de facture en référence lors de votre virement.</p>
                </div>
            </div>
        </div>
    );
}

export default InvoiceGenerator;
