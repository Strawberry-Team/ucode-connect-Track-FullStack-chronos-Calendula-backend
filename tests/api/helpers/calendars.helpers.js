import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker/locale/en";
import { expectResponseHeaders } from "./general.helpers.js";
import { createAndSaveUserData } from "./users.helpers.js";

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
        participants: [],
        ...base,
        ...overrides
    };
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
                role: 'member'
            },
            {
                userId: expected.participants[2].userId,
                role: 'viewer'
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

export async function generateParticipants(ownerId) {
    return [
        {
            userId: ownerId,
            role: 'owner'
        },
        {
            userId: (await createAndSaveUserData()).id,
            role: 'member'
        },
        {
            userId: (await createAndSaveUserData()).id,
            role: 'viewer'
        },
    ];
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