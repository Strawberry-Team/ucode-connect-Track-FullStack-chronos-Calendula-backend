import UserModel from "../../../src/user/model.js";

const userModel = new UserModel();

export async function createUser() {
    const newUser = userModel.createEntity(
        {
            email: `ann.nichols${Date.now()}@example.com`,
            fullName: 'Ann Nichols',
            country: 'Ukraine',
            password: 'EMPTY',
        }
    );
    await newUser.save();

    return newUser;
}