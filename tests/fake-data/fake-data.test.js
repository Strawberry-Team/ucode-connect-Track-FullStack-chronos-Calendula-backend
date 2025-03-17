// TODO какой duration у event.type = reminder?

import {faker} from '@faker-js/faker';
import {test} from '@playwright/test';
import UserModel from "../../src/user/model.js";
import CalendarModel from "../../src/calendar/model.js";
import dotenv from "dotenv";
import {
    confirmUserEmail,
    loginUser,
    registerUser
} from "../api/helpers/users.helpers.js";
import {expectResponseHeaders, generateHeaders} from "../api/helpers/general.helpers.js";
import userData from "nodemailer/lib/xoauth2/index.js";
import ownerObject from "nodemailer/lib/xoauth2/index.js";

dotenv.config({path: '.env.test', debug: true});

test.describe('Seed fake data to database', () => {
    test.describe.configure({mode: 'serial', timeout: 2000});

    const NUMBER_OF_USERS = 10;
    const NUMBER_OF_USERS_BY_GENDER = 5;
    const NUMBER_OF_SHARED_CALENDARS = 3;

    const USER_ROLE = 'user';
    const USER_PASSWORD = 'Password123!$';
    const USER_COUNTRIES = ['Ukraine', 'Finland', 'Estonia'];
    const USER_PROFILE_PICTURE = 'default.png';
    const CALENDAR_TYPES = ['main', 'shared', 'holidays'];
    const PARTICIPANT_ROLES = ['owner', 'member', 'viewer'];
    const EVENT_CATEGORIES = ['work', 'home', 'hobby'];
    const EVENT_TYPES = ['meeting', 'reminder', 'task'];
    const EVENT_ATTENDANCE_STATUSES = ['yes', 'no', 'maybe'];
    const COLORS = [
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
    let allCalendarsObjects = [];
    let allEventIds = [];
    let mainCalendarsIds = [];
    let mainCalendarOwnersIds = [];
    let sharedCalendarsIds = [];
    let sharedCalendarParticipantsIds = [];
    let eventCreatorsIds = [];
    let sharedCalendarEventsData = [];
    let mainCalendarEventsData = [];
    let allUsersObjects = [];

    function generateCreationAt(from, to) {
        return faker.date.between({from, to})
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
                faker.number.int({min: 4, max: 11}),
                faker.number.int({min: 8, max: 17}),
                faker.number.int({min: 0, max: 3, multipleOf: 30}),
                0,
                0
            ),
            duration: faker.number.int({min: 1, max: 12, multipleOf: 30})
        }
    }

    function generateEveningTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({min: 4, max: 11}),
                faker.number.int({min: 17, max: 20}),
                faker.number.int({min: 0, max: 3, multipleOf: 30}),
                0,
                0
            ),
            duration: faker.number.int({min: 1, max: 3, multipleOf: 30})
        };
    }

    function generateWeekendTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({min: 12, max: 13}),
                faker.number.int({min: 10, max: 18}),
                faker.number.int({min: 0, max: 3, multipleOf: 30}),
                0,
                0
            ),
            duration: faker.number.int({min: 1, max: 8, multipleOf: 30})
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
            startAt.setHours(startAt.getHours() + (eventTime.duration * 30)))
            .toISOString().replace("T", " ").split(".")[0];
        return {
            startAt,
            endAt,
        };
    }

    async function generateUser(gender = 'M', profilePictureNumber = 0) {
        const user = {};
        const sex = (gender === 'M') ? 'male' : 'female';
        const firstName = faker.person.firstName(sex);
        const lastName = faker.person.lastName(sex);

        user.fullName = `${firstName} ${lastName}`;
        user.password = USER_PASSWORD;
        user.password_confirm = user.password;
        user.email = faker.internet.email({
            firstName: firstName,
            lastName: lastName,
            provider: 'calendula.ua',
            allowSpecialCharacters: false
        }).toLowerCase();
        user.profilePicture = profilePictureNumber === 0 ? USER_PROFILE_PICTURE : `${sex}_${profilePictureNumber}.png`;
        user.country = faker.helpers.arrayElement(USER_COUNTRIES);
        user.role = USER_ROLE;
        user.isVerified = 1;
        user.creationAt = generateCreationAt('2025-04-01T00:00:00.000Z', '2025-04-02T00:00:00.000Z');

        return user;
    }

    function generateCalendar(creationByUserId, calendarType) {
        const calendar = {};
        calendar.title = generateTitle();
        calendar.description = generateDescription();
        calendar.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUsersIds);
        calendar.creationAt = generateCreationAt('2020-04-02T08:00:00.000Z', '2025-04-02T11:00:00.000Z');
        calendar.type = !CALENDAR_TYPES.includes(calendarType) ? calendarType : CALENDAR_TYPES[1];
        calendar.participants = [];
        // calendar.participants = [
        //     {
        //         userId: creationByUserId,
        //         role: PARTICIPANT_ROLES[0],
        //         color: null,
        //         isConfirmed: true
        //     }
        // ];

        return calendar;
    }

