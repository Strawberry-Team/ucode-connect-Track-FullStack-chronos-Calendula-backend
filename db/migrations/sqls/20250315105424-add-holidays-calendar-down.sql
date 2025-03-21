DELETE FROM `users` WHERE `id` = 1;

DELETE FROM `events` WHERE `type` = 'home' AND `category` = 'reminder' AND creationByUserId = 1;