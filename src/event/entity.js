import Entity from "../entity.js";
import UserModel from "../user/model.js";
import CalendarModel from "../calendar/model.js";
import {format, isSameDay, parse} from "date-fns";

class EventEntity extends Entity {
    /**
     * @param {EventModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);

        this._publicFields.push('creator', 'participants', 'calendar');
    }

    _getRelationFields() {
        return {
            creator: async () => await (new UserModel()).getEntityById(this[this._model._creationByRelationFieldName]),
            participants: async () => await this.getParticipants(),
            calendar: async () => await this._getCalendar(),
        };
    }

    async _getCalendar() {
        return (new CalendarModel()).getEntityById(this.calendarId, false);
    }

    async getParticipants() {
        return this._model.getParticipantsByEventId(this.id)
    }

    /**
     * Formats the event date range into a human-readable string based on the start and end date-times.
     *
     * @return {string} A formatted string representing the event's date range.
     *                  The format varies depending on whether the event spans a single day, multiple days,
     *                  full days, or partial days.
     */
    getFormattedEventDate() {
        const startDate = parse(this.startAt, 'yyyy-MM-dd HH:mm:ss', new Date());
        const endDate = parse(this.endAt, 'yyyy-MM-dd HH:mm:ss', new Date());

        // Якщо обидві дати співпадають (на весь день, 00:00 до 23:59)
        if (isSameDay(startDate, endDate) && format(startDate, 'HH:mm:ss') === '00:00:00' && format(endDate, 'HH:mm:ss') === '23:59:59') {
            return format(startDate, 'EEE MMM d, yyyy');
        }

        // Якщо обидві дати в один день, але час не на весь день
        if (isSameDay(startDate, endDate)) {
            const day = format(startDate, 'EEE MMM d, yyyy');
            const timeRange = `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
            return `${day} ${timeRange}`;
        }

        // Якщо дати охоплюють кілька днів і час на весь день
        if (format(startDate, 'HH:mm:ss') === '00:00:00' && format(endDate, 'HH:mm:ss') === '23:59:59') {
            return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
        }

        // Якщо дати охоплюють кілька днів і час не на весь день
        return `${format(startDate, 'EEE MMM d HH:mm')} - ${format(endDate, 'EEE MMM d HH:mm, yyyy')}`;
    }
}

export default EventEntity;