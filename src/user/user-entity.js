import Entity from "../entity.js";

class UserEntity extends Entity {
    /**
     * @param {UserModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);
    }

    toJSON() {
        const result = super.toJSON();
        delete result?.password;
        delete result?.confirmToken;
        delete result?.passwordResetToken;
        return result;
    }
}

export default UserEntity;