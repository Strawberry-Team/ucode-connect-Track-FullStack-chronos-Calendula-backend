import { faker } from '@faker-js/faker';
import { test } from '@playwright/test';
import dotenv from "dotenv";
import { expectResponseHeaders, generateHeaders } from "../api/helpers/general.helpers.js";
import { NUMBER_OF_USERS, USER_PASSWORD, generateUserAccessToken } from "./helpers/fake.users.helpers.js";
import { EVENT_ATTENDANCE_STATUSES, EVENT_CATEGORIES, EVENT_TYPES, generateEvent, generateEventParticipant, TIME_INTERVAL }
        from "./helpers/fake.events.helpers.js";
import UserModel from "../../src/user/model.js";
import CalendarModel from "../../src/calendar/model.js";
import CalendarUserModel from "../../src/calendar/user/model.js";

dotenv.config({path: '.env.test', debug: true});

test.describe(`Create events with participants`, async () => {
    test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

    let allUserObjects = [];
    let allUserIds = [];

    test(`Get users data`, async ({request}) => {
        allUserObjects = await (new UserModel()).getEntitiesByIds(
            Array.from({length: 11}, (_, i) => i + 12)
        );

        for (const user of allUserObjects) {
            user.password = USER_PASSWORD;
            user.accessToken = await generateUserAccessToken(request, user);
        }

        allUserObjects.forEach(user => allUserIds.push(user.id));
    });

    test('EVENING EVENTS for main calendars', async ({request}) => {
        let possibleParticipants = [];

        for (let i = 1; i <= NUMBER_OF_USERS; i++) {
            for (let j = 1; j <= faker.number.int({min: 2, max: 4}); j++) {
                let event = {};

                await test.step(`Event ${j} for User ${i}`, async () => {
                    /* Select the owner of the event */
                    const ownerId = allUserIds[i - 1];

                    /* Find the ID of the owner's main calendar */
                    const calendar = await (new CalendarModel()).getMainCalendar(ownerId);

                    /* Generate first level data for the event */
                    event = generateEvent(
                        ownerId,
                        calendar.id,
                        {
                            interval: TIME_INTERVAL.EVENING
                        }
                    );

                    /* Generate participants for the event */
                    possibleParticipants = allUserIds.filter(id => id !== ownerId);

                    for (let k = 0; k <= faker.number.int({min: 0, max: 2}); k++) {
                        const participant = generateEventParticipant(
                            faker.helpers.arrayElement(possibleParticipants)
                        );

                        possibleParticipants = possibleParticipants.filter(id => id !== participant.userId);
                        event.participants.push(participant);
                    }

                    /* Send request to the API to create an event with participants */
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

                    /* Update the `attendanceStatus` status for event participants */
                    event.participants = event.participants
                        .filter(p => !EVENT_ATTENDANCE_STATUSES.includes(p.attendanceStatus)
                            && p.userId !== event.creationByUserId);

                    for (const p of event.participants) {
                        const participant = allUserObjects.find(user => user.id === p.userId);

                        await test.step(`Update attendance status for participant ${participant.id} in Event ${event.id}`,
                            async () => {
                                const response = await request.patch(
                                    `events/${event.id}/${
                                        faker.datatype.boolean({probability: 0.8})
                                            ? (faker.datatype.boolean({probability: 0.8})
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
            }
        }
    });

    test('WEEKEND EVENTS for main calendars', async ({request}) => {
        let possibleParticipants = [];

        for (let i = 1; i <= NUMBER_OF_USERS; i++) {
            for (let j = 1; j <= faker.number.int({min: 2, max: 4}); j++) {
                let event = {};

                await test.step(`Event ${j} for User ${i}`, async () => {
                    /* Select the owner of the event */
                    const ownerId = allUserIds[i - 1];

                    /* Find the ID of the owner's main calendar */
                    const calendar = await (new CalendarModel()).getMainCalendar(ownerId);

                    /* Generate first level data for the event */
                    event = generateEvent(
                        ownerId,
                        calendar.id,
                        {
                            interval: TIME_INTERVAL.WEEKEND
                        }
                    );

                    /* Generate participants for the event */
                    possibleParticipants = allUserIds.filter(id => id !== ownerId);

                    for (let k = 0; k <= faker.number.int({min: 0, max: 5}); k++) {
                        const participant = generateEventParticipant(
                            faker.helpers.arrayElement(possibleParticipants)
                        );

                        possibleParticipants = possibleParticipants.filter(id => id !== participant.userId);
                        event.participants.push(participant);
                    }

                    /* Send request to the API to create an event with participants */
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

                    /* Update the `attendanceStatus` status for event participants */
                    event.participants = event.participants
                        .filter(p => !EVENT_ATTENDANCE_STATUSES.includes(p.attendanceStatus)
                            && p.userId !== event.creationByUserId);

                    for (const p of event.participants) {
                        const participant = allUserObjects.find(user => user.id === p.userId);

                        await test.step(`Update attendance status for participant ${participant.id} in Event ${event.id}`,
                            async () => {
                                const response = await request.patch(
                                    `events/${event.id}/${
                                        faker.datatype.boolean({probability: 0.8})
                                            ? (faker.datatype.boolean({probability: 0.8})
                                                ? 'join'
                                                : 'tentative')
                                            : 'leave'
                                    }`,
                                    {
                                        headers: generateHeaders(participant.accessToken)
                                    });

                                expectResponseHeaders(response, 200);
                            });
                    }
                });
            }
        }
    });

    test('WORK EVENTS for shared calendars', async ({request}) => {
        /* Select created shared calendars */
        const sharedCalendars = await (new CalendarModel()).getCalendarsByType('shared');
        let dailyEventStartHours = 9;

        for (const calendar of sharedCalendars) {
            /* Select the event owner and its participants */
            const ownerObject = allUserObjects.find(user => user.id === calendar.creationByUserId);
            const calendarParticipants = await (new CalendarUserModel()).getParticipantsByCalendarId(calendar.id);

            /* Generate DAILY WORK EVENTS */
            await test.step(`DAILY WORK EVENTS`, async () => {
                for (let i = 7; i <= 11; i++) {
                    /* Generate first level data for the event */
                    const event = generateEvent(
                        calendar.creationByUserId,
                        calendar.id,
                        {
                            interval: TIME_INTERVAL.WORK_DAILY,
                            day: i,
                            hours: dailyEventStartHours
                        },
                        EVENT_CATEGORIES.WORK,
                        EVENT_TYPES.MEETING
                    );

                    /* Generate participants for the event */
                    calendarParticipants.forEach(participant =>
                        event.participants.push(generateEventParticipant(participant.userId))
                    );

                    /* Send request to the API to create an event with participants */
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

                    /* Update the `attendanceStatus` status for event participants */
                    event.participants = event.participants
                        .filter(p => !EVENT_ATTENDANCE_STATUSES.includes(p.attendanceStatus)
                            && p.userId !== event.creationByUserId);

                    for (const p of event.participants) {
                        const participant = allUserObjects.find(user => user.id === p.userId);

                        await test.step(`Update attendance status for participant ${participant.id} in Event ${event.id}`,
                            async () => {
                                const response = await request.patch(
                                    `events/${event.id}/join`, {
                                        headers: generateHeaders(participant.accessToken)
                                    });

                                expectResponseHeaders(response, 200);
                            });
                    }
                }
            });

            dailyEventStartHours++;

            /* Generate RANDOM WORK EVENTS */
            await test.step(`RANDOM WORK EVENTS`, async () => {
                for (let i = 1; i <= faker.number.int({min: 4, max: 8}); i++) {
                    /* Generate first level data for the event */
                    const event = generateEvent(
                        calendar.creationByUserId,
                        calendar.id,
                        {
                            interval: TIME_INTERVAL.WORK
                        },
                        EVENT_CATEGORIES.WORK
                    );

                    /* Generate participants for the event */
                    calendarParticipants.forEach(participant =>
                        event.participants.push(generateEventParticipant(participant.userId))
                    );

                    /* Send request to the API to create an event with participants */
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

                    /* Update the `attendanceStatus` status for event participants */
                    event.participants = event.participants
                        .filter(p => !EVENT_ATTENDANCE_STATUSES.includes(p.attendanceStatus)
                            && p.userId !== event.creationByUserId);

                    for (const p of event.participants) {
                        const participant = allUserObjects.find(user => user.id === p.userId);

                        await test.step(`Update attendance status for participant ${participant.id} in Event ${event.id}`,
                            async () => {
                                const response = await request.patch(
                                    `events/${event.id}/${
                                        faker.datatype.boolean({probability: 0.8})
                                            ? (faker.datatype.boolean({probability: 0.8})
                                                ? 'join'
                                                : 'tentative')
                                            : 'leave'
                                    }`,
                                    {
                                        headers: generateHeaders(participant.accessToken)
                                    });

                                expectResponseHeaders(response, 200);
                            });
                    }
                }
            });
        }
    });
});
