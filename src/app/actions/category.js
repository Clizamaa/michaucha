'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function getSessionUserId() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    return parseInt(session.user.id);
}

export async function createCategory(prevState, formData) {
    try {
        const userId = await getSessionUserId();
        const rawName = formData.get('name')?.toString().trim();

        if (!rawName) {
            return { error: 'El nombre de la categoría es requerido.' };
        }

        // Capitalize first letter logic mimicking existing ones
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

        // Check if category already exists for this user (case-insensitive checking via Prisma if collation is CI, 
        // but we'll manually check to be safe against case variations)
        const existing = await prisma.category.findFirst({
            where: {
                userId,
                name: {
                    equals: name
                }
            }
        });

        if (existing) {
            return { error: 'Ya existe una categoría con ese nombre.' };
        }

        await prisma.category.create({
            data: {
                name,
                userId
            }
        });

        revalidatePath('/');
        revalidatePath('/gastos');
        return { success: true, message: 'Categoría creada con éxito.' };

    } catch (error) {
        console.error('Error creating category:', error);
        return { error: 'Ocurrió un error al crear la categoría.' };
    }
}

export async function getCategories() {
    const userId = await getSessionUserId();
    return await prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' }
    });
}
