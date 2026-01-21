import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MonthNavigation from "@/components/shared/MonthNavigation";
import { getCategoryTransactions } from "@/app/actions/transaction";
import { formatCLP, cn } from "@/lib/utils";
import DeleteButton from "@/components/shared/DeleteButton";

export default async function CategoryPage({ params, searchParams }) {
    const { id } = await params;
    const { year, month } = await searchParams;
    const currentDate = (year && month) ? new Date(parseInt(year), parseInt(month) - 1, 1) : new Date();

    const data = await getCategoryTransactions(id, currentDate);
    const { categoryName, transactions, total } = data;

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden bg-[#0f1023] font-sans selection:bg-pink-500/30 selection:text-pink-200">
            {/* Background Decor */}
            <div className="fixed top-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed top-[20%] left-[-10%] w-[250px] h-[250px] bg-blue-300/30 rounded-full blur-3xl pointer-events-none" />

            <main className="px-6 space-y-8 relative z-10 max-w-7xl mx-auto w-full mt-8">

                {/* Header & Nav */}
                <div className="flex flex-col gap-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium w-fit">
                        <ArrowLeft size={16} />
                        Volver al Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">{categoryName}</h1>
                            <p className="text-slate-500 text-sm">Detalle de movimientos</p>
                        </div>
                        <MonthNavigation currentDate={currentDate} />
                    </div>
                </div>

                {/* Total Card */}
                <div className="p-6 rounded-[2rem] bg-[#1f2029] border border-white/5 shadow-2xl shadow-black/20">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total del Mes</p>
                    <p className="text-4xl text-white font-mono font-bold">{formatCLP(total)}</p>
                </div>

                {/* Transactions List */}
                <div className="bg-[#1f2029] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl shadow-black/20">
                    <h3 className="font-bold text-white text-xl mb-6">Transacciones</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {transactions.map((t) => (
                            <div key={t.id} className="group flex items-center justify-between p-3 rounded-xl bg-[#151621] border border-white/5 hover:border-white/10 transition-all hover:translate-x-1">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-inner font-bold",
                                        t.paymentMethod === 'VISA' ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                                    )}>
                                        {t.category.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{t.description || t.category.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-2">
                                            {new Date(t.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white font-mono text-sm tracking-tight bg-white/5 px-2 py-1 rounded-lg">
                                        -{formatCLP(t.amount)}
                                    </span>
                                    <DeleteButton id={t.id} className="p-1.5" />
                                </div>
                            </div>
                        ))}

                        {transactions.length === 0 && (
                            <div className="col-span-full text-center py-16 text-slate-600">
                                <p className="text-sm">No hay movimientos en este periodo.</p>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
