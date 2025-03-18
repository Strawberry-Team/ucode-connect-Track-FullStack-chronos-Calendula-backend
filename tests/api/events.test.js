import { test } from '@playwright/test';
import dotenv from 'dotenv';
import {expectResponseHeaders, generateHeaders} from "./helpers/general.helpers.js";
import {cleanUpUser, createAndLoginUser, generateUserData} from "./helpers/users.helpers.js";
import { generateEventData, expectEventResponse, getMainCalendarByUserId,
        generateParticipants, expectParticipantsDataToMatch } from "./helpers/events.helpers.js"

dotenv.config({ path: '.env.test', debug: true });

test.describe('Events', () => {
    test.describe.configure({mode: 'serial', timeout: 2000});

    let userData = {};
    let eventData = {};
    let headers = {};
    let participants = [];

    test.beforeAll('Create and login user', async ({ request }) => {
        const user = await createAndLoginUser(request);
        userData = generateUserData(user);
        headers = generateHeaders(userData.accessToken);
    });

    test.beforeAll('Create users and fill participants', async ({ request}) => {
        const userCalendar = await getMainCalendarByUserId(userData.id);
        participants = await generateParticipants(userData.id);
        eventData = generateEventData({}, {
            creationByUserId: userData.id,
            calendarId: userCalendar.id,
            participants
        });
    });

    test("Create Event", async ({request}) => {
        const response = await request.post(`events/`, {
            headers,
            data: {
                calendarId: eventData.calendarId,
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                type: eventData.type,
                startAt: eventData.startAt,
                endAt: eventData.endAt,
                participants: eventData.participants,
            }
        });

        const responseBody = await expectEventResponse(response, eventData, 201);
        eventData.id = responseBody.data.id;
        eventData.creationAt = responseBody.data.creationAt;
    });

    test("Get Event", async ({request}) => {
        const response = await request.get(`events/${eventData.id}`, {
            headers
        });

        await expectEventResponse(response, eventData);
    });

    test("Update Event", async ({request}) => {
        eventData = generateEventData(eventData, {});

        const response = await request.patch(`events/${eventData.id}`, {
            headers,
            data: {
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                type: eventData.type,
                startAt: eventData.startAt,
                endAt: eventData.endAt,
                participants: eventData.participants
            }
        });

        await expectEventResponse(response, eventData);
    });

    test("Update Event Participants", async ({request}) => {
        const response = await request.patch(`events/${eventData.id}`, {
            headers,
            data: {
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                type: eventData.type,
                startAt: eventData.startAt,
                endAt: eventData.endAt,
                participants: [eventData.participants[0]]
            }
        });

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expectParticipantsDataToMatch(eventData, responseBody.data);
    });

    test("Delete Event", async ({request}) => {
        const response = await request.delete(`events/${eventData.id}`, {
            headers
        });

        await expectEventResponse(response, eventData, 200);
    });

    test.afterAll("Cleanup of test data", async ({request}) => {
        for (const participant of eventData.participants) {
            await cleanUpUser(participant.userId);
        }
    });
});
