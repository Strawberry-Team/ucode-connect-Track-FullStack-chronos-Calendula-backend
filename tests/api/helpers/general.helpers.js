import { expect, test } from "@playwright/test";
import UserModel from "../../../src/user/user-model.js";

export const HEADERS = { 'Content-Type': 'application/json' };

export function generateHeaders(accessToken) {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
    };
}

export function expectResponseHeaders(response, statusCode = 200) {
    expect(response.status()).toBe(statusCode);
    const headers = response.headers();
    expect(headers).toHaveProperty('content-type');
    expect(headers['content-type']).toContain('application/json');
}

export function cleanup(users = []) {
    test("Cleanup of test data", async ({ request}) => {
        const userModel = new UserModel();

        for (const user of users) {
            userModel.delete(user.userId);
        }

        userModel.delete(user.id);
    });
}