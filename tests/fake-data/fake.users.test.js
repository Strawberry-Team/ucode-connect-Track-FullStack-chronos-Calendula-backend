import {test} from '@playwright/test';
import UserModel from "../../src/user/user-model.js";
import dotenv from "dotenv";
import {confirmUserEmail, loginUser, registerUser} from "../api/helpers/users.helpers.js";
import {generateUser, NUMBER_OF_USERS, NUMBER_OF_USERS_BY_GENDER} from "./helpers/fake.users.helpers.js";

dotenv.config({path: '.env.test', debug: true});

test.describe(`Create and login ${NUMBER_OF_USERS} users (${
    NUMBER_OF_USERS_BY_GENDER} female, ${NUMBER_OF_USERS_BY_GENDER} male, 1 test)`, () => {
    test.describe.configure({mode: 'serial', retries: 0, timeout: 10 * 60 * 1000});

    test("Create Test User", async ({request}) => {
        /* Generate the Test User data */
        const testUser = generateUser('M', 0, true);

        /* Send a request to the API for registration, mail confirmation and user login */
        await registerUser(request, testUser);
        await confirmUserEmail(request, testUser);
        let {userData} = await loginUser(request, testUser);
        testUser.accessToken = userData.accessToken;
        testUser.id = userData.id;

        /* Update user profile picture */
        const entity = await (new UserModel()).getEntityById(testUser.id);
        testUser.creationAt = entity.creationAt;
        entity.profilePicture = testUser.profilePicture;
        await entity.save();
    });

    for (let i = 0; i < NUMBER_OF_USERS_BY_GENDER; i++) {
        const sex = ['F', 'M'];

        for (let j = 0; j < sex.length; j++) {
            test(`User ${i * sex.length + j + 2}`, async ({request}) => {
                /* Generate the user data */
                const user = generateUser(sex[j], i + 1);
                const createdUser = {};
                Object.assign(createdUser, user);

                /* Send a request to the API for registration, mail confirmation and user login */
                await registerUser(request, createdUser);
                await confirmUserEmail(request, createdUser);
                let {userData} = await loginUser(request, createdUser);
                user.accessToken = userData.accessToken;
                user.id = userData.id;

                /* Update user profile picture */
                const userEntity = await (new UserModel()).getEntityById(user.id);
                user.creationAt = userEntity.creationAt;
                userEntity.profilePicture = user.profilePicture;
                await userEntity.save();
            });
        }
    }
});