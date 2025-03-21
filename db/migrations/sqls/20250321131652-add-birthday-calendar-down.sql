DELETE FROM `events` WHERE `calendarId` = 5;

DELETE FROM `calendars_events` WHERE `calendarId` = 5;

DELETE FROM `calendars_users` WHERE `calendarId` = 5;

DELETE FROM `calendars` WHERE `id` = 5;

ALTER TABLE `calendars` MODIFY `type` ENUM('main', 'shared', 'holidays') DEFAULT 'shared' NOT NULL;

ALTER TABLE `users` DROP COLUMN `birthday`;
