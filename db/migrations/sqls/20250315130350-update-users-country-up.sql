ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Finland', 'Estonia', 'Poland', 'Spain') default 'Ukraine' NOT NULL;

UPDATE `users` SET `country` = 'Finland' WHERE `country` = 'Poland';
UPDATE `users` SET `country` = 'Estonia' WHERE `country` = 'Spain';

ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Finland', 'Estonia') default 'Ukraine' NOT NULL;