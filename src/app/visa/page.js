import Link from "next/link";
import { ArrowLeft, CreditCard, Filter, Calendar } from "lucide-react";
import DeleteButton from "@/components/shared/DeleteButton";
import { prisma } from "@/lib/prisma";
import { formatCLP, cn } from "@/lib/utils";
import { getCurrentPeriod } from "@/app/actions/period";

export const metadata = {
    title: 'Movimientos VISA | Michaucha',
    description: 'Resumen de gastos y facturación de tarjeta VISA.',
};

export const dynamic = 'force-dynamic';

async function getVisaData(periodId = null) {
    let activePeriod;

    if (periodId) {
        activePeriod = await prisma.period.findUnique({ where: { id: parseInt(periodId) } });
    } else {
        activePeriod = await getCurrentPeriod();
    }

    // Fallback si no hay periodo
    const startDate = activePeriod ? activePeriod.startDate : new Date();
    const endDate = activePeriod && activePeriod.endDate ? activePeriod.endDate : undefined;

    const whereClause = {
        paymentMethod: 'VISA',
        date: {
            gte: startDate,
            ...(endDate ? { lte: endDate } : {})
        }
    };

    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        include: { category: true }
    });

    const total = transactions.reduce((acc, t) => acc + t.amount, 0);

    return { transactions, total, activePeriod };
}

export default async function VisaPage() {
    // Usamos el periodo actual por defecto
    const { transactions, total, activePeriod } = await getVisaData();

    return (
        <div className="min-h-screen pb-10 bg-[#0f1023] font-sans selection:bg-pink-500/30 selection:text-pink-200 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="fixed top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

            <header className="py-6 sticky top-0 z-20 bg-[#0f1023]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-wide">Movimientos VISA</h1>
                            <p className="text-xs text-slate-500">Resumen del periodo actual</p>
                        </div>
                    </div>
                    {/* Opcional: Agregar acción extra de encabezado aquí */}
                </div>
            </header>

            <main className="px-6 mt-8 max-w-5xl mx-auto w-full relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Columna Izquierda: Resumen de Tarjeta */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Info Periodo */}
                        <div className="flex justify-center md:justify-start text-slate-400 text-xs items-center gap-2">
                            <Calendar size={14} />
                            {activePeriod ? (
                                <span>
                                    {new Date(activePeriod.startDate).toLocaleDateString()} - {activePeriod.endDate ? new Date(activePeriod.endDate).toLocaleDateString() : 'Presente'}
                                </span>
                            ) : (
                                <span>-</span>
                            )}
                        </div>

                        {/* Visual de Tarjeta VISA */}
                        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-blue-700 to-[#0a0b1e] text-white shadow-2xl shadow-blue-900/20 overflow-hidden sticky top-28 border border-white/10 group">
                            {/* Superposición Brillante */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none"></div>

                            {/* Círculos decorativos */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="italic font-bold text-2xl tracking-wider font-serif text-white/90">VISA</div>
                                    <CreditCard className="text-white/70" size={32} />
                                </div>

                                <div className="mb-8">
                                    <p className="text-blue-200/60 text-[10px] uppercase tracking-widest mb-1">
                                        Total Facturado (Periodo)
                                    </p>
                                    <p className="text-4xl font-mono font-bold tracking-tight text-white drop-shadow-lg">{formatCLP(total)}</p>
                                </div>

                                <div className="flex justify-between items-end text-white/50 font-mono text-xs tracking-widest">
                                    <div>**** 1234</div>
                                    <div>CHRISTIAN</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Lista de Transacciones */}
                    <div className="md:col-span-2">
                        <div className="bg-[#1f2029] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl shadow-black/20">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-white text-lg">Detalle de Compras</h3>
                                <div className="text-xs text-slate-500 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
                                    {transactions.length} movimientos
                                </div>
                            </div>

                            <div className="space-y-4">
                                {transactions.map((t) => (
                                    <div key={t.id} className="group flex items-center justify-between p-4 rounded-2xl bg-[#151621] border border-white/5 hover:border-blue-500/30 transition-all hover:translate-x-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm md:text-base">{t.description || t.category.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('es-CL')}</p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{t.category.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-white font-mono text-sm md:text-base bg-white/5 px-2 py-1 rounded-lg">
                                                -{formatCLP(t.amount)}
                                            </span>
                                            <DeleteButton id={t.id} />
                                        </div>
                                    </div>
                                ))}

                                {transactions.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-4 rounded-3xl border border-dashed border-white/5 bg-[#151621]/50">
                                        <div className="p-4 bg-white/5 rounded-full">
                                            <CreditCard className="w-8 h-8 opacity-30" />
                                        </div>
                                        <p className="text-sm">No hay compras con VISA este periodo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
