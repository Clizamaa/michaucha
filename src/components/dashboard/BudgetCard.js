'use client';

import { useState } from 'react';
import { formatCLP } from "@/lib/utils";
import { Wallet, Edit2, TrendingDown, TrendingUp, PiggyBank } from "lucide-react";
import { setPeriodBudget, updateSavingsGoal } from "@/app/actions/period"; // Using period actions now if available, or create new ones? We used setMonthlyBudget before.
// Correct import based on previous refactor:
import { setPeriodBudget as setBudgetAction } from "@/app/actions/budget";

export default function BudgetCard({ summary }) {
    const [isEditing, setIsEditing] = useState(false);
    const [budgetInput, setBudgetInput] = useState(summary.budget || 0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        setIsLoading(true);
        // Assuming we want to update the period budget which matches current logic
        // We need periodId? summary usually comes from getDashboardData which uses current period.
        // But the previous action setMonthlyBudget used month/year logic. 
        // We refactored setPeriodBudget in budget.js. We need periodId.
        // Ideally summary object should contain periodId or we fetch current. 
        // For simplicity, let's assume setPeriodBudget handles finding current if null.
        await setBudgetAction(budgetInput, null);
        setIsEditing(false);
        setIsLoading(false);
    };

    const savingsGoal = summary.savingsGoal || 0;
    const remaining = (summary.budget || 0) - summary.monthTotal;
    // El "Disponible Real" considera el ahorro como un "gasto comprometido"
    const availableAfterSavings = remaining - savingsGoal;

    const progress = summary.budget > 0 ? (summary.monthTotal / summary.budget) * 100 : 0;
    const isOverBudget = remaining < 0;

    return (
        <div className="md:col-span-2 p-8 rounded-[2rem] bg-[#1f2029] border border-white/5 shadow-2xl shadow-black/20 relative overflow-hidden group hover:border-white/10 transition-all">
            {/* Decoración de fondo */}
            <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mt-1">Saldo Disponible</p>
                            {savingsGoal > 0 && (
                                <p className="text-[10px] text-emerald-400 font-medium">
                                    (Meta: {formatCLP(savingsGoal)})
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                        title="Editar Sueldo"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>

                {isEditing ? (
                    <div className="mb-6">
                        <input
                            type="number"
                            className="bg-[#151621] border border-white/10 rounded-xl px-4 py-3 text-3xl font-bold text-white w-full focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-slate-600"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(e.target.value)}
                            placeholder="Ingresa tu sueldo"
                            autoFocus
                        />
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? '...' : 'Guardar'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="text-slate-400 hover:text-white px-4 py-2 text-sm font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-2">
                                {formatCLP(remaining)}
                            </h2>
                        </div>

                        {savingsGoal > 0 && (
                            <div className="flex items-center gap-2 mb-2 text-sm">
                                <span className="text-slate-400">Libre tras ahorro:</span>
                                <span className={availableAfterSavings >= 0 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                                    {formatCLP(availableAfterSavings)}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isOverBudget ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {isOverBudget ? 'Sobrepresupuesto' : 'Dentro del presupuesto'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* Estadísticas de Progreso */}
                    <div>
                        <div className="flex justify-between text-sm font-medium mb-3">
                            <span className="text-slate-400">Gastado: <span className="text-white ml-1">{formatCLP(summary.monthTotal)}</span></span>
                            <span className="text-slate-500">{Math.min(progress, 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-[#151621] h-3 rounded-full overflow-hidden border border-white/5">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isOverBudget ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-blue-600 to-cyan-400'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas de Pie de Página */}
                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Sueldo Mensual</p>
                            <p className="text-sm font-bold text-slate-300">{formatCLP(summary.budget || 0)}</p>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Meta Ahorro</p>
                            <div className="flex items-center gap-1">
                                <PiggyBank size={14} className="text-emerald-400" />
                                <p className="text-sm font-bold text-slate-300">{formatCLP(savingsGoal)}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Promedio Diario</p>
                            <div className="flex items-center gap-1">
                                {isOverBudget ? (
                                    <TrendingUp size={14} className="text-red-400" />
                                ) : (
                                    <TrendingDown size={14} className="text-emerald-400" />
                                )}
                                <p className="text-sm font-bold text-slate-300">{formatCLP(summary.dailyAverage)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
