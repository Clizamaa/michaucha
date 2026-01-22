import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import DeleteButton from "@/components/shared/DeleteButton";
import { prisma } from "@/lib/prisma";
import { formatCLP, cn } from "@/lib/utils";

export const metadata = {
    title: 'Historial de Gastos | Michaucha',
    description: 'Historial completo de transacciones y gastos.',
};

export const dynamic = 'force-dynamic';

async function getTransactions() {
    const transactions = await prisma.transaction.findMany({
        orderBy: { date: 'desc' },
        include: { category: true }
    });

    // Agrupar por fecha
    const grouped = transactions.reduce((acc, t) => {
        const dateKey = new Date(t.date).toLocaleDateString('es-CL', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const formattedDate = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
        if (!acc[formattedDate]) acc[formattedDate] = [];
        acc[formattedDate].push(t);
        return acc;
    }, {});

    return grouped;
}

export default async function GastosPage() {
    const groupedTransactions = await getTransactions();

    return (
        <div className="min-h-screen pb-20 bg-[#0f1023] font-sans selection:bg-pink-500/30 selection:text-pink-200 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="fixed top-[-20%] right-[20%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <header className="px-6 py-6 sticky top-0 z-20 bg-[#0f1023]/80 backdrop-blur-md border-b border-white/5 flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-wide">Historial de Gastos</h1>
                    <p className="text-xs text-slate-500">Todos los movimientos</p>
                </div>
            </header>

            <div className="px-6 mt-8 space-y-10 relative z-10 max-w-3xl mx-auto">
                {Object.entries(groupedTransactions).map(([date, items]) => (
                    <div key={date} className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
                        {/* Línea vertical conectando grupos */}
                        <div className="absolute left-6 top-10 bottom-0 w-px bg-white/5 -z-10" />

                        <div className="flex items-center gap-3 mb-4 text-slate-400 font-bold text-xs uppercase tracking-widest sticky top-20 bg-[#0f1023]/95 backdrop-blur-md py-3 z-10 w-fit pr-4 rounded-r-xl border-y border-transparent">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                <Calendar className="w-3.5 h-3.5" />
                            </div>
                            {date}
                        </div>

                        <div className="space-y-3 pl-2">
                            {items.map((t) => (
                                <div key={t.id} className="group flex items-center justify-between p-4 rounded-2xl bg-[#1f2029] border border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-black/20 transition-all hover:-translate-y-0.5">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-inner font-bold transition-colors",
                                            t.paymentMethod === 'VISA' ? "bg-orange-500/10 text-orange-400" : "bg-blue-500/10 text-blue-400"
                                        )}>
                                            {t.category.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm md:text-base">{t.description || t.category.name}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {new Date(t.date).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {t.paymentMethod === 'VISA' && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/10 uppercase tracking-wider">
                                                        VISA
                                                    </span>
                                                )}
                                                {t.category.name && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-slate-400 rounded truncate max-w-[120px] border border-white/5">
                                                        {t.category.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-white font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                                            -{formatCLP(t.amount)}
                                        </span>
                                        <DeleteButton id={t.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedTransactions).length === 0 && (
                    <div className="text-center py-32 text-slate-600">
                        <div className="inline-block p-6 rounded-full bg-[#1f2029] mb-4 border border-white/5 shadow-2xl">
                            <div className="text-4xl opacity-50">🍃</div>
                        </div>
                        <p className="text-sm font-medium">No hay movimientos registrados.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
