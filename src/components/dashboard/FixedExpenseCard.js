'use client';

import { useState } from 'react';
import { Check, Edit2, X } from 'lucide-react';
import { formatCLP, cn } from '@/lib/utils';
import { toggleFixedExpensePayment, updateFixedExpenseAmount } from '@/app/actions/fixed-expense';

export default function FixedExpenseCard({ expense, month, year }) {
    const [isPaid, setIsPaid] = useState(expense.isPaid);
    const [isEditing, setIsEditing] = useState(false);
    const [amount, setAmount] = useState(expense.amount);
    const [isLoading, setIsLoading] = useState(false);

    const handleTogglePaid = async () => {
        setIsLoading(true);
        const newState = !isPaid;
        setIsPaid(newState); // Optimistic update

        try {
            await toggleFixedExpensePayment(expense.id, month, year, newState);
        } catch (error) {
            console.error("Failed to toggle payment", error);
            setIsPaid(!newState); // Revert
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAmount = async () => {
        setIsLoading(true);
        try {
            await updateFixedExpenseAmount(expense.id, amount);
            expense.amount = amount; // Update local reference if needed, though parent might re-render
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update amount", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn(
            "min-w-[280px] p-5 rounded-2xl border transition-all flex flex-col justify-between group relative",
            isPaid
                ? "bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40"
                : "bg-[#1f2029] border-white/5 hover:border-white/10"
        )}>
            {/* Línea Indicadora de Estado */}
            <div className={cn(
                "absolute top-0 left-0 w-full h-1 rounded-t-2xl transition-colors",
                isPaid ? "bg-emerald-500" : "bg-red-500/50"
            )} />

            <div className="flex justify-between items-start mb-4 mt-2">
                <div>
                    <h3 className="text-white font-bold text-sm truncate pr-2">{expense.name}</h3>
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        isPaid ? "text-emerald-400" : "text-slate-500"
                    )}>
                        {isPaid ? "Pagado" : "Pendiente"}
                    </p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-slate-500 hover:text-white transition-colors p-1"
                >
                    <Edit2 size={14} />
                </button>
            </div>

            <div className="flex items-center justify-between">
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="bg-[#151621] border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-white w-full focus:outline-none focus:border-blue-500/50"
                            autoFocus
                        />
                        <button onClick={handleSaveAmount} className="text-emerald-400 hover:text-emerald-300 p-1">
                            <Check size={16} />
                        </button>
                    </div>
                ) : (
                    <p className="text-xl font-mono font-bold text-white">
                        {formatCLP(amount)}
                    </p>
                )}

                {!isEditing && (
                    <button
                        onClick={handleTogglePaid}
                        disabled={isLoading}
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg",
                            isPaid
                                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                                : "bg-white/5 text-slate-400 hover:bg-white/10"
                        )}
                        title={isPaid ? "Marcar como no pagado" : "Marcar como pagado"}
                    >
                        {isPaid ? <Check size={16} /> : <div className="w-3 h-3 rounded-full border-2 border-slate-500" />}
                    </button>
                )}
            </div>
        </div>
    );
}
