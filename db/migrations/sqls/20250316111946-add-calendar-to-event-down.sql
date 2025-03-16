ALTER TABLE `events` DROP FOREIGN KEY `fk_events_calendarId`;

ALTER TABLE `events` DROP COLUMN `calendarId`;