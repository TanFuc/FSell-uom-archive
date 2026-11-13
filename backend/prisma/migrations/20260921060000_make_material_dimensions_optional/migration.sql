-- AlterTable: make material and dimensions optional (nullable)
ALTER TABLE `products` MODIFY `material` TEXT NULL;
ALTER TABLE `products` MODIFY `dimensions` TEXT NULL;
