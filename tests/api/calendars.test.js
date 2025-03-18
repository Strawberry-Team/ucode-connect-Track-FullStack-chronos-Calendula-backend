import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { expectResponseHeaders, generateHeaders } from "./helpers/general.helpers.js";
import { createAndLoginUser, generateUserData, cleanUpUser } from "./helpers/users.helpers.js";
import { generateCalendarTitle, generateCalendarDescription, generateCalendarData,
        expectCalendarResponse, generateParticipants, expectParticipantsDataToMatch } from "./helpers/calendars.helpers.js";

dotenv.config({ path: '.env.test', debug: true });

test.describe('Calendars', () => {
    test.describe.configure({ mode: 'serial', timeout: 2000 });

    let userData = {};
    let calendarData = {};
    let headers = {};
    let participants = [];

    test.beforeAll('Create and login user', async ({ request}) => {
        const user = await createAndLoginUser(request);
        userData = generateUserData(user);
        headers = generateHeaders(userData.accessToken);
    });

    test.beforeAll('Create users and fill participants', async ({ request}) => {
        participants = await generateParticipants(userData.id);
        calendarData = generateCalendarData({}, {
            creationByUserId: userData.id,
            participants
        });
    });


    test("Create Calendar", async ({request}) => {
        const response = await request.post(`calendars/`, {
            headers,
            data: {
                title: calendarData.title,
                description: calendarData.description,
                participants: calendarData.participants
            }
        });

        const responseBody = await expectCalendarResponse(response, calendarData, 201);
        calendarData.id = responseBody.data.id;
        calendarData.creationAt = responseBody.data.creationAt;
    });

    test("Get Calendar", async ({request}) => {
        const response = await request.get(`calendars/${calendarData.id}`, {
            headers
        });

        await expectCalendarResponse(response, calendarData);
    });

    test("Update Calendar", async ({request}) => {
        calendarData.title = generateCalendarTitle();
        calendarData.description = generateCalendarDescription();

        const response = await request.patch(`calendars/${calendarData.id}`, {
            headers,
            data: {
                title: calendarData.title,
                description: calendarData.description,
                participants: calendarData.participants
            }
        });

        await expectCalendarResponse(response, calendarData);
    });

    test("Update Calendar Participants", async ({request}) => {
        const response = await request.patch(`calendars/${calendarData.id}`, {
            headers,
            data: {
                title: calendarData.title,
                description: calendarData.description,
                participants: calendarData.participants.filter(p => p.role === 'owner')
            }
        });

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expectParticipantsDataToMatch(calendarData, responseBody.data);
    });

    test("Delete Calendar", async ({request}) => {
        const response = await request.delete(`calendars/${calendarData.id}`, {
            headers
        });

        expectResponseHeaders(response);
    });

    test.afterAll("Cleanup of test data", async ({request}) => {
        for (const participant of calendarData.participants) {
            await cleanUpUser(participant.userId);
        }
    });
});
