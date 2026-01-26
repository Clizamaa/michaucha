require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching last 5 transactions...");
    const transactions = await prisma.transaction.findMany({
        take: 5,
        orderBy: { id: 'desc' },
        include: { category: true }
    });

    console.log(JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
