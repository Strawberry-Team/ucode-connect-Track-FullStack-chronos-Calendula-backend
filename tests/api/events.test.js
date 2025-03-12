import { test } from '@playwright/test';
import dotenv from 'dotenv';
import { BASE_URL, generateHeaders } from "./helpers/general.helpers.js";
import { createAndLoginUser, generateUserData } from "./helpers/users.helpers.js";
import { generateEventData, expectEventResponse } from "./helpers/events.helpers.js"

dotenv.config({ path: '.env.test', debug: true });

test.describe('Events', () => {
    test.describe.configure({mode: 'serial', timeout: 2000});

    let userData = {};
    let eventData = {};
    let headers = {};

    test.beforeAll('Create and login user', async ({ request }) => {
        const user = await createAndLoginUser(request);
        userData = generateUserData(user);
        eventData = generateEventData({}, { creationByUserId: userData.id });
        headers = generateHeaders(userData.accessToken);
    });

    test("Create Event", async ({request}) => {
        const response = await request.post(`${BASE_URL}/events/`, {
            headers,
            data: {
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                type: eventData.type,
                startAt: eventData.startAt,
                endAt: eventData.endAt
            }
        });
        const responseBody = await expectEventResponse(response, eventData, 201);
        eventData.id = responseBody.data.id;
    });

    test("Get Event", async ({request}) => {
        const response = await request.get(`${BASE_URL}/events/${eventData.id}`, {
            headers
        });

        await expectEventResponse(response, eventData);
    });

    test("Update Event", async ({request}) => {
        eventData = generateEventData(eventData, {});
        const response = await request.patch(`${BASE_URL}/events/${eventData.id}`, {
            headers,
            data: {
                title: eventData.title,
                description: eventData.description,
                category: eventData.category,
                type: eventData.type,
                startAt: eventData.startAt,
                endAt: eventData.endAt
            }
        });

        await expectEventResponse(response, eventData);
    });

    test("Delete Event", async ({request}) => {
        const response = await request.delete(`${BASE_URL}/events/${eventData.id}`, {
            headers
        });

        await expectEventResponse(response, eventData, 200);
    });
});
