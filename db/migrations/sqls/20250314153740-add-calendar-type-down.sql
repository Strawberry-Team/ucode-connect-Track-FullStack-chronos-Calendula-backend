ALTER TABLE `calendars` DROP COLUMN `type`;

ALTER TABLE calendars_users ADD `isMain` BOOLEAN DEFAULT FALSE;