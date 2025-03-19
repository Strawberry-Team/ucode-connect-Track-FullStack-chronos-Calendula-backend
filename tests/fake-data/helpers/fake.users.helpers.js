import { faker } from "@faker-js/faker";
import { expect } from "@playwright/test";
import { expectResponseHeaders, HEADERS } from "../../api/helpers/general.helpers.js";

export const NUMBER_OF_USERS_BY_GENDER = 5;
export const NUMBER_OF_USERS = 10 + 1;
export const USER_ROLE = 'user';
export const USER_PASSWORD = 'Password123!$';
export const USER_COUNTRIES = ['Ukraine', 'Finland', 'Estonia'];
export const USER_PROFILE_PICTURE = 'default.png';

export async function generateUserAccessToken(request, userData) {
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
            country: userData.country,
            role: 'user',
            isVerified: true,
        }
    });

    return responseBody.accessToken;
}

export function generateUser(gender = 'M', profilePictureNumber = 0, isTestUser = false) {
    const user = {};
    const sex = (gender === 'M') ? 'male' : 'female';
    const firstName = isTestUser ? 'Test' : faker.person.firstName(sex);
    const lastName = isTestUser ? 'User' : faker.person.lastName(sex);

    user.fullName = `${firstName} ${lastName}`;
    user.password = USER_PASSWORD;
    user.password_confirm = user.password;
    user.email = isTestUser
        ? `test.user@calendula.ua`
        : faker.internet.email({
            firstName: firstName,
            lastName: lastName,
            provider: 'calendula.ua',
            allowSpecialCharacters: false
        }).replace(/\d+/g, '').toLowerCase();
    user.profilePicture = profilePictureNumber === 0 ? USER_PROFILE_PICTURE : `${sex}_${profilePictureNumber}.png`;
    user.country = faker.helpers.arrayElement(USER_COUNTRIES);
    user.role = USER_ROLE;
    user.isVerified = 1;

    return user;
}
