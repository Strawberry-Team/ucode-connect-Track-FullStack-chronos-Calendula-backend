import Model from "../model.js";
import CalendarEntity from "./calendar-entity.js";
import UserModel from "../user/user-model.js";
import CalendarUserModel from "./user/calendar-user-model.js";
import Where from "../db/sql/where.js";
import CalendarEventModel from "./event/calendar-event-model.js";
import EventModel from "../event/event-model.js";


class CalendarModel extends Model {
    constructor() {
        super(
            'calendars',
            [
                'id',
                'title',
                'description',
                'type',
                'creationByUserId',
                'creationAt'
            ],
            CalendarEntity
        );
    }

    /**
     * @inheritDoc
     * @return {Promise<CalendarEntity>}
     */
    async getEntityById(id, withRelations = true) {
        return super.getEntityById(id, withRelations);
    }

    async getCreatorById(userId) {
        return (new UserModel()).getEntityById(userId);
    }

    async getParticipantsByCalendarId(calendarId) {
        return (new CalendarUserModel()).getParticipantsByCalendarId(calendarId);
    }

    /**
     *
     * @param {string} type
     * @returns {Promise<Entity[]|Entity>}
     */
    async getCalendarsByType(type) {
        return await super.getEntities([], [
            new Where('type', '=', type)
        ]);
    }

    /**
     * @param {number} userId
     * @return {Promise<CalendarEntity>}
     */
    async createMainCalendar(userId) {
        const user = await (new UserModel()).getEntityById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        let calendar = await this.getMainCalendar(userId);

        if (calendar) {
            throw new Error('User already has a main calendar');
        }

        calendar = this.createEntity({
            title: '📌 ' + user.fullName,
            description: user.fullName + '\'s main calendar',
            type: 'main',
            creationByUserId: user.id
        });

        await calendar.save();

        const calendarUser = (new CalendarUserModel()).createEntity({
            calendarId: calendar.id,
            userId: user.id,
            role: 'owner',
            isConfirmed: true
        });

        await calendarUser.save();

        return calendar;
    }

    /**
     * @param userId
     * @return {Promise<CalendarEntity|null>}
     */
    async getMainCalendar(userId) {
        return this.getEntities([], [
                new Where(this._creationByRelationFieldName, '=', userId),
                new Where('type', '=', 'main')
            ],
            'id',
            1
        );
    }

    /**
     * @return {Promise<CalendarEntity|null>}
     */
    async getBirthdayCalendar() {
        return this.getEntities([], [
                new Where('type', '=', 'birthdays')
            ],
            'id',
            1
        );
    }

    async getEventsByCalendarId(calendarId) {
        const relatedEvents = await (new CalendarEventModel()).getEntities([], [
            new Where('calendarId', '=', calendarId)
        ]);
        if (!relatedEvents.length) {
            return [];
        }

        return await (new EventModel()).getEntities([], [
            new Where('id', 'IN', relatedEvents.map(event => event.eventId))
        ]);
    }

    /**
     * @param {number} userId
     * @return {Promise<void>}
     */
    async addUserToHolidaysCalendar(userId) {
        const user = await (new UserModel()).getEntityById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const holidaysCalendars = await this.getCalendarsByType('holidays');

        const calendar = {
            'Ukraine': holidaysCalendars.find(calendar => calendar.title.includes('Ukraine')),
            'Finland': holidaysCalendars.find(calendar => calendar.title.includes('Finland')),
            'Estonia': holidaysCalendars.find(calendar => calendar.title.includes('Estonia'))
        }[user.country];

        if (!calendar) {
            throw new Error('Holidays Calendar not found');
        }

        await (new CalendarUserModel()).addParticipant(
            calendar.id,
            userId,
            'viewer',
            true
        )
    }

    /**
     * @param {number} userId
     * @return {Promise<void>}
     */
    async addUserToBirthdayCalendar(userId) {
        const user = await (new UserModel()).getEntityById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const calendar = await this.getBirthdayCalendar();

        if (!calendar) {
            throw new Error('Birthday calendar not found');
        }

        await (new CalendarUserModel()).addParticipant(
            calendar.id,
            userId,
            'viewer',
            true
        )
    }
}

export default CalendarModel;