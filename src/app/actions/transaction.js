'use server';

import { TransactionService } from "@/lib/transaction-service";
import { prisma } from "@/lib/prisma";

export async function createTransaction(data) {
    return await TransactionService.createTransaction(data);
}

export async function deleteTransaction(id) {
    return await TransactionService.deleteTransaction(id);
}

export async function getDashboardData(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 1); // First day of next month (exclusive for <)

    const transactions = await prisma.transaction.findMany({
        where: {
            date: {
                gte: firstDay,
                lt: lastDay
            }
        },
        include: { category: true },
        orderBy: { date: 'desc' }
    });

    const total = transactions.reduce((acc, curr) => acc + curr?.amount || 0, 0);

    // Daily Average Logic
    const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;
    const daysPassed = isCurrentMonth ? new Date().getDate() : new Date(year, month + 1, 0).getDate(); // Days in month if past
    const dailyAverage = daysPassed > 0 ? total / daysPassed : 0;

    const maxTransaction = transactions.length > 0 ? transactions.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) : null;

    const budgetRecord = await prisma.monthlyBudget.findUnique({
        where: {
            month_year: {
                month: month + 1, // 1-indexed for DB
                year: year
            }
        }
    });

    const budget = budgetRecord ? budgetRecord.amount : 0;
    const remaining = budget - total;

    return {
        summary: {
            monthTotal: total,
            budget,
            remaining,
            diffPercent: 0,
            dailyAverage: Math.round(dailyAverage),
            maxExpense: maxTransaction ? { category: maxTransaction.category.name, amount: maxTransaction.amount } : { category: '-', amount: 0 }
        },
        recentTransactions: transactions // Return all for the month view, or maybe still slice? Let's return all for "Recientes" in context of month
    };
}
