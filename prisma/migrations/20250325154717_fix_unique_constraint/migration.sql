-- CreateTable
CREATE TABLE `user` (
    `phone` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NULL,
    `adress` VARCHAR(191) NULL DEFAULT 'ساری معلم بلوار پرستار',
    `instagram` VARCHAR(191) NULL DEFAULT '0_rahimy',
    `money` VARCHAR(191) NOT NULL DEFAULT '0',
    `walletNumber` VARCHAR(191) NULL DEFAULT '',
    `walletHolder` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `insertDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isSeller` BOOLEAN NOT NULL,

    PRIMARY KEY (`phone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blockUser` (
    `phone` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`phone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` INTEGER NOT NULL,

    INDEX `roles_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SellerIncome` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `wallet` VARCHAR(191) NOT NULL,
    `amount` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,

    INDEX `SellerIncome_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(50) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `Count` INTEGER NOT NULL,
    `Describe` TEXT NOT NULL,

    INDEX `products_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `productId` INTEGER NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `receiverName` VARCHAR(191) NOT NULL,
    `adress` VARCHAR(191) NOT NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `Describe` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `accepted` BOOLEAN NOT NULL DEFAULT false,
    `payed` BOOLEAN NOT NULL DEFAULT false,
    `payTime` DATETIME(3) NULL,
    `payStatus` VARCHAR(191) NOT NULL DEFAULT 'waiting',
    `payCode` VARCHAR(191) NULL,
    `payWalletNumber` VARCHAR(191) NULL,
    `count` INTEGER NOT NULL,
    `finalCost` VARCHAR(191) NOT NULL,
    `finish` VARCHAR(191) NOT NULL DEFAULT 'waiting',
    `sellAccept` BOOLEAN NOT NULL DEFAULT false,
    `price` INTEGER NOT NULL,
    `fee` INTEGER NOT NULL,
    `sendPrice` INTEGER NOT NULL,

    UNIQUE INDEX `orders_payCode_key`(`payCode`),
    INDEX `orders_productId_fkey`(`productId`),
    INDEX `orders_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee` (
    `id` INTEGER NOT NULL,
    `fee` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket` (
    `id` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `Adminfile` VARCHAR(191) NULL,
    `insertTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `judgement` (
    `id` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NULL,
    `file` VARCHAR(191) NULL,
    `Adminfile` VARCHAR(191) NULL,
    `insertTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `judgement_orderId_fkey`(`orderId`),
    INDEX `judgement_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `miniDescribe` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `insertDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `text` TEXT NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blogTag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Advertisement` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `Photo` VARCHAR(191) NULL,
    `Start` DATETIME(3) NOT NULL,
    `End` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Advertisement_Seen` (
    `id` VARCHAR(191) NOT NULL,
    `adId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `InsertDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routineLog` (
    `id` DATETIME(3) NOT NULL,
    `AllMoney` INTEGER NOT NULL,
    `payedMoney` INTEGER NOT NULL,
    `WpayedMoney` INTEGER NOT NULL,
    `inPrviderWallet` INTEGER NOT NULL,
    `inWallets` INTEGER NOT NULL,
    `pureMoney` INTEGER NOT NULL,
    `userCounr` INTEGER NOT NULL,
    `fialedOrders` INTEGER NOT NULL,
    `successOrders` INTEGER NOT NULL,
    `waitingAcceptOrders` INTEGER NOT NULL,
    `waitingPeymentOrders` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trasactions` (
    `userId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `insertDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ref_id` VARCHAR(191) NOT NULL,
    `card_hash` VARCHAR(191) NOT NULL,
    `card_pan` VARCHAR(191) NOT NULL,
    `String` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `authority` VARCHAR(191) NOT NULL,
    `fee` INTEGER NOT NULL,

    UNIQUE INDEX `trasactions_orderId_key`(`orderId`),
    PRIMARY KEY (`ref_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blockUser` ADD CONSTRAINT `blockUser_phone_fkey` FOREIGN KEY (`phone`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SellerIncome` ADD CONSTRAINT `SellerIncome_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket` ADD CONSTRAINT `ticket_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `judgement` ADD CONSTRAINT `judgement_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `judgement` ADD CONSTRAINT `judgement_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog` ADD CONSTRAINT `blog_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `blogTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Advertisement_Seen` ADD CONSTRAINT `Advertisement_Seen_adId_fkey` FOREIGN KEY (`adId`) REFERENCES `Advertisement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trasactions` ADD CONSTRAINT `trasactions_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`payCode`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trasactions` ADD CONSTRAINT `trasactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`phone`) ON DELETE NO ACTION ON UPDATE CASCADE;
