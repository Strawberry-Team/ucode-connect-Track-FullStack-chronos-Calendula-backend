import { expect } from '@playwright/test';
import { faker } from "@faker-js/faker/locale/en";
import { formatDate } from "date-fns";
import { HEADERS, expectResponseHeaders } from "./general.helpers.js";
import UserModel from "../../../src/user/user-model.js";

const userModel = new UserModel();

export function generateEmail(firstName, lastName) {
    return faker.internet.email({
        firstName: firstName,
        lastName: lastName,
        provider: 'calendula.ua',
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
    return faker.helpers.arrayElement(['Ukraine', 'Finland', 'Estonia']);
}

export function generateBirthday(){
    const today = new Date();
    const birthday = faker.date.between({
        from: new Date(today).setFullYear(today.getFullYear() - 50),
        to: new Date(today).setFullYear(today.getFullYear() - 18)
    });

    return formatDate(birthday, 'yyyy-MM-dd');
}

export function generatePassword() {
    return 'Password123!$';
}

export function generateProfilePicture() {
    return 'default.png';
}

export function generateUserData(base = {}, overrides = {}) {
    const name = generateFullName();
    return {
        id: undefined,
        email: generateEmail(name.firstName, name.lastName),
        fullName: name.fullName,
        birthday: generateBirthday(),
        country: generateCountry(),
        password: generatePassword(),
        password_confirm: generatePassword(),
        confirmToken: undefined,
        accessToken: undefined,
        ...base,
        ...overrides
    };
}

export async function createAndSaveUserData() {
    const data = generateUserData({ isVerified: true });
    data.password = await userModel.createPassword(data.password);

    const user = await userModel.createEntity(data);
    await user.save();

    return user;
}

export async function registerUser(request, userData) {
    const response = await request.post(`auth/register`, {
        headers: HEADERS,
        data: {
            email: userData.email,
            fullName: userData.fullName,
            birthday: userData.birthday,
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
            birthday: userData.birthday,
            country: userData.country,
        }
    });

    const user = await userModel.getEntityById(responseBody.data.id);
    expect(user).toMatchObject({
        id: expect.any(Number),
        fullName: userData.fullName,
        email: userData.email,
        birthday: userData.birthday,
        country: userData.country,
        confirmToken: expect.any(String)
    });
    userData.id = user.id;
    userData.confirmToken = user.confirmToken;

    return { userData, responseBody };
}

export async function confirmUserEmail(request, userData) {
    const response = await request.get(`auth/confirm-email/${userData.confirmToken}`, {
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
        birthday: userData.birthday,
        country: userData.country,
        isVerified: true
    });
    user.password = userData.password;
    Object.assign(userData, user);

    return { userData, responseBody };
}

export async function loginUser(request, userData) {
    const response = await request.post(`auth/login`, {
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
            birthday: userData.birthday,
            country: userData.country,
            role: 'user',
            isVerified: true,
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

export function expectUserDataToMatch(expected, actual) {
    expect(actual).toMatchObject({
        id: expected.id ?? expect.any(Number),
        fullName: expected.fullName,
        email: expected.email,
        profilePicture: expected.profilePicture,
        birthday: expected.birthday,
        country: expected.country,
        role: expected.role,
        isVerified: expected.isVerified,
        creationAt: expected.creationAt ?? expect.any(String)
    });
}

export async function expectUserResponse(response, expectedData, statusCode = 200) {
    expectResponseHeaders(response, statusCode);
    const responseBody = await response.json();
    expectUserDataToMatch(expectedData, responseBody.data);
    return responseBody;
}

export async function expectAllUsersResponse(response, expectedData, statusCode = 200) {
    expectResponseHeaders(response, statusCode);

    const responseBody = await response.json();
    expect(Array.isArray(responseBody.data)).toBe(true);
    expect(responseBody.data.length).toBeGreaterThan(0);

    for (const user of responseBody.data) {
        expect(user.role).toBe('user');
        expect(user.isVerified).toBe(true);
    }

    const firstUser = responseBody.data.filter(item => item.email === expectedData.email)[0];
    const expectedUser = {};
    Object.assign(expectedUser, expectedData);
    expectedUser.id = undefined;
    expectedUser.createdAt = undefined;
    expectUserDataToMatch(expectedUser, firstUser);

    return responseBody;
}

export async function cleanUpUser(userId) {
    const user = await userModel.getEntityById(userId);
    await user.delete();
}
