import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker/locale/en";
import { expectResponseHeaders } from "./general.helpers.js";
import { generateEmail, generateFullName, generateCountry, generatePassword } from "./user.helpers.js";
import UserModel from "../../../src/user/model.js";

const userModel = new UserModel();

export function generateCalendarTitle() {
    return faker.lorem.sentence({ min: 1, max: 5 });
}

export function generateCalendarDescription() {
    return faker.lorem.paragraph({ min: 1, max: 4 });
}

export function generateCalendarData(base = {}, overrides = {}) {
    return {
        id: undefined,
        title: generateCalendarTitle(),
        description: generateCalendarDescription(),
        creationByUserId: undefined,
        creationAt: undefined,
        ...base,
        ...overrides
    };
}

export async function createUser() {
    const newUser = userModel.createEntity(
        {
            email: generateEmail(),
            fullName: generateFullName(),
            country: generateCountry(),
            password: generatePassword(),
        }
    );

    await newUser.save();

    return newUser;
}

export function expectCalendarDataToMatch(expected, actual) {
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

export function expectParticipantsDataToMatch(expected, actual) {
    expect(actual).toMatchObject({
        participants: [
            {
                userId: expected.participants[0].userId,
                role: 'owner'
            }
        ]
    });
}

export async function expectCalendarResponse(response, expectedData, statusCode = 200) {
    expectResponseHeaders(response, statusCode);
    const responseBody = await response.json();
    expectCalendarDataToMatch(expectedData, responseBody.data);
    return responseBody;
}
