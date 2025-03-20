import EventModel from '../../../event/model.js';
import * as mailer from "../../mailer/service.js";


export async function notifyUpcomingEventTask() {
    console.group(
        'Notify upcoming event',' - ', new Date(new Date().getTime() + 2 * 60 * 60000).toISOString().slice(0, 19).replace('T', ' '));

    const events = await new EventModel().getEventsToNotify();

    for (const event of events) {
    console.info(`Event: [${event.id}] ${event.title} ${event.getFormattedEventDate()}`);

    console.group();
    for (const participant of event.participants) {
        console.info(`Participant: [${participant.userId}] ${participant.user.fullName} ${participant.attendanceStatus}`);
            if (['yes', 'maybe'].includes(participant.attendanceStatus)) {
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
    }
    console.groupEnd();

    console.groupEnd();
}
