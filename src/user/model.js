import Model from "../model.js";
import UserEntity from "./entity.js";
import Where from "../sql/where.js";
import * as argon2 from "argon2";
import jwt from 'jsonwebtoken';

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
                'confirmToken',
                'passwordResetToken',
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
     * @param {[number]} userIds
     * @return {Promise<UserEntity>}
     */
    async getEntitiesByIds(userIds) {
        return this.getEntities([], [ new Where('id', 'IN', userIds) ], 'id');
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

    /**
     * @param {Object} data
     * @param {string} expiresIn
     * @return {Promise<string>}
     */
    async createToken(data, expiresIn = '7d') {
        return jwt.sign(
            data,
            process.env.APP_SECRET,
            { expiresIn }
        );
    }
}
export default UserModel;