import Entity from "../entity.js";
import UserModel from "../user/user-model.js";
import CalendarEventModel from "./event/calendar-event-model.js";

class CalendarEntity extends Entity {
    /**
     * @param {CalendarModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);

        this._publicFields.push('creator', 'participants', 'events');
    }

    /**
     * @return {boolean} Returns true if the type is 'main', otherwise false.
     */
    isMain() {
        return this.type === 'main';
    }

    _getRelationFields() {
        return {
            creator: async () => await (new UserModel()).getEntityById(this[this._model._creationByRelationFieldName]),
            participants: async () => await this.getParticipants(),
            events: async () => await this._model.getEventsByCalendarId(this.id)
        };
    }

    async attachEvent(eventId) {
        await (new CalendarEventModel()).createRelation(this.id, eventId);
    }

    async detachEvent(eventId) {
        await (new CalendarEventModel()).deleteRelation(this.id, eventId);
    }

    async getParticipants() {
        return this._model.getParticipantsByCalendarId(this.id);
    }

    /**
     * Formats the calendar creator's full name into an emoji string.
     *
     * @return {string} A formatted string representing the calendar creator's full name.
     */
    getFormattedCreatorFullName() {
        return `${this.creator.fullName}`;
    }
}

export default CalendarEntity;