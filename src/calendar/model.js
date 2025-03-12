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
}

export default CalendarModel;