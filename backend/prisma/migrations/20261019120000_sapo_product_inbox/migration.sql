CREATE TABLE `sapo_product_inbox` (
  `sapoProductId` VARCHAR(191) NOT NULL,
  `topic` VARCHAR(191) NOT NULL,
  `payload` JSON NOT NULL,
  `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`sapoProductId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
