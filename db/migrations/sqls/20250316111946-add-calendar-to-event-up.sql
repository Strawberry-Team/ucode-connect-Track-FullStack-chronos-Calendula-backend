ALTER TABLE `events`
    ADD `calendarId` INT(10) UNSIGNED NOT NULL;

UPDATE `events` SET `calendarId` = 2 WHERE id <= 33;
UPDATE `events` SET `calendarId` = 3 WHERE id >= 34 AND id <= 68;
UPDATE `events` SET `calendarId` = 4 WHERE id >= 69 AND id <= 104;

ALTER TABLE `events`
    ADD CONSTRAINT `fk_events_calendarId`
        FOREIGN KEY (`calendarId`) REFERENCES `calendars` (id)
            ON DELETE CASCADE;