import Entity from "../entity.js";
import UserModel from "../user/model.js";
import CalendarModel from "../calendar/model.js";

class EventEntity extends Entity {
    /**
     * @param {EventModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);

        this._publicFields.push('creator', 'participants', 'calendar');
    }

    _getRelationFields() {
        return {
            creator: async () => await (new UserModel()).getEntityById(this[this._model._creationByRelationFieldName]),
            participants: async () => await this.getParticipants(),
            calendar: async () => await this._getCalendar(),
        };
    }

    async _getCalendar() {
        return (new CalendarModel()).getEntityById(this.calendarId, false);
    }

    async getParticipants() {
        return this._model.getParticipantsByEventId(this.id)
    }
}

export default EventEntity;