import { test, expect, request } from '@playwright/test';
import dotenv from 'dotenv';
import UserModel from "./../../src/user/model.js";

dotenv.config({ path: '.env.test', debug: true });

const baseUrl = 'http://localhost:8080/api/auth';
const userModel = new UserModel();

test.describe('Authentication', () => {
    test.describe.configure({ mode: 'serial', timeout: 2000 });

    const testUserData = {
        email: `ann.nichols${Date.now()}@example.com`,
        fullName: 'Ann Nichols',
        country: 'Ukraine',
        password: 'StrongPassword123!$',
        new_password: 'NewStrongPassword123!$'
    };
    let currentUser;

    test('User registration', async ({ request }) => {
        const response = await request.post(`${baseUrl}/register`, {
            headers: { 'Content-Type': 'application/json' },
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
        const response = await request.get(`${baseUrl}/confirm-email/${confirmToken}`, {
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

    test('User login', async ({ request }) => {
        const response = await request.post(`${baseUrl}/login`, {
            headers: { 'Content-Type': 'application/json' },
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

    test('User logout', async ({ request }) => {
        const response = await request.post(`${baseUrl}/logout`, );

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Successful logout');
    });

    test('Send a password recovery email', async ({ request }) => {
        const response = await request.post(`${baseUrl}/password-reset`, {
            headers: { 'Content-Type': 'application/json' },
            data: {
                email: confirmedUser.email
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty("message");
        expect(responseBody.message).toBe('Successful send an email');

        confirmedUser = await userModel.getEntityById(confirmedUser.id);
        expect(confirmedUser).toBeDefined();
        expect(confirmedUser.passwordResetToken).toBeTruthy();
    });

    test('Confirm password recovery by token', async ({ request }) => {
        const passwordResetToken = confirmedUser.passwordResetToken;
        const response = await request.post(`${baseUrl}/password-reset/${passwordResetToken}`, {
            params: {
                confirm_token: passwordResetToken
            },
            headers: { 'Content-Type': 'application/json' },
            data: {
                password: testUserData.new_password,
                password_confirm: testUserData.new_password
            }
        });

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Successful password update');

        confirmedUser = await userModel.getEntityById(confirmedUser.id);
        expect(confirmedUser).toBeDefined();
        expect(confirmedUser.password).toBeTruthy();
    });

    test('User login with new password', async ({ request }) => {
        const response = await request.post(`${baseUrl}/login`, {
            headers: { 'Content-Type': 'application/json' },
            data: {
                email: confirmedUser.email,
                password: testUserData.new_password
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

    test('Final user logout', async ({ request }) => {
        const response = await request.post(`${baseUrl}/logout`);

        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toBe('Successful logout');
    });
});