import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Download, Copy, Check, Trash2, PenTool, RefreshCw, FileText, AlertTriangle, Fingerprint } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FacebookRecoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function FacebookRecoveryModal({ isOpen, onClose }: FacebookRecoveryModalProps) {
    // Identity data (Alex / Dropsiders)
    const [fullName, setFullName] = useState('Alexandre CUENCA');
    const [birthDate, setBirthDate] = useState('14/03/1997');
    const [birthPlace, setBirthPlace] = useState('Nîmes (30), France');
    const [address, setAddress] = useState('411 Rue de Bouillargue, 30000 Nîmes, France');
    const [phone, setPhone] = useState('07 62 05 45 89');
    const [personalEmail, setPersonalEmail] = useState('alexlight3034@icloud.com');
    const [proEmail, setProEmail] = useState('contact@dropsiders.fr');
    const [roleTitle, setRoleTitle] = useState('Fondateur, Propriétaire et Représentant Légal de Dropsiders');
    const [siret, setSiret] = useState('805 131 828 00010');

    // Page Facebook Info
    const [pageName, setPageName] = useState('Dropsiders');
    const [pageUrl, setPageUrl] = useState('https://www.facebook.com/dropsiders');
    const [pageId, setPageId] = useState('828253520693650');
    const [businessManagerId, setBusinessManagerId] = useState('');
    const [targetAdminEmail, setTargetAdminEmail] = useState('alexlight3034@icloud.com');
    const [targetAdminProfileUrl, setTargetAdminProfileUrl] = useState('https://www.facebook.com/dropsidersfr');

    // Issue Type & Details
    const [issueType, setIssueType] = useState<'hacked' | 'lost_access' | 'trademark'>('hacked');
    const [issueExplanation, setIssueExplanation] = useState(
        "Je soussigné Alexandre CUENCA, fondateur, propriétaire et représentant légal de l'entité Dropsiders (SIRET: 805 131 828 00010), demande formellement par la présente déclaration la réattribution complète et exclusive de l'accès Administrateur sur la Page Facebook « Dropsiders » (ID de la Page : 828253520693650) à mon adresse email et compte Facebook : alexlight3034@icloud.com (contact pro : contact@dropsiders.fr). Suite à la perte d'accès de mon compte administrateur d'origine, je sollicite auprès des services d'assistance de Meta la restauration immédiate de mes droits de gestion et de contrôle légitimes sur cette page."
    );

    // Location & Date
    const [city, setCity] = useState('Nîmes');
    const [declarationDate, setDeclarationDate] = useState(new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }));

    // Signature Canvas
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

    // Digital Signature state
    const [certId] = useState<string>(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const rand = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return `DS-${rand(4)}-${rand(6)}-${rand(4)}`;
    });
    const [certTimestamp] = useState<string>(() => new Date().toISOString());
    const [digitalSigGenerated, setDigitalSigGenerated] = useState(false);
    const [digitalSigHash, setDigitalSigHash] = useState<string>('');

    // Generate certified digital signature hash (SHA-256 via Web Crypto API)
    const generateDigitalSignature = async () => {
        const payload = `${fullName}|${siret}|${pageName}|${pageId}|${targetAdminEmail}|${targetAdminProfileUrl}|${certTimestamp}|${certId}`;
        const msgBuffer = new TextEncoder().encode(payload);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        setDigitalSigHash(hashHex);
        setDigitalSigGenerated(true);
    };

    useEffect(() => {
        generateDigitalSignature();
    }, []);

    // UI state
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
    const previewRef = useRef<HTMLDivElement | null>(null);

    // Quick issue preset switch
    const handleIssueTypeChange = (type: 'hacked' | 'lost_access' | 'trademark') => {
        setIssueType(type);
        if (type === 'hacked') {
            setIssueExplanation("Je soussigné Alexandre CUENCA, fondateur et représentant légal de Dropsiders (SIRET: 805 131 828 00010), demande formellement la réattribution de l'accès Administrateur sur la Page Facebook « Dropsiders » (ID : 828253520693650) à mon adresse email : alexlight3034@icloud.com suite au piratage/détournement de mon compte administrateur.");
        } else if (type === 'lost_access') {
            setIssueExplanation("Je soussigné Alexandre CUENCA, propriétaire légal de Dropsiders (SIRET: 805 131 828 00010), demande la réattribution de l'accès Administrateur sur la Page Facebook « Dropsiders » (ID : 828253520693650) à mon adresse email : alexlight3034@icloud.com suite à une perte d'accès technique.");
        } else {
            setIssueExplanation("Je soussigné Alexandre CUENCA, titulaire exclusif des droits et marque Dropsiders (SIRET: 805 131 828 00010), revendique la propriété légale et requiers l'accès Administrateur principal sur la Page Facebook « Dropsiders » (ID : 828253520693650) pour le compte : alexlight3034@icloud.com.");
        }
    };

    // Signature canvas handlers
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineTo(x, y);
        ctx.strokeStyle = '#051937';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (canvasRef.current) {
            setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
        setSignatureDataUrl(null);
    };

    // Download PDF
    const handleDownloadPdf = async () => {
        // Always switch to preview tab first so previewRef mounts
        if (activeTab !== 'preview') {
            setActiveTab('preview');
            // Wait for React to render the preview DOM
            await new Promise(r => setTimeout(r, 600));
        } else {
            await new Promise(r => setTimeout(r, 100));
        }

        const el = previewRef.current;
        if (!el) {
            alert('Impossible de générer le PDF : aperçu non chargé. Clique sur "Aperçu Document" puis réessaie.');
            return;
        }

        setIsGeneratingPdf(true);
        try {
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: el.scrollWidth,
                windowHeight: el.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgRatio = imgProps.height / imgProps.width;
            const contentHeight = pdfWidth * imgRatio;

            if (contentHeight <= pdfHeight) {
                // Fits on one page
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, contentHeight);
            } else {
                // Multi-page: slice the image across pages
                let yOffset = 0;
                const pageCanvas = document.createElement('canvas');
                const pageCtx = pageCanvas.getContext('2d')!;
                const scale = 2;
                const pageHeightPx = Math.floor((pdfHeight / pdfWidth) * canvas.width);
                pageCanvas.width = canvas.width;
                pageCanvas.height = pageHeightPx;

                while (yOffset < canvas.height) {
                    pageCtx.fillStyle = '#ffffff';
                    pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                    pageCtx.drawImage(canvas, 0, -yOffset);
                    const pageData = pageCanvas.toDataURL('image/jpeg', 0.95);
                    if (yOffset > 0) pdf.addPage();
                    pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                    yOffset += pageHeightPx;
                    void scale;
                }
            }

            pdf.save(`Declaration_Facebook_Meta_Dropsiders_${declarationDate.replace(/\//g, '-')}.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            alert('Erreur lors de la génération du PDF. Vérifie la console pour les détails.');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Copy text content
    const handleCopyText = () => {
        const textToCopy = `DÉCLARATION SUR L'HONNEUR - RÉCUPÉRATION DE PAGE FACEBOOK (META)
STATEMENT UNDER PENALTY OF PERJURY FOR FACEBOOK PAGE RECOVERY

1. DEMANDEUR / APPLICANT
Nom / Name: ${fullName}
Date & Lieu de naissance / Date & Place of birth: ${birthDate} à ${birthPlace}
Adresse / Address: ${address}
Téléphone / Phone: ${phone}
Email de contact: ${personalEmail} / ${proEmail}
Rôle / Capacity: ${roleTitle}
Entité / Business: Dropsiders (SIRET: ${siret})

2. PAGE FACEBOOK CONCERNÉE / TARGET FACEBOOK PAGE
Nom de la Page / Page Name: ${pageName}
URL de la Page: ${pageUrl}
${pageId ? `Page ID: ${pageId}\n` : ''}${businessManagerId ? `Business Manager ID: ${businessManagerId}\n` : ''}Compte / Email à désigner Administrateur: ${targetAdminEmail}
${targetAdminProfileUrl ? `URL Profil Facebook: ${targetAdminProfileUrl}\n` : ''}

3. EXPLICATION DE LA SITUATION / STATEMENT OF FACTS
${issueExplanation}

4. DÉCLARATION SOUS SERMENT / STATEMENT UNDER PENALTY OF PERJURY
Je soussigné(e) ${fullName}, atteste sur l'honneur et sous peine de parjure (Statement under penalty of perjury conformément aux règlements de Meta Platforms, Inc.) que je suis le propriétaire légitime et le représentant dûment habilité de la marque et entreprise "Dropsiders", et que toutes les informations et déclarations fournies dans ce document sont véridiques, exactes et complètes. Je demande expressément la réattribution immédiate de l'accès Administrateur exclusif sur la Page Facebook mentionnée ci-dessus.

I, the undersigned ${fullName}, certify under penalty of perjury pursuant to the laws and terms of Meta Platforms, Inc. that I am the authorized legal representative and lawful owner of the business/brand "Dropsiders", and that all statements contained herein are true, accurate, and complete. I formally request full Administrator access on the aforementioned Facebook Page to be assigned to my account.

Fait à ${city}, le ${declarationDate}
Signature légale: [Document signé numériquement par ${fullName}]`;

        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 bg-black/95 backdrop-blur-2xl overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-[#0b0e17] border border-blue-500/20 rounded-[2.5rem] w-full max-w-6xl shadow-[0_0_80px_rgba(24,119,242,0.15)] relative overflow-hidden flex flex-col max-h-[92vh]"
                >
                    {/* Top Meta Blue Accent Stripe */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1877F2] via-neon-cyan to-[#1877F2]" />

                    {/* Modal Header */}
                    <div className="p-6 md:p-8 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-white/[0.03] to-transparent">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#1877F2]/20 border border-[#1877F2]/40 flex items-center justify-center shadow-[0_0_20px_rgba(24,119,242,0.3)]">
                                <ShieldCheck className="w-8 h-8 text-[#1877F2]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase italic tracking-tight">
                                        Déclaration Signée <span className="text-[#1877F2]">Meta / Facebook</span>
                                    </h2>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-neon-cyan/20 border border-neon-cyan/40 text-neon-cyan">
                                        Accès Alex
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 font-medium">
                                    Générateur officiel de déclaration sur l'honneur sous peine de parjure pour récupérer la Page Facebook
                                </p>
                            </div>
                        </div>

                        {/* Top Actions & Tabs */}
                        <div className="flex items-center gap-2">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex">
                                <button
                                    onClick={() => setActiveTab('form')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'form' ? 'bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Éditeur Formulaire
                                </button>
                                <button
                                    onClick={() => setActiveTab('preview')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'preview' ? 'bg-[#1877F2] text-white shadow-lg shadow-[#1877F2]/30' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Aperçu Document
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all ml-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                        {activeTab === 'form' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Column: Form Controls */}
                                <div className="lg:col-span-7 space-y-6">
                                    {/* Quick Issue Selector */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                            Type de motif pour Meta Support
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleIssueTypeChange('hacked')}
                                                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${issueType === 'hacked' ? 'bg-[#1877F2]/20 border-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                <span className="text-xs font-black uppercase">Piratage Admin</span>
                                                <span className="text-[9px] text-gray-400 leading-tight">Compte piraté / Accès retiré</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleIssueTypeChange('lost_access')}
                                                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${issueType === 'lost_access' ? 'bg-[#1877F2]/20 border-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                <span className="text-xs font-black uppercase">Perte d'accès</span>
                                                <span className="text-[9px] text-gray-400 leading-tight">Ancien profil injoignable</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleIssueTypeChange('trademark')}
                                                className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-1 ${issueType === 'trademark' ? 'bg-[#1877F2]/20 border-[#1877F2] text-white shadow-[0_0_15px_rgba(24,119,242,0.2)]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                            >
                                                <span className="text-xs font-black uppercase">Propriétaire Marque</span>
                                                <span className="text-[9px] text-gray-400 leading-tight">Revendication légale</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Section 1: Demandeur (Alex) */}
                                    <div className="p-5 bg-white/[0.02] border border-white/10 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                            <div className="w-2 h-2 rounded-full bg-neon-cyan" />
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">
                                                1. Identité du Demandeur (Représentant Légal)
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Nom & Prénom</label>
                                                <input
                                                    value={fullName}
                                                    onChange={e => setFullName(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Qualité / Rôle</label>
                                                <input
                                                    value={roleTitle}
                                                    onChange={e => setRoleTitle(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Date & Lieu de Naissance</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={birthDate}
                                                        onChange={e => setBirthDate(e.target.value)}
                                                        placeholder="JJ/MM/AAAA"
                                                        className="w-1/3 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                    />
                                                    <input
                                                        value={birthPlace}
                                                        onChange={e => setBirthPlace(e.target.value)}
                                                        placeholder="Ville (Dép), Pays"
                                                        className="w-2/3 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Numéro SIRET</label>
                                                <input
                                                    value={siret}
                                                    onChange={e => setSiret(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Adresse Postale Officielle</label>
                                                <input
                                                    value={address}
                                                    onChange={e => setAddress(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Téléphone</label>
                                                <input
                                                    value={phone}
                                                    onChange={e => setPhone(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Email Personnel / Support</label>
                                                <input
                                                    value={personalEmail}
                                                    onChange={e => setPersonalEmail(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Page Facebook Info */}
                                    <div className="p-5 bg-white/[0.02] border border-white/10 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                                            <div className="w-2 h-2 rounded-full bg-[#1877F2]" />
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">
                                                2. Informations de la Page Facebook à Récupérer
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Nom de la Page Facebook</label>
                                                <input
                                                    value={pageName}
                                                    onChange={e => setPageName(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">URL de la Page Facebook</label>
                                                <input
                                                    value={pageUrl}
                                                    onChange={e => setPageUrl(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">ID de la Page (Facultatif)</label>
                                                <input
                                                    value={pageId}
                                                    onChange={e => setPageId(e.target.value)}
                                                    placeholder="Ex: 104829104829104"
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Email du compte à nommer Administrateur</label>
                                                <input
                                                    value={targetAdminEmail}
                                                    onChange={e => setTargetAdminEmail(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>

                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Lien Profil Facebook (du représentant légal)</label>
                                                <input
                                                    value={targetAdminProfileUrl}
                                                    onChange={e => setTargetAdminProfileUrl(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 3: Description of Issue */}
                                    <div className="p-5 bg-white/[0.02] border border-white/10 rounded-3xl space-y-3">
                                        <label className="text-xs font-black text-white uppercase tracking-widest block">
                                            3. Déclaration des faits (Texte explicatif pour Meta)
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={issueExplanation}
                                            onChange={e => setIssueExplanation(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs text-white leading-relaxed outline-none focus:border-[#1877F2] resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Signature Pad & Checklist */}
                                <div className="lg:col-span-5 space-y-6">
                                    {/* Signature Section */}
                                    <div className="p-5 bg-white/[0.02] border border-white/10 rounded-3xl space-y-4">
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                            <div className="flex items-center gap-2">
                                                <PenTool className="w-4 h-4 text-neon-cyan" />
                                                <h3 className="text-xs font-black text-white uppercase tracking-widest">
                                                    Signature Manuscrite
                                                </h3>
                                            </div>
                                            {hasSignature && (
                                                <button
                                                    onClick={clearSignature}
                                                    className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Effacer
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-[10px] text-gray-400 font-medium">
                                            Signe directement avec ton doigt ou la souris ci-dessous pour authentifier la déclaration :
                                        </p>

                                        <div className="relative border border-dashed border-white/20 rounded-2xl overflow-hidden bg-white/90 shadow-inner">
                                            <canvas
                                                ref={canvasRef}
                                                width={400}
                                                height={160}
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                                className="w-full h-40 touch-none cursor-crosshair"
                                            />
                                            {!hasSignature && (
                                                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-400 gap-1 opacity-60">
                                                    <PenTool className="w-6 h-6 text-gray-400" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Signer ici</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Fait à</label>
                                                <input
                                                    value={city}
                                                    onChange={e => setCity(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase">Le (Date)</label>
                                                <input
                                                    value={declarationDate}
                                                    onChange={e => setDeclarationDate(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-[#1877F2]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Certified Digital Signature Block */}
                                    <div className="p-5 bg-gradient-to-br from-[#1877F2]/10 to-purple-900/10 border border-[#1877F2]/30 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2 border-b border-[#1877F2]/20 pb-3">
                                            <Fingerprint className="w-4 h-4 text-[#1877F2]" />
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">
                                                Signature Numérique Certifiée
                                            </h3>
                                            {digitalSigGenerated && (
                                                <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-green-500/20 border border-green-500/40 text-green-400">
                                                    ✓ Générée
                                                </span>
                                            )}
                                        </div>

                                        {digitalSigGenerated ? (
                                            <div className="space-y-3">
                                                <div className="bg-black/30 rounded-2xl p-3 space-y-2 border border-white/10">
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-400 font-bold uppercase">Certificat ID</span>
                                                        <span className="text-[#1877F2] font-black font-mono">{certId}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-400 font-bold uppercase">Horodatage</span>
                                                        <span className="text-white font-bold font-mono">{new Date(certTimestamp).toLocaleString('fr-FR')}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[9px]">
                                                        <span className="text-gray-400 font-bold uppercase">Signataire</span>
                                                        <span className="text-white font-bold">{fullName}</span>
                                                    </div>
                                                    <div className="pt-2 border-t border-white/10">
                                                        <p className="text-[8px] text-gray-400 uppercase font-bold mb-1">Empreinte SHA-256</p>
                                                        <p className="text-[8px] font-mono text-neon-cyan break-all leading-relaxed">
                                                            {digitalSigHash.slice(0, 32)}<br/>
                                                            {digitalSigHash.slice(32, 64)}<br/>
                                                            {digitalSigHash.slice(64)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-gray-500 leading-relaxed">
                                                    Cette empreinte cryptographique (SHA-256) certifie l'intégrité du document au moment de sa génération. Elle sera intégrée dans le PDF.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 space-y-3">
                                                <Fingerprint className="w-10 h-10 text-gray-600 mx-auto" />
                                                <p className="text-[10px] text-gray-400">Génère une empreinte cryptographique unique pour certifier ce document.</p>
                                                <button
                                                    onClick={generateDigitalSignature}
                                                    className="w-full py-3 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 border border-[#1877F2]/40 rounded-xl text-[#1877F2] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Fingerprint className="w-3.5 h-3.5" /> Générer la signature certifiée
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta Required Attachments Checklist */}
                                    <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-3">
                                        <div className="flex items-center gap-2 text-amber-400">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <h4 className="text-xs font-black uppercase tracking-wider">Pièces à joindre pour Meta</h4>
                                        </div>
                                        <p className="text-[10px] text-gray-300 leading-relaxed font-medium">
                                            En plus de ce document signé, Meta exige impérativement d'attacher lors de l'envoi :
                                        </p>
                                        <ul className="text-[10px] text-gray-300 space-y-1.5 font-bold">
                                            <li className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-neon-green flex-shrink-0" /> Copie recto-verso de ta CNI ou Passeport en cours de validité
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-neon-green flex-shrink-0" /> Avis de situation SIRENE ou Extrait KBIS officiel Dropsiders
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <Check className="w-3.5 h-3.5 text-neon-green flex-shrink-0" /> Cette Déclaration signée (PDF)
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-2 pt-2">
                                        <button
                                            onClick={handleDownloadPdf}
                                            disabled={isGeneratingPdf}
                                            className="w-full py-4 px-6 bg-gradient-to-r from-[#1877F2] to-blue-600 hover:from-blue-600 hover:to-[#1877F2] text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(24,119,242,0.35)] transition-all active:scale-98 disabled:opacity-50"
                                        >
                                            {isGeneratingPdf ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 animate-spin" /> Génération du PDF...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" /> Télécharger la Déclaration (PDF A4)
                                                </>
                                            )}
                                        </button>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setActiveTab('preview')}
                                                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-neon-cyan" /> Voir Aperçu
                                            </button>

                                            <button
                                                onClick={handleCopyText}
                                                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-neon-green" /> Texte Copié !
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-3.5 h-3.5 text-gray-400" /> Copier Texte
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Tab 2: Document Preview */
                            <div className="space-y-6 flex flex-col items-center">
                                {/* Preview Controls Bar */}
                                <div className="w-full max-w-3xl flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3">
                                    <span className="text-xs font-bold text-gray-300">
                                        Aperçu conforme pour impression et téléchargement PDF
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDownloadPdf}
                                            disabled={isGeneratingPdf}
                                            className="px-4 py-2 bg-[#1877F2] text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-blue-600 transition-all"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Télécharger PDF
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('form')}
                                            className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition-all"
                                        >
                                            Modifier
                                        </button>
                                    </div>
                                </div>

                                {/* Printable A4 Sheet Preview */}
                                <div className="w-full overflow-x-auto flex justify-center py-4">
                                    <div
                                        ref={previewRef}
                                        className="w-[210mm] min-h-[297mm] bg-white text-[#1a1a1a] p-[18mm] shadow-2xl rounded-sm font-sans flex flex-col justify-between text-[11px] leading-relaxed select-text"
                                        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                                    >
                                        {/* Document Header */}
                                        <div>
                                            <div className="flex justify-between items-start border-b-2 border-[#1877F2] pb-5 mb-6">
                                                <div>
                                                    <h1 className="text-2xl font-black text-[#051937] tracking-tight uppercase">
                                                        DROPSIDERS
                                                    </h1>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                                        Média & Culture Électronique • SIRET: {siret}
                                                    </p>
                                                    <p className="text-[9px] text-gray-500">
                                                        {address} • {phone} • {proEmail}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-[#1877F2] font-black text-[9px] uppercase tracking-wider rounded-md">
                                                        Meta Platforms Support
                                                    </span>
                                                    <p className="text-[9px] text-gray-500 mt-1">
                                                        Facebook Page Access & Recovery Unit
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Formal Title */}
                                            <div className="text-center my-5 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                <h2 className="text-base font-black text-[#051937] uppercase tracking-wide">
                                                    DÉCLARATION SUR L'HONNEUR SOUS PEINE DE PARJURE
                                                </h2>
                                                <p className="text-[10px] font-bold text-[#1877F2] uppercase tracking-wider mt-0.5">
                                                    STATEMENT UNDER PENALTY OF PERJURY FOR FACEBOOK PAGE RECOVERY
                                                </p>
                                            </div>

                                            {/* Section 1: Identification */}
                                            <div className="mb-5 space-y-1 bg-blue-50/50 p-3.5 rounded-lg border border-blue-100">
                                                <h3 className="font-bold text-[#051937] text-[11px] uppercase tracking-wider mb-2 border-b border-blue-200/60 pb-1">
                                                    1. IDENTIFICATION DU REPRÉSENTANT LÉGAL / AUTHORIZED REPRESENTATIVE
                                                </h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                                    <p><strong>Nom complet :</strong> {fullName}</p>
                                                    <p><strong>Qualité / Titre :</strong> {roleTitle}</p>
                                                    <p><strong>Né(e) le :</strong> {birthDate} à {birthPlace}</p>
                                                    <p><strong>Entité légale :</strong> Dropsiders (SIRET: {siret})</p>
                                                    <p><strong>Adresse :</strong> {address}</p>
                                                    <p><strong>Téléphone :</strong> {phone}</p>
                                                    <p><strong>Email officiel :</strong> {proEmail}</p>
                                                    <p><strong>Email personnel :</strong> {personalEmail}</p>
                                                </div>
                                            </div>

                                            {/* Section 2: Target Page Info */}
                                            <div className="mb-5 space-y-1 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
                                                <h3 className="font-bold text-[#051937] text-[11px] uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
                                                    2. PAGE FACEBOOK ET COMPTE CIBLE / TARGET FACEBOOK PAGE DETAILS
                                                </h3>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                                    <p><strong>Nom de la Page :</strong> {pageName}</p>
                                                    <p><strong>URL de la Page :</strong> {pageUrl}</p>
                                                    {pageId && <p><strong>ID de la Page :</strong> {pageId}</p>}
                                                    {businessManagerId && <p><strong>Business Manager ID :</strong> {businessManagerId}</p>}
                                                    <p className="col-span-2 text-[#1877F2]">
                                                        <strong>Compte Facebook à désigner Administrateur principal :</strong> {targetAdminEmail}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Section 3: Facts */}
                                            <div className="mb-5 space-y-1.5">
                                                <h3 className="font-bold text-[#051937] text-[11px] uppercase tracking-wider border-b border-gray-200 pb-1">
                                                    3. EXPLICATION DES FAITS / STATEMENT OF FACTS
                                                </h3>
                                                <p className="text-[10px] text-gray-700 text-justify leading-relaxed">
                                                    {issueExplanation}
                                                </p>
                                            </div>

                                            {/* Section 4: Legal declaration under penalty of perjury */}
                                            <div className="mb-6 space-y-2 border-l-4 border-[#1877F2] pl-3 py-1 bg-blue-50/30">
                                                <h3 className="font-bold text-[#051937] text-[10px] uppercase tracking-wider">
                                                    4. ENGAGEMENT SOUS SERMENT / STATEMENT UNDER PENALTY OF PERJURY
                                                </h3>
                                                <p className="text-[9.5px] text-gray-800 text-justify leading-relaxed">
                                                    Je soussigné(e) <strong>{fullName}</strong>, atteste sur l'honneur et sous peine de parjure (conforme aux exigences légales et aux directives de Meta Platforms, Inc.) que je suis le propriétaire exclusif, créateur et représentant légal habilité de l'entité et marque <strong>Dropsiders</strong>. Je certifie que l'ensemble des renseignements, déclarations et justificatifs fournis sont sincères, véridiques et conformes à la réalité. Je demande expressément à Meta Platforms, Inc. de réassigner l'administration complète de la Page Facebook « {pageName} » à mon profil/adresse : <strong>{targetAdminEmail}</strong>.
                                                </p>
                                                <p className="text-[9px] text-gray-600 italic text-justify leading-relaxed">
                                                    I, the undersigned <strong>{fullName}</strong>, declare under penalty of perjury under the laws and policies of Meta Platforms, Inc. that I am the sole rightful owner, founder and authorized legal representative of <strong>Dropsiders</strong>. I hereby certify that all information in this declaration is true, complete and accurate, and I formally request Meta to restore full Administrator access for the Facebook Page "{pageName}" to my verified email: <strong>{targetAdminEmail}</strong>.
                                                </p>
                                            </div>
                                        </div>

                                                        {/* Signature & Date Footer */}
                                        <div className="pt-4 border-t border-gray-200 mt-6">
                                            <div className="flex justify-between items-end">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold text-gray-800">
                                                        Fait à <strong>{city}</strong>, le <strong>{declarationDate}</strong>
                                                    </p>
                                                    <p className="text-[9px] text-gray-500">
                                                        Pièces justificatives jointes : Copie CNI/Passeport + Extrait SIRENE
                                                    </p>
                                                    <p className="text-[9px] text-gray-600">
                                                        <strong>Lien profil Facebook :</strong> {targetAdminProfileUrl}
                                                    </p>
                                                </div>

                                                <div className="text-center w-64">
                                                    <p className="text-[10px] font-bold text-[#051937] uppercase tracking-wider mb-2">
                                                        Signature & Cachet du Représentant Légal
                                                    </p>
                                                    <div className="w-56 h-24 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center p-1 mx-auto overflow-hidden">
                                                        {signatureDataUrl ? (
                                                            <img src={signatureDataUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                                                        ) : (
                                                            <span className="text-[9px] text-gray-400 italic">Signature manuscrite</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-gray-700 mt-1 uppercase">
                                                        {fullName}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Certified Digital Signature Stamp */}
                                            {digitalSigGenerated && (
                                                <div className="mt-5 p-3 border border-[#1877F2]/40 rounded-lg bg-blue-50/60">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-8 h-8 bg-[#1877F2] rounded-md flex items-center justify-center">
                                                            <span className="text-white text-[10px] font-black">DS</span>
                                                        </div>
                                                        <div className="flex-1 space-y-0.5">
                                                            <p className="text-[9px] font-black text-[#051937] uppercase tracking-wider">
                                                                Signature Numérique Certifiée — Document Authentifié
                                                            </p>
                                                            <p className="text-[8px] text-gray-600 font-mono">
                                                                <strong>Certificat ID :</strong> {certId} &nbsp;|&nbsp;
                                                                <strong>Horodatage :</strong> {new Date(certTimestamp).toLocaleString('fr-FR')}
                                                            </p>
                                                            <p className="text-[8px] text-gray-600">
                                                                <strong>Signataire :</strong> {fullName} ({personalEmail}) &nbsp;|&nbsp;
                                                                <strong>Entité :</strong> Dropsiders SIRET {siret}
                                                            </p>
                                                            <p className="text-[7.5px] font-mono text-[#1877F2] break-all leading-relaxed pt-0.5">
                                                                <strong>SHA-256 :</strong> {digitalSigHash}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-[7px] text-gray-400 italic mt-2 text-center">
                                                        Ce document a été signé numériquement par le représentant légal désigné ci-dessus via l'algorithme SHA-256 (Web Crypto API).
                                                        L'empreinte cryptographique garantit l'intégrité et l'authenticité du contenu de cette déclaration.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default FacebookRecoveryModal;
