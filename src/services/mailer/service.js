import nodemailer from 'nodemailer';
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
    //TODO: потрібно розуміти, яке це оточення.
    if (process.env.ETHEREAL_MAILER_LOGIN === '') {
        return;
    }

    console.log('Sending email to ' + email, process.env.ETHEREAL_MAILER_LOGIN);

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
        'templates/confirmEmail.html',
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
        'templates/passwordReset.html',
        data
    );
}

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendCalendarInvitation(email, data) {
    await send(
        email,
        `Join Calendar '${data.title}'`,
        'templates/calendarInvitation.html',
        data
    );
}

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendEventInvitation(email, data) {
    await send(
        email,
        `Join Event '${data.title}'`,
        'templates/eventInvitation.html',
        data
    );
}

/**
 * @param {string} email
 * @param {Object} data
 * @return {Promise<void>}
 */
export async function sendNotifyAboutUpcomingEvent(email, data) {
    await send(
        email,
        `Notification: ${data.title} @ ${data.date}`,
        'templates/eventUpcoming.html',
        data
    );
}