ALTER TABLE `calendars_users` DROP COLUMN `isMain`;

ALTER TABLE `calendars` ADD `type` ENUM ('main', 'shared', 'holidays') DEFAULT 'shared' NOT NULL;

