import EventModel from '../../../event/model.js';
import * as mailer from "../../mailer/mailer-service.js";
import CalendarUserModel from "../../../calendar/user/model.js";


export async function notifyUpcomingEventTask() {
    console.group(
        'Notify upcoming event',' - ', new Date(new Date().getTime() + 2 * 60 * 60000).toISOString().slice(0, 19).replace('T', ' '));

    const events = await new EventModel().getEventsToNotify();

    for (const event of events) {
    console.info(`Event: [${event.id}] ${event.title} ${event.getFormattedEventDate()}`);

    console.group();

    let participants = [];
    console.log(event.calendar);
    if (['main', 'shared'].includes(event.calendar.type)) {
        participants = event.participants.filter(p => ['yes', 'maybe'].includes(p.attendanceStatus));
    } else if (['holidays', 'birthdays'].includes(event.calendar.type)) {
        participants = await (new CalendarUserModel().getParticipantsByCalendarId(event.calendar.id));
    }

    for (const participant of participants) {
        console.info(`Participant: [${participant.userId}] ${participant.user.fullName} ${participant.attendanceStatus}`);
            await mailer.sendNotifyAboutUpcomingEvent(
                participant.user.email, {
                    userFullName: participant.user.fullName,
                    title: event.title,
                    description: event.title,
                    type: event.getFormattedType(),
                    category: event.getFormattedCategory(),
                    startAt: event.startAt,
                    calendar: event.getFormattedCalendarTitle(),
                    date: event.getFormattedEventDate(),
                    creator: event.getFormattedCreatorFullName(),
                }
            )
        }
    }
    console.groupEnd();

    console.groupEnd();
}
