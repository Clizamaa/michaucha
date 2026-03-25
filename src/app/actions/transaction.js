'use server';

import { TransactionService } from "@/lib/transaction-service";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCurrentPeriod, getPeriodByDate } from "./period";

async function getSessionUserId() {
    const session = await auth();
    if (!session?.user) redirect('/api/auth/signout');

    if (!session.user.id && session.user.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) return user.id;
    }

    if (!session.user.id) redirect('/api/auth/signout');
    return parseInt(session.user.id);
}

export async function createTransaction(data) {
    const userId = await getSessionUserId();
    return await TransactionService.createTransaction({ ...data, userId });
}

export async function deleteTransaction(id) {
    return await TransactionService.deleteTransaction(id);
}

export async function getDashboardData(periodId = null) {
    const userId = await getSessionUserId();
    let activePeriod;

    if (periodId) {
        activePeriod = await prisma.period.findFirst({
            where: { id: parseInt(periodId), userId }
        });
    } else {
        activePeriod = await getCurrentPeriod();
    }

    if (!activePeriod) {
        return {
            summary: {
                monthTotal: 0, budget: 0, remaining: 0, diffPercent: 0,
                dailyAverage: 0,
                maxExpense: { category: '-', amount: 0, categoryId: null }
            },
            recentTransactions: []
        };
    }

    const startDate = activePeriod.startDate;

    // 1. Transacciones del periodo
    const transactions = await prisma.transaction.findMany({
        where: {
            category: { userId },
            date: {
                gte: startDate,
                ...(activePeriod.endDate ? { lte: activePeriod.endDate } : {})
            }
        },
        include: { category: true },
        orderBy: { date: 'desc' }
    });

    let transactionTotal = transactions.reduce((acc, curr) => acc + (curr?.amount || 0), 0);

    // 2. Gastos Fijos Pagados
    const paidFixedExpensesStats = await prisma.fixedExpensePayment.findMany({
        where: { periodId: activePeriod.id, isPaid: true },
        include: { fixedExpense: true }
    });

    // 3. Gasto Virtual (gastos fijos sin transacción real)
    let virtualFixedTotal = 0;
    const transactionCategoryNames = new Set(transactions.map(t => t.category.name.toLowerCase()));

    for (const payment of paidFixedExpensesStats) {
        const expenseName = payment.fixedExpense.name;
        if (!transactionCategoryNames.has(expenseName.toLowerCase())) {
            virtualFixedTotal += payment.fixedExpense.amount;
        }
    }

    const totalGastadoReal = transactionTotal + virtualFixedTotal;

    const endCalculationDate = activePeriod.endDate || new Date();
    const diffTime = Math.abs(endCalculationDate - startDate);
    const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const dailyAverage = daysPassed > 0 ? totalGastadoReal / daysPassed : 0;

    const maxTransaction = transactions.length > 0
        ? transactions.reduce((prev, current) => (prev.amount > current.amount) ? prev : current)
        : null;

    const budgetRecord = await prisma.monthlyBudget.findUnique({
        where: { periodId: activePeriod.id }
    });

    const budget = budgetRecord ? budgetRecord.amount : 0;
    const remaining = budget - totalGastadoReal;

    const visaTotal = transactions
        .filter(t => t.paymentMethod === 'VISA')
        .reduce((acc, curr) => acc + curr.amount, 0);

    return {
        summary: {
            monthTotal: totalGastadoReal, budget, remaining,
            savingsGoal: activePeriod.savingsGoal,
            diffPercent: 0,
            dailyAverage: Math.round(dailyAverage),
            maxExpense: maxTransaction
                ? { category: maxTransaction.category.name, amount: maxTransaction.amount, categoryId: maxTransaction.categoryId }
                : { category: '-', amount: 0, categoryId: null },
            periodValues: {
                startDate: activePeriod.startDate,
                endDate: activePeriod.endDate,
                isActive: activePeriod.isActive
            },
            visaTotal
        },
        recentTransactions: transactions
    };
}

export async function getCategoryTransactions(categoryId, periodIdentifier = null) {
    const userId = await getSessionUserId();
    let activePeriod;

    if (periodIdentifier instanceof Date || (typeof periodIdentifier === 'string' && periodIdentifier.includes('-') && !isNaN(Date.parse(periodIdentifier)))) {
        activePeriod = await getPeriodByDate(periodIdentifier);
    } else if (periodIdentifier) {
        activePeriod = await prisma.period.findFirst({ where: { id: parseInt(periodIdentifier), userId } });
    } else {
        activePeriod = await getCurrentPeriod();
    }

    const idParsed = parseInt(categoryId);
    if (isNaN(idParsed)) {
        return { categoryName: 'Categoría no válida', transactions: [], total: 0 };
    }

    const whereClause = {
        categoryId: idParsed,
        category: { userId },
        ...(activePeriod ? {
            date: {
                gte: activePeriod.startDate,
                ...(activePeriod.endDate ? { lte: activePeriod.endDate } : {})
            }
        } : {})
    };

    const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { date: 'desc' }
    });

    const category = await prisma.category.findFirst({
        where: { id: idParsed, userId }
    });

    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);

    return {
        categoryName: category ? category.name : 'Desconocida',
        transactions,
        total
    };
}
