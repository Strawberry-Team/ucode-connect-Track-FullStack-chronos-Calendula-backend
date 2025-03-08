import nodemailer from 'nodemailer'
import ejs from 'ejs';
import * as path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {string} email
 * @param {string} subject
 * @param {string} htmlTemplate
 * @param {Object} dataForTemplate
 * @docs https://ethereal.email/
 * @return {Promise<void>}
 */
async function send(email, subject, htmlTemplate, dataForTemplate) {
    try {
        const airplane = nodemailer.createTransport(
            {
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.ETHEREAL_MAILER_LOGIN || 'ricky43@ethereal.email',
                    pass: process.env.ETHEREAL_MAILER_PASSWORD || '4e1zbM2nxsMu2d823E'
                }
            }
        );

        const html = await ejs.renderFile(
            path.join(__dirname, htmlTemplate),
            dataForTemplate
        );
        const result = await airplane.sendMail(
            {
                from: "\"Calendula\" info@calendula.com",
                to: email,
                subject,
                html
            }
        );
        console.log('Mailing success! ' + result.response);
    } catch (error) {
        console.error('Mailing error! ', error);
    }
}

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendConfirm(email, data) {
    await send(
        email,
        '[Action Required] Confirm Email',
        'confirmEmail.html',
        data
    );
}

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendPasswordReset(email, data) {
    await send(
        email,
        '[Action Required] Password Reset',
        'passwordReset.html',
        data
    );
}