ALTER TABLE `calendars_users` MODIFY `role` ENUM ('owner', 'member', 'editor', 'viewer') default 'viewer' NOT NULL;

UPDATE `calendars_users` SET `role` = 'member' WHERE `role` = 'editor';

ALTER TABLE `calendars_users` MODIFY `role` ENUM ('owner', 'member', 'viewer') default 'viewer' NOT NULL;