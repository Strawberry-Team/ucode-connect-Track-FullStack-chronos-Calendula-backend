import { faker } from "@faker-js/faker";
import { format } from 'date-fns';
import { generateDescription, generateTitle } from "./general.fake.helpers.js";

/* Must be the first day of week - Monday */
const DEMO_START_DATE = new Date(2025, 2, 24);
/* Must be 7 days from Monday to Sunday inclusive */
export const DEMO_DATES = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(DEMO_START_DATE);
    date.setDate(DEMO_START_DATE.getDate() + i);
    return date;
});
export const EVENT_ATTENDANCE_STATUSES = ['yes', 'no', 'maybe'];
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
    const randomDay = faker.helpers.arrayElement(DEMO_DATES.slice(0, 5));

    return {
        startAt: new Date(
            randomDay.getFullYear(),
            randomDay.getMonth(),
            randomDay.getDate(),
            faker.number.int({min: 8, max: 17}),
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: faker.number.int({min: 30, max: 60, multipleOf: 30})
    }
}

export function generateWorkDailyTime(weekday, hours) {
    const targetDay = weekday >= 0 && weekday <= 6
        ? DEMO_DATES[weekday]
        : DEMO_DATES[0];

    return {
        startAt: new Date(
            targetDay.getFullYear(),
            targetDay.getMonth(),
            targetDay.getDate(),
            hours ?? 9,
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: 30
    }
}

export function generateEveningTime() {
    const randomDay = faker.helpers.arrayElement(DEMO_DATES.slice(0, 5));

    return {
        startAt: new Date(
            randomDay.getFullYear(),
            randomDay.getMonth(),
            randomDay.getDate(),
            faker.number.int({min: 17, max: 20}),
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: faker.number.int({min: 30, max: 60, multipleOf: 30})
    };
}

export function generateWeekendTime() {
    const randomDay = faker.helpers.arrayElement(DEMO_DATES.slice(5, 7));

    return {
        startAt: new Date(
            randomDay.getFullYear(),
            randomDay.getMonth(),
            randomDay.getDate(),
            faker.number.int({min: 10, max: 17}),
            faker.number.int({min: 0, max: 30, multipleOf: 30}),
            0,
            0
        ),
        duration: faker.number.int({min: 60, max: 240, multipleOf: 30})
    };
}

export function generateEventDateTime(time = {}, eventType) {
    const eventTime = {
        [TIME_INTERVAL.WORK]: generateWorkTime(),
        [TIME_INTERVAL.WORK_DAILY]: generateWorkDailyTime(time.weekday, time.hours),
        [TIME_INTERVAL.EVENING]: generateEveningTime(),
        [TIME_INTERVAL.WEEKEND]: generateWeekendTime()
    }[time.interval] || generateWorkTime();

    let startAt = format(eventTime.startAt,
        "yyyy-MM-dd HH:mm:ss"
    );
    let endAt = format(new Date(eventTime.startAt.getTime() + eventTime.duration * 60 * 1000),
        "yyyy-MM-dd HH:mm:ss"
    );

    if (eventType === EVENT_TYPES.REMINDER) {
        startAt = startAt.split(' ')[0] + ' 00:00:00';
        endAt = endAt.split(' ')[0] + ' 23:59:59';
    }

    return {
        startAt,
        endAt,
    };
}

export function generateEvent(creationByUserId, calendarId, time = {}, category, type) {
    const event = {};

    event.creationByUserId = creationByUserId ?? faker.helpers.arrayElement(allUserIds);
    event.title = generateTitle();
    event.description = generateDescription();
    event.category = category ?? faker.helpers.arrayElement(
        [EVENT_CATEGORIES.WORK, EVENT_CATEGORIES.HOME, EVENT_CATEGORIES.HOBBY]);

    if (type) {
        event.type = type;
    } else {
        event.type = faker.helpers.weightedArrayElement([
            { value: EVENT_TYPES.MEETING, weight: 60 },
            { value: EVENT_TYPES.TASK, weight: 30 },
            { value: EVENT_TYPES.REMINDER, weight: 10 }
        ]);
    }

    const dateTime = generateEventDateTime(time, event.type);

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

export function generateEventParticipant(participantId) {
    const participant = {};
    participant.userId = participantId;
    participant.attendanceStatus = null;

    return participant;
}