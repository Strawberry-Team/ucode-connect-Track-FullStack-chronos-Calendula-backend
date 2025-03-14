// TODO какой duration у event.type = reminder?

import { faker } from '@faker-js/faker';
import UserModel from "./src/user/model.js";
import CalendarModel from "./src/calendar/model.js";
import EventModel from "./src/event/model.js";
import CalendarUserModel from "./src/calendar/user/model.js";

(async () => {
    const NUMBER_OF_USERS = 10;
    const NUMBER_OF_USERS_BY_GENDER = 5;
    const NUMBER_OF_SHARED_CALENDARS = 3;
    const NUMBER_OF_EVENTS = 25;
    const NUMBER_OF_CATEGORIES = 3;
    const NUMBER_OF_TYPES = 3;

    const USER_ROLE = 'user';
    const USER_PASSWORD = 'Password123!$';
    const USER_COUNTRIES = ['Ukraine', 'Poland', 'Spain'];
    const USER_PROFILE_PICTURE = 'default.png';
    const PARTICIPANT_ROLES = ['owner', 'member', 'viewer'];
    const EVENT_CATEGORIES = ['work', 'home', 'hobby'];
    const EVENT_TYPES = ['meeting', 'reminder', 'task'];
    const EVENT_ATTENDANCE_STATUSES = ['yes', 'no', 'maybe'];
    const COLOURS = [
        '#F4511E', '#EF6C00', '#F09300', '#F6BF26',
        '#E4C441', '#C0CA33', '#7CB342', '#33B679',
        '#0B8043', '#009688', '#039BE5', '#4285F4',
        '#3F51B5', '#7986CB', '#B39DDB', '#9E69AF',
        '#8E24AA', '#795548', '#616161', '#A79B8E'
    ];
    const TIME_INTERVAL = Object.freeze({
        WORK: 'work',
        EVENING: 'evening',
        WEEKEND: 'weekend'
    });

    let allUsersIds = [];
    let allCalendarsIds = [];
    let allEventIds = [];
    let mainCalendarsIds = [];
    let mainCalendarOwnersIds = [];
    let sharedCalendarsIds = [];
    let sharedCalendarOwnersIds = [];
    let sharedCalendarParticipantsIds = [];
    let eventCreatorsIds = [];
    let sharedCalendarEventsData = [];
    let mainCalendarEventsData = [];

    function generateCreationAt(from, to) {
        return faker.date.between({ from, to })
            .toISOString().replace("T", " ").split(".")[0];
    }

    function generateTitle() {
        // return faker.lorem.sentence({ min: 1, max: 5 });
        const verb = faker.hacker.ingverb();
        return verb.charAt(0).toUpperCase() + verb.slice(1).toLowerCase();
    }

    function generateDescription() {
        // return faker.lorem.paragraph({ min: 1, max: 4 });
        return faker.hacker.phrase();
    }

    function generateWorkTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({ min: 4, max: 11 }),
                faker.number.int({ min: 8, max: 17 }),
                faker.number.int({ min: 0, max: 3, multipleOf: 15 }),
                0,
                0
            ),
            duration: faker.number.int({ min: 1, max: 12, multipleOf: 15 })
        }
    }

    function generateEveningTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({ min: 4, max: 11 }),
                faker.number.int({ min: 17, max: 20 }),
                faker.number.int({ min: 0, max: 3, multipleOf: 15 }),
                0,
                0
            ),
            duration: faker.number.int({ min: 1, max: 3, multipleOf: 15 })
        };
    }

    function generateWeekendTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({ min: 12, max: 13 }),
                faker.number.int({ min: 10, max: 18 }),
                faker.number.int({ min: 0, max: 3, multipleOf: 15 }),
                0,
                0
            ),
            duration: faker.number.int({ min: 1, max: 8, multipleOf: 15 })
        };
    }

    function generateEventDateTime(timeInterval) {
        const eventTime = {
            [TIME_INTERVAL.WORK]: generateWorkTime(),
            [TIME_INTERVAL.EVENING]: generateEveningTime(),
            [TIME_INTERVAL.WEEKEND]: generateWeekendTime()
        }[timeInterval] || generateWorkTime();
        const startAt = eventTime.startAt
            .toISOString().replace("T", " ").split(".")[0];
        const endAt = new Date(
            startAt.setHours(startAt.getHours() + (eventTime.duration * 15)))
            .toISOString().replace("T", " ").split(".")[0];
        return {
            startAt,
            endAt,
        };
    }

    async function generateUser(gender = 'M') {
        const model = new UserModel();
        const user = model.createEntity();
        const sex = (gender === 'M') ? 'male' : 'female';
        const firstName = faker.person.firstName(sex);
        const lastName = faker.person.lastName(sex);

        user.fullName = `${firstName} ${lastName}`;
        user.password = await model.createPassword(USER_PASSWORD);
        user.email = faker.internet.exampleEmail({
            firstName,
            lastName,
            allowSpecialCharacters: false
        }).toLowerCase();
        user.profilePicture = USER_PROFILE_PICTURE;
        user.country = faker.helpers.arrayElement(USER_COUNTRIES);
        user.role = USER_ROLE;
        user.isVerified = 1;
        user.creationAt = generateCreationAt('2025-04-01T00:00:00.000Z', '2025-04-02T00:00:00.000Z');

        await user.save();
        allUsersIds.push(user.id);
    }

    async function generateCalendar(creationByUserId) {
        const model = new CalendarModel();
        const calendar = model.createEntity();

        calendar.title = generateTitle();
        calendar.description = generateDescription();
        calendar.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUsersIds);
        calendar.creationAt = generateCreationAt('2020-04-02T08:00:00.000Z', '2025-04-02T11:00:00.000Z');

        await calendar.save();
        allCalendarsIds.push(calendar.id);
    }

    async function generateMainCalendarOwners(calendarId, userId) {
        const model = new CalendarUserModel();
        const entity = model.createEntity();

        entity.calendarId = calendarId;
        entity.userId = userId;
        entity.color = faker.helpers.arrayElement(COLOURS);
        entity.role = PARTICIPANT_ROLES[0];
        entity.isMain = true;
        entity.isConfirmed = true;
        entity.creationAt = generateCreationAt('2020-04-02T11:00:00.000Z', '2025-04-02T12:00:00.000Z');

        await entity.save();
        mainCalendarsIds.push(entity.id);
        mainCalendarOwnersIds.push(entity.userId);
    }

    async function generateSharedCalendarOwners(calendarId) {
        const model = new CalendarUserModel();
        const entity = model.createEntity();

        entity.calendarId = calendarId;
        entity.userId = faker.helpers.arrayElement(allUsersIds);
        entity.color = faker.helpers.arrayElement(COLOURS);
        entity.role = PARTICIPANT_ROLES[0];
        entity.isMain = false;
        entity.isConfirmed = true;
        entity.creationAt = generateCreationAt('2020-04-02T12:00:00.000Z', '2025-04-02T14:00:00.000Z');

        await entity.save();
        sharedCalendarsIds.push(entity.id);
        sharedCalendarOwnersIds.push(entity.userId);
    }

    async function generateSharedCalendarParticipants(participantId) {
        const model = new CalendarUserModel();
        const entity = model.createEntity();

        entity.calendarId = faker.helpers.arrayElement(sharedCalendarsIds);
        entity.userId = participantId;
        entity.color = faker.helpers.arrayElement(COLOURS);
        entity.role = faker.helpers.arrayElement([ PARTICIPANT_ROLES[1], PARTICIPANT_ROLES[2]]);
        entity.isMain = false;
        entity.isConfirmed = faker.datatype.boolean();
        entity.creationAt = generateCreationAt('2020-04-02T14:00:00.000Z', '2025-04-02T15:00:00.000Z');

        await entity.save();
        sharedCalendarParticipantsIds.push(entity.userId);
    }

    // todo creationByUserId має бути тільки з роллю editor
    async function generateEvent(creationByUserId, timeInterval, category) {
        const model = new EventModel();
        const event = model.createEntity();
        const dateTime = generateEventDateTime(timeInterval);

        event.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUsersIds);
        event.title = generateTitle();
        event.description = generateDescription();
        event.category = category ?? faker.helpers.arrayElement(EVENT_CATEGORIES);
        event.type = faker.helpers.arrayElement(EVENT_TYPES);
        event.startAt = dateTime.startAt;
        event.endAt = dateTime.endAt;
        event.creationAt = generateCreationAt('2020-04-02T15:00:00.000Z', '2025-04-02T16:00:00.000Z');

        await event.save();
        allEventIds.push(event.id);
        return {
            eventId: event.id,
            ownerId: event.creationByUserId
        }
    }

    function addEventToCalendar() {
        // todo
        // const model = new CalendarEvent()
        // const event = model.createEntity();
    }

    function addUserToEvent() {
        // todo
        // const model = new EventUser();
        // const event = model.createEntity();
    }

