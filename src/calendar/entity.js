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

    /**
     * @return {boolean} Returns true if the type is 'main', otherwise false.
     */
    isMain() {
        return this.type === 'main';
    }

    _getRelationFields() {
        return {
            creator: async () => await (new UserModel()).getEntityById(this[this._model._creationByRelationFieldName]),
            participants: async () => await this._model.getParticipantsByCalendarId(this.id),
        };
    }
}

export default CalendarEntity;