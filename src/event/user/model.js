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
     * @param {[{userId: number, color: string, attendanceStatus: string}]} participants
     * @return {Promise<void>}
     */
    async syncParticipants(eventId, participants) {
        if (participants.length === 0) {
            throw new Error('There must be at least one participant.');
        }

        if (participants.filter(p => p.attendanceStatus === 'yes').length !== 1) {
            throw new Error('The event must be attended by at least one participant (event owner).');
        }

        const eventUsers = await this.getEntities([], [
            new Where('eventId', '=', eventId)
        ]);

        for (const eventUser of eventUsers) {
            if (!participants.find(p => p.userId === eventUser.userId)) {
                await eventUser.delete();
            } else if (
                participants.find(p => p.userId === eventUser.userId
                    && (p.attendanceStatus !== eventUser.attendanceStatus
                        || p.color !== eventUser.color))
            ) {
                const participantToUpdate = participants
                    .find(p => p.userId === eventUser.userId);
                eventUser.attendanceStatus = participantToUpdate.attendanceStatus;
                eventUser.color = participantToUpdate.color;
                await eventUser.save();
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
                color: participant.color,
                attendanceStatus: participant.attendanceStatus
            });

            await eventUser.save();
        }
    }

    async getEventsByUserId(userId) {
        return await this.getEntities([], [
            new Where('userId', '=', userId)
        ]);
    }

    async getEventsByEventId(eventId) {
        return await this.getEntities([], [
            new Where('eventId', '=', eventId)
        ]);
    }
}

export default EventUserModel;