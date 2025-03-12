import Model from "../model.js";
import CalendarEntity from "./entity.js";
import UserModel from "../user/model.js";
import CalendarUserModel from "./user/model.js";
import Where from "../sql/where.js";


class CalendarModel extends Model {
    constructor() {
        super(
            'calendars',
            [
                'id',
                'title',
                'description',
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

        const calendarUserModel = new CalendarUserModel();
        const userCalendars = await calendarUserModel.getCalendarsByUserId(userId);
        if (userCalendars.find(calendar => calendar.isMain)) {
            throw new Error('User already has a main calendar');
        }

        const calendar = this.createEntity({
            title: user.fullName,
            description: user.fullName + '\'s main calendar',
            creationByUserId: user.id
        });

        await calendar.save();

        const calendarUser = calendarUserModel.createEntity({
            calendarId: calendar.id,
            userId: user.id,
            role: 'owner',
            isMain: true,
            isConfirmed: true
        });

        await calendarUser.save();
    }
}

export default CalendarModel;