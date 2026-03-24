'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function getSessionUserId() {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    
    if (!session.user.id && session.user.email) {
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) return user.id;
    }
    
    if (!session.user.id) throw new Error('Unauthorized');
    return parseInt(session.user.id);
}

export async function getCurrentPeriod() {
    const userId = await getSessionUserId();

    let activePeriod = await prisma.period.findFirst({
        where: { isActive: true, userId },
        orderBy: { startDate: 'desc' }
    });

    if (!activePeriod) {
        activePeriod = await prisma.period.create({
            data: { startDate: new Date(), isActive: true, userId }
        });
    }

    return activePeriod;
}

export async function closePeriod() {
    const activePeriod = await getCurrentPeriod();

    if (!activePeriod) throw new Error("No active period found");

    const now = new Date();
    const userId = await getSessionUserId();

    await prisma.period.update({
        where: { id: activePeriod.id },
        data: { isActive: false, endDate: now }
    });

    const newPeriod = await prisma.period.create({
        data: { startDate: now, isActive: true, userId }
    });

    revalidatePath('/');
    return { success: true, newPeriod };
}

export async function updateSavingsGoal(periodId, amount) {
    const userId = await getSessionUserId();

    if (!periodId) {
        const activePeriod = await getCurrentPeriod();
        periodId = activePeriod.id;
    }

    try {
        // Ensure the period belongs to this user
        const period = await prisma.period.findFirst({
            where: { id: parseInt(periodId), userId }
        });
        if (!period) throw new Error('Period not found or unauthorized');

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

export async function getPeriodByDate(date) {
    const userId = await getSessionUserId();
    const targetDate = new Date(date);

    const period = await prisma.period.findFirst({
        where: {
            userId,
            AND: [
                { startDate: { lte: targetDate } },
                {
                    OR: [
                        { endDate: { gte: targetDate } },
                        { endDate: null }
                    ]
                }
            ]
        }
    });

    return period;
}
