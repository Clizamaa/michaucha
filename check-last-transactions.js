const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const transactions = await prisma.transaction.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                category: true
            }
        });

        console.log("=== ÚLTIMAS 5 TRANSACCIONES EN LA BASE DE DATOS ===");
        console.log(JSON.stringify(transactions, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
