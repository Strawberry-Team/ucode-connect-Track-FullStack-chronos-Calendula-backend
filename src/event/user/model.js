import Model from "../../model.js";
import EventUserEntity from "./entity.js";
import Where from "../../sql/where.js";
import UserModel from "../../user/model.js";

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
     * @param {[{userId: number, color: string, isOrganizer: boolean}]} participants
     * @return {Promise<void>}
     */
    async syncEventParticipants(eventId, participants) {
        if (participants.length === 0) {
            throw new Error('There must be at least one participant.');
        }

        if (!participants.find(p => p.isOrganizer)) {
            throw new Error('The event must be attended by organizer.');
        }

        participants = this._deduplicateParticipants(participants);

        const eventUsers = await this.getEntities([], [
            new Where('eventId', '=', eventId)
        ]);

        for (const eventUser of eventUsers) {
            if (!participants.find(p => p.userId === eventUser.userId)) {
                await eventUser.delete();
            }

            participants = participants.filter(p => p.userId !== eventUser.userId);
        }

        const eventUserModel = new EventUserModel();
        const userModel = new UserModel();

        for (const participant of participants) {
            const user = await userModel.getEntityById(participant.userId);
            if (!user) {
                continue;
            }

            const eventUser = eventUserModel.createEntity( {
                eventId: eventId,
                userId: participant.userId,
                attendanceStatus: participant.isOrganizer ? 'yes' : null,
            });

            await eventUser.save();
        }
    }

    /**
     * @param {[{userId: number, color: string, isOrganizer: boolean}]} participants
     * @return {[{userId: number, color: string, isOrganizer: boolean}]}
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
}

export default EventUserModel;