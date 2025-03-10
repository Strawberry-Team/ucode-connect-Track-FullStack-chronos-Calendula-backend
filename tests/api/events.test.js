import { test, expect, request } from '@playwright/test';
import dotenv from 'dotenv';
import UserModel from "./../../src/user/model.js";
import EventModel from "./../../src/event/model.js";

dotenv.config({ path: '.env.test', debug: true });

const baseUrl = 'http://localhost:8080/api';
const userModel = new UserModel();
const eventModel = new EventModel();

test.describe('Events', () => {
    test.describe.configure({mode: 'serial', timeout: 2000});

    const testUserData = {
        email: `ann.nichols${Date.now()}@example.com`,
        fullName: 'Ann Nichols',
        country: 'Ukraine',
        password: 'StrongPassword123!$',
    };
    let currentUser;

    test('User registration', async ({request}) => {
        const response = await request.post(`${baseUrl}/auth/register`, {
            headers: {'Content-Type': 'application/json'},
            data: {
                email: testUserData.email,
                fullName: testUserData.fullName,
                country: testUserData.country,
                password: testUserData.password,
                password_confirm: testUserData.password
            }
        });

        expect(response.status()).toBe(201);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.fullName');
        expect(responseBody).toHaveProperty('data.email');
        expect(responseBody).toHaveProperty('data.country');
        expect(responseBody.data.id).toBeTruthy();
        expect(responseBody.data.fullName).toBe(testUserData.fullName);
        expect(responseBody.data.email).toBe(testUserData.email);
        expect(responseBody.data.country).toBe(testUserData.country);

        currentUser = await userModel.getEntityById(responseBody.data.id);
        expect(currentUser).toBeDefined();
        expect(currentUser.id).toBeTruthy();
        expect(currentUser.fullName).toBe(testUserData.fullName);
        expect(currentUser.email).toBe(testUserData.email);
        expect(currentUser.country).toBe(testUserData.country);
        expect(currentUser.confirmToken).toBeTruthy();
    });

    let confirmedUser;

    test('Confirm the user\'s email by token', async ({request}) => {
        const confirmToken = currentUser.confirmToken;
        const response = await request.get(`${baseUrl}/auth/confirm-email/${confirmToken}`, {
            params: {
                confirm_token: confirmToken
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Successful email confirmation');

        confirmedUser = await userModel.getEntityById(currentUser.id);
        expect(confirmedUser).toBeDefined();
        expect(confirmedUser.isVerified).toBe(1);
    });

    let accessToken;

    test('User login', async ({request}) => {
        const response = await request.post(`${baseUrl}/auth/login`, {
            headers: {'Content-Type': 'application/json'},
            data: {
                email: confirmedUser.email,
                password: testUserData.password
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message');
        expect(responseBody).toHaveProperty('accessToken');
        expect(responseBody.message).toBe('Successful login');
        expect(responseBody.accessToken).toBeTruthy();

        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.fullName');
        expect(responseBody).toHaveProperty('data.email');
        expect(responseBody).toHaveProperty('data.country');
        expect(responseBody).toHaveProperty('data.profilePicture');
        expect(responseBody).toHaveProperty('data.isVerified');
        expect(responseBody).toHaveProperty('data.role');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBe(confirmedUser.id);
        expect(responseBody.data.fullName).toBe(confirmedUser.fullName);
        expect(responseBody.data.email).toBe(confirmedUser.email);
        expect(responseBody.data.country).toBe(confirmedUser.country);
        expect(responseBody.data.profilePicture).toBe(confirmedUser.profilePicture);
        expect(responseBody.data.role).toBe(confirmedUser.role);
        expect(responseBody.data.creationAt).toBeTruthy();

        accessToken = responseBody.accessToken;
    });

    const testEventData = {
        title: 'Database Modeling',
        description: 'Discussion of requirements, business logic, clarification of team composition',
        category: 'work',
        type: 'meeting',
        startAt: '2023-03-09 14:00:00',
        endAt: '2023-03-09 15:00:00',
    };
    let currentEvent = {};

    test("Create Event", async ({request}) => {
        const response = await request.post(`${baseUrl}/events/`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                title: testEventData.title,
                description: testEventData.description,
                category: testEventData.category,
                type: testEventData.type,
                startAt: testEventData.startAt,
                endAt: testEventData.endAt
            }
        });

        expect(response.status()).toBe(201);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.category');
        expect(responseBody).toHaveProperty('data.type');
        expect(responseBody).toHaveProperty('data.startAt');
        expect(responseBody).toHaveProperty('data.endAt');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBeTruthy();
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.title).toBe(testEventData.title);
        expect(responseBody.data.description).toBe(testEventData.description);
        expect(responseBody.data.category).toBe(testEventData.category);
        expect(responseBody.data.type).toBe(testEventData.type);
        expect(responseBody.data.startAt).toBe(testEventData.startAt);
        expect(responseBody.data.endAt).toBe(testEventData.endAt);
        expect(responseBody.data.creationAt).toBeTruthy();
        currentEvent.id = responseBody.data.id;
    });

    test("Get Event", async ({request}) => {
        const response = await request.get(`${baseUrl}/events/${currentEvent.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.category');
        expect(responseBody).toHaveProperty('data.type');
        expect(responseBody).toHaveProperty('data.startAt');
        expect(responseBody).toHaveProperty('data.endAt');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBeTruthy();
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.title).toBe(testEventData.title);
        expect(responseBody.data.description).toBe(testEventData.description);
        expect(responseBody.data.category).toBe(testEventData.category);
        expect(responseBody.data.type).toBe(testEventData.type);
        expect(responseBody.data.startAt).toBe(testEventData.startAt);
        expect(responseBody.data.endAt).toBe(testEventData.endAt);
        expect(responseBody.data.creationAt).toBeTruthy();
    });

    testEventData.title = "Frontend: Auth"
    testEventData.description = "Creating user flow for authorisation";
    testEventData.category = "work";
    testEventData.type = "task";
    testEventData.startAt ='2023-03-11 10:00:00';
    testEventData.endAt = '2023-03-11 13:00:00';

    test("Update Event", async ({request}) => {
        const response = await request.patch(`${baseUrl}/events/${currentEvent.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                title: testEventData.title,
                description: testEventData.description,
                category: testEventData.category,
                type: testEventData.type,
                startAt: testEventData.startAt,
                endAt: testEventData.endAt
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.category');
        expect(responseBody).toHaveProperty('data.type');
        expect(responseBody).toHaveProperty('data.startAt');
        expect(responseBody).toHaveProperty('data.endAt');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBeTruthy();
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.title).toBe(testEventData.title);
        expect(responseBody.data.description).toBe(testEventData.description);
        expect(responseBody.data.category).toBe(testEventData.category);
        expect(responseBody.data.type).toBe(testEventData.type);
        expect(responseBody.data.startAt).toBe(testEventData.startAt);
        expect(responseBody.data.endAt).toBe(testEventData.endAt);
        expect(responseBody.data.creationAt).toBeTruthy();
    });

    test("Delete Event", async ({request}) => {
        const response = await request.delete(`${baseUrl}/events/${currentEvent.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.category');
        expect(responseBody).toHaveProperty('data.type');
        expect(responseBody).toHaveProperty('data.startAt');
        expect(responseBody).toHaveProperty('data.endAt');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBeTruthy();
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.title).toBe(testEventData.title);
        expect(responseBody.data.description).toBe(testEventData.description);
        expect(responseBody.data.category).toBe(testEventData.category);
        expect(responseBody.data.type).toBe(testEventData.type);
        expect(responseBody.data.startAt).toBe(testEventData.startAt);
        expect(responseBody.data.endAt).toBe(testEventData.endAt);
        expect(responseBody.data.creationAt).toBeTruthy();
    });

    test('Final user logout', async ({ request }) => {
        const response = await request.post(`${baseUrl}/auth/logout`);

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Successful logout');
    });
});