/*
    TABLE users
*/
    // Створюємо 10 користувачів: 5 чоловіків, 5 жінок
    for (let i = 0; i < NUMBER_OF_USERS_BY_GENDER; i++) {
        await generateUser('F');
        await generateUser('M');
    }
/*
    TABLE calendars
*/
   // Створюємо 10 календарів, які будуть MAIN у кожного користувача
   for (let i = 1; i <= NUMBER_OF_USERS; i++) {
       const mainId = await generateCalendar(allUsersIds[i]);
       mainCalendarsIds.push(mainId);
   }
    // Створюємо 5 SHARED календарів
    for (let i = 1; i <= NUMBER_OF_SHARED_CALENDARS; i++) {
        await generateCalendar();
    }
/*
    TABLE calendars_users
*/
    // Додаємо власників MAIN календарів
    for (let i = 1; i <= NUMBER_OF_USERS; i++) {
        await generateMainCalendarOwners(mainCalendarsIds[i], allUsersIds[i]);
    }
    // Додаємо власників SHARED календарів
    for (let i = 1; i <= NUMBER_OF_USERS; i++) {
        await generateSharedCalendarOwners(sharedCalendarsIds[i]);
    }
    // Додаємо учасників (editor, viewer) SHARED календарів
    const participantsIds = allUsersIds.filter(id => !sharedCalendarOwnersIds.includes(id));
    for (let i = 1; i <= participantsIds.length; i++) {
        await generateSharedCalendarParticipants(participantsIds[i]);
    }
