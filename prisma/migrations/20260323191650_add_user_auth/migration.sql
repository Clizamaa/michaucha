-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `Category_userId_idx`(`userId`),
    UNIQUE INDEX `Category_name_userId_key`(`name`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` VARCHAR(191) NULL,
    `categoryId` INTEGER NOT NULL,
    `paymentMethod` ENUM('CASH', 'DEBIT', 'VISA') NOT NULL DEFAULT 'CASH',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Transaction_date_idx`(`date`),
    INDEX `Transaction_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Period` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `savingsGoal` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Period_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyBudget` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` INTEGER NOT NULL,
    `periodId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonthlyBudget_periodId_key`(`periodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FixedExpense` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FixedExpense_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FixedExpensePayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fixedExpenseId` INTEGER NOT NULL,
    `periodId` INTEGER NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FixedExpensePayment_fixedExpenseId_periodId_key`(`fixedExpenseId`, `periodId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Period` ADD CONSTRAINT `Period_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyBudget` ADD CONSTRAINT `MonthlyBudget_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `Period`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FixedExpense` ADD CONSTRAINT `FixedExpense_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FixedExpensePayment` ADD CONSTRAINT `FixedExpensePayment_fixedExpenseId_fkey` FOREIGN KEY (`fixedExpenseId`) REFERENCES `FixedExpense`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FixedExpensePayment` ADD CONSTRAINT `FixedExpensePayment_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `Period`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
