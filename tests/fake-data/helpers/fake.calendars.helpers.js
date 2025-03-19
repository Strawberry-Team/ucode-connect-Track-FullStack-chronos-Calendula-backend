import { faker } from "@faker-js/faker";
import { generateDescription, generateTitle } from "./general.fake.helpers.js";

export const NUMBER_OF_SHARED_CALENDARS = 3;
export const COLORS = [
    '#F4511E', '#EF6C00', '#F09300', '#F6BF26',
    '#E4C441', '#C0CA33', '#7CB342', '#33B679',
    '#0B8043', '#009688', '#039BE5', '#4285F4',
    '#3F51B5', '#7986CB', '#B39DDB', '#9E69AF',
    '#8E24AA', '#795548', '#616161', '#A79B8E'
];
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
            color: faker.helpers.arrayElement(COLORS),
            isConfirmed: true
        }
    ];

    return calendar;
}

export function generateSharedCalendarParticipant(participantId, role, color) {
    const participant = {};
    participant.userId = participantId;
    participant.color = COLORS.includes(color)
        ? color
        : faker.helpers.arrayElement(COLORS);
    participant.role = role ?? faker.helpers.arrayElement([PARTICIPANT_ROLES.MEMBER, PARTICIPANT_ROLES.VIEWER]);
    participant.isConfirmed = role === PARTICIPANT_ROLES.OWNER;

    return participant;
}