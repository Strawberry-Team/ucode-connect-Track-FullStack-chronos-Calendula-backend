import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { BASE_URL, expectResponseHeaders, generateHeaders } from "./helpers/general.helpers.js";
import { createAndLoginUser, generateUserData } from "./helpers/users.helpers.js";
import { createUser, generateCalendarTitle, generateCalendarDescription, generateCalendarData,
    expectCalendarResponse, expectParticipantsDataToMatch } from "./helpers/calendars.helpers.js";

dotenv.config({ path: '.env.test', debug: true });

test.describe('Calendars', () => {
    test.describe.configure({ mode: 'serial', timeout: 2000 });

    let userData = {};
    let calendarData = {};
    let headers = {};
    let participants = [
        {
            userId: undefined,
            role: 'owner'
        },
        {
            userId: undefined,
            role: 'editor'
        },
        {
            userId: undefined,
            role: 'viewer'
        },
    ];

    test.beforeAll('Create and login user', async ({ request}) => {
        const user = await createAndLoginUser(request);
        userData = generateUserData(user);
        headers = generateHeaders(userData.accessToken);
    });

    test.beforeAll('Create users and fill participants', async ({ request}) => {
        for (const participant of participants) {
            const user = await createUser();
            participant.userId = user.id;
        }

        participants.forEach(participant => {
            if (participant.role === 'owner') {
                participant.userId = userData.id;
            }
        });

        calendarData = generateCalendarData({}, { creationByUserId: userData.id, participants });
    });


    test("Create Calendar", async ({request}) => {
        const response = await request.post(`${BASE_URL}/calendars/`, {
            headers,
            data: {
                title: calendarData.title,
                description: calendarData.description,
                participants: calendarData.participants
            }
        });

        const responseBody = await expectCalendarResponse(response, calendarData, 201);
        calendarData.id = responseBody.data.id;
    });

    test("Get Calendar", async ({request}) => {
        const response = await request.get(`${BASE_URL}/calendars/${calendarData.id}`, {
            headers
        });

        await expectCalendarResponse(response, calendarData);
    });

    test("Update Calendar", async ({request}) => {
        calendarData.title = generateCalendarTitle();
        calendarData.description = generateCalendarDescription();

        const response = await request.patch(`${BASE_URL}/calendars/${calendarData.id}`, {
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
        calendarData.participants = calendarData.participants.filter(participant => participant.role === 'owner');

        const response = await request.patch(`${BASE_URL}/calendars/${calendarData.id}`, {
            headers,
            data: {
                title: calendarData.title,
                description: calendarData.description,
                participants: calendarData.participants
            }
        });

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expectParticipantsDataToMatch(calendarData, responseBody.data);
    });

    test("Delete Calendar", async ({request}) => {
        const response = await request.delete(`${BASE_URL}/calendars/${calendarData.id}`, {
            headers
        });

        expectResponseHeaders(response);
    });
});
