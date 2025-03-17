ALTER TABLE  `calendars_users` MODIFY `color` VARCHAR(7) DEFAULT '#039BE5' NOT NULL;

UPDATE `calendars_users` SET `color` = '#039BE5' WHERE `color` = '';