ALTER TABLE `payment_settings`
  ADD COLUMN `transferTemplates` JSON NULL,
  ADD COLUMN `activeTemplateId` VARCHAR(191) NULL;
