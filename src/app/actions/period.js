'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCurrentPeriod() {
    // Buscar periodo activo
    let activePeriod = await prisma.period.findFirst({
        where: { isActive: true },
        orderBy: { startDate: 'desc' }
    });

    // Si no existe ninguno, crear el primero por defecto
    if (!activePeriod) {
        activePeriod = await prisma.period.create({
            data: {
                startDate: new Date(),
                isActive: true
            }
        });
    }

    return activePeriod;
}

export async function closePeriod() {
    const activePeriod = await getCurrentPeriod();

    if (!activePeriod) {
        throw new Error("No active period found");
    }

    const now = new Date();

    // 1. Cerrar periodo actual
    await prisma.period.update({
        where: { id: activePeriod.id },
        data: {
            isActive: false,
            endDate: now
        }
    });

    // 2. Crear nuevo periodo
    const newPeriod = await prisma.period.create({
        data: {
            startDate: now,
            isActive: true
        }
    });

    // NOTA: Los gastos fijos "se reinician" automáticamente porque
    // la tabla FixedExpensePayment vincula pagos a un periodId específico.
    // Al crearse un nuevo periodo, no existen registros de pago para ese nuevo ID,
    // por lo tanto, todos los FixedExpense aparecerán como "No Pagados" (o pendientes).

    // ... (closePeriod implementation)
    revalidatePath('/');
    return { success: true, newPeriod };
}

export async function updateSavingsGoal(periodId, amount) {
    if (!periodId) {
        const activePeriod = await getCurrentPeriod();
        periodId = activePeriod.id;
    }

    try {
        await prisma.period.update({
            where: { id: parseInt(periodId) },
            data: { savingsGoal: parseInt(amount) }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Error updating savings goal:", error);
        return { success: false, error: error.message };
    }
}
