import { useState, useEffect, useRef } from 'react';
import { Plus, Printer, Trash2, Send, Loader, X, Mail, BookUser, Save, Eye, Phone, Building2, CreditCard, ChevronRight, History, CheckCircle, Clock } from 'lucide-react';
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

    // History & Tracking
    const [view, setView] = useState<'edit' | 'archive'>('edit');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/invoices');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) { console.error('History fetch error:', e); }
        finally { setIsLoadingHistory(false); }
    };

    useEffect(() => {
        const savedNumber = localStorage.getItem('dropsiders_last_invoice_number');
        if (savedNumber) setInvoiceNumber(parseInt(savedNumber, 10));
        const savedPhone = localStorage.getItem('invoice_user_phone');
        if (savedPhone) setUserPhone(savedPhone);
        fetchHistory();
    }, []);

    const togglePaid = async (id: number, currentPaid: boolean) => {
        try {
            const adminPass = (localStorage.getItem('admin_password') || '').trim();
            const res = await fetch('/api/invoices/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': adminPass
                },
                body: JSON.stringify({ id, paid: !currentPaid })
            });
            if (res.ok) {
                setHistory(prev => prev.map(inv => inv.id === id ? { ...inv, paid: !currentPaid } : inv));
            }
        } catch (e) { console.error('Toggle paid error:', e); }
    };

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
                // Force background if it's white to be explicitly white for the capture
                if (el.id === 'printable-invoice') {
                    el.style.backgroundColor = '#ffffff';
                    el.style.color = '#000000';
                }
            }
        });
    };

    const handlePreview = async () => {
        setPreviewLoading(true);
        setShowPreview(true);
        setPreviewImage(null);
        setSendError('');
        try {
            const invoiceEl = invoiceRef.current;
            if (!invoiceEl) throw new Error('Calculateur introuvable');

            // Create a dedicated container for capture to avoid any conflict
            const captureContainer = document.createElement('div');
            captureContainer.id = 'preview-portal';
            Object.assign(captureContainer.style, {
                position: 'fixed',
                left: '0',
                top: '0',
                width: '100vw',
                height: '200vh',
                backgroundColor: '#ffffff',
                zIndex: '999999',
                overflow: 'visible',
                padding: '40px'
            });

            const invoiceCopy = invoiceEl.cloneNode(true) as HTMLElement;
            invoiceCopy.id = 'preview-cloned-invoice';
            Object.assign(invoiceCopy.style, {
                display: 'block',
                visibility: 'visible',
                position: 'relative',
                margin: '0 auto',
                width: '794px',
                backgroundColor: '#ffffff',
                opacity: '1'
            });
            invoiceCopy.classList.remove('hidden');

            captureContainer.appendChild(invoiceCopy);
            document.body.appendChild(captureContainer);
            window.scrollTo(0, 0);

            // Wait for images and layout
            await new Promise(r => setTimeout(r, 3000));

            const canvas = await html2canvas(invoiceCopy, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                onclone: (clonedDoc) => {
                    sanitizeColors(clonedDoc);
                }
            });

            // Cleanup immediately
            if (document.body.contains(captureContainer)) {
                document.body.removeChild(captureContainer);
            }

            const dataUrl = canvas.toDataURL('image/png');
            if (dataUrl === 'data:,' || dataUrl.length < 30000) {
                throw new Error('Canevas vide généré');
            }

            setPreviewImage(dataUrl);
        } catch (e: any) {
            console.error('Preview Error:', e);
            setSendError('Rendu échoué: ' + e.message);
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

            // Create a dedicated container for capture to avoid any conflict
            const captureContainer = document.createElement('div');
            captureContainer.id = 'capture-portal';
            Object.assign(captureContainer.style, {
                position: 'fixed',
                left: '0',
                top: '0',
                width: '100vw',
                height: '200vh',
                backgroundColor: '#ffffff',
                zIndex: '999999',
                overflow: 'visible',
                padding: '40px'
            });

            const invoiceCopy = invoiceEl.cloneNode(true) as HTMLElement;
            invoiceCopy.id = 'cloned-invoice';
            Object.assign(invoiceCopy.style, {
                display: 'block',
                visibility: 'visible',
                position: 'relative',
                margin: '0 auto',
                width: '794px',
                backgroundColor: '#ffffff',
                opacity: '1'
            });
            invoiceCopy.classList.remove('hidden');

            captureContainer.appendChild(invoiceCopy);
            document.body.appendChild(captureContainer);
            window.scrollTo(0, 0);

            // Crucial wait for the DOM to settle and images to load
            await new Promise(r => setTimeout(r, 3000));

            const canvas = await html2canvas(invoiceCopy, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: true,
                onclone: (clonedDoc) => {
                    sanitizeColors(clonedDoc);
                }
            });

            // Cleanup immediately
            if (document.body.contains(captureContainer)) {
                document.body.removeChild(captureContainer);
            }

            if (!canvas || canvas.width < 100) {
                throw new Error('Échec technique de capture (Canevas nul ou trop petit)');
            }

            const imgData = canvas.toDataURL('image/png');
            // A meaningful A4 capture at scale 2 should be at least 100kb+ (133k characters in base64)
            if (imgData.length < 50000) {
                throw new Error(`Le rendu PDF est trop petit (${imgData.length} chars). Erreur de rendu probable.`);
            }

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            // Use PNG for maximum fidelity and to avoid black backgrounds in some PDF readers
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);

            const pdfBase64 = pdf.output('datauristring');

            setSendStatus('sending');

            const adminUser = (localStorage.getItem('admin_user') || '').trim();
            const adminPass = (localStorage.getItem('admin_password') || '').trim();
            const sessionId = (localStorage.getItem('admin_session') || '').trim();

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
                    pdfBase64: pdfBase64,
                    filename: `Facture_${formattedInvoiceNumber}.pdf`,
                    invoiceData: {
                        number: formattedInvoiceNumber,
                        client: clientName,
                        total: total,
                        date: date
                    }
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                const serverMsg = data.error || 'Erreur serveur';
                const detailMsg = data.details ? ` (${data.details})` : '';
                throw new Error(`${serverMsg}${detailMsg}`);
            }

            setSendStatus('success');
            fetchHistory(); // Refresh history
            setTimeout(() => {
                setSendStatus('idle');
                setShowEmailModal(false);
            }, 3000);
        } catch (e: any) {
            console.error('Send Error:', e);
            setSendStatus('error');
            setSendError(e.message);
        }
    };

    return (
        <div className="w-full h-full bg-[#050505] text-white font-sans overflow-hidden flex flex-col selection:bg-white/10">
            {/* ULTRA PREMIUM HEADER */}
            <div className="shrink-0 px-10 py-8 flex items-center justify-between bg-black/80 backdrop-blur-3xl z-50 border-b border-white/[0.03]">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-14 h-14 rounded-2xl bg-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 duration-500">
                            <span className="text-black font-black text-2xl tracking-tighter">CA</span>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-[-0.05em] leading-none mb-1">
                            STUDIO <span className="text-white/40 italic">EXPANSION</span>
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Sytème de Facturation v2.0</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-2xl ml-8">
                        <button
                            onClick={() => setView('edit')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${view === 'edit' ? 'bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <Plus className={`w-3 h-3 ${view === 'edit' ? 'text-black' : 'text-current'}`} />
                            Nouvelle
                        </button>
                        <button
                            onClick={() => setView('archive')}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${view === 'archive' ? 'bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <History className={`w-3 h-3 ${view === 'archive' ? 'text-black' : 'text-current'}`} />
                            Archive
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-6">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Utilisateur</span>
                        <span className="text-xs font-bold text-white/60">Alexandre Cuenca</span>
                    </div>

                    <button
                        onClick={handlePreview}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all flex items-center gap-3 group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Eye className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Scanner Aperçu</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                    >
                        <Printer className="w-5 h-5 text-white/20 group-hover:text-white" />
                    </button>

                    <div className="w-px h-8 bg-white/5 mx-2" />

                    <button
                        onClick={() => setShowEmailModal(true)}
                        className="group relative px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.15em] text-[11px] shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] transition-all flex items-center gap-3 active:scale-95"
                    >
                        <Send className="w-4 h-4" /> Finaliser Dispatch
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.02),transparent)]">
                <AnimatePresence mode="wait">
                    {view === 'edit' ? (
                        <motion.div
                            key="edit"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16"
                        >

                            {/* CONTROL CENTER */}
                            <div className="lg:col-span-4 space-y-10">
                                {/* Profile & Identity */}
                                <div className="bg-[#0c0c0c] border border-white/[0.03] rounded-[40px] p-10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                                        <Building2 className="w-32 h-32" />
                                    </div>

                                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-10 border-b border-white/5 pb-6">IDENTITÉ ÉMETTEUR</h3>

                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Contact Pro</label>
                                            <div className="bg-black/60 border border-white/5 rounded-2xl p-4 flex items-center gap-4 focus-within:border-white/20 transition-all">
                                                <Phone className="w-4 h-4 text-white/20" />
                                                <input
                                                    type="text"
                                                    value={userPhone}
                                                    onChange={e => saveUserPhone(e.target.value)}
                                                    className="bg-transparent border-none outline-none text-sm font-bold w-full text-white/80"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Référence Chrono</label>
                                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 group-hover:bg-white/[0.04] transition-colors">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-white/20 font-black text-sm italic">INV-</span>
                                                    <input
                                                        type="number"
                                                        value={invoiceNumber}
                                                        onChange={e => saveInvoiceNumber(parseInt(e.target.value) || 0)}
                                                        className="bg-transparent border-none outline-none text-4xl font-black w-full tracking-tighter text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Horodatage</label>
                                            <div className="bg-black/60 border border-white/5 rounded-2xl p-4">
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={e => setDate(e.target.value)}
                                                    className="bg-transparent border-none outline-none text-sm font-bold w-full [color-scheme:dark] text-white/80"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-white/5">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/20"><Save className="w-5 h-5" /></div>
                                            <div>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Status Légal</p>
                                                <p className="text-[10px] font-bold text-white/40 leading-relaxed">Auto-entrepreneur<br />SIRET : 805131828 00010</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Terminal Info */}
                                <div className="bg-gradient-to-br from-[#0c0c0c] to-black border border-white/[0.03] rounded-[40px] p-10">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-8 pb-6 border-b border-white/5">TERMINAL TRANSACTION</h3>
                                    <div className="space-y-6">
                                        <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 flex items-start gap-5">
                                            <CreditCard className="w-6 h-6 text-white/20 shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Canal Règlements</p>
                                                <p className="text-[11px] font-bold text-white/60 leading-relaxed italic">
                                                    Transferts SEPA / Revolut Business via Nîmes Hub.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">Network Security</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CONTENT CANVAS */}
                            <div className="lg:col-span-8 space-y-10 pb-20">

                                {/* CLIENT HUB */}
                                <div className="bg-[#0c0c0c] border border-white/[0.03] rounded-[48px] p-12 space-y-12 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">CLIENT & DESTINATION</h3>
                                        <div className="flex items-center gap-4">
                                            {savedClients.length > 0 && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setShowClientPicker(!showClientPicker)}
                                                        className="px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3"
                                                    >
                                                        <BookUser className="w-4 h-4 text-white/40" /> Carnet
                                                    </button>
                                                    <AnimatePresence>
                                                        {showClientPicker && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                                                className="absolute right-0 top-full mt-6 w-80 bg-[#0f0f0f] border border-white/[0.08] rounded-[32px] z-[100] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-3xl"
                                                            >
                                                                <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar-thin space-y-1">
                                                                    {savedClients.map(c => (
                                                                        <div key={c.id} className="p-5 hover:bg-white/[0.03] rounded-2xl cursor-pointer group flex items-center justify-between transition-colors" onClick={() => loadClient(c)}>
                                                                            <div className="overflow-hidden">
                                                                                <p className="text-xs font-black truncate text-white/80">{c.name}</p>
                                                                                <p className="text-[9px] text-white/20 font-bold tracking-wider mt-1">{c.email}</p>
                                                                            </div>
                                                                            <button onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }} className="p-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
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
                                                className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
                                            >
                                                <Plus className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Société / Entité</label>
                                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-5 focus-within:border-white/20 transition-all group">
                                                    <Building2 className="w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={clientName}
                                                        onChange={e => setClientName(e.target.value)}
                                                        placeholder="Label, Club, Festival..."
                                                        className="bg-transparent border-none outline-none font-bold w-full text-base placeholder:text-white/10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Email Facturation</label>
                                                <div className="bg-black/40 border border-white/5 p-5 rounded-2xl flex items-center gap-5 focus-within:border-white/20 transition-all group">
                                                    <Mail className="w-5 h-5 text-white/20 group-focus-within:text-white/60 transition-colors" />
                                                    <input
                                                        type="email"
                                                        value={clientEmail}
                                                        onChange={e => setClientEmail(e.target.value)}
                                                        placeholder="accounting@studio.com"
                                                        className="bg-transparent border-none outline-none text-base font-medium w-full placeholder:text-white/10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] ml-2">Siège Social / Adresse</label>
                                            <textarea
                                                value={clientAddress}
                                                onChange={e => setClientAddress(e.target.value)}
                                                rows={6}
                                                placeholder="Addresse complète du destinataire pour conformité légale..."
                                                className="bg-black/40 border border-white/5 p-6 rounded-[32px] outline-none text-sm w-full resize-none font-medium leading-relaxed focus:border-white/20 transition-all placeholder:text-white/10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* LINE ITEMS TERMINAL */}
                                <div className="bg-[#0c0c0c] border border-white/[0.03] rounded-[48px] p-12 space-y-10 shadow-2xl">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20">MANIFESTE DES PRESTATIONS</h3>
                                        <button
                                            onClick={addLine}
                                            className="px-6 py-2.5 rounded-full border border-white/10 hover:bg-white text-white hover:text-black text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" /> Nouvelle Unité
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {lines.map((line) => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                key={line.id}
                                                className="grid grid-cols-12 gap-6 items-center bg-black/40 p-5 rounded-[28px] border border-white/5 group hover:border-white/20 transition-all border-l-4 border-l-transparent hover:border-l-white"
                                            >
                                                <div className="col-span-12 md:col-span-7">
                                                    <input
                                                        type="text"
                                                        value={line.description}
                                                        onChange={e => updateLine(line.id, 'description', e.target.value)}
                                                        placeholder="Désignation de la mission..."
                                                        className="bg-transparent border-none outline-none text-base font-bold w-full px-2 text-white/90 placeholder:text-white/5"
                                                    />
                                                </div>
                                                <div className="col-span-4 md:col-span-2">
                                                    <div className="bg-white/[0.03] rounded-2xl p-4 text-center border border-white/5 focus-within:border-white/20 transition-colors">
                                                        <input
                                                            type="number"
                                                            value={line.quantity}
                                                            onChange={e => updateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                            className="bg-transparent border-none outline-none text-xs font-black w-full text-center text-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-span-6 md:col-span-2">
                                                    <div className="flex items-center gap-3 px-3">
                                                        <input
                                                            type="number"
                                                            value={line.unitPrice}
                                                            onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                            className="bg-transparent border-none outline-none text-right font-black w-full text-lg tracking-tight"
                                                        />
                                                        <span className="text-white/20 font-black text-xs">€</span>
                                                    </div>
                                                </div>
                                                <div className="col-span-2 md:col-span-1 text-right">
                                                    <button onClick={() => removeLine(line.id)} className="p-3 text-white/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 hover:scale-110">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* AGGREGATION AREA */}
                                    <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-10 border-t border-white/5">
                                        <div className="space-y-4 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">
                                                <ChevronRight className="w-4 h-4 text-white/40" /> Franchise de TVA (CGI 293B)
                                            </div>
                                            <p className="text-[11px] font-medium text-white/30 max-w-sm leading-relaxed">
                                                Calcul automatique basé sur un taux net de 0%.<br />
                                                Le montant final représente la somme totale à percevoir.
                                            </p>
                                        </div>
                                        <div className="text-right flex flex-col items-center md:items-end">
                                            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-white/10 block mb-4">TOTAL NET RÉGLÉ</span>
                                            <div className="relative">
                                                <div className="absolute -inset-4 bg-white/5 blur-3xl rounded-full opacity-50" />
                                                <span className="relative text-7xl font-black italic tracking-[-0.08em] leading-none text-white transition-all hover:scale-110 cursor-default inline-block">
                                                    {total.toFixed(2)}<span className="text-3xl ml-2 not-italic text-white/40 opacity-50 font-black">€</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="archive"
                            initial={{ opacity: 0, scale: 1.02 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className="max-w-[1400px] mx-auto"
                        >
                            <div className="bg-[#0c0c0c] border border-white/[0.03] rounded-[56px] p-16 space-y-12">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-5xl font-black uppercase tracking-[-0.05em] italic">Archive</h3>
                                        <p className="text-[10px] font-black tracking-[0.5em] text-white/20 mt-4 uppercase">Suivi des transmissions & règlements</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-6 py-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center min-w-[120px]">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Total Envoyé</span>
                                            <span className="text-xl font-bold">{history.length}</span>
                                        </div>
                                        <div className="px-6 py-4 bg-green-500/10 rounded-2xl border border-green-500/20 flex flex-col items-center min-w-[120px]">
                                            <span className="text-[9px] font-black text-green-500/40 uppercase tracking-widest mb-1">Payées</span>
                                            <span className="text-xl font-bold text-green-400">{history.filter(h => h.paid).length}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-[40px] border border-white/5 bg-black/40">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white/[0.02] border-b border-white/5">
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20">Référence</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20">Client</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20">Date</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20">Montant</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Status</th>
                                                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-white/20 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {isLoadingHistory ? (
                                                <tr>
                                                    <td colSpan={6} className="p-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-white/20">
                                                            <Loader className="w-8 h-8 animate-spin" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronisation de l'Archive...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : history.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-20 text-center text-white/10 font-black uppercase tracking-widest text-xs italic">
                                                        Aucune archive disponible
                                                    </td>
                                                </tr>
                                            ) : history.map((inv) => (
                                                <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors group">
                                                    <td className="p-8 font-black tabular-nums tracking-tighter text-lg">{inv.number}</td>
                                                    <td className="p-8">
                                                        <div className="font-bold text-white/80">{inv.client}</div>
                                                    </td>
                                                    <td className="p-8 text-white/40 font-medium">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                                                    <td className="p-8">
                                                        <span className="text-xl font-black italic">{inv.total.toFixed(2)}€</span>
                                                    </td>
                                                    <td className="p-8">
                                                        <div className="flex justify-center">
                                                            {inv.paid ? (
                                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 text-[10px] font-black uppercase italic">
                                                                    <CheckCircle className="w-3 h-3" /> Réglée
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 text-[10px] font-black uppercase italic">
                                                                    <Clock className="w-3 h-3" /> En attente
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-8 text-right">
                                                        <button
                                                            onClick={() => togglePaid(inv.id, inv.paid)}
                                                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${inv.paid ? 'bg-white/5 text-white/20 hover:text-white' : 'bg-white text-black hover:scale-105'} active:scale-95`}
                                                        >
                                                            {inv.paid ? 'Marquer Impayé' : 'Marquer Payé'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* PREVIEW MODAL LIGHTBOX */}
            <AnimatePresence>
                {showPreview && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl print:hidden">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="relative w-full max-w-6xl h-[90vh] flex flex-col gap-8"
                        >
                            <div className="flex items-center justify-between shrink-0 px-4">
                                <div>
                                    <h3 className="text-5xl font-black uppercase tracking-[-0.05em] italic">Visual Proof</h3>
                                    <p className="text-[10px] font-black tracking-[0.5em] text-white/20 mt-2">DÉTAILS DU RENDU PDF HAUTE DÉFINITION</p>
                                </div>
                                <button onClick={() => { setShowPreview(false); setPreviewImage(null); }} className="p-6 bg-white/5 hover:bg-white text-white hover:text-black rounded-3xl transition-all active:scale-95 group">
                                    <X className="w-10 h-10 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar rounded-[56px] border border-white/5 bg-black p-12 flex items-center justify-center shadow-3xl relative group/canvas">
                                {previewLoading ? (
                                    <div className="flex flex-col items-center gap-10 text-white/10">
                                        <div className="relative">
                                            <Loader className="w-24 h-24 animate-[spin_3s_linear_infinite]" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            </div>
                                        </div>
                                        <p className="text-xs font-black tracking-[1.5em] uppercase animate-pulse">GENERATING VECTOR DATA</p>
                                    </div>
                                ) : previewImage ? (
                                    <div className="relative">
                                        <div className="absolute -inset-10 bg-white/5 blur-[100px] rounded-full opacity-20 pointer-events-none" />
                                        <img
                                            src={previewImage || undefined}
                                            alt="Facture Preview"
                                            className="max-h-[75vh] w-auto rounded-lg shadow-[0_50px_100px_rgba(0,0,0,1)] transition-transform hover:scale-[1.02] duration-700"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-red-500 font-black uppercase tracking-[0.2em] text-center px-10 flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 rounded-full border-2 border-red-500/20 flex items-center justify-center">
                                            <X className="w-10 h-10" />
                                        </div>
                                        <span>{sendError || "Échec de la génération. Veuillez réessayer."}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-10 mt-2 shrink-0 px-4">
                                <button onClick={() => { setShowPreview(false); handlePrint(); }} className="flex-1 py-10 bg-white/5 border border-white/10 rounded-[48px] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white/10 transition-all active:scale-95">Imprimer Hardware</button>
                                <button onClick={() => { setShowPreview(false); setShowEmailModal(true); }} className="flex-1 py-10 bg-white text-black rounded-[48px] font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white/90 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.05)] active:scale-95">Executer le Dispatch</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EMAIL DISPATCH MODULE */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl print:hidden">
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="bg-[#0a0a0a] border border-white/[0.05] rounded-[72px] p-16 w-full max-w-2xl space-y-12 shadow-3xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[120px] -translate-y-1/2 translate-x-1/2 rounded-full" />

                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <h3 className="text-5xl font-black uppercase italic tracking-tighter text-white">DISPATCH</h3>
                                    <p className="text-[10px] font-black tracking-[0.5em] text-white/20 mt-1 uppercase">Transmission par relais sécurisé</p>
                                </div>
                                <button onClick={() => { setShowEmailModal(false); setSendStatus('idle'); }} className="p-5 bg-white/5 hover:bg-white text-white hover:text-black rounded-3xl transition-all active:scale-90"><X className="w-10 h-10" /></button>
                            </div>

                            <div className="space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] ml-4">CANAL DESTINATAIRE</label>
                                    <input
                                        type="email"
                                        value={emailTo}
                                        onChange={e => setEmailTo(e.target.value)}
                                        className="w-full p-8 bg-white/[0.03] border border-white/5 rounded-[32px] outline-none font-black text-xl focus:border-white/20 transition-all text-white placeholder:text-white/5"
                                        placeholder="client@relais.com"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em] ml-4">CORPUS DU MESSAGE</label>
                                    <textarea
                                        value={emailMessage}
                                        onChange={e => setEmailMessage(e.target.value)}
                                        rows={8}
                                        className="w-full p-10 bg-white/[0.03] border border-white/5 rounded-[40px] outline-none text-base resize-none font-medium leading-relaxed focus:border-white/20 transition-all text-white/80 placeholder:text-white/5"
                                        placeholder="Message de transmission..."
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {sendStatus === 'error' && (
                                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="p-8 bg-black/40 backdrop-blur-3xl border border-red-500/20 rounded-[48px] text-center relative z-10">
                                        <div className="flex items-center justify-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                <X className="w-6 h-6 text-red-500" />
                                            </div>
                                            <h3 className="text-red-500 font-black uppercase text-base tracking-widest">Alerte Sécurité</h3>
                                        </div>

                                        <div className="space-y-6">
                                            <p className="text-red-500 text-sm font-black uppercase text-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                                                {sendError}
                                            </p>

                                            <div className="text-left space-y-3 px-2">
                                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 text-center">Diagnostic de Transmission</p>
                                                <div className="space-y-3 text-[11px] text-white/50 leading-relaxed bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                                                    <p className="flex gap-3"><span className="text-red-500 font-bold">•</span> Vérifie que ton mot de passe administrateur est <span className="text-white font-bold">01061988</span>.</p>
                                                    <p className="flex gap-3"><span className="text-red-500 font-bold">•</span> Assure-toi que ton utilisateur est <span className="text-white font-bold">alex</span>.</p>
                                                    <p className="flex gap-3"><span className="text-red-500 font-bold">•</span> Si tu viens de le changer, rafraîchis la page (F5).</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {sendStatus === 'success' && (
                                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8 bg-green-500/10 border border-green-500/20 rounded-[32px] text-green-400 text-xs font-black text-center uppercase tracking-[0.3em] relative z-10 flex items-center justify-center gap-4">
                                        <Send className="w-4 h-4" /> EXPÉDITION TERMINÉE AVEC SUCCÈS
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button
                                onClick={generateAndSendPDF}
                                disabled={sendStatus !== 'idle' && sendStatus !== 'error'}
                                className="group relative w-full py-10 bg-white text-black rounded-[48px] font-black uppercase text-[12px] tracking-[0.3em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02] active:scale-[0.95] disabled:opacity-50 disabled:scale-100 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                {sendStatus === 'generating' || sendStatus === 'sending' ? (
                                    <div className="flex items-center justify-center gap-4">
                                        <Loader className="animate-spin w-8 h-8" />
                                        <span>SYNCHRONISATION...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-4">
                                        <Send className="w-6 h-6" />
                                        <span>START TRANSMISSION</span>
                                    </div>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* HIDDEN PRINT ASSETS */}
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

            <div ref={invoiceRef} id="printable-invoice" className="hidden print:block w-[794px] bg-white text-black p-[60px] min-h-[1123px] font-sans" style={{ backgroundColor: '#ffffff', color: '#000000' }}>

                {/* Image-Style Header Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{ fontSize: '42px', fontWeight: '500', margin: '0 0 15px 0', color: '#000', letterSpacing: '2px' }}>FACTURE</h1>
                        <div style={{ fontSize: '13px', lineHeight: '1.4', color: '#333' }}>
                            <p style={{ fontWeight: '700' }}>Alexandre Cuenca</p>
                            <p>411 Rue de Bouillargues</p>
                            <p>30000 OCC Nîmes</p>
                            <p>France</p>
                            <p>n° SIREN : 805131828</p>
                            <br />
                            <p>Cuenca Alexandre</p>
                            <p>{userPhone}</p>
                            <p>alexlight3034@icloud.com</p>
                        </div>
                    </div>
                </div>

                {/* Receiver Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '60px', alignItems: 'flex-start' }}>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: '800', marginBottom: '10px' }}>Facturé à</p>
                        <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>{clientName || 'CLIENT'}</p>
                        <p style={{ fontSize: '12px', color: '#333', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{clientAddress}</p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '250px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'min-content min-content', gap: '8px 20px', fontSize: '13px', justifyContent: 'end' }}>
                            <p style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Facture N° :</p>
                            <p style={{ fontWeight: '800' }}>{invoiceNumber.toString().padStart(3, '0')}</p>

                            <p style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Date d'émission :</p>
                            <p style={{ fontWeight: '800' }}>{new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>

                            <p style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Date d'échéance :</p>
                            <p style={{ fontWeight: '800' }}>{new Date(new Date(date).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Table with Soft Blue Header */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '8fr 2fr 2fr 2fr',
                        background: '#A0D8EF',
                        padding: '10px 20px',
                        borderBottom: '1px solid #ddd'
                    }}>
                        <p style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#000' }}>DESCRIPTION</p>
                        <p style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', color: '#000' }}>QUANTITÉ</p>
                        <p style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'center', color: '#000' }}>PRIX (€)</p>
                        <p style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', textAlign: 'right', color: '#000' }}>MONTANT (€)</p>
                    </div>

                    {lines.map((line) => (
                        <div key={line.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '8fr 2fr 2fr 2fr',
                            padding: '14px 20px',
                            borderBottom: '1px solid #eee',
                            alignItems: 'center'
                        }}>
                            <p style={{ fontSize: '13px', fontWeight: '500' }}>{line.description}</p>
                            <p style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>{line.quantity}</p>
                            <p style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>{line.unitPrice.toFixed(2).replace('.', ',')}</p>
                            <p style={{ fontSize: '13px', fontWeight: '800', textAlign: 'right' }}>{(line.quantity * line.unitPrice).toFixed(2).replace('.', ',')}</p>
                        </div>
                    ))}
                </div>

                {/* Optimized Amount Footer to avoid overlaps */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: '80px' }}>
                    <div style={{ minWidth: '580px', borderTop: '2px solid #333', paddingTop: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingRight: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#666', letterSpacing: '1px' }}>MONTANT TOTAL (EUR) :</span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#000' }}>{total.toFixed(2).replace('.', ',')} €</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#F4F7F9',
                            padding: '24px 30px',
                            borderRadius: '4px'
                        }}>
                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MONTANT À PAYER (EUR)</span>
                            <span style={{ fontSize: '46px', fontWeight: '900', color: '#000', letterSpacing: '-2px', marginLeft: '40px' }}>
                                {total.toFixed(2).replace('.', ',')} €
                            </span>
                        </div>
                    </div>
                </div>

                {/* Signature/Bank Footer Info */}
                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: '12px', fontWeight: '800', color: '#A0D8EF', marginBottom: '12px', textTransform: 'uppercase' }}>INFORMATIONS DE PAIEMENT :</p>
                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#333', lineHeight: '1.6' }}>
                            Titulaire du compte : Cuenca Alexandre &nbsp;&nbsp;&nbsp;&nbsp;
                            IBAN : <span style={{ color: '#4A90E2', fontWeight: '700' }}>BE59 9675 0891 6526</span> &nbsp;&nbsp;&nbsp;&nbsp;
                            BIC/SWIFT : <span style={{ color: '#4A90E2', fontWeight: '700' }}>TRWIBEB1XXX</span>
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default InvoiceGenerator;
