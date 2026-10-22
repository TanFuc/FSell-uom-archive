-- AlterTable orders: Thêm các cột thanh toán chuyển khoản và trạng thái xác nhận
ALTER TABLE `orders`
  ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'bank_transfer',
  ADD COLUMN `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'unpaid',
  ADD COLUMN `paymentProofUrl` TEXT NULL,
  ADD COLUMN `paymentProofUploadedAt` DATETIME(3) NULL,
  ADD COLUMN `paymentConfirmedAt` DATETIME(3) NULL,
  ADD COLUMN `confirmedAt` DATETIME(3) NULL,
  ADD COLUMN `confirmationEmailSentAt` DATETIME(3) NULL,
  ADD INDEX `orders_status_idx`(`status`),
  ADD INDEX `orders_paymentStatus_idx`(`paymentStatus`);

-- CreateTable payment_settings: Cấu hình mã QR thanh toán của Admin và thông tin ngân hàng
CREATE TABLE `payment_settings` (
    `id` VARCHAR(191) NOT NULL,
    `qrCodeUrl` TEXT NULL,
    `bankName` VARCHAR(191) NULL DEFAULT '',
    `accountNumber` VARCHAR(191) NULL DEFAULT '',
    `accountHolder` VARCHAR(191) NULL DEFAULT '',
    `transferInstruction` TEXT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
