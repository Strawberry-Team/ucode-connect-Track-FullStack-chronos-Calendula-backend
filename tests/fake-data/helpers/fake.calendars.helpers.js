import { faker } from "@faker-js/faker";
import { generateDescription, generateTitle } from "./general.fake.helpers.js";

export const NUMBER_OF_SHARED_CALENDARS = 3;

export const CALENDAR_TYPES = Object.freeze({
    MAIN: 'main',
    SHARED: 'shared',
    HOLIDAYS: 'holidays'
});
export const PARTICIPANT_ROLES = Object.freeze({
    OWNER: 'owner',
    MEMBER: 'member',
    VIEWER: 'viewer'
});

export function generateCalendar(creationByUserId, calendarType) {
    const calendar = {};
    calendar.title = generateTitle();
    calendar.description = generateDescription();
    calendar.creationByUserId = creationByUserId;
    calendar.type = calendarType ?? CALENDAR_TYPES.SHARED;
    calendar.participants = [
        {
            userId: creationByUserId,
            role: PARTICIPANT_ROLES.OWNER,
            isConfirmed: true
        }
    ];

    return calendar;
}

export function generateSharedCalendarParticipant(participantId, role) {
    const participant = {};
    participant.userId = participantId;
    participant.role = role ?? faker.helpers.arrayElement([PARTICIPANT_ROLES.MEMBER, PARTICIPANT_ROLES.VIEWER]);
    participant.isConfirmed = role === PARTICIPANT_ROLES.OWNER;

    return participant;
}

