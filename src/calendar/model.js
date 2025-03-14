import Model from "../model.js";
import CalendarEntity from "./entity.js";
import UserModel from "../user/model.js";
import CalendarUserModel from "./user/model.js";
import Where from "../sql/where.js";
import CalendarEventModel from "./event/model.js";
import EventModel from "../event/model.js";


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

    async getCreatorById(userId) {
        return (new UserModel()).getEntityById(userId);
    }

    async getParticipantsByCalendarId(calendarId) {
        const calendarUserModel = new CalendarUserModel();
        return await calendarUserModel.getEntities([], [
            new Where('calendarId', '=', calendarId)
        ]);
    }

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
            title: user.fullName,
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
    }

    async getMainCalendar(userId) {
        return await this.getEntities([], [
                new Where(this._creationByRelationFieldName, '=', userId),
                new Where('type', '=', 'main')
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
            new Where('id', 'in', relatedEvents.map(event => event.eventId))
        ]);
    }
}

export default CalendarModel;