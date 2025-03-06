import Model from "../model.js";
import UserEntity from "./entity.js";
import Where from "../sql/where.js";
import * as argon2 from "argon2";

class UserModel extends Model {
    constructor() {
        super(
            'users',
            [
                'id',
                'fullName',
                'password',
                'email',
                'profilePicture',
                'country',
                'role',
                'isVerified',
                'creationAt'
            ],
            UserEntity
        );
    }

    /**
     * @param {string} email
     * @return {Promise<UserEntity>}
     */
    async getByEmail(email) {
        return this.getEntities([], [ new Where('email', '=', email) ], 'id', 1);
    }

    /**
     * @param {string} password
     * @param {string} passwordHash
     * @return {Promise<boolean>}
     */
    async isValidPassword(password, passwordHash) {
        return await argon2.verify(passwordHash, password);
    }

    /**
     * @param {string} password
     * @return {Promise<String>}
     */
    async createPassword(password) {
        return await argon2.hash(password, { salt: Buffer.from(process.env.APP_SECRET) });
    }
}
export default UserModel;