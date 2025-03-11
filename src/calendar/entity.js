import Entity from "../entity.js";
import UserModel from "../user/model.js";

class CalendarEntity extends Entity {
    /**
     * @param {CalendarModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);

        this._publicFields.push('creator', 'participants');
    }

    _getRelationFields() {
        return {
            creator: async () => await (new UserModel()).getEntityById(this[this._model._creationByRelationFieldName]),
            participants: async () => await this._model.getParticipantsByCalendarId(this.id),
        };
    }
}

export default CalendarEntity;