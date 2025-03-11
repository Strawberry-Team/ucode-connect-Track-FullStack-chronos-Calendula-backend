import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { BASE_URL, createAndLoginUser, expectResponseHeaders, generateHeaders, generateUserData } from "./helpers/auth.helpers.js";
import { createUser } from "./helpers/calendars.helpers.js";

dotenv.config({ path: '.env.test', debug: true });

const DEFAULT_CALENDAR_FIELDS = {
    id: undefined,
    title: 'Calendula Dev Team',
    description: 'Stand-ups, retrospectives, planning sprints and product demos',
    creationByUserId: undefined,
    creationAt: undefined
};

function generateCalendarData(base = {}, overrides = {}) {
    return {
        ...DEFAULT_CALENDAR_FIELDS,
        ...base,
        ...overrides
    };
}

function expectCalendarDataToMatch(expected, actual) {
    expect(actual).toMatchObject({
        id: expected.id ?? expect.any(Number),
        title: expected.title,
        description: expected.description,
        creationByUserId: expected.creationByUserId,
        creationAt: expect.any(String),
        participants: [
            {
                userId: expected.participants[0].userId,
                role: 'owner'
            },
            {
                userId: expected.participants[1].userId,
                role: 'editor'
            },
            {
                userId: expected.participants[2].userId,
                role: 'viewer'
            }
        ]
    });
}

function expectParticipantsDataToMatch(expected, actual) {
    expect(actual).toMatchObject({
        participants: [
            {
                userId: expected.participants[0].userId,
                role: 'owner'
            }
        ]
    });
}

async function expectCalendarResponse(response, expectedData, statusCode = 200) {
    expectResponseHeaders(response, statusCode);
    const responseBody = await response.json();
    expectCalendarDataToMatch(expectedData, responseBody.data);
    return responseBody;
}

test.describe('Calendars', () => {
    test.describe.configure({mode: 'serial', timeout: 2000});

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
            headers: headers,
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
            headers: headers
        });

        await expectCalendarResponse(response, calendarData);
    });

    test("Update Calendar", async ({request}) => {
        calendarData.title = "Sports activities";
        calendarData.description = "Schedule of gym classes and bike rides";

        const response = await request.patch(`${BASE_URL}/calendars/${calendarData.id}`, {
            headers: headers,
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
            headers: headers,
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
            headers: headers
        });

        expectResponseHeaders(response);
    });
});
