import { test, expect, request } from '@playwright/test';
import dotenv from 'dotenv';
import UserModel from "./../../src/user/model.js";
import CalendarModel from "./../../src/calendar/model.js";

dotenv.config({ path: '.env.test', debug: true });

const baseUrl = 'http://localhost:8080/api';
const userModel = new UserModel();
const calendarModel = new CalendarModel();

test.describe('Calendar', () => {
    test.describe.configure({mode: 'serial', timeout: 2000});

    const testUserData = {
        email: `testuser${Date.now()}@example.com`,
        fullName: 'Test User',
        country: 'Ukraine',
        password: 'StrongPassword123!$',
        new_password: 'NewStrongPassword123!$'
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
        // expect(responseBody.data.creationAt).toBe(confirmedUser.creationAt);

        accessToken = responseBody.accessToken;
    });

    const testCalendarData = {
        title: 'Test Calendar',
        description: 'Test Calendar Description'
    };
    let currentCalendar = {};

    test("Create Calendar", async ({request}) => {
        const response = await request.post(`${baseUrl}/calendars/`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                title: testCalendarData.title,
                description: testCalendarData.description
            }
        });

        expect(response.status()).toBe(201);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBeTruthy();
        expect(responseBody.data.title).toBe(testCalendarData.title);
        expect(responseBody.data.description).toBe(testCalendarData.description);
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.creationAt).toBeTruthy();

        currentCalendar.id = responseBody.data.id;
    });

    test("Get Calendar", async ({request}) => {
        const response = await request.get(`${baseUrl}/calendars/${currentCalendar.id}`, {
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
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBe(currentCalendar.id);
        expect(responseBody.data.title).toBe(testCalendarData.title);
        expect(responseBody.data.description).toBe(testCalendarData.description);
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.creationAt).toBeTruthy();
    });

    test("Update Calendar", async ({request}) => {
        testCalendarData.title = testCalendarData.title + " Updated";
        testCalendarData.description = testCalendarData.description + " Updated";

        const response = await request.patch(`${baseUrl}/calendars/${currentCalendar.id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: {
                title: testCalendarData.title,
                description: testCalendarData.description
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('data');
        expect(responseBody).toHaveProperty('data.id');
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBe(currentCalendar.id);
        expect(responseBody.data.title).toBe(testCalendarData.title);
        expect(responseBody.data.description).toBe(testCalendarData.description);
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.creationAt).toBeTruthy();
    });

    test("Delete Calendar", async ({request}) => {
        const response = await request.delete(`${baseUrl}/calendars/${currentCalendar.id}`, {
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
        expect(responseBody).toHaveProperty('data.title');
        expect(responseBody).toHaveProperty('data.description');
        expect(responseBody).toHaveProperty('data.creationByUserId');
        expect(responseBody).toHaveProperty('data.creationAt');
        expect(responseBody.data.id).toBe(currentCalendar.id);
        expect(responseBody.data.title).toBe(testCalendarData.title);
        expect(responseBody.data.description).toBe(testCalendarData.description);
        expect(responseBody.data.creationByUserId).toBe(confirmedUser.id);
        expect(responseBody.data.creationAt).toBeTruthy();
    });
});
