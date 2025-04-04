import Model from "../../model.js";
import EventUserEntity from "./event-user-entity.js";
import Where from "../../db/sql/where.js";
import UserModel from "../../user/user-model.js";
import EventModel from "../event-model.js";
import CalendarModel from "../../calendar/calendar-model.js";
import CalendarUserModel from "../../calendar/user/calendar-user-model.js";

class EventUserModel extends Model {
    constructor() {
        super(
            'events_users',
            [
                'id',
                'eventId',
                'userId',
                'color',
                'attendanceStatus',
                'creationAt'
            ],
            EventUserEntity
        );
    }

    /**
     *
     * @param {number} eventId
     * @param {[{userId: number}]} participants
     * @return {Promise<void>}
     */
    async syncEventParticipants(eventId, participants) {
        const event = await (new EventModel()).getEntityById(eventId);

        if (!event) {
            throw new Error('Event not found.');
        }
        
        const eventCreator = await (new UserModel()).getEntityById(event[this._creationByRelationFieldName]);

        if (!eventCreator) {
            throw new Error('Event creator not found.');
        }

        if (participants.length === 0) {
            throw new Error('There must be at least one participant.');
        }

        if (!participants.find(p => p.userId === eventCreator.id)) {
            throw new Error('The event must be attended by creator.');
        }

        participants = this._deduplicateParticipants(participants);

        const eventUsers = await this.getEntities([], [
            new Where('eventId', '=', event.id)
        ]);

        for (const eventUser of eventUsers) {
            if (!participants.find(p => p.userId === eventUser.userId)) {
                await eventUser.delete();
                
                await this.handleSyncEventWithCalendar(event.calendarId, eventId, eventUser.userId, 'detach');
            }

            participants = participants.filter(p => p.userId !== eventUser.userId);
        }

        for (const p of participants) {
            await this.addParticipant(
                eventId,
                p.userId,
                p.userId === eventCreator.id ? 'yes' : null
            );

            await this.handleSyncEventWithCalendar(event.calendarId, eventId, p.userId, 'attach');
        }
    }

    /**
     * @param {[{userId: number}]} participants
     * @return {[{userId: number}]}
     * @private
     */
    _deduplicateParticipants(participants) {
        const uniqueParticipants = {};

        for (const participant of participants) {
            if (!uniqueParticipants[participant.userId]) {
                uniqueParticipants[participant.userId] = participant;
            }
        }

        return Object.values(uniqueParticipants);
    }

    async addParticipant(eventId, userId, attendanceStatus) {
        const user = await (new UserModel()).getEntityById(userId);

        if (!user) {
            return;
        }

        if (await this.getParticipantByEventIdAndUserId(eventId, userId)) {
            return;
        }

        const eventUser = this.createEntity({
            eventId,
            userId,
            attendanceStatus
        });

        await eventUser.save();

        return eventUser;
    }

    async getParticipantByEventIdAndUserId(eventId, userId) {
        return await this.getEntities([], [
                new Where('eventId', '=', eventId),
                new Where('userId', '=', userId),
            ],
            'id',
            1
        );
    }

    /**
     * @param {number} calendarId
     * @param {number} eventId
     * @param {number} userId
     * @param {string} strategy - attach or detach
     * @return {Promise<void>}
     */
    async handleSyncEventWithCalendar(calendarId, eventId, userId, strategy) {
        const calendar = await (new CalendarModel()).getEntityById(calendarId);

        if (!calendar) {
            throw new Error('Calendar not found.');
        }

        const calendarUsers = await calendar.getParticipants();

        if (calendar.isMain() || !calendarUsers.find(cu => cu.userId === userId)) {
            let participantMainCalendar = await (new CalendarModel()).getMainCalendar(userId);

            if (!participantMainCalendar) {
                participantMainCalendar = await (new CalendarModel()).createMainCalendar(userId);
            }

            if (strategy === 'attach') {
                await participantMainCalendar.attachEvent(eventId);
            } else if (strategy === 'detach') {
                await participantMainCalendar.detachEvent(eventId);
            } else {
                throw new Error('Unknown strategy.');
            }
        } else {

        }
    }
}

export default EventUserModel;