import Entity from "../../entity.js";
import UserModel from "../../user/model.js";

class CalendarEventEntity extends Entity {
    /**
     * @param {CalendarEventModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);

        this._publicFields.push('user');
    }

    _getRelationFields() {
        return {
            user: async () => await (new UserModel()).getEntityById(this.userId),
        };
    }
}

export default CalendarEventEntity;