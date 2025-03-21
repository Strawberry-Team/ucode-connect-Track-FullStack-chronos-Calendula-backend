import Entity from "../../entity.js";
import UserModel from "../../user/user-model.js";

class CalendarUserEntity extends Entity {
    /**
     * @param {CalendarUserModel} model
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

export default CalendarUserEntity;