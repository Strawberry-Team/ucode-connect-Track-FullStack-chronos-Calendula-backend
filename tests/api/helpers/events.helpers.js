import { faker } from "@faker-js/faker/locale/en";
import { expect } from "@playwright/test";
import { expectResponseHeaders } from "./general.helpers.js";
import { createAndSaveUserData } from "./users.helpers.js";
import CalendarModel from "../../../src/calendar/model.js";

export function generateEventTitle() {
    return faker.lorem.sentence({ min: 1, max: 5 });
}

export function generateEventDescription() {
    return faker.lorem.paragraph({ min: 1, max: 4 })
}

export function generateCategory() {
    return faker.helpers.arrayElement(['work', 'home', 'hobby']);
}

export function generateType() {
    return faker.helpers.arrayElement(['meeting', 'reminder', 'task']);
}

export function generateDateTime() {
    const fakerDateTime = faker.date.between({
        from: '2020-04-07T00:00:00.000Z',
        to: '2025-04-14T00:00:00.000Z'
    });

    const startAt = fakerDateTime.toISOString().replace("T", " ").split(".")[0];

    const endAt = new Date(fakerDateTime.setHours(fakerDateTime.getHours() + 1))
        .toISOString().replace("T", " ").split(".")[0];

    return {
        startAt,
        endAt,
    };
}

export function generateEventData(base = {}, overrides = {}) {
    const dateTime = generateDateTime();
    return {
        id: undefined,
        creationByUserId: undefined,
        title: generateEventTitle(),
        description: generateEventDescription(),
        category: generateCategory(),
        type: generateType(),
        startAt: dateTime.startAt,
        endAt: dateTime.endAt,
        creationAt: undefined,
        participants: [],
        ...base,
        ...overrides
    };
}

export function expectEventDataToMatch(expected, actual) {
    expect(actual).toMatchObject({
        id: expected.id ?? expect.any(Number),
        creationByUserId: expected.creationByUserId ?? expect.any(Number),
        title: expected.title,
        description: expected.description,
        category: expected.category,
        type: expected.type,
        startAt: expected.startAt,
        endAt: expected.endAt,
        creationAt: expect.any(String)
    });
}

export async function expectEventResponse(response, expectedData, statusCode = 200) {
    expectResponseHeaders(response, statusCode);
    const responseBody = await response.json();
    expectEventDataToMatch(expectedData, responseBody.data);
    return responseBody;
}

export async function getMainCalendarByUserId(userId) {
    return (new CalendarModel()).getMainCalendar(userId);
}

export async function generateParticipants(ownerId) {
    return [
        {
            userId: ownerId
        },
        {
            userId: (await createAndSaveUserData()).id
        },
        {
            userId: (await createAndSaveUserData()).id
        },
    ];
}

export function expectParticipantsDataToMatch(expected, actual) {
    expect(actual).toMatchObject({
        participants: [
            {
                userId: expected.participants[0].userId
            }
        ]
    });
}