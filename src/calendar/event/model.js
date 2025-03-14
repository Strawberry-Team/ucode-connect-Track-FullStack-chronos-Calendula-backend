import Model from "../../model.js";
import CalendarEventEntity from "./entity.js";

class CalendarEventModel extends Model {
    constructor() {
        super(
            'calendars_events',
            [
                'id',
                'calendarId',
                'eventId',
                'creationAt'
            ],
            CalendarEventEntity
        );
    }

    async create(calendarId, eventId) {
        const entity = this.createEntity({
            calendarId: calendarId,
            eventId: eventId
        });

        await entity.save();
    }
}

export default CalendarEventModel;