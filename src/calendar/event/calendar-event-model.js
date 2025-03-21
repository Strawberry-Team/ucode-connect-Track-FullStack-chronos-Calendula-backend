import Model from "../../model.js";
import CalendarEventEntity from "./calendar-event-entity.js";
import Where from "../../db/sql/where.js";

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

    async createRelation(calendarId, eventId) {
        const relationEntity = await this.getRelationEntity(eventId, calendarId);
        if (relationEntity) {
            return;
        }

        const entity = this.createEntity({
            calendarId: calendarId,
            eventId: eventId
        });

        await entity.save();
    }

    async deleteRelation(calendarId, eventId) {
        const relationEntity = await this.getRelationEntity(eventId, calendarId);
        if (!relationEntity) {
            return;
        }

        await relationEntity.delete();
    }

    async getRelationEntity(eventId, calendarId) {
        return this.getEntities([], [
                new Where('eventId', '=', eventId),
                new Where('calendarId', '=', calendarId),
            ],
            'id',
            1
        );
    }
}

export default CalendarEventModel;