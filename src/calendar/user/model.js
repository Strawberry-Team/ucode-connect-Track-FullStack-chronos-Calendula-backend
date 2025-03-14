import Model from "../../model.js";
import CalendarUserEntity from "./entity.js";
import Where from "../../sql/where.js";
import UserModel from "../../user/model.js";

class CalendarUserModel extends Model {
    constructor() {
        super(
            'calendars_users',
            [
                'id',
                'calendarId',
                'userId',
                'color',
                'role',
                'isMain',
                'isConfirmed',
                'creationAt'
            ],
            CalendarUserEntity
        );
    }


    /**
     * Determines the unique lowest roles for each participant based on their userId and a predefined role priority.
     *
     * @param {Array<Object>} participants - An array of participant objects, each containing a `userId` (number)
     *                                        and a `role` (string). Roles are assumed to have a priority order.
     * @return {Array<Object>} An array of objects with unique `userId` and their corresponding lowest-priority roles.
     */
    _getUniqueLowestRoles(participants) {
        const rolesPriority = { owner: 1, editor: 2, viewer: 3 };

        const uniqueParticipants = {};

        participants.forEach(({ userId, role }) => {
            if (!uniqueParticipants[userId] || rolesPriority[role] > rolesPriority[uniqueParticipants[userId]]) {
                uniqueParticipants[userId] = role;
            }
        });

        return Object.entries(uniqueParticipants)
            .map(([userId, role]) => ({ userId: Number(userId), role }));
    }

    /**
     *
     * @param {number} calendarId
     * @param {[{userId: number, role: string}]} participants
     * @return {Promise<void>}
     */
    async syncCalendarParticipants(calendarId, participants) {
        if (participants.length === 0) {
            throw new Error('There must be at least one participant.');
        }

        if (participants.filter(p => p.role === 'owner').length !== 1) {
            throw new Error('There must be only one owner.');
        }

        participants = this._getUniqueLowestRoles(participants);

        const calendarUsers = await this.getEntities([], [
            new Where('calendarId', '=', calendarId)
        ]);

        if (calendarUsers.find(u => u.isMain === true)) {
            return;
        }

        for (const calendarUser of calendarUsers) {
            if (!participants.find(p => p.userId === calendarUser.userId)) {
                await calendarUser.delete();
            } else if (
                participants.find(p => p.userId === calendarUser.userId
                    && p.role !== calendarUser.role)
            ) {
                const participantToUpdate = participants.find(p => p.userId === calendarUser.userId);
                calendarUser.role = participantToUpdate.role;
                await calendarUser.save();
            }

            participants = participants.filter(p => p.userId !== calendarUser.userId);
        }

        const calendarUserModel = new CalendarUserModel();
        const userModel = new UserModel();

        for (const participant of participants) {
            const user = await userModel.getEntityById(participant.userId);

            if (!user) {
                continue;
            }

            const calendarUser = calendarUserModel.createEntity({
                calendarId: calendarId,
                userId: participant.userId,
                role: participant.role,
                isMain: false,
                isConfirmed: participant.role === 'owner'
            });

            await calendarUser.save();
        }
    }

    async getCalendarsByUserId(userId) {
        return await this.getEntities([], [
            new Where('userId', '=', userId)
        ]);
    }

    async getCalendarsByCalendarId(calendarId) {
        return await this.getEntities([], [
            new Where('calendarId', '=', calendarId)
        ]);
    }
}

export default CalendarUserModel;