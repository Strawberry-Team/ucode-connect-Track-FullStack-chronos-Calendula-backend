ALTER TABLE `users` ADD `birthday` DATE;

UPDATE `users` SET `birthday` = '1990-01-11' WHERE `id` = 1;

ALTER TABLE `calendars` MODIFY `type` ENUM ('main', 'shared', 'holidays', 'birthdays') DEFAULT 'shared' NOT NULL;

INSERT INTO `calendars` (id, title, description, creationByUserId, creationAt, type) VALUES (5, '🎂 Birthdays', 'Birthdays of the company\'s employees', 1, '2025-03-15 12:21:15', 'birthdays');

INSERT INTO `calendars_users` (id, calendarId, userId, role, isConfirmed, creationAt) VALUES (5, 5, 1, 'owner', 1, '2025-03-15 10:52:49');
