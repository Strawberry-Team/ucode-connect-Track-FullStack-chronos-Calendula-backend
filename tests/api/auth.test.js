import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
import { HEADERS, expectResponseHeaders } from "./helpers/general.helpers.js";
import { registerUser, confirmUserEmail, loginUser, generateUserData } from "./helpers/users.helpers.js";
import UserModel from "./../../src/user/model.js";

dotenv.config({ path: '.env.test', debug: true });

const userModel = new UserModel();

test.describe('Authentication', () => {
    test.describe.configure({ mode: 'serial', timeout: 2000 });

    let userData = generateUserData();

    test('User registration', async ({ request }) => {
       await registerUser(request, userData);
    });

    test('Confirm the user`s email by token', async ({ request }) => {
        const { userData: user } = await confirmUserEmail(request, userData);
        Object.assign(userData, user);
    });

    test('User login', async ({ request }) => {
        const { userData: user } = await loginUser(request, userData);
        userData.accessToken = user.accessToken;
    });

    test('User logout', async ({ request }) => {
        const response = await request.post(`auth/logout`, );

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expect(responseBody).toMatchObject({
            message: 'Successful logout'
        });
    });

    test('Send a password recovery email', async ({ request }) => {
        const response = await request.post(`auth/password-reset`, {
            headers: HEADERS,
            data: {
                email: userData.email
            }
        });

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expect(responseBody).toMatchObject({
            message: 'Successful send an email.'
        });

        const user = await userModel.getEntityById(userData.id);
        expect(user).toMatchObject({
            passwordResetToken: expect.any(String)
        });
        userData.passwordResetToken = user.passwordResetToken;
    });

    test('Confirm password recovery by token', async ({ request }) => {
        userData.new_password = 'NewStrongPassword123!$';
        const response = await request.post(`auth/password-reset/${userData.passwordResetToken}`, {
            params: {
                confirm_token: userData.passwordResetToken
            },
            headers: HEADERS,
            data: {
                password: userData.new_password,
                password_confirm: userData.new_password
            }
        });

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expect(responseBody).toMatchObject({
            message: 'Successful password update.'
        });

        const user = await userModel.getEntityById(userData.id);
        expect(user).toMatchObject({
            password: expect.any(String)
        });
    });

    test('User login with new password', async ({ request }) => {
        const response = await request.post(`auth/login`, {
            headers: HEADERS,
            data: {
                email: userData.email,
                password: userData.new_password
            }
        });

        expectResponseHeaders(response);
        const responseBody = await response.json();
        expect(responseBody).toMatchObject({
            message: 'Successful login',
            accessToken: expect.any(String),
            data: {
                id: userData.id,
                fullName: userData.fullName,
                email: userData.email,
                country: userData.country,
                profilePicture: userData.profilePicture,
                isVerified: userData.isVerified,
                role: userData.role,
                creationAt: expect.any(String)
            }
        });
        userData.accessToken = responseBody.accessToken;
    });

    test('Final user logout', async ({ request }) => {
        const response = await request.post(`auth/logout`);
        expectResponseHeaders(response);
        const responseBody = await response.json();
        expect(responseBody).toMatchObject({
            message: 'Successful logout'
        });
    });

    test("Cleanup of test data", async ({request}) => {
        const userModel = new UserModel();
        const user = await userModel.getByEmail(userData.email);
        await user.delete();
    });
});