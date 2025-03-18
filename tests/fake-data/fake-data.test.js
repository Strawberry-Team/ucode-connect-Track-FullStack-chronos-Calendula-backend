// TODO какой duration у event.type = reminder?

import {faker} from '@faker-js/faker';
import {test} from '@playwright/test';
import UserModel from "../../src/user/model.js";
import CalendarModel from "../../src/calendar/model.js";
import dotenv from "dotenv";
import { confirmUserEmail, loginUser, registerUser } from "../api/helpers/users.helpers.js";
import {expectResponseHeaders, generateHeaders} from "../api/helpers/general.helpers.js";

dotenv.config({path: '.env.test', debug: true});
test.describe( () => {
    test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

    const NUMBER_OF_USERS = 10 + 1;
    const NUMBER_OF_USERS_BY_GENDER = 5;
    const NUMBER_OF_SHARED_CALENDARS = 3;

    const USER_ROLE = 'user';
    const USER_PASSWORD = 'Password123!$';
    const USER_COUNTRIES = ['Ukraine', 'Finland', 'Estonia'];
    const USER_PROFILE_PICTURE = 'default.png';
    // const CALENDAR_TYPES = ['main', 'shared', 'holidays'];
    // const PARTICIPANT_ROLES = ['owner', 'member', 'viewer'];
    // const EVENT_CATEGORIES = ['work', 'home', 'hobby'];
    // const EVENT_TYPES = ['meeting', 'reminder', 'task'];
    // const EVENT_ATTENDANCE_STATUSES = ['yes', 'no', 'maybe'];

    const DEMO_DAY_START = '2025-04-';
    const DEMO_DAY_END = '2025-04-';
    const DEMO_TIME_START = ':00:00';
    const DEMO_TIME_END = ':00:00';

    const COLORS = [
        '#F4511E', '#EF6C00', '#F09300', '#F6BF26',
        '#E4C441', '#C0CA33', '#7CB342', '#33B679',
        '#0B8043', '#009688', '#039BE5', '#4285F4',
        '#3F51B5', '#7986CB', '#B39DDB', '#9E69AF',
        '#8E24AA', '#795548', '#616161', '#A79B8E'
    ];
    const CALENDAR_TYPES = Object.freeze({
        MAIN: 'main',
        SHARED: 'shared',
        HOLIDAYS: 'holidays'
    });
    const PARTICIPANT_ROLES = Object.freeze({
        OWNER: 'owner',
        MEMBER: 'member',
        VIEWER: 'viewer'
    });
    const EVENT_CATEGORIES = Object.freeze({
        WORK: 'work',
        HOME: 'home',
        HOBBY: 'hobby'
    });
    const EVENT_TYPES = Object.freeze({
        MEETING: 'meeting',
        REMINDER: 'reminder',
        TASK: 'task'
    });
    const TIME_INTERVAL = Object.freeze({
        WORK: 'work',
        WORK_DAILY: 'work daily',
        EVENING: 'evening',
        WEEKEND: 'weekend'
    });
    const EVENT_ATTENDANCE_STATUSES = Object.freeze({
        YES: 'yes',
        NO: 'no',
        MAYBE: 'maybe'
    });

    let allUserIds = [];
    let allUserObjects = [];
    let allCalendarIds = [];
    let allCalendarObjects = [];
    let allEventIds = [];
    let allEventObjects = [];
    let mainCalendarsIds = [];
    let mainCalendarOwnersIds = [];
    let sharedCalendarsIds = [];
    let sharedCalendarParticipantsIds = [];
    let eventCreatorsIds = [];
    let sharedCalendarEventsData = [];
    let mainCalendarEventsData = [];


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
                faker.number.int({min: 0, max: 30, multipleOf: 30}),
                0,
                0
            ),
            duration: faker.number.int({min: 30, max: 60, multipleOf: 30})
        }
    }

    function generateWorkDailyTime(day, hours) {
        return {
            startAt: new Date(
                2025,
                3,
                day ?? 4,
                hours ?? 9,
                faker.number.int({min: 0, max: 30, multipleOf: 30}),
                0,
                0
            ),
            duration: 30
        }
    }

    function generateEveningTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({min: 4, max: 11}),
                faker.number.int({min: 17, max: 20}),
                faker.number.int({min: 0, max: 30, multipleOf: 30}),
                0,
                0
            ),
            duration: faker.number.int({min: 30, max: 60, multipleOf: 30})
        };
    }

    function generateWeekendTime() {
        return {
            startAt: new Date(
                2025,
                3,
                faker.number.int({min: 12, max: 13}),
                faker.number.int({min: 10, max: 18}),
                faker.number.int({min: 0, max: 30, multipleOf: 30}),
                0,
                0
            ),
            duration: faker.number.int({min: 60, max: 240, multipleOf: 30})
        };
    }

    function generateEventDateTime(time = {}) {
        const eventTime = {
            [TIME_INTERVAL.WORK]: generateWorkTime(),
            [TIME_INTERVAL.WORK_DAILY]: generateWorkDailyTime(time.day, time.hours),
            [TIME_INTERVAL.EVENING]: generateEveningTime(),
            [TIME_INTERVAL.WEEKEND]: generateWeekendTime()
        }[time.interval] || generateWorkTime();
        const startAt = eventTime.startAt
            .toISOString().replace("T", " ").split(".")[0];
        const endAt = new Date(eventTime.startAt.getTime() + eventTime.duration * 60 * 1000)
            .toISOString().replace("T", " ").split(".")[0];
        return {
            startAt,
            endAt,
        };
    }

    function generateUser(gender = 'M', profilePictureNumber = 0, isTestUser = false) {
        const user = {};
        const sex = (gender === 'M') ? 'male' : 'female';
        const firstName = isTestUser ? 'Test' : faker.person.firstName(sex);
        const lastName = isTestUser ? 'User' : faker.person.lastName(sex);

        user.fullName = `${firstName} ${lastName}`;
        user.password = USER_PASSWORD;
        user.password_confirm = user.password;
        user.email = isTestUser
            ? `test.user@calendula.ua`
            : faker.internet.email({
                firstName: firstName,
                lastName: lastName,
                provider: 'calendula.ua',
                allowSpecialCharacters: false
            }).replace(/\d+/g, '').toLowerCase();
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
        calendar.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUserIds);
        calendar.creationAt = generateCreationAt('2020-04-02T08:00:00.000Z', '2025-04-02T11:00:00.000Z');
        calendar.type = calendarType ?? CALENDAR_TYPES.SHARED;
        calendar.participants = [
            {
                userId: creationByUserId,
                role: PARTICIPANT_ROLES.OWNER,
                color: faker.helpers.arrayElement(COLORS),
                isConfirmed: true
            }
        ];

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
//     calendarOwner.userId = faker.helpers.arrayElement(allUserIds);
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
        participant.role = role ?? faker.helpers.arrayElement([PARTICIPANT_ROLES.MEMBER, PARTICIPANT_ROLES.VIEWER]);
        participant.isConfirmed = role === PARTICIPANT_ROLES.OWNER;
        participant.creationAt = generateCreationAt('2020-04-02T14:00:00.000Z', '2025-04-02T15:00:00.000Z');

        return participant;
    }

    function generateEvent(creationByUserId, calendarId, time = {}, category, type) {
        const event = {};
        const dateTime = generateEventDateTime(time);
        event.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUserIds);
        event.title = generateTitle();
        event.description = generateDescription();
        event.category = category ?? faker.helpers.arrayElement(
            [EVENT_CATEGORIES.WORK, EVENT_CATEGORIES.HOME, EVENT_CATEGORIES.HOBBY]);
        event.type = type ?? faker.helpers.arrayElement(
            [EVENT_TYPES.MEETING, EVENT_TYPES.REMINDER, EVENT_TYPES.TASK]);
        event.startAt = dateTime.startAt;
        event.endAt = dateTime.endAt;
        event.creationAt = generateCreationAt('2020-04-02T15:00:00.000Z', '2025-04-02T16:00:00.000Z');
        event.calendarId = calendarId;
        event.participants = [
            {
                userId: creationByUserId
            }
        ];

        return event;
    }

    function generateEventParticipant(participantId, color) {
        const participant = {};
        participant.userId = participantId;
        participant.color = COLORS.includes(color)
            ? color
            : faker.helpers.arrayElement(COLORS);
        participant.attendanceStatus = null;
        participant.creationAt = generateCreationAt('2020-04-02T14:00:00.000Z', '2025-04-02T15:00:00.000Z');

        return participant;
    }

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

    /**
     * TABLE users, calendars_users (main)
     */
    test.describe('Create and login 11 users (5 female, 6 male)', () => {
        test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

        test("Create Test User", async ({request}) => {
            // Generate the Test User data
            const testUser = generateUser('M', 0, true);
            // Send a request to the API for registration, mail confirmation and user login
            await registerUser(request, testUser);
            await confirmUserEmail(request, testUser);
            let {userData} = await loginUser(request, testUser);
            testUser.accessToken = userData.accessToken;
            testUser.id = userData.id;

            // Update user profile picture
            const entity = await (new UserModel()).getEntityById(testUser.id);
            testUser.creationAt = entity.creationAt;
            entity.profilePicture = testUser.profilePicture;
            await entity.save();

            allUserIds.push(testUser.id);
            allUserObjects.push(testUser);

            // Save the main calendar created for the Test User
            const mainCalendar = await (new CalendarModel()).getMainCalendar(testUser.id);
            allCalendarObjects.push(mainCalendar);
            allCalendarIds.push(mainCalendar.id);
        });

        for (let i = 0; i < NUMBER_OF_USERS_BY_GENDER; i++) {
            const sex = ['F', 'M'];

            for (let j = 0; j < sex.length; j++) {
                const description = `User ${i * sex.length + j + 1}`;

                test(description, async ({request}) => {
                    // Generate the user data
                    const user = generateUser(sex[j], i + 1);
                    const createdUser = {};
                    Object.assign(createdUser, user);

                    // Send a request to the API for registration, mail confirmation and user login
                    await registerUser(request, createdUser);
                    await confirmUserEmail(request, createdUser);
                    let {userData} = await loginUser(request, createdUser);
                    user.accessToken = userData.accessToken;
                    user.id = userData.id;

                    // Update user profile picture
                    const userEntity = await (new UserModel()).getEntityById(user.id);
                    user.creationAt = userEntity.creationAt;
                    userEntity.profilePicture = user.profilePicture;
                    await userEntity.save();

                    allUserIds.push(user.id);
                    allUserObjects.push(user);

                    // Save the main calendar created for the user
                    const mainCalendar = await (new CalendarModel()).getMainCalendar(user.id);
                    allCalendarObjects.push(mainCalendar);
                    allCalendarIds.push(mainCalendar.id);
                });
            }
        }
    });


    /**
     * TABLE calendars, calendars_users (shared)
     */
    test.describe('Create 5 shared calendars with participants', async () => {
        test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

        let sharedCalendarOwnersIds = [];
        let possibleParticipants = [];

        for (let i = 1; i <= NUMBER_OF_SHARED_CALENDARS; i++) {
            let description = `Calendar ${i}`;
            let calendar = {};

            test(description, async ({request}) => {
                // Select the owner of the calendar
                const possibleOwners = allUserIds.filter(id => !sharedCalendarOwnersIds.includes(id));
                const ownerId = faker.helpers.arrayElement(possibleOwners);
                sharedCalendarOwnersIds.push(ownerId);

                // Generate first level data for the calendar
                calendar = generateCalendar(ownerId, CALENDAR_TYPES.SHARED);

                // Generate participants for the calendar
                possibleParticipants = allUserIds.filter(id => id !== ownerId);

                for (let j = 1; j <= faker.number.int({min: 2, max: 4}); j++) {
                    const participant = generateSharedCalendarParticipant(
                        faker.helpers.arrayElement(possibleParticipants)
                    );

                    possibleParticipants = possibleParticipants.filter(id => id !== participant.userId);
                    calendar.participants.push(participant);
                }

                // Send request to the API to create a calendar with participants
                const ownerObject = allUserObjects.find(user => user.id === ownerId);

                const response = await request.post(`calendars`, {
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

                allCalendarIds.push(calendar.id);
                allCalendarObjects.push(calendar);

                // Update the `isConfirmed` status for calendar participants
                calendar.participants = calendar.participants.filter(p => p.isConfirmed === false);

                for (const p of calendar.participants) {
                    const participant = allUserObjects.find(user => user.id === p.userId);
                    description = `Update join status for participant ${participant.id} in Calendar ${calendar.id}`;

                    await test.step(description, async () => {
                        const response = await request.patch(`calendars/${calendar.id}/join`, {
                            headers: generateHeaders(participant.accessToken)
                        });

                        expectResponseHeaders(response, 200);
                    });
                }
            });
        }
    });

    /**
     * TABLE events, calendars_events, events_users
     */
    test.describe('Create events with participants for users\' main calendars', async () => {
        test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

        let mainEventOwnersIds = [];
        let possibleParticipants = [];

        for (let i = 1; i <= NUMBER_OF_USERS; i++) {
            for (let j = 1; j <= faker.number.int({min: 2, max: 4}); j++) {
                const description = `Event ${j} for User ${i}`;
                let event = {};

                test(description, async ({request}) => {
                    // Select the owner of the event
                    const ownerId = allUserIds[i-1];
                    mainEventOwnersIds.push(ownerId);

                    // Find the ID of the owner's main calendar
                    const calendar = allCalendarObjects.find(
                        c => c.creationByUserId === ownerId
                            && c.type === CALENDAR_TYPES.MAIN
                    );
                    // const calendar = await (new CalendarModel()).getMainCalendar(ownerId);

                    // Generate first level data for the event
                    event = generateEvent(
                        ownerId,
                        calendar.id,
                        {
                            interval: TIME_INTERVAL.EVENING
                        }
                    );

                    // Generate participants for the event
                    possibleParticipants = allUserIds.filter(id => id !== ownerId);

                    for (let k = 0; k <= faker.number.int({ min: 0, max: 2 }); k++) {
                        const participant = generateEventParticipant(
                            faker.helpers.arrayElement(possibleParticipants)
                        );

                        possibleParticipants = possibleParticipants.filter(id => id !== participant.userId);
                        event.participants.push(participant);
                    }

                    // Send request to the API to create an event with participants
                    const ownerObject = allUserObjects.find(user => user.id === ownerId);

                    const response = await request.post(`events`, {
                        headers: generateHeaders(ownerObject.accessToken),
                        data: {
                            calendarId: calendar.id,
                            title: event.title,
                            description: event.description,
                            category: event.category,
                            type: event.type,
                            startAt: event.startAt,
                            endAt: event.endAt,
                            participants: event.participants
                        }
                    });

                    expectResponseHeaders(response, 201);
                    const responseBody = await response.json();
                    event.id = responseBody.data.id;
                    event.creationAt = responseBody.data.creationAt;

                    allEventIds.push(event.id);
                    allEventObjects.push(event);

                    // Update the `attendanceStatus` status for event participants
                    event.participants = event.participants.filter(p => p.attendanceStatus === null);

                    for (const p of event.participants) {
                        const participant = allUserObjects.find(user => user.id === p.userId);
                        const description = `Update attendance status for participant ${participant.id} in Event ${event.id}`;

                        await test.step(description, async () => {
                            const response = await request.patch(
                                `events/${event.id}/${
                                    faker.datatype.boolean({ probability: 0.8 }) 
                                        ? (faker.datatype.boolean({ probability: 0.8 }) 
                                            ? 'join'
                                            : 'tentative') 
                                        : 'leave'
                                }`, {
                                headers: generateHeaders(participant.accessToken)
                            });

                            expectResponseHeaders(response, 200);
                        });
                    }
                });

                allEventIds.push(event.id);
            }
        }

    });
});

// /*
// TABLE events
// */
// // Створюємо події для main календарів - будь-яка категорія
// for (let i = 0; i < NUMBER_OF_USERS; i++) {
//     const countEvening = faker.number.int({min: 2, max: 4});
//     for (let j = 1; j <= countEvening; j++) {
//         const data = await generateEvent(allUserIds[i], TIME_INTERVAL.EVENING);
//         mainCalendarEventsData.push(data);
//     }
//     const countWeekend = faker.number.int({min: 2, max: 6});
//     for (let j = 1; j <= countWeekend; j++) {
//         const data = await generateEvent(allUserIds[i], TIME_INTERVAL.WEEKEND);
//         mainCalendarEventsData.push(data);
//     }
// }




// // todo Створюємо події для shared календарів - категорія work
// // todo Але creationByUserId має бути тільки з роллю owner або editor
// for (let i = 1; i <= NUMBER_OF_USERS; i++) {
//     const count = faker.number.int({ min: 2, max: 10 });
//     for (let j = 1; j <= count; j++) {
//         const data = await generateEvent(allUserIds[i], TIME_INTERVAL.WORK, EVENT_CATEGORIES.WORK);
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