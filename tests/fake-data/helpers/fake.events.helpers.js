import { faker } from "@faker-js/faker";
import { generateDescription, generateTitle } from "./general.fake.helpers.js";

/* Must be 7 days from Monday to Sunday inclusive */
export const DEMO_DATES = {
    year: 2025,
    monthIndex: 3,
    date: {
        start: 7,
        end: 13
    }
};
export const EVENT_ATTENDANCE_STATUSES = ['yes', 'no', 'maybe'];
export const COLORS = [
    '#F4511E', '#EF6C00', '#F09300', '#F6BF26',
    '#E4C441', '#C0CA33', '#7CB342', '#33B679',
    '#0B8043', '#009688', '#039BE5', '#4285F4',
    '#3F51B5', '#7986CB', '#B39DDB', '#9E69AF',
    '#8E24AA', '#795548', '#616161', '#A79B8E'
];
export const EVENT_CATEGORIES = Object.freeze({
    WORK: 'work',
    HOME: 'home',
    HOBBY: 'hobby'
});
export const EVENT_TYPES = Object.freeze({
    MEETING: 'meeting',
    REMINDER: 'reminder',
    TASK: 'task'
});
export const TIME_INTERVAL = Object.freeze({
    WORK: 'work',
    WORK_DAILY: 'work daily',
    EVENING: 'evening',
    WEEKEND: 'weekend'
});

export function generateWorkTime() {
    return {
        startAt: new Date(
            DEMO_DATES.year,
            DEMO_DATES.monthIndex,
            faker.number.int({min: DEMO_DATES.date.start, max: DEMO_DATES.date.end - 2}),
            faker.number.int({min: 8, max: 17}),
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: faker.number.int({min: 30, max: 60, multipleOf: 30})
    }
}

export function generateWorkDailyTime(day, hours) {
    return {
        startAt: new Date(
            DEMO_DATES.year,
            DEMO_DATES.monthIndex,
            day ?? DEMO_DATES.date.start,
            hours ?? 9,
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: 30
    }
}

export function generateEveningTime() {
    return {
        startAt: new Date(
            DEMO_DATES.year,
            DEMO_DATES.monthIndex,
            faker.number.int({min: DEMO_DATES.date.start, max: DEMO_DATES.date.end - 2}),
            faker.number.int({min: 17, max: 20}),
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: faker.number.int({min: 30, max: 60, multipleOf: 30})
    };
}

export function generateWeekendTime() {
    return {
        startAt: new Date(
            DEMO_DATES.year,
            DEMO_DATES.monthIndex,
            faker.number.int({min: DEMO_DATES.date.end - 1, max: DEMO_DATES.date.end}),
            faker.number.int({min: 10, max: 17}),
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: faker.number.int({min: 60, max: 240, multipleOf: 30})
    };
}

export function generateEventDateTime(time = {}) {
    const eventTime = {
        [TIME_INTERVAL.WORK]: generateWorkTime(),
        [TIME_INTERVAL.WORK_DAILY]: generateWorkDailyTime(time.day, time.hours),
        [TIME_INTERVAL.EVENING]: generateEveningTime(),
        [TIME_INTERVAL.WEEKEND]: generateWeekendTime()
    }[time.interval] || generateWorkTime();

    const startAt = eventTime.startAt
        .toISOString().replace("T", " ").split(".")[0];
    const endAt = new Date(eventTime.startAt.getTime() + eventTime.duration * 60 * 1000)
        .toISOString().replace("T", " ").split(".")[0];

    return {
        startAt,
        endAt,
    };
}

export function generateEvent(creationByUserId, calendarId, time = {}, category, type) {
    const event = {};
    const dateTime = generateEventDateTime(time);
    event.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUserIds);
    event.title = generateTitle();
    event.description = generateDescription();
    event.category = category ?? faker.helpers.arrayElement(
        [EVENT_CATEGORIES.WORK, EVENT_CATEGORIES.HOME, EVENT_CATEGORIES.HOBBY]);
    event.type = type ?? faker.helpers.arrayElement(
        [EVENT_TYPES.MEETING, EVENT_TYPES.REMINDER, EVENT_TYPES.TASK]);
    event.startAt = dateTime.startAt;
    event.endAt = dateTime.endAt;
    event.calendarId = calendarId;
    event.participants = [
        {
            userId: creationByUserId
        }
    ];

    return event;
}

export function generateEventParticipant(participantId, color) {
    const participant = {};
    participant.userId = participantId;
    participant.color = COLORS.includes(color)
        ? color
        : faker.helpers.arrayElement(COLORS);
    participant.attendanceStatus = null;

    return participant;
}