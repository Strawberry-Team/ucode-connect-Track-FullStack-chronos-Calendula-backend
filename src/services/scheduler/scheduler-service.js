import cron from 'node-cron';
import { notifyUpcomingEventTask } from './tasks/event/notify-upcoming-event-task.js';

cron.schedule('* * * * *', async () => {
    console.group('Run scheduler: * * * * * (every minute)');

    await notifyUpcomingEventTask();

    console.groupEnd();
});