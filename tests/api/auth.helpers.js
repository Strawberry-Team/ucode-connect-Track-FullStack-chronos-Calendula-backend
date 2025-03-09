// import { expect } from '@playwright/test';
//
// const baseUrl = 'http://localhost:8080/api';
//
// export const testUserData = {
//     email: `ann.nichols${Date.now()}@example.com`,
//     fullName: 'Ann Nichols',
//     country: 'Ukraine',
//     password: 'StrongPassword123!$',
//     confirmToken: undefined,
//     accessToken: undefined,
// };
//
// export async function registerUser(request, userData = testUserData) {
//     const response = await request.post(`${baseUrl}/auth/register`, {
//         headers: { 'Content-Type': 'application/json' },
//         data: {
//             email: userData.email,
//             fullName: userData.fullName,
//             country: userData.country,
//             password: userData.password,
//             password_confirm: userData.password
//         }
//     });
//
//     expect(response.status()).toBe(201);
//     testUserData.confirmToken = await response.json().data.confirmToken;
//     return response.json();
// }
//
// export async function loginUser(request, email = testUserData.email, password = testUserData.password) {
//     const response = await request.post(`${baseUrl}/auth/login`, {
//         headers: { 'Content-Type': 'application/json' },
//         data: { email, password }
//     });
//
//     expect(response.status()).toBe(200);
//     testUserData.accessToken = response.json().accessToken;
//     return response.json();
// }
//
// export async function confirmUserEmail(request, confirmToken = testUserData.confirmToken) {
//     console.log('confirmToken', confirmToken);
//     const response = await request.get(`${baseUrl}/auth/confirm-email/${confirmToken}`);
//
//     expect(response.status()).toBe(200);
//     return response.json();
// }
//
// // export async function deleteUser(request, accessToken = testUserData.accessToken) {
// //     const response = await request.delete(`${baseUrl}/auth/delete`, {
// //         headers: { Authorization: `Bearer ${accessToken}` }
// //     });
// //
// //     expect(response.status()).toBe(204);
// // }
