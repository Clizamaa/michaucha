import { prisma } from "@/lib/prisma";

export async function getPeriodSpendingAnalysis(limit = 3) {
    // 1. Obtener últimos 'limit' periodos CERRADOS (isActive: false)
    const closedPeriods = await prisma.period.findMany({
        where: { isActive: false },
        orderBy: { endDate: 'desc' },
        take: limit,
        include: {
            payments: { // Gastos fijos
                where: { isPaid: true },
                include: { fixedExpense: true }
            },
            budgets: true // Presupuesto
        }
    });

    if (closedPeriods.length === 0) {
        return {
            averageSpending: 0,
            averageIncome: 0,
            categories: {},
            periodCount: 0
        };
    }

    let totalGlobalSpending = 0;
    let totalIncome = 0;
    const categoryTotals = {};

    for (const period of closedPeriods) {
        // Ingresos (Presupuesto)
        const budget = period.budgets[0]?.amount || 0;
        totalIncome += budget;

        // Gastos Fijos
        let periodFixedTotal = 0;
        for (const payment of period.payments) {
            periodFixedTotal += payment.fixedExpense.amount;
        }

        // Transacciones (Variable)
        // Necesitamos consultar las transacciones de este periodo
        const transactions = await prisma.transaction.findMany({
            where: {
                date: {
                    gte: period.startDate,
                    lte: period.endDate // periodo cerrado tiene endDate
                }
            },
            include: { category: true }
        });

        // Sumar transacciones y agrupar por categoría
        let periodVariableTotal = 0;
        for (const t of transactions) {
            periodVariableTotal += t.amount;

            const catName = t.category.name;
            if (!categoryTotals[catName]) categoryTotals[catName] = 0;
            categoryTotals[catName] += t.amount;
        }

        totalGlobalSpending += (periodFixedTotal + periodVariableTotal);
    }

    const count = closedPeriods.length;

    // Promediar categorías
    const averageCategories = {};
    for (const [cat, total] of Object.entries(categoryTotals)) {
        averageCategories[cat] = Math.round(total / count);
    }

    return {
        averageSpending: Math.round(totalGlobalSpending / count),
        averageIncome: Math.round(totalIncome / count),
        averageSavings: Math.round((totalIncome - totalGlobalSpending) / count),
        categoryAverages: averageCategories,
        periodCount: count
    };
}
