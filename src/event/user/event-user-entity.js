import Entity from "../../entity.js";
import UserModel from "../../user/user-model.js";
import Where from "../../db/sql/where.js";

class EventUserEntity extends Entity {
    /**
     * @param {EventUserModel} model
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

export default EventUserEntity;
