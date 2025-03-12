import {expect} from "@playwright/test";

export const BASE_URL = 'http://localhost:8080/api';
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