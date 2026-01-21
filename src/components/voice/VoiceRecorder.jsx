'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Check, X, Wand2, CreditCard, Keyboard, Calendar } from 'lucide-react';
import { cn, formatCLP } from '@/lib/utils';
import { parseTransaction, CATEGORIES } from '@/lib/voice-parser';
import { createTransaction } from '@/app/actions/transaction';
import { toggleFixedExpenseByName } from '@/app/actions/fixed-expense';

export default function VoiceRecorder({ onSave }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [parsedData, setParsedData] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, listening, processing, confirming, manual
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);

    // Manual Entry State
    const [manualForm, setManualForm] = useState({
        amount: '',
        category: '',
        paymentMethod: 'CASH',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.lang = 'es-CL';
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setStatus('listening');
                setTranscript('');
                setError(null);
            };

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const currentText = finalTranscript || interimTranscript;
                setTranscript(currentText);

                if (finalTranscript) {
                    processVoiceInput(finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech error", event.error);
                if (event.error === 'no-speech') {
                    setError("No te escuché. Intenta de nuevo.");
                } else {
                    setError("Error de reconocimiento: " + event.error);
                }
                setIsListening(false);
                setStatus('idle');
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    const startListening = () => {
        if (!recognitionRef.current) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }

        if (isListening) return; // Prevent double start

        try {
            recognitionRef.current.start();
        } catch (e) {
            // Ignore "already started" error
            if (e.name === 'InvalidStateError' || e.message?.includes('already started')) {
                console.log("Recognition already active");
                return;
            }
            console.error("Error starting recognition", e);
        }
    };

    const processVoiceInput = (text) => {
        setStatus('processing');

        setTimeout(() => {
            const data = parseTransaction(text);
            if (data) {
                setParsedData(data);
                setStatus('confirming');
            } else {
                setError("No pude entender el gasto. Prueba: 'Almuerzo 5000'");
                setStatus('idle');
            }
        }, 600);
    };

    const handleConfirm = async () => {
        if (parsedData) {
            if (parsedData.type === 'FIXED_PAYMENT') {
                const year = new Date().getFullYear();
                const month = new Date().getMonth() + 1;

                const res = await toggleFixedExpenseByName(parsedData.expenseName, month, year, true);  // Always paying for now
                if (res.success) {
                    reset();
                } else {
                    setError("Error: " + (res.error || "No se pudo marcar el pago"));
                }
                return;
            }

            const saveFn = onSave || createTransaction;
            const res = await saveFn(parsedData);
            if (res.success) {
                reset();
            } else {
                setError("Error al guardar: " + res.error);
            }
        }
    };

    const handleManualSubmit = async () => {
        if (!manualForm.amount || !manualForm.category) {
            setError("Monto y Categoría son obligatorios");
            return;
        }

        const data = {
            amount: parseInt(manualForm.amount),
            category: manualForm.category.charAt(0) + manualForm.category.slice(1).toLowerCase().replace('_', ' '),
            paymentMethod: manualForm.paymentMethod,
            date: new Date(manualForm.date + 'T12:00:00'),
            description: manualForm.description || (manualForm.category.charAt(0) + manualForm.category.slice(1).toLowerCase().replace('_', ' '))
        };

        const saveFn = onSave || createTransaction;
        // Optimization: Optimistic UI or wait? We wait.
        const res = await saveFn(data);
        if (res.success) {
            reset();
        } else {
            setError("Error al guardar: " + res.error);
        }
    };

    const reset = () => {
        setTranscript('');
        setParsedData(null);
        setStatus('idle');
        setError(null);
        setManualForm({
            amount: '',
            category: '',
            paymentMethod: 'CASH',
            date: new Date().toISOString().split('T')[0],
            description: ''
        });
    };

    const openManual = () => {
        setStatus('manual');
    };

    if (status === 'idle') {
        return (
            <>
                {error && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-5 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end">
                    {/* Panic Button (Manual) */}
                    <button
                        onClick={openManual}
                        className="w-12 h-12 rounded-full bg-[#1f2029] text-slate-400 border border-white/10 shadow-lg flex items-center justify-center hover:scale-110 hover:text-white hover:border-white/30 transition-all active:scale-95 group"
                        title="Ingreso Manual"
                    >
                        <Keyboard className="w-5 h-5 group-hover:text-blue-400 transition-colors" />
                    </button>

                    {/* Mic Button */}
                    <button
                        onClick={startListening}
                        className="w-16 h-16 rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center hover:scale-105 transition-all hover:bg-blue-500 active:scale-95 group"
                    >
                        <Mic className="w-8 h-8 group-hover:animate-pulse" />
                    </button>
                </div>
            </>
        );
    }

    // Modal Content
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/80 backdrop-blur-md transition-all animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-[#1f2029] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 p-6 space-y-6 animate-in slide-in-from-bottom-20 duration-500">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white tracking-wide">
                        {status === 'listening' && 'Te escucho...'}
                        {status === 'processing' && 'Analizando...'}
                        {status === 'confirming' && 'Confirmar Gasto'}
                        {status === 'manual' && 'Nuevo Gasto'}
                    </h2>
                    <button onClick={reset} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content based on status */}
                {status === 'manual' ? (
                    <div className="space-y-4">
                        {/* Amount */}
                        <div className="bg-[#151621] p-4 rounded-xl border border-white/5 focus-within:border-blue-500/50 transition-colors">
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Monto</label>
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-xl font-light">$</span>
                                <input
                                    type="number"
                                    value={manualForm.amount}
                                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                                    className="bg-transparent text-white text-2xl font-bold w-full focus:outline-none placeholder:text-slate-700"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="bg-[#151621] p-4 rounded-xl border border-white/5 focus-within:border-blue-500/50 transition-colors">
                            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider block mb-1">Categoría</label>
                            <select
                                value={manualForm.category}
                                onChange={(e) => setManualForm({ ...manualForm, category: e.target.value })}
                                className="w-full bg-transparent text-white text-lg font-medium focus:outline-none appearance-none cursor-pointer"
                            >
                                <option value="" disabled className="bg-[#1f2029]">Seleccionar...</option>
                                {Object.keys(CATEGORIES).filter(k => k !== 'VISA').map(key => (
                                    <option key={key} value={key} className="bg-[#1f2029]">
                                        {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                                    </option>
                                ))}
                                <option value="GASTOS_VARIOS" className="bg-[#1f2029]">Gastos Varios</option>
                            </select>
                        </div>

                        {/* Payment & Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#151621] p-3 rounded-xl border border-white/5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">Método</label>
                                <div className="flex bg-white/5 rounded-lg p-1">
                                    <button
                                        onClick={() => setManualForm({ ...manualForm, paymentMethod: 'CASH' })}
                                        className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", manualForm.paymentMethod === 'CASH' ? "bg-green-500 text-white shadow" : "text-slate-400 hover:text-white")}
                                    >
                                        Efectivo
                                    </button>
                                    <button
                                        onClick={() => setManualForm({ ...manualForm, paymentMethod: 'VISA' })}
                                        className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", manualForm.paymentMethod === 'VISA' ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white")}
                                    >
                                        VISA
                                    </button>
                                </div>
                            </div>
                            <div className="bg-[#151621] p-3 rounded-xl border border-white/5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">Fecha</label>
                                <input
                                    type="date"
                                    value={manualForm.date}
                                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                                    className="w-full bg-transparent text-white text-sm font-medium focus:outline-none dark-calendar"
                                />
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleManualSubmit}
                            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 mt-4"
                        >
                            <Check className="w-5 h-5" />
                            Guardar
                        </button>
                    </div>

                ) : (
                    // Voice Views (Listening, Processing, Confirming)
                    <div className={cn(
                        "relative min-h-[140px] flex flex-col items-center justify-center p-6 rounded-2xl transition-all duration-500 border",
                        status === 'listening' ? "bg-blue-500/10 border-blue-500/30" : "bg-[#151621] border-white/5"
                    )}>
                        {status === 'listening' ? (
                            <div className="space-y-4 text-center w-full">
                                <div className="flex items-center justify-center gap-1 h-8">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-1.5 bg-blue-500 rounded-full animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s`, height: '40%' }}></div>
                                    ))}
                                </div>
                                <p className="text-blue-200 font-medium text-lg leading-relaxed animate-pulse">
                                    {transcript || "Di algo como: 'Almuerzo 5000 hoy'"}
                                </p>
                            </div>
                        ) : status === 'processing' ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Procesando con IA</p>
                            </div>
                        ) : (
                            // Confirming View
                            <div className="text-center w-full">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 text-green-400 mb-3">
                                    <Wand2 className="w-6 h-6" />
                                </div>
                                <p className="text-slate-400 text-sm italic">"{transcript}"</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Confirmation Action for Voice */}
                {status === 'confirming' && parsedData && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
                        {parsedData.type === 'FIXED_PAYMENT' ? (
                            // Fixed Expense Confirmation UI
                            <div className="text-center p-6 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-2xl border border-emerald-500/20">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500 text-white mb-4 shadow-lg shadow-emerald-500/30">
                                    <Check className="w-8 h-8" />
                                </div>
                                <h3 className="text-white font-bold text-xl mb-1">Confirmar Pago</h3>
                                <p className="text-emerald-400 font-medium text-lg">{parsedData.expenseName}</p>
                                <p className="text-slate-500 text-sm mt-2">Se marcará como pagado este mes</p>
                            </div>
                        ) : (
                            // Regular Transaction UI (existing)
                            <>
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-[#151621] rounded-2xl border border-white/5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto</label>
                                        <div className="text-2xl font-bold text-white tracking-tight">
                                            {formatCLP(parsedData.amount)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#151621] rounded-2xl border border-white/5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Categoría</label>
                                        <div className="text-lg font-bold text-blue-400 truncate">
                                            {parsedData.category}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <div className="flex-1 p-3 flex items-center gap-3 bg-[#151621] rounded-xl border border-white/5">
                                        <div className={cn("p-2 rounded-lg", parsedData.paymentMethod === 'VISA' ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400")}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Método</p>
                                            <p className="font-semibold text-slate-300 text-sm">{parsedData.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-3 flex items-center gap-3 bg-[#151621] rounded-xl border border-white/5">
                                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg text-xs font-bold">
                                            {parsedData.date instanceof Date ? parsedData.date.getDate() : new Date().getDate()}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Fecha</p>
                                            <p className="font-semibold text-slate-300 text-sm">
                                                {parsedData.date instanceof Date
                                                    ? parsedData.date.toLocaleDateString('es-CL', { month: 'short' })
                                                    : 'Hoy'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            onClick={handleConfirm}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2",
                                parsedData.type === 'FIXED_PAYMENT'
                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                            )}
                        >
                            <Check className="w-5 h-5" />
                            {parsedData.type === 'FIXED_PAYMENT' ? 'Confirmar Pago' : 'Guardar Gasto'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