/*
    TABLE events
*/
    // Створюємо події для main календарів - будь-яка категорія
    for (let i = 0; i < NUMBER_OF_USERS; i++) {
        const countEvening = faker.number.int({ min: 2, max: 4 });
        for (let j = 1; j <= countEvening; j++) {
            const data = await generateEvent(allUsersIds[i], TIME_INTERVAL.EVENING);
            mainCalendarEventsData.push(data);
        }
        const countWeekend = faker.number.int({ min: 2, max: 6 });
        for (let j = 1; j <= countWeekend; j++) {
            const data = await generateEvent(allUsersIds[i], TIME_INTERVAL.WEEKEND);
            mainCalendarEventsData.push(data);
        }
    }
    // todo Створюємо події для shared календарів - категорія work
    // todo Але creationByUserId має бути тільки з роллю owner або editor
    for (let i = 1; i <= NUMBER_OF_USERS; i++) {
        const count = faker.number.int({ min: 2, max: 10 });
        for (let j = 1; j <= count; j++) {
            const data = await generateEvent(allUsersIds[i], TIME_INTERVAL.WORK, EVENT_CATEGORIES[0]);
            sharedCalendarEventsData.push(data);
        }
    }
/*
    TABLE calendars_events
*/
    // todo Додаємо події для main календарів у main календарі ===> calendars_events
    for (let i = 1; i <= mainCalendarEventsData.length; i++) {
        // mainCalendarEventsData.eventId;
        // mainCalendarEventsData.ownerId;
    }
    // todo Додаємо події для shared календарів у shared календарі ===> calendars_events
    for (let i = 1; i <= sharedCalendarEventsData.length; i++) {
        // sharedCalendarEventsData.eventId;
        // sharedCalendarEventsData.ownerId;
    }
/*
    TABLE events_users
*/
    // todo Додаємо учасників до персональних подій main календарів ===> events_users
    for (let i = 1; i <= mainCalendarEventsData.length; i++) {
        // id учасника має != id owner-a
        // mainCalendarEventsData.eventId;
        // mainCalendarEventsData.ownerId;
    }
    // todo Додаємо учасників до shared подій shared календарів ===> events_users
    for (let i = 1; i <= sharedCalendarEventsData.length; i++) {
        // id учасника має != id owner-a
        // а також учасник події має бути учасником календаря (calendars_users)
        // sharedCalendarEventsData.eventId;
        // sharedCalendarEventsData.ownerId;
    }
})();