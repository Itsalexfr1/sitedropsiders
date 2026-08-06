import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Save, Printer, Check, Euro, Sparkles, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';

interface WorkDayConfig {
    date: string; // "YYYY-MM-DD"
    dayNum: number;
    dayOfWeek: string;
    isWeekend: boolean;
    worked: boolean;
    price: number;
    note: string;
}

interface WorkPlanningProps {
    onConvertToInvoice?: (lines: { description: string; quantity: number; unitPrice: number }[], notes: string) => void;
}

export function WorkPlanning({ onConvertToInvoice }: WorkPlanningProps) {
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${y}-${m}`;
    });

    const [defaultPrice, setDefaultPrice] = useState<number>(150);
    const [days, setDays] = useState<WorkDayConfig[]>([]);
    const [savedNotice, setSavedNotice] = useState(false);

    // Generate days for selected month
    useEffect(() => {
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // 0-indexed

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Load saved state for this month if exists
        const savedKey = `work_planning_${selectedMonth}`;
        const savedDataRaw = localStorage.getItem(savedKey);
        let savedData: Record<string, { worked: boolean; price: number; note: string }> = {};
        if (savedDataRaw) {
            try { savedData = JSON.parse(savedDataRaw); } catch {}
        }

        const newDays: WorkDayConfig[] = [];
        const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const dayOfWeekIdx = dateObj.getDay();
            const dayOfWeek = dayNames[dayOfWeekIdx];
            const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 5 || dayOfWeekIdx === 6; // Fri, Sat, Sun
            const dateStr = `${yearStr}-${monthStr}-${d.toString().padStart(2, '0')}`;

            const savedDay = savedData[dateStr];
            newDays.push({
                date: dateStr,
                dayNum: d,
                dayOfWeek,
                isWeekend,
                worked: savedDay ? savedDay.worked : false,
                price: savedDay && savedDay.price !== undefined ? savedDay.price : defaultPrice,
                note: savedDay ? savedDay.note || '' : '',
            });
        }
        setDays(newDays);
    }, [selectedMonth]);

    const savePlanning = (updatedDays: WorkDayConfig[]) => {
        const key = `work_planning_${selectedMonth}`;
        const dataToSave: Record<string, { worked: boolean; price: number; note: string }> = {};
        updatedDays.forEach(d => {
            if (d.worked || d.note || d.price !== defaultPrice) {
                dataToSave[d.date] = { worked: d.worked, price: d.price, note: d.note };
            }
        });
        localStorage.setItem(key, JSON.stringify(dataToSave));
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    const toggleDayWorked = (index: number) => {
        const updated = [...days];
        updated[index] = {
            ...updated[index],
            worked: !updated[index].worked,
            price: updated[index].worked ? updated[index].price : (updated[index].price || defaultPrice),
        };
        setDays(updated);
        savePlanning(updated);
    };

    const updateDayPrice = (index: number, price: number) => {
        const updated = [...days];
        updated[index] = { ...updated[index], price: Math.max(0, price) };
        setDays(updated);
        savePlanning(updated);
    };

    const updateDayNote = (index: number, note: string) => {
        const updated = [...days];
        updated[index] = { ...updated[index], note };
        setDays(updated);
        savePlanning(updated);
    };

    const applyDefaultPriceToAllWorked = () => {
        const updated = days.map(d => ({ ...d, price: d.worked ? defaultPrice : d.price }));
        setDays(updated);
        savePlanning(updated);
    };

    const selectWeekends = () => {
        const updated = days.map(d => ({ 
            ...d, 
            worked: d.isWeekend ? true : d.worked, 
            price: d.price || defaultPrice 
        }));
        setDays(updated);
        savePlanning(updated);
    };

    const clearAllDays = () => {
        const updated = days.map(d => ({ ...d, worked: false }));
        setDays(updated);
        savePlanning(updated);
    };

    const changeMonth = (offset: number) => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const d = new Date(y, m - 1 + offset, 1);
        const newY = d.getFullYear();
        const newM = (d.getMonth() + 1).toString().padStart(2, '0');
        setSelectedMonth(`${newY}-${newM}`);
    };

    const workedDays = days.filter(d => d.worked);
    const totalDaysCount = workedDays.length;
    const totalAmount = workedDays.reduce((sum, d) => sum + (d.price || 0), 0);

    const monthFormatted = new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();

    const handlePrint = () => {
        const rowsHtml = workedDays.map(d => `
            <tr>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:12px;font-weight:700;">${new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:12px;color:#444;">${d.note || 'Soirée / Prestation DJ'}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:12px;font-weight:700;text-align:right;">${(d.price || 0).toFixed(2)} €</td>
            </tr>
        `).join('');

        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<title>Planning de Travail - ${monthFormatted}</title>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20mm; color: #111; background: #fff; }
    h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
    .sub { font-size: 11px; color: #666; margin-bottom: 24px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #10b981; color: #fff; text-align: left; padding: 10px 14px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .total-box { background: #064e3b; color: #fff; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; font-weight: 900; font-size: 18px; }
</style>
</head>
<body>
    <h1>Planning de Travail (Alex)</h1>
    <div class="sub">CUENCA ALEXANDRE • ${monthFormatted} • ${totalDaysCount} Soir(s) de Taff</div>
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description / Lieu</th>
                <th style="text-align:right">Tarif Soir HT</th>
            </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
    </table>
    <div class="total-box">
        <span>TOTAL DU MOIS (${totalDaysCount} SOIRS DE TAFF)</span>
        <span>${totalAmount.toFixed(2)} €</span>
    </div>
</body>
</html>`;

        const w = window.open('', '_blank');
        if (w) {
            w.document.write(html);
            w.document.close();
            w.onload = () => { w.focus(); w.print(); };
        }
    };

    const handleCreateInvoice = () => {
        if (!onConvertToInvoice) return;
        const lines = workedDays.map(d => ({
            description: `Prestation ${new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}${d.note ? ` (${d.note})` : ''}`,
            quantity: 1,
            unitPrice: d.price || defaultPrice,
        }));

        if (lines.length === 0) {
            lines.push({
                description: `Prestation Planning ${monthFormatted}`,
                quantity: 1,
                unitPrice: 0
            });
        }

        const notes = `Planning de travail mensuel ${monthFormatted} — Total ${totalDaysCount} soir(s) de travail (${totalAmount.toFixed(2)} €).`;
        onConvertToInvoice(lines, notes);
    };

    return (
        <div className="space-y-6 p-4 md:p-8 bg-[#0d0f1a] text-white">

            {/* TOP TITLE & BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.04] border border-white/[0.08] rounded-3xl p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                        <CalendarIcon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">
                                Planning de Travail <span className="text-emerald-400">Alex</span>
                            </h2>
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[9px] font-black uppercase text-emerald-400 tracking-wider">
                                Réservé Alex
                            </span>
                        </div>
                        <p className="text-xs font-medium text-white/40 mt-0.5">
                            Sélection des jours de taff par mois, gestion des prix par soir et total automatique
                        </p>
                    </div>
                </div>

                {/* Month Navigator */}
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1.5 rounded-2xl self-start md:self-auto">
                    <button 
                        onClick={() => changeMonth(-1)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"
                        title="Mois précédent"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="px-4 text-center min-w-[140px]">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">{monthFormatted}</span>
                        <input 
                            type="month"
                            value={selectedMonth}
                            onChange={e => e.target.value && setSelectedMonth(e.target.value)}
                            className="bg-transparent text-[10px] text-white/40 font-mono focus:outline-none cursor-pointer text-center"
                        />
                    </div>
                    <button 
                        onClick={() => changeMonth(1)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white transition-all"
                        title="Mois suivant"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* CONTROLS & KPI SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* KPI Card Total */}
                <div className="lg:col-span-4 bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-black/60 border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                    <div>
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
                            TOTAL DU MOIS ({totalDaysCount} SOIR{totalDaysCount > 1 ? 'S' : ''})
                        </span>
                        <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1">
                            {totalAmount.toFixed(2)} <span className="text-xl text-emerald-400 font-bold">€ HT</span>
                        </div>
                        <p className="text-[11px] text-emerald-300/60 font-medium mt-1">
                            {totalDaysCount > 0 
                                ? `Moyenne : ${(totalAmount / totalDaysCount).toFixed(2)} € / soir de taff`
                                : `Sélectionnez vos jours de taff dans le calendrier`}
                        </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                        {onConvertToInvoice && (
                            <button
                                onClick={handleCreateInvoice}
                                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <FileText className="w-4 h-4" /> Générer la Facture avec ce Planning
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Printer className="w-4 h-4 text-emerald-400" /> Imprimer / Export PDF
                        </button>
                    </div>
                </div>

                {/* Quick Controls */}
                <div className="lg:col-span-8 bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Configuration Rapide des Soirs & Prix
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1.5">
                                Prix par Soir par Défaut (€)
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="number"
                                        value={defaultPrice}
                                        onChange={e => setDefaultPrice(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-bold text-sm focus:border-emerald-400 outline-none transition-all"
                                    />
                                    <Euro className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                                <button
                                    onClick={applyDefaultPriceToAllWorked}
                                    className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    title="Appliquer le prix par défaut aux soirs cochés"
                                >
                                    Appliquer aux soirs
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col justify-end gap-2">
                            <label className="text-[9px] font-black text-white/40 uppercase tracking-widest block">
                                Raccourcis de sélection
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectWeekends}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> W-E (Ven/Sam/Dim)
                                </button>
                                <button
                                    onClick={clearAllDays}
                                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                >
                                    Tout effacer
                                </button>
                            </div>
                        </div>
                    </div>

                    {savedNotice && (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold animate-pulse pt-1">
                            <CheckCircle2 className="w-4 h-4" /> Planning sauvegardé automatiquement
                        </div>
                    )}
                </div>
            </div>

            {/* CALENDAR DAYS SELECTION GRID */}
            <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">
                        Sélection des Jours de Taff ({monthFormatted})
                    </h3>
                    <span className="text-[10px] font-bold text-white/40 uppercase">
                        Cliquez sur un jour pour cocher / décocher le soir de travail
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    {days.map((day, idx) => {
                        return (
                            <motion.div
                                key={day.date}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                                    day.worked
                                        ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                                        : day.isWeekend
                                            ? 'bg-white/[0.03] border-white/10 hover:border-white/30'
                                            : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                                }`}
                                onClick={() => toggleDayWorked(idx)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                                            day.worked 
                                                ? 'bg-emerald-500 text-black' 
                                                : 'bg-white/10 text-white'
                                        }`}>
                                            {day.dayNum}
                                        </span>
                                        <div>
                                            <span className="text-xs font-bold text-white uppercase block leading-none">{day.dayOfWeek}</span>
                                            <span className="text-[9px] text-white/30 font-mono">{day.date}</span>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox"
                                        checked={day.worked}
                                        onChange={() => {}} // handled by parent div click
                                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                                    />
                                </div>

                                {day.worked ? (
                                    <div className="space-y-2 pt-2 border-t border-emerald-500/20" onClick={e => e.stopPropagation()}>
                                        <div>
                                            <label className="text-[8px] font-black text-emerald-400/80 uppercase tracking-widest block mb-1">
                                                Prix du Soir (€)
                                            </label>
                                            <input 
                                                type="number"
                                                value={day.price}
                                                onChange={e => updateDayPrice(idx, parseFloat(e.target.value) || 0)}
                                                className="w-full bg-black/60 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-white font-black text-xs focus:border-emerald-400 outline-none"
                                                placeholder="150"
                                            />
                                        </div>
                                        <div>
                                            <input 
                                                type="text"
                                                value={day.note}
                                                onChange={e => updateDayNote(idx, e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-white font-medium text-[10px] focus:border-white/30 outline-none placeholder:text-white/20"
                                                placeholder="Lieu / Evénement (opt)..."
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-white/20 font-medium italic text-center py-2">
                                        Repos
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* DETAILED WORK RECAP TABLE */}
            {workedDays.length > 0 && (
                <div className="bg-white/[0.02] border border-white/[0.07] rounded-3xl p-6 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400">
                        Récapitulatif des {workedDays.length} Soir(s) de Taff Sélectionné(s)
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-white">
                            <thead>
                                <tr className="border-b border-white/10 text-[9px] font-black uppercase text-white/40 tracking-widest">
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Jour</th>
                                    <th className="py-3 px-4">Evénement / Note</th>
                                    <th className="py-3 px-4 text-right">Prix Soir HT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {workedDays.map((d) => (
                                    <tr key={d.date} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{d.date}</td>
                                        <td className="py-3 px-4 font-bold uppercase">{d.dayOfWeek} {d.dayNum}</td>
                                        <td className="py-3 px-4 text-white/70">{d.note || 'Soirée DJ / Prestation'}</td>
                                        <td className="py-3 px-4 font-black text-right">{d.price.toFixed(2)} €</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-emerald-500/40 font-black text-sm text-emerald-400">
                                    <td colSpan={3} className="py-4 px-4 uppercase tracking-widest">TOTAL CUMULÉ ({totalDaysCount} SOIRS)</td>
                                    <td className="py-4 px-4 text-right text-lg">{totalAmount.toFixed(2)} €</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
