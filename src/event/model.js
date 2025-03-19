import Model from "../model.js";
import EventEntity from "./entity.js";
import UserModel from "../user/model.js";
import CalendarUserModel from "../calendar/user/model.js";
import Where from "../sql/where.js";
import EventUserModel from "./user/model.js";

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
}

export default EventModel;