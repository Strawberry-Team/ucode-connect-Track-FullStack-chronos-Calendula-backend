import Entity from "../entity.js";

class UserEntity extends Entity {
    /**
     * @param {UserModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);
    }

    toJSON(allowedAllFields = false) {
        const result = super.toJSON(allowedAllFields);
        delete result?.password;
        return result;
    }
}

export default UserEntity;