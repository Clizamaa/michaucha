import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function MonthNavigation({ currentDate, baseUrl = "/" }) {
    // Month Navigation
    const prevMonthDate = new Date(currentDate);
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);

    const nextMonthDate = new Date(currentDate);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

    // Year Navigation
    const prevYearDate = new Date(currentDate);
    prevYearDate.setFullYear(prevYearDate.getFullYear() - 1);

    const nextYearDate = new Date(currentDate);
    nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);

    const today = new Date();

    // Helper to generate URL
    const getUrl = (date) => `${baseUrl}?year=${date.getFullYear()}&month=${date.getMonth() + 1}`;

    const isNextMonthFuture = nextMonthDate.getFullYear() > today.getFullYear() ||
        (nextMonthDate.getFullYear() === today.getFullYear() && nextMonthDate.getMonth() > today.getMonth());

    const isNextYearFuture = nextYearDate.getFullYear() > today.getFullYear() ||
        (nextYearDate.getFullYear() === today.getFullYear() && nextYearDate.getMonth() > today.getMonth());

    const containerClass = "flex items-center bg-[#1f2029] border border-white/10 rounded-full p-1 shadow-lg";
    const buttonClass = "p-1.5 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white active:scale-95";
    const disabledClass = "p-1.5 text-slate-600 opacity-50 cursor-not-allowed";

    return (
        <div className="flex items-center gap-2">
            {/* Month Selector */}
            <div className={containerClass}>
                <Link href={getUrl(prevMonthDate)} className={buttonClass} title="Mes Anterior">
                    <ChevronLeft size={18} />
                </Link>

                <span className="px-2 font-bold text-slate-700 capitalize text-sm md:text-base min-w-[80px] text-center select-none">
                    {currentDate.toLocaleString('es-CL', { month: 'long' })}
                </span>

                {!isNextMonthFuture ? (
                    <Link href={getUrl(nextMonthDate)} className={buttonClass} title="Mes Siguiente">
                        <ChevronRight size={18} />
                    </Link>
                ) : (
                    <div className={disabledClass}>
                        <ChevronRight size={18} />
                    </div>
                )}
            </div>

            {/* Year Selector */}
            <div className={containerClass}>
                <Link href={getUrl(prevYearDate)} className={buttonClass} title="Año Anterior">
                    <ChevronLeft size={18} />
                </Link>

                <span className="px-2 font-bold text-slate-700 font-mono text-xs md:text-sm min-w-[50px] text-center select-none">
                    {currentDate.getFullYear()}
                </span>

                {!isNextYearFuture ? (
                    <Link href={getUrl(nextYearDate)} className={buttonClass} title="Año Siguiente">
                        <ChevronRight size={18} />
                    </Link>
                ) : (
                    <div className={disabledClass}>
                        <ChevronRight size={18} />
                    </div>
                )}
            </div>
        </div>
    );
}
