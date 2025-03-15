ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Finland', 'Estonia', 'Poland', 'Spain') default 'Ukraine' NOT NULL;

UPDATE `users` SET `country` = 'Poland' WHERE `country` = 'Finland';
UPDATE `users` SET `country` = 'Spain' WHERE `country` = 'Estonia';

ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Spain', 'Poland') default 'Ukraine' NOT NULL;

DELETE FROM `calendars_users` WHERE calendarId IN (12, 13, 14) AND `role` = 'viewer' AND `userId` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);