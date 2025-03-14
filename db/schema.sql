DROP DATABASE IF EXISTS Calendula;
CREATE DATABASE Calendula;

USE Calendula;

DROP TABLE IF EXISTS `calendars_events`;
DROP TABLE IF EXISTS `events_users`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `calendars_users`;
DROP TABLE IF EXISTS `calendars`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE IF NOT EXISTS `users` (
   `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
   `fullName` VARCHAR(30),
   `password` VARCHAR(100) NULL,
   `email` VARCHAR(50) NOT NULL,
   `profilePicture` VARCHAR(50) DEFAULT 'default.png',
   `country` ENUM ('Ukraine', 'Poland', 'Spain') DEFAULT 'Ukraine' NOT NULL,
   `role` ENUM ('user', 'admin') DEFAULT 'user' NOT NULL,
   `isVerified` BOOLEAN NOT NULL DEFAULT FALSE,
   `confirmToken` VARCHAR(200),
   `passwordResetToken` VARCHAR(200),
   `creationAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `calendars` (
   `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
   `title` VARCHAR(50) NOT NULL,
   `description` VARCHAR(250) DEFAULT NULL,
   `creationByUserId` INT(10) UNSIGNED NOT NULL,
   `creationAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`),
   INDEX `calendars_creationByUserId_i` (creationByUserId),
   CONSTRAINT `foreign_key_calendars_creationByUserId`
       FOREIGN KEY (`creationByUserId`) REFERENCES `users`(`id`)
       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `calendars_users` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `calendarId` INT(10) UNSIGNED NOT NULL,
    `userId` INT(10) UNSIGNED NOT NULL,
    `color` VARCHAR(10) DEFAULT '#616161',
    `role` ENUM ('owner', 'editor', 'viewer') DEFAULT 'viewer' NOT NULL,
    `isMain` BOOLEAN DEFAULT FALSE,
    `isConfirmed` BOOLEAN DEFAULT FALSE,
    `creationAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_calendar` (`calendarId`, `userId`),
    INDEX `calendars_users_calendarId_i` (calendarId),
    INDEX `calendars_users_userId_i` (userId),
    CONSTRAINT `foreign_key_calendars_users_calendarId`
      FOREIGN KEY (`calendarId`) REFERENCES `calendars`(`id`)
          ON DELETE CASCADE,
    CONSTRAINT `foreign_key_calendars_users_userId`
      FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `events` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `creationByUserId` INT(10) UNSIGNED NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `description` VARCHAR(250) DEFAULT NULL,
    `category` ENUM ('work', 'home', 'hobby') DEFAULT 'work' NOT NULL,
    `type` ENUM ('meeting', 'reminder', 'task') DEFAULT 'meeting' NOT NULL,
    `startAt` DATETIME,
    `endAt` DATETIME DEFAULT NULL,
    `creationAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `events_creationByUserId_i` (creationByUserId),
    CONSTRAINT `foreign_key_comments_creationByUserId`
      FOREIGN KEY (`creationByUserId`) REFERENCES `users`(`id`)
          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `events_users` (
     `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
     `eventId` INT(10) UNSIGNED NOT NULL,
     `userId` INT(10) UNSIGNED NOT NULL,
     `color` VARCHAR(10) DEFAULT '#616161',
     `attendanceStatus` ENUM ('yes', 'no', 'maybe') DEFAULT NULL,
     `creationAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`id`),
     UNIQUE KEY `user_event` (`eventId`, `userId`),
     INDEX `events_users_eventId_i` (eventId),
     INDEX `events_users_userId_i` (userId),
     CONSTRAINT `foreign_key_events_users_eventId`
         FOREIGN KEY (`eventId`) REFERENCES `events`(`id`)
             ON DELETE CASCADE,
     CONSTRAINT `foreign_key_events_users_userId`
         FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
             ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `calendars_events` (
    `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    `eventId` INT(10) UNSIGNED NOT NULL,
    `calendarId` INT(10) UNSIGNED NOT NULL,
    `creationAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `user_event` (`eventId`, `calendarId`),
    INDEX `calendars_events_eventId_i` (eventId),
    INDEX `calendars_events_calendarId_i` (calendarId),
    CONSTRAINT `foreign_key_calendars_events_eventId`
      FOREIGN KEY (`eventId`) REFERENCES `events`(`id`)
          ON DELETE CASCADE,
    CONSTRAINT `foreign_key_calendars_events_calendarId`
      FOREIGN KEY (`calendarId`) REFERENCES `calendars`(`id`)
          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;