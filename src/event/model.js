import Model from "../model.js";
import EventEntity from "./entity.js";
import UserModel from "../user/model.js";
import Where from "../sql/where.js";
import EventUserModel from "./user/model.js";
import CalendarModel from "../calendar/model.js";
import CalendarEventModel from "../calendar/event/model.js";
import { addYears, differenceInCalendarDays, isBefore, parse, set } from "date-fns";

const END_OF_CALENDARS = new Date(2026, 11, 31, 23, 59, 59, 0);

class EventModel extends Model {
    constructor() {
        super(
            'events',
            [
                'id',
                'creationByUserId',
                'calendarId',
                'title',
                'description',
                'category',
                'type',
                'notifyBeforeMinutes',
                'startAt',
                'endAt',
                'creationAt'
            ],
            EventEntity
        );
    }

    /**
     * @inheritDoc
     * @return {Promise<CalendarEntity>}
     */
    async getEntityById(id, withRelations = true) {
        return super.getEntityById(id, withRelations);
    }

    async getParticipantsByEventId(eventId) {
        const eventUserModel = new EventUserModel();
        return await eventUserModel.getEntities([], [
            new Where('eventId', '=', eventId)
        ]);
    }

    async syncEventParticipants(eventId, participants) {
        const eventUserModel = new EventUserModel();
        await eventUserModel.syncEventParticipants(eventId, participants);
    }

    /**
     * @return {Promise<EventEntity[]>}
     */
    async getEventsToNotify() {
        const query = `
            SELECT
                id,
                title,
                startAt,
                DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+02:00'), '%Y-%m-%d %H:%i:00') AS nowDateTime,
                TIMESTAMPDIFF(MINUTE, DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+02:00'), '%Y-%m-%d %H:%i:00'), startAt) AS diff,
                notifyBeforeMinutes
            FROM
                \`${this._table}\`
            WHERE
                TIMESTAMPDIFF(MINUTE, DATE_FORMAT(CONVERT_TZ(NOW(), '+00:00', '+02:00'), '%Y-%m-%d %H:%i:00'), startAt) = notifyBeforeMinutes
        `;

        const [rawData] = await this._dbConnection.query(query);

        const ids = rawData.map(item => {
            return item.id;
        });

        if (ids.length === 0) {
            return [];
        }

        return this.getEntities([], [
            new Where('id', 'IN', ids)
        ]);
    }

    /**
     * @param {number} userId
     * @return {Promise<EventEntity[]>}
     */
    async createBirthdayEvents(userId) {
        const user = await (new UserModel()).getEntityById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const calendar = await (new CalendarModel()).getBirthdayCalendar();

        if (!calendar) {
            throw new Error('No birthday calendar available');
        }

        const startOfHire = parse(user.creationAt, 'yyyy-MM-dd HH:mm:ss', new Date());
        let hireYear = startOfHire.getFullYear();
        const birthDate = parse(user.birthday, 'yyyy-MM-dd', new Date());
        let birthdayCurrentYear = set(birthDate, { year: hireYear });

        const events = [];
        let currentYear = hireYear;

        if (differenceInCalendarDays(startOfHire, birthdayCurrentYear) > 0) {
            currentYear += 1;
            birthdayCurrentYear = addYears(birthdayCurrentYear, 1);
        }

        while (
            isBefore(birthdayCurrentYear, END_OF_CALENDARS)
            || birthdayCurrentYear.getFullYear() === END_OF_CALENDARS.getFullYear()
        ) {
            const date = `${currentYear}-${birthDate.getMonth() + 1}-${birthDate.getDate()}`;

            const event = this.createEntity({
                creationByUserId: user.id,
                title: user.fullName,
                description: user.fullName + '\'s birthday',
                category: 'work',
                type: 'reminder',
                startAt: `${date} 00:00:00`,
                endAt: `${date} 23:59:59`,
                calendarId: calendar.id,
                notifyBeforeMinutes: 1440
            });
            await event.save();

            await this.syncEventParticipants(event.id, [{ userId: user.id }]);

            events.push(event);

            currentYear += 1;
            birthdayCurrentYear = addYears(birthdayCurrentYear, 1);
        }

        return events;
    }
}

export default EventModel;