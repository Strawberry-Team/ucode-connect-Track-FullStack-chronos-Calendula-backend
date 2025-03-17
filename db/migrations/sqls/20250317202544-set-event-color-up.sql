ALTER TABLE `events_users` MODIFY `color` VARCHAR(7) DEFAULT NULL NULL;

UPDATE `events_users` SET `color` = NULL WHERE `color` = '';