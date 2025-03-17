UPDATE `calendars_users` SET `color` = '#039BE5' WHERE `color` = '';

ALTER TABLE  `calendars_users` MODIFY `color` VARCHAR(10) NULL;

