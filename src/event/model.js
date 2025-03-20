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
}

export default EventModel;