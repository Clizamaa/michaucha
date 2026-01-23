import FixedExpenseCard from "./FixedExpenseCard";
import { getFixedExpenses } from "@/app/actions/fixed-expense";
import { getCurrentPeriod } from "@/app/actions/period";
import { Wallet } from "lucide-react";

export default async function FixedExpensesList({ periodId }) {
    // Si no viene periodId, buscamos el actual
    let currentPeriodId = periodId;
    if (!currentPeriodId) {
        const period = await getCurrentPeriod();
        currentPeriodId = period.id;
    }

    // Obtener datos dentro del componente del servidor
    const expenses = await getFixedExpenses(currentPeriodId);

    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const paidTotal = expenses.filter(e => e.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
    const progress = total > 0 ? (paidTotal / total) * 100 : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Gastos Fijos</h3>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{Math.round(progress)}% Pagado</span>
                            <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diseño en Cuadrícula */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
                {expenses.map((expense) => (
                    <FixedExpenseCard key={expense.id} expense={expense} periodId={currentPeriodId} />
                ))}
            </div>
        </div>
    );
}
