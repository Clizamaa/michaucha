import { prisma } from "@/lib/prisma";

export async function getPeriodSpendingAnalysis(userId, limit = 3) {
    if (!userId) return { averageSpending: 0, averageIncome: 0, categories: {}, periodCount: 0 };

    const closedPeriods = await prisma.period.findMany({
        where: { isActive: false, userId },
        orderBy: { endDate: 'desc' },
        take: limit,
        include: {
            payments: {
                where: { isPaid: true },
                include: { fixedExpense: true }
            },
            budgets: true
        }
    });

    if (closedPeriods.length === 0) {
        return { averageSpending: 0, averageIncome: 0, categories: {}, periodCount: 0 };
    }

    let totalGlobalSpending = 0;
    let totalIncome = 0;
    const categoryTotals = {};

    for (const period of closedPeriods) {
        const budget = period.budgets[0]?.amount || 0;
        totalIncome += budget;

        let periodFixedTotal = 0;
        for (const payment of period.payments) {
            periodFixedTotal += payment.fixedExpense.amount;
        }

        const transactions = await prisma.transaction.findMany({
            where: {
                category: { userId },
                date: {
                    gte: period.startDate,
                    lte: period.endDate
                }
            },
            include: { category: true }
        });

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
