import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const TransactionService = {
    /**
     * Crea una nueva transacción con lógica de resolución de categoría
     * @param {Object} data - { amount, category, date, description, paymentMethod }
     */
    async createTransaction(data) {
        try {
            if (!data.amount) throw new Error("Amount is required");

            const categoryName = data.category || "Gastos varios";

            // 1. Resolver Categoría
            let category = await prisma.category.findUnique({
                where: { name: categoryName }
            });

            if (!category) {
                // Retroceder a "Gastos varios" si no se encuentra la categoría específica
                // En producción, asumimos que las categorías fijas están sembradas (seeded).
                console.warn(`Category '${categoryName}' not found. Falling back to 'Gastos varios'.`);
                category = await prisma.category.findUnique({
                    where: { name: "Gastos varios" }
                });

                // Si aún falta (fallo crítico en seeding), crear marcador de posición (seguridad solo desarrollo)
                if (!category && process.env.NODE_ENV !== 'production') {
                    category = await prisma.category.create({ data: { name: categoryName } });
                }
            }

            if (!category) throw new Error("Category resolution failed. Database might need seeding.");

            // 2. Crear Transacción
            const transaction = await prisma.transaction.create({
                data: {
                    amount: data.amount,
                    description: data.description,
                    date: data.date ? new Date(data.date) : new Date(),
                    categoryId: category.id,
                    paymentMethod: data.paymentMethod || "CASH",
                },
                include: { category: true }
            });

            // 3. Revalidar Rutas
            revalidatePath('/');
            revalidatePath('/gastos');
            revalidatePath('/visa');
            revalidatePath('/dashboard');

            return { success: true, data: transaction };

        } catch (error) {
            console.error("[TransactionService] Error:", error);
            return { success: false, error: error.message };
        }
    },

    async deleteTransaction(id) {
        try {
            await prisma.transaction.delete({
                where: { id }
            });

            revalidatePath('/');
            revalidatePath('/gastos');
            revalidatePath('/visa');
            revalidatePath('/dashboard');

            return { success: true };
        } catch (error) {
            console.error("[TransactionService] Delete Error:", error);
            return { success: false, error: error.message };
        }
    }
};
