ALTER TABLE  `calendars_users` MODIFY `color` VARCHAR(10) NULL;

UPDATE `events_users` SET `color` = '' WHERE `color` IS NULL;