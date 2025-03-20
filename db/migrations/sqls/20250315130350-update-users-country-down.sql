ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Finland', 'Estonia', 'Poland', 'Spain') default 'Ukraine' NOT NULL;

UPDATE `users` SET `country` = 'Poland' WHERE `country` = 'Finland';
UPDATE `users` SET `country` = 'Spain' WHERE `country` = 'Estonia';

ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Spain', 'Poland') default 'Ukraine' NOT NULL;