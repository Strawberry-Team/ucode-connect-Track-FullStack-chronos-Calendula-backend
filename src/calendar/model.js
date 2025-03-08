import Model from "../model.js";
import CalendarEntity from "./entity.js";
import UserModel from "../user/model.js";


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
}

export default CalendarModel;