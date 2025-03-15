ALTER TABLE `calendars_users` MODIFY `role` ENUM ('owner', 'member', 'editor', 'viewer') default 'viewer' NOT NULL;

UPDATE `calendars_users` SET `role` = 'editor' WHERE `role` = 'member';

ALTER TABLE `calendars_users` MODIFY `role` ENUM ('owner', 'editor', 'viewer') default 'viewer' NOT NULL;