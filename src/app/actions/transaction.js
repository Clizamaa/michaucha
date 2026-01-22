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
    const month = date.getMonth(); // base-0

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 1); // Primer día del siguiente mes (exclusivo para <)

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

    // Lógica de Promedio Diario
    const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;
    const daysPassed = isCurrentMonth ? new Date().getDate() : new Date(year, month + 1, 0).getDate(); // Días en el mes si ya pasó
    const dailyAverage = daysPassed > 0 ? total / daysPassed : 0;

    const maxTransaction = transactions.length > 0 ? transactions.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) : null;

    const budgetRecord = await prisma.monthlyBudget.findUnique({
        where: {
            month_year: {
                month: month + 1, // base-1 para BD
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
            maxExpense: maxTransaction ? { category: maxTransaction.category.name, amount: maxTransaction.amount, categoryId: maxTransaction.categoryId } : { category: '-', amount: 0, categoryId: null }
        },
        recentTransactions: transactions // Retorna todo para la vista mensual, ¿o quizás aún recortar? Retornemos todo para "Recientes" en el contexto del mes
    };
}

export async function getCategoryTransactions(categoryId, date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 1);

    const transactions = await prisma.transaction.findMany({
        where: {
            categoryId: parseInt(categoryId),
            date: {
                gte: firstDay,
                lt: lastDay
            }
        },
        include: { category: true },
        orderBy: { date: 'desc' }
    });

    const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
    });

    const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);

    return {
        categoryName: category ? category.name : 'Desconocida',
        transactions,
        total
    };
}