// async function generateMainCalendarOwners(calendarId, userId) {
//     const model = new CalendarUserModel();
//     const entity = model.createEntity();
//
//     entity.calendarId = calendarId;
//     entity.userId = userId;
//     entity.color = faker.helpers.arrayElement(COLORS);
//     entity.role = PARTICIPANT_ROLES[0];
//     entity.isConfirmed = true;
//     entity.creationAt = generateCreationAt('2020-04-02T11:00:00.000Z', '2025-04-02T12:00:00.000Z');
//
//     await entity.save();
//     mainCalendarsIds.push(entity.id);
//     mainCalendarOwnersIds.push(entity.userId);
// }
//
// async function generateSharedCalendarOwners(calendarId) {
//     const calendarOwner = {};
//     calendarOwner.calendarId = calendarId;
//     calendarOwner.userId = faker.helpers.arrayElement(allUsersIds);
//     calendarOwner.color = faker.helpers.arrayElement(COLORS);
//     calendarOwner.role = PARTICIPANT_ROLES[0];
//     calendarOwner.isConfirmed = true;
//     calendarOwner.creationAt = generateCreationAt('2020-04-02T12:00:00.000Z', '2025-04-02T14:00:00.000Z');
//
//     sharedCalendarsIds.push(calendarOwner.id);
//     sharedCalendarOwnersIds.push(calendarOwner.userId);
// }

    function generateSharedCalendarParticipant(participantId, role, color) {
        const participant = {};
        participant.userId = participantId;
        participant.color = COLORS.includes(color)
            ? color
            : faker.helpers.arrayElement(COLORS);
        participant.role = PARTICIPANT_ROLES.includes(role)
            ? role
            : faker.helpers.arrayElement([PARTICIPANT_ROLES[1], PARTICIPANT_ROLES[2]]);
        participant.isConfirmed = role === PARTICIPANT_ROLES[0];
        participant.creationAt = generateCreationAt('2020-04-02T14:00:00.000Z', '2025-04-02T15:00:00.000Z');

        return participant;
    }

// // todo creationByUserId має бути тільки з роллю editor
// async function generateEvent(creationByUserId, timeInterval, category) {
//     const model = new EventModel();
//     const event = model.createEntity();
//     const dateTime = generateEventDateTime(timeInterval);
//
//     event.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUsersIds);
//     event.title = generateTitle();
//     event.description = generateDescription();
//     event.category = category ?? faker.helpers.arrayElement(EVENT_CATEGORIES);
//     event.type = faker.helpers.arrayElement(EVENT_TYPES);
//     event.startAt = dateTime.startAt;
//     event.endAt = dateTime.endAt;
//     event.creationAt = generateCreationAt('2020-04-02T15:00:00.000Z', '2025-04-02T16:00:00.000Z');
//
//     await event.save();
//     allEventIds.push(event.id);
//     return {
//         eventId: event.id,
//         ownerId: event.creationByUserId
//     }
// }
//
// function addEventToCalendar() {
//     // todo
//     // const model = new CalendarEvent()
//     // const event = model.createEntity();
// }
//
// function addUserToEvent() {
//     // todo
//     // const model = new EventUser();
//     // const event = model.createEntity();
// }

    /*
    TABLE users
    */
    test.describe('Create and login 10 users (5 female, 5 male)', () => {
        test.describe.configure({ mode: 'serial', timeout: 2000 });

        for (let i = 0; i < NUMBER_OF_USERS_BY_GENDER; i++) {
            const sex = ['F', 'M'];

            for (let j = 0; j < sex.length; j++) {
                const description = `User ${i * sex.length + j + 1}`;

                test(description, async ({request}) => {
                    const user = await generateUser(sex[j], i + 1);
                    const createdUser = {};
                    Object.assign(createdUser, user);

                    await registerUser(request, createdUser);
                    await confirmUserEmail(request, createdUser);
                    let {userData} = await loginUser(request, createdUser);
                    user.accessToken = userData.accessToken;
                    user.id = userData.id;

                    const userEntity = await (new UserModel()).getEntityById(user.id);
                    user.creationAt = userEntity.creationAt;
                    userEntity.profilePicture = user.profilePicture;
                    await userEntity.save();

                    allUsersIds.push(user.id);
                    allUsersObjects.push(user);
                    const mainCalendar = await (new CalendarModel()).getMainCalendar(user.id);
                    allCalendarsObjects.push(mainCalendar);
                    allCalendarsIds.push(mainCalendar.id);
                });
            }
        }
    });


