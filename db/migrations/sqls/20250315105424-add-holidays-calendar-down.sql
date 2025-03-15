DELETE FROM `users` WHERE `id` = 11;

DELETE FROM `events` WHERE `type` = 'home' AND `category` = 'reminder' AND creationByUserId = 11;