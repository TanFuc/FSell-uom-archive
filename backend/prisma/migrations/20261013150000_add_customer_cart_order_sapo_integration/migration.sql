-- AlterTable: Thêm các cột Sapo và SKU vào products
ALTER TABLE `products` ADD COLUMN `sapoProductId` VARCHAR(191) NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL;

-- CreateTable: Bảng khách hàng và đăng nhập mạng xã hội (Customer & Social Auth)
CREATE TABLE `customers` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `avatarUrl` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `address` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `authProvider` ENUM('LOCAL', 'FACEBOOK', 'INSTAGRAM') NOT NULL DEFAULT 'LOCAL',
    `facebookId` VARCHAR(191) NULL,
    `instagramId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `hardDeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `customers_email_key`(`email`),
    UNIQUE INDEX `customers_facebookId_key`(`facebookId`),
    UNIQUE INDEX `customers_instagramId_key`(`instagramId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Bảng giỏ hàng (Cart)
CREATE TABLE `carts` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `hardDeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `carts_sessionId_key`(`sessionId`),
    INDEX `carts_sessionId_idx`(`sessionId`),
    INDEX `carts_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Bảng chi tiết giỏ hàng (Cart Items)
CREATE TABLE `cart_items` (
    `id` VARCHAR(191) NOT NULL,
    `cartId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `priceVND` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `hardDeletedAt` DATETIME(3) NULL,

    INDEX `cart_items_cartId_idx`(`cartId`),
    INDEX `cart_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Bảng đơn hàng tích hợp Sapo (Orders)
CREATE TABLE `orders` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `shippingAddress` TEXT NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `note` TEXT NULL,
    `totalVND` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `isDraft` BOOLEAN NOT NULL DEFAULT false,
    `sapoOrderId` VARCHAR(191) NULL,
    `sapoOrderNumber` VARCHAR(191) NULL,
    `sapoFulfillmentStatus` VARCHAR(191) NULL,
    `sapoFinancialStatus` VARCHAR(191) NULL DEFAULT 'pending',
    `trackingCompany` VARCHAR(191) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `trackingUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `hardDeletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `orders_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `orders_sapoOrderId_key`(`sapoOrderId`),
    INDEX `orders_customerId_idx`(`customerId`),
    INDEX `orders_sapoOrderId_idx`(`sapoOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Bảng chi tiết đơn hàng (Order Items)
CREATE TABLE `order_items` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `productTitle` VARCHAR(191) NOT NULL,
    `productSku` VARCHAR(191) NULL,
    `productImage` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `priceVND` INTEGER NOT NULL,
    `sapoVariantId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `hardDeletedAt` DATETIME(3) NULL,

    INDEX `order_items_orderId_idx`(`orderId`),
    INDEX `order_items_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Bảng ghi nhận webhook Sapo (Sapo Webhook Logs)
CREATE TABLE `sapo_webhook_logs` (
    `id` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `sapoOrderId` VARCHAR(191) NULL,
    `payload` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'processed',
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,
    `hardDeletedAt` DATETIME(3) NULL,

    INDEX `sapo_webhook_logs_topic_idx`(`topic`),
    INDEX `sapo_webhook_logs_sapoOrderId_idx`(`sapoOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `products_sku_key` ON `products`(`sku`);
CREATE UNIQUE INDEX `products_sapoProductId_key` ON `products`(`sapoProductId`);

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_cartId_fkey` FOREIGN KEY (`cartId`) REFERENCES `carts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart_items` ADD CONSTRAINT `cart_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
