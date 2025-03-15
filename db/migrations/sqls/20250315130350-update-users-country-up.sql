ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Finland', 'Estonia', 'Poland', 'Spain') default 'Ukraine' NOT NULL;

UPDATE `users` SET `country` = 'Finland' WHERE `country` = 'Poland';
UPDATE `users` SET `country` = 'Estonia' WHERE `country` = 'Spain';

ALTER TABLE `users` MODIFY `country` ENUM ('Ukraine', 'Finland', 'Estonia') default 'Ukraine' NOT NULL;

INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (15, 14, 1, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (16, 13, 2, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (17, 12, 3, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (18, 14, 3, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (19, 14, 5, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (20, 13, 6, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (21, 12, 7, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (22, 13, 8, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (23, 14, 9, '', 'viewer', 1, '2025-03-15 13:51:49');
INSERT INTO `calendars_users`  (id, calendarId, userId, color, role, isConfirmed, creationAt) VALUES (24, 13, 10, '', 'viewer', 1, '2025-03-15 13:51:49');
