import { faker } from '@faker-js/faker';
import { test } from '@playwright/test';
import dotenv from "dotenv";
import { expectResponseHeaders, generateHeaders, getEnv } from "../api/helpers/general.helpers.js";
import { NUMBER_OF_SHARED_CALENDARS, CALENDAR_TYPES, generateCalendar, generateSharedCalendarParticipant }
        from "./helpers/fake.calendars.helpers.js";
import { USER_PASSWORD, generateUserAccessToken } from "./helpers/fake.users.helpers.js";
import { generateColor } from "./helpers/general.fake.helpers.js";
import UserModel from "../../src/user/user-model.js";
import CalendarUserModel from "../../src/calendar/user/calendar-user-model.js";

const env = getEnv();
dotenv.config({path: `.env.${env}`, debug: env === 'test'});

test.describe(`Create ${NUMBER_OF_SHARED_CALENDARS} shared calendars with participants`, async () => {
    test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

    let allUserObjects = [];
    let sharedCalendarOwnersIds = [];
    let possibleParticipants = [];

    test(`Get users data`, async ({request}) => {
        allUserObjects = await (new UserModel()).getEntitiesByIds(
            Array.from({length: 11}, (_, i) => i + 2)
        );

        for (const user of allUserObjects) {
            user.password = USER_PASSWORD;
            user.accessToken = await generateUserAccessToken(request, user);
        }
    });

    for (let i = 1; i <= NUMBER_OF_SHARED_CALENDARS; i++) {
        let calendar = {};

        test(`Calendar ${i}`, async ({request}) => {
            /* Select the owner of the calendar */
            const possibleOwners = allUserObjects
                .filter(user => !sharedCalendarOwnersIds.includes(user.id))
                .map(user => user.id);
            const ownerId = faker.helpers.arrayElement(possibleOwners);
            sharedCalendarOwnersIds.push(ownerId);

            /* Generate first level data for the calendar */
            calendar = generateCalendar(ownerId, CALENDAR_TYPES.SHARED);

            /* Generate participants for the calendar */
            possibleParticipants = allUserObjects
                .filter(user => user.id !== ownerId)
                .map(user => user.id);

            for (let j = 1; j <= faker.number.int({min: 2, max: 4}); j++) {
                const participant = generateSharedCalendarParticipant(
                    faker.helpers.arrayElement(possibleParticipants)
                );

                possibleParticipants = possibleParticipants.filter(id => id !== participant.userId);
                calendar.participants.push(participant);
            }

            /* Send request to the API to create a calendar with participants */
            const ownerObject = allUserObjects.find(user => user.id === ownerId);

            const response = await request.post(`calendars`, {
                headers: generateHeaders(ownerObject.accessToken),
                data: {
                    title: calendar.title,
                    description: calendar.description,
                    participants: calendar.participants
                }
            });

            expectResponseHeaders(response, 201);
            const responseBody = await response.json();
            calendar.id = responseBody.data.id;
            calendar.creationAt = responseBody.data.creationAt;

            calendar.participants = calendar.participants.filter(p => p.isConfirmed === false);

            for (const p of calendar.participants) {
                const participant = allUserObjects.find(user => user.id === p.userId);

                /* Update the `isConfirmed` status for calendar participants  */
                await test.step(`Update join status for participant ${participant.id} in Calendar ${calendar.id}`,
                    async () => {
                        const response = await request.patch(`calendars/${calendar.id}/join`, {
                            headers: generateHeaders(participant.accessToken)
                        });

                        expectResponseHeaders(response, 200);
                    });
            }
        });
    }

    test(`Update colour for all user calendars`, async ({request}) => {
        for (const user of allUserObjects) {
            const calendars = await (new CalendarUserModel()).getCalendarsByUserId(user.id);

            for (const calendar of calendars) {
                await test.step(`Update Calendar ${calendar.calendarId} color for User ${calendar.userId}`,
                    async () => {
                    const response = await request.patch(`calendars/${calendar.calendarId}/color`, {
                        headers: generateHeaders(user.accessToken),
                        data: {
                            color: generateColor()
                        }
                    });

                    expectResponseHeaders(response, 200);
                });
            }
        }
    });
});