// const calendarModel = new CalendarModel();
// const mainCalendarsObjects = await calendarModel.getCalendarsByType(CALENDAR_TYPES[0]);
// mainCalendarsObjects.forEach(calendar => allCalendarsIds.push(calendar.id));
    /*
        TABLE calendars
    */
    test.describe('Create 5 shared calendars with participants', async () => {
        test.describe.configure({mode: 'serial', timeout: 10000});

        let sharedCalendarOwnersIds = [];
        let possibleParticipants = [];
        let sharedCalendarsObjects = [];

        for (let i = 0; i < NUMBER_OF_SHARED_CALENDARS; i++) {
            let description = `Calendar ${i + 1}`;
            let calendar = {};

            test(description, async ({request}) => {
                const possibleOwners = allUsersIds.filter(id => !sharedCalendarOwnersIds.includes(id));
                const ownerId = faker.number.int({
                    min: Math.min(...possibleOwners),
                    max: Math.max(...possibleOwners)
                });
                sharedCalendarOwnersIds.push(ownerId);

                calendar = generateCalendar(ownerId);

                possibleParticipants = allUsersIds.filter(id => id !== ownerId);

                for (let j = 1; j <= faker.number.int({min: 2, max: 4}); j++) {
                    const participant = generateSharedCalendarParticipant(
                        faker.number.int({
                            min: Math.min(...possibleParticipants),
                            max: Math.max(...possibleParticipants)
                        })
                    );

                    calendar.participants.push(participant);
                }

                const ownerObject = allUsersObjects.find(user => user.id === ownerId);

                const response = await request.post(`calendars/`, {
                    headers: generateHeaders(ownerObject.accessToken),
                    data: {
                        title: calendar.title,
                        description: calendar.description,
                        participants: calendar.participants
                    }
                });

                expectResponseHeaders(response, 201);
                const responseBody = await response.json();
                calendar.id = responseBody.data.id;
                calendar.creationAt = responseBody.data.creationAt;

                allCalendarsIds.push(calendar.id);
                allCalendarsObjects.push(calendar);
                sharedCalendarsObjects.push(calendar);

                calendar.participants = calendar.participants
                    .filter(p => p.isConfirmed === false);

                console.log(">>>>Calendar", calendar.id, "participants", calendar.participants);
                for (const p of calendar.participants) {
                    const participant = allUsersObjects.find(user => user.id === p.userId);
                    console.log(">>>>>participant", participant);
                    description = `Update join status for participant ${participant.id} in Calendar ${calendar.id}`;

                    await test.step(description, async () => {
                        const response = await request.patch(
                            // `calendars/${calendar.id}/${faker.datatype.boolean({probability: 0.5}) ? 'join' : 'leave'}`, {
                            `calendars/${calendar.id}/join`, {
                                headers: generateHeaders(participant.accessToken)
                            });
                        console.log(await response.text());

                        expectResponseHeaders(response, 200);
                    });
                }
            });
        }
    });


});
/*
TABLE calendars_users
*/

// // Додаємо власників SHARED календарів
// for (let i = 1; i <= NUMBER_OF_USERS; i++) {
//     await generateSharedCalendarOwners(sharedCalendarsIds[i]);
// }

// /*
// TABLE events
// */
// // Створюємо події для main календарів - будь-яка категорія
// for (let i = 0; i < NUMBER_OF_USERS; i++) {
//     const countEvening = faker.number.int({ min: 2, max: 4 });
//     for (let j = 1; j <= countEvening; j++) {
//         const data = await generateEvent(allUsersIds[i], TIME_INTERVAL.EVENING);
//         mainCalendarEventsData.push(data);
//     }
//     const countWeekend = faker.number.int({ min: 2, max: 6 });
//     for (let j = 1; j <= countWeekend; j++) {
//         const data = await generateEvent(allUsersIds[i], TIME_INTERVAL.WEEKEND);
//         mainCalendarEventsData.push(data);
//     }
// }
// // todo Створюємо події для shared календарів - категорія work
// // todo Але creationByUserId має бути тільки з роллю owner або editor
// for (let i = 1; i <= NUMBER_OF_USERS; i++) {
//     const count = faker.number.int({ min: 2, max: 10 });
//     for (let j = 1; j <= count; j++) {
//         const data = await generateEvent(allUsersIds[i], TIME_INTERVAL.WORK, EVENT_CATEGORIES[0]);
//         sharedCalendarEventsData.push(data);
//     }
// }
// /*
// TABLE calendars_events
// */
// // todo Додаємо події для main календарів у main календарі ===> calendars_events
// for (let i = 1; i <= mainCalendarEventsData.length; i++) {
//     // mainCalendarEventsData.eventId;
//     // mainCalendarEventsData.ownerId;
// }
// // todo Додаємо події для shared календарів у shared календарі ===> calendars_events
// for (let i = 1; i <= sharedCalendarEventsData.length; i++) {
//     // sharedCalendarEventsData.eventId;
//     // sharedCalendarEventsData.ownerId;
// }
// /*
// TABLE events_users
// */
// // todo Додаємо учасників до персональних подій main календарів ===> events_users
// for (let i = 1; i <= mainCalendarEventsData.length; i++) {
//     // id учасника має != id owner-a
//     // mainCalendarEventsData.eventId;
//     // mainCalendarEventsData.ownerId;
// }
// // todo Додаємо учасників до shared подій shared календарів ===> events_users
// for (let i = 1; i <= sharedCalendarEventsData.length; i++) {
//     // id учасника має != id owner-a
//     // а також учасник події має бути учасником календаря (calendars_users)
//     // sharedCalendarEventsData.eventId;
//     // sharedCalendarEventsData.ownerId;
// }