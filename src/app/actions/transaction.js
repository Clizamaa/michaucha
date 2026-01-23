'use server';

import { TransactionService } from "@/lib/transaction-service";
import { prisma } from "@/lib/prisma";
import { getCurrentPeriod } from "./period";

export async function createTransaction(data) {
    return await TransactionService.createTransaction(data);
}

export async function deleteTransaction(id) {
    return await TransactionService.deleteTransaction(id);
}

// ... (imports remain)

export async function getDashboardData(periodId = null) {
    let activePeriod;

    if (periodId) {
        activePeriod = await prisma.period.findUnique({ where: { id: parseInt(periodId) } });
    } else {
        activePeriod = await getCurrentPeriod();
    }

    if (!activePeriod) {
        // Fallback si no hay periodos (recién inicializado)
        return {
            summary: {
                monthTotal: 0,
                budget: 0,
                remaining: 0,
                diffPercent: 0,
                dailyAverage: 0,
                maxExpense: { category: '-', amount: 0, categoryId: null }
            },
            recentTransactions: []
        };
    }

    const startDate = activePeriod.startDate;
    const endDate = activePeriod.endDate || new Date(); // Si está activo, hasta hoy para filtro

    // 1. Obtener Transacciones Reales dentro del Periodo
    const transactions = await prisma.transaction.findMany({
        where: {
            date: {
                gte: startDate,
                // Si el periodo está cerrado, usamos su fecha fin. Si está activo, no ponemos límite superior estricto 
                // o usamos ahora? Generalmente queremos ver todo lo de ese periodo.
                // Si está cerrado activePeriod.endDate no es null.
                ...(activePeriod.endDate ? { lte: activePeriod.endDate } : {})
            }
        },
        include: { category: true },
        orderBy: { date: 'desc' }
    });

    let transactionTotal = transactions.reduce((acc, curr) => acc + curr?.amount || 0, 0);

    // 2. Obtener Gastos Fijos Pagados en este Periodo
    const paidFixedExpensesStats = await prisma.fixedExpensePayment.findMany({
        where: {
            periodId: activePeriod.id,
            isPaid: true
        },
        include: {
            fixedExpense: true
        }
    });

    // 3. Calcular "Gasto Virtual"
    let virtualFixedTotal = 0;
    const transactionCategoryNames = new Set(transactions.map(t => t.category.name.toLowerCase()));

    for (const payment of paidFixedExpensesStats) {
        const expenseName = payment.fixedExpense.name;
        if (!transactionCategoryNames.has(expenseName.toLowerCase())) {
            virtualFixedTotal += payment.fixedExpense.amount;
        }
    }

    const totalGastadoReal = transactionTotal + virtualFixedTotal;

    // Lógica de Promedio Diario
    // Días transcurridos = (ahora - inicio) ó (fin - inicio)
    const endCalculationDate = activePeriod.endDate || new Date();
    const diffTime = Math.abs(endCalculationDate - startDate);
    const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Al menos 1 día

    const dailyAverage = daysPassed > 0 ? totalGastadoReal / daysPassed : 0;

    const maxTransaction = transactions.length > 0 ? transactions.reduce((prev, current) => (prev.amount > current.amount) ? prev : current) : null;

    const budgetRecord = await prisma.monthlyBudget.findUnique({
        where: {
            periodId: activePeriod.id
        }
    });

    const budget = budgetRecord ? budgetRecord.amount : 0;
    const remaining = budget - totalGastadoReal;

    return {
        summary: {
            monthTotal: totalGastadoReal,
            budget,
            remaining,
            savingsGoal: activePeriod.savingsGoal, // NEW field
            diffPercent: 0,
            dailyAverage: Math.round(dailyAverage),
            maxExpense: maxTransaction ? { category: maxTransaction.category.name, amount: maxTransaction.amount, categoryId: maxTransaction.categoryId } : { category: '-', amount: 0, categoryId: null },
            periodValues: { // Info extra para el frontend
                startDate: activePeriod.startDate,
                endDate: activePeriod.endDate,
                isActive: activePeriod.isActive
            }
        },
        recentTransactions: transactions
    };
}

export async function getCategoryTransactions(categoryId, periodId = null) {
    let activePeriod;
    if (periodId) {
        activePeriod = await prisma.period.findUnique({ where: { id: parseInt(periodId) } });
    } else {
        activePeriod = await getCurrentPeriod();
    }

    const startDate = activePeriod ? activePeriod.startDate : new Date();
    // Si no hay periodo, un fallback seguro?

    const whereClause = {
        categoryId: parseInt(categoryId),
        ...(activePeriod ? {
            date: {
                gte: startDate,
                ...(activePeriod.endDate ? { lte: activePeriod.endDate } : {})
            }
        } : {})
    };

    const transactions = await prisma.transaction.findMany({
        where: whereClause,
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
