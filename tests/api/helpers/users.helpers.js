import { expect } from '@playwright/test';
import { faker } from "@faker-js/faker/locale/en";
import { BASE_URL, HEADERS, expectResponseHeaders } from "./general.helpers.js";
import UserModel from "../../../src/user/model.js";

const userModel = new UserModel();

export function generateEmail(firstName, lastName) {
    return faker.internet.exampleEmail({
        firstName: firstName,
        lastName: lastName,
        allowSpecialCharacters: false
    }).toLowerCase();
}

export function generateFullName() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`
    };
}

export function generateCountry() {
    return faker.helpers.arrayElement(['Ukraine', 'Poland', 'Spain']);
}

export function generatePassword() {
    return 'Password123!$';
}

export function generateUserData(base = {}, overrides = {}) {
    const name = generateFullName();
    return {
        id: undefined,
        email: generateEmail(name.firstName, name.lastName),
        fullName: name.fullName,
        country: generateCountry(),
        password: generatePassword(),
        password_confirm: generatePassword(),
        confirmToken: undefined,
        accessToken: undefined,
        ...base,
        ...overrides
    };
}

export async function registerUser(request, userData) {
    const response = await request.post(`${BASE_URL}/auth/register`, {
        headers: HEADERS,
        data: {
            email: userData.email,
            fullName: userData.fullName,
            country: userData.country,
            password: userData.password,
            password_confirm: userData.password_confirm
        }
    });

    expectResponseHeaders(response, 201);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
        data: {
            id: expect.any(Number),
            fullName: userData.fullName,
            email: userData.email,
            country: userData.country,
        }
    });

    const user = await userModel.getEntityById(responseBody.data.id);
    expect(user).toMatchObject({
        id: expect.any(Number),
        fullName: userData.fullName,
        email: userData.email,
        country: userData.country,
        confirmToken: expect.any(String)
    });
    userData.id = user.id;
    userData.confirmToken = user.confirmToken;

    return { userData, responseBody };
}

export async function confirmUserEmail(request, userData) {
    const response = await request.get(`${BASE_URL}/auth/confirm-email/${userData.confirmToken}`, {
        params: {
            confirm_token: userData.confirmToken
        }
    });

    expectResponseHeaders(response);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
        message: 'Successful email confirmation'
    });

    const user = await userModel.getEntityById(userData.id);
    expect(user).toMatchObject({
        id: userData.id,
        fullName: userData.fullName,
        email: userData.email,
        country: userData.country,
        isVerified: 1
    });
    user.password = userData.password;
    Object.assign(userData, user);

    return { userData, responseBody };
}

export async function loginUser(request, userData) {
    const response = await request.post(`${BASE_URL}/auth/login`, {
        headers: HEADERS,
        data: {
            email: userData.email,
            password: userData.password
        }
    });

    expectResponseHeaders(response);
    const responseBody = await response.json();
    expect(responseBody).toMatchObject({
        message: 'Successful login',
        accessToken: expect.any(String),
        data: {
            id: expect.any(Number),
            fullName: userData.fullName,
            email: userData.email,
            profilePicture: expect.any(String),
            country: userData.country,
            role: 'user',
            isVerified: 1,
        }
    });
    userData.accessToken = responseBody.accessToken;

    return { userData, responseBody };
}

export async function createAndLoginUser(request, overrideUserData = {}) {
    const user = generateUserData(overrideUserData);
    await registerUser(request, user);
    await confirmUserEmail(request, user);
    const { userData } = await loginUser(request, user);
    return userData;
}
