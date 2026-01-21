import Link from "next/link";
import Image from "next/image";
import { Space_Grotesk } from "next/font/google"; // Import Font
import { ArrowUpRight, TrendingDown, Wallet, CreditCard, Activity, Calendar } from "lucide-react";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] }); // Initialize Font
import VoiceRecorder from "@/components/voice/VoiceRecorder"; // Ensure this matches creation path
import BudgetCard from "@/components/dashboard/BudgetCard";
import MonthNavigation from "@/components/shared/MonthNavigation"; // Import the new component
import DeleteButton from "@/components/shared/DeleteButton";
import { getDashboardData, createTransaction } from "@/app/actions/transaction"; // Verify path
import FixedExpensesList from "@/components/dashboard/FixedExpensesList"; // Import new component
import { formatCLP, cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Dashboard | Michaucha',
  description: 'Control de gastos personales y presupuesto mensual.',
};

export default async function Dashboard({ searchParams }) {
  const { year, month } = await searchParams;
  const currentDate = (year && month) ? new Date(parseInt(year), parseInt(month) - 1, 1) : new Date();

  const data = await getDashboardData(currentDate);
  const { summary, recentTransactions } = data;

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden bg-[#0f1023] font-sans selection:bg-pink-500/30 selection:text-pink-200">

      {/* Background Decor */}
      <div className="fixed top-[-10%] right-[-5%] w-[300px] h-[300px] bg-purple-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-[20%] left-[-10%] w-[250px] h-[250px] bg-blue-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="py-6 sticky top-0 bg-[#0f1023]/80 backdrop-blur-md z-30 border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 overflow-hidden shadow-blue-500/30">
              <Image
                src="/logo.png"
                alt="Michaucha Logo"
                fill
                className="object-cover"
              />
            </div>
            {/* <div className="relative h-27 w-80">
              <Image
                src="/tituloo.png"
                alt="Michaucha"
                fill
                className="object-contain object-left"
                priority
              />
            </div> */}
          </div>

          <div className="flex items-center gap-4">
            {/* Search or Notifications Mock */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-400 p-[2px]">
              <div className="w-full h-full rounded-full bg-[#0f1023] flex items-center justify-center text-white font-bold text-xs">
                CH
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8 relative z-10 max-w-7xl mx-auto w-full mt-8">

        {/* Month Navigation - Moved here */}
        <div className="flex items-center gap-4 mb-4">
          <MonthNavigation currentDate={currentDate} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Card - Spans 2 cols on Desktop */}
          <div className="lg:col-span-2 h-full">
            <BudgetCard summary={summary} />
          </div>

          {/* Stacked Info Cards */}
          <div className="flex flex-col gap-6 h-full">
            {/* Top Gasto */}
            <Link
              href={summary.maxExpense.categoryId ? `/category/${summary.maxExpense.categoryId}` : '#'}
              className="flex-1 p-6 rounded-[2rem] bg-[#1f2029] border border-white/5 shadow-2xl shadow-black/20 flex flex-col justify-between group hover:border-white/10 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div className="bg-orange-500/10 text-orange-400 p-1 rounded-lg">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div>
                <p className="text-white font-bold text-lg truncate">{summary.maxExpense.category}</p>
                <p className="text-xs text-slate-500 mt-1">Ver detalle mensual</p>
              </div>
            </Link>

            {/* VISA Shortcut */}
            <Link href="/visa" className="flex-1 p-6 rounded-[2rem] bg-[#1f2029] border border-white/5 shadow-2xl shadow-black/20 flex flex-col justify-between group hover:bg-[#252636] transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <CreditCard size={100} />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <CreditCard size={24} />
                </div>
                <div className="bg-blue-500/10 text-blue-400 p-1 rounded-lg">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">VISA</p>
                <p className="text-white font-bold text-lg">Movimientos</p>
                <p className="text-xs text-slate-500 mt-1">Ver detalle mensual</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Fixed Expenses Section */}
        <FixedExpensesList currentDate={currentDate} />

        {/* Recent Transactions Table Style */}
        <div className="bg-[#1f2029] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-white text-xl">Recientes</h3>
              <p className="text-slate-500 text-sm mt-1">Últimos movimientos del mes</p>
            </div>
            <Link href="/gastos" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Ver Todo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentTransactions.map((t) => (
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
                      <span className="px-1.5 py-0.5 rounded-md bg-white/5 uppercase tracking-wider">{t.category.name}</span>
                      <span>•</span>
                      {new Date(t.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
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

            {recentTransactions.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-600">
                <div className="inline-flex p-4 rounded-full bg-white/5 mb-4">
                  <Wallet size={24} className="opacity-50" />
                </div>
                <p className="text-sm">Sin movimientos recientes.</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Floating Recorder */}
      <VoiceRecorder onSave={createTransaction} />
    </div>
  );
}
