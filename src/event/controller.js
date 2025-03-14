import Controller from "../controller.js";
import EventModel from "./model.js";
import { body } from "express-validator";
import EventUserModel from "./user/model.js";
import UserModel from "./../user/model.js";
import * as mailer from "../../mailer/service.js";
import CalendarModel from "../calendar/model.js";

/**
 * @property {EventModel} _model
 */
class EventController extends Controller {
    constructor() {
        super(new EventModel(),
            [
                body('title')
                    .notEmpty().withMessage('Title is required.')
                    .isLength({ min: 1, max: 50 }).withMessage('Title should be at most 50 characters long.'),

                body('description')
                    .optional()
                    .isLength({ max: 250 }).withMessage('Description should be at most 250 characters long.'),

                body('category')
                    .notEmpty().withMessage('Please provide a category.')
                    .isIn(['work', 'home', 'hobby']).withMessage('Categories: work, home, hobby.'),

                body('type')
                    .notEmpty().withMessage('Please provide a type.')
                    .isIn(['meeting', 'reminder', 'task']).withMessage('Types: meeting, reminder, task.'),

                body('startAt')
                    .notEmpty().withMessage('Please provide a start date and time.')
                    // todo create a custom validator for date and time
                    .custom((value, {req}) => {
                        if (value > req.body.endAt) {
                            throw new Error('Start date and time should be less than the end date and time.');
                        }
                        return true;
                    }),

                body('endAt')
                    .custom((value, {req}) => {
                        if (!value && req.body.type !== "reminder") {
                            throw new Error('Please provide an end date and time.');
                        }
                        return true;
                    })
                    // todo create a custom validator for date and time
                    .custom((value, {req}) => {
                        if (value < req.body.startAt) {
                            throw new Error('End date and time should be greater than the start date and time.');
                        }
                        return true;
                    }),

                    body('participants')
                        .optional()
                        .isArray({ min: 1 }).withMessage('Participants must be an array with at least one item.'),

                    body('participants.*.userId')
                        .if(body('participants').exists())
                        .exists().withMessage('User id is required.')
                        .isInt({ gt: 0 }).withMessage('User id must be a positive integer.')
            ]
        );

        const allowedFields = ['title', 'description', 'category', 'type', 'startAt', 'endAt', 'calendarId'];

        this._accessPolicies.user
            .setCreate(allowedFields)
            .setRead()
            .setUpdate(allowedFields.filter(field => field !== 'calendarId'), [{
                field: this._model._creationByRelationFieldName, operator: '=', value: null
            }])
            .setDelete(allowedFields, [{
                field: this._model._creationByRelationFieldName, operator: '=', value: null
            }]);

        this._accessPolicies.guest
            .removeAll();
    }

    /**
     * Prepares the list of participants for a request.
     *
     * @param {e.Request} req
     * @return {Array} The updated list of participants.
     */
    _prepareParticipants(req) {
        let participants = req?.body?.participants;

        if (participants && Array.isArray(participants)) {
            participants.push({
                userId: req?.user.id,
                isOrganizer: true,
            });
        } else {
            participants = [
                {
                    userId: req?.user.id,
                    isOrganizer: true,
                }
            ];
        }

        return participants;
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async create(req, res, next) {
        try {
            const fields = this._prepareFields(req);
            /* TODO
            Если добавляю в isMain = TRUE, то добляем в syncEventParticipants
            только в аналогичные isMain календари

            Если в isMain = FALSE, то только в общий.
            * */

            if (this._model._fields.includes(this._model._creationByRelationFieldName)) {
                fields[this._model._creationByRelationFieldName] = req.user.id;
            }

            let entity = this._model.createEntity(fields);
            await entity.save();

            const eventUserModel = new EventUserModel();
            await eventUserModel.syncEventParticipants(entity.id, this._prepareParticipants(req));

            const event = await this._model.getEntityById(entity.id);
            const participants = await eventUserModel.getEventsByEventId(event.id);

            for (const participant of participants) {
                if (participant.userId === event.creationByUserId) {
                    continue;
                }

                const userModel = new UserModel();
                const user = await userModel.getEntityById(participant.userId);

                await mailer.sendEventInvitation(
                    user.email,
                    {
                        userFullName: user.fullName,
                        eventId: event.id,
                        title: event.title,
                        description: event.description,
                        type: event.type,
                        startAt: event.startAt,
                        endAt: event.endAt,
                    }
                );
            }

            return res.status(201).json({
                data: event.toJSON(),
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async update(req, res, next) {
        try {
            const entity = await this._getEntityByIdAndAccessFilter(req);

            if (!entity) {
                return this._returnNotFound(res);
            }

            Object.assign(entity, this._prepareFields(req));
            await entity.save();

            const eventUserModel = new EventUserModel();
            await eventUserModel.syncEventParticipants(entity.id, this._prepareParticipants(req));

            const event = await this._model.getEntityById(entity.id);
            const participants = await eventUserModel.getEventsByEventId(event.id);

            for (const participant of participants) {
                if (participant.userId === event.creationByUserId) {
                    continue;
                }

                const userModel = new UserModel();
                const user = await userModel.getEntityById(participant.userId);

                await mailer.sendEventInvitation(
                    user.email,
                    {
                        userFullName: user.fullName,
                        eventId: event.id,
                        title: event.title,
                        description: event.description,
                        type: event.type,
                        startAt: event.startAt,
                        endAt: event.endAt,
                    }
                );
            }

            return this._returnResponse(res, 200, {
                data: event.toJSON()
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Manages the join or leave actions for a event based on the user's request.
     *
     * @param {e.Request} req - The request object containing the user's command and parameters (e.g., command and event ID).
     * @param {e.Response} res - The response object to send the response to the client.
     * @param {e.NextFunction} next - The next middleware function to handle errors or further requests.
     * @return {Promise<e.Response>} A promise that resolves without a value after processing the join or leave request.
     */
    async joinOrLeaveOrTentative(req, res, next) {
        try {
            const command = req.params.command;

            if (!['join', 'leave', 'tentative'].includes(command)) {
                return this._returnResponse(res, 400, {}, "Invalid command.");
            }

            const event = await this._model.getEntityById(req.params.id);

            if (!event) {
                return this._returnNotFound(res);
            }

            await event.prepareRelationFields();
            const participant = event.participants.find(p => p.userId === req.user.id);

            if (!participant) {
                return this._returnAccessDenied(
                    res, 403, {},
                    "Unable to participate an event without an invitation."
                );
            }

            if (command === 'join') {
                if (participant.attendanceStatus === 'yes') {
                    return this._returnAccessDenied(
                        res, 400, {},
                        "Unable to join an event already joined."
                    );
                }

                participant.attendanceStatus = 'yes';
                await participant.save();

            } else if (command === 'leave') {
                if (participant.id === event.creationByUserId) {
                    return this._returnAccessDenied(
                        res, 400, {},
                        "Unable to leave an event for an owner, only delete it."
                    );
                }

                participant.attendanceStatus = 'no';
                await participant.save();

            } else if (command === 'tentative') {
                participant.attendanceStatus = 'maybe';
                await participant.save();
            }

            return this._returnResponse(res, 200);
        } catch (e) {
            next(e);
        }
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<*>}
     */
    async _canCreateEvents(req, res, next) {
        const calendar = await (new CalendarModel()).getEntityById(req?.body?.calendarId ?? 0);
        if (!calendar) {
            return this._returnNotFound(res, 404, {},
                "Calendar not found."
            );
        }

        await calendar.prepareRelationFields();
        if (calendar.participants.find(p => p.userId === req?.user.id && ['owner', 'member'].includes(p.role))) {
            return next();
        } else {
            return this._returnAccessDenied(
                res, 403, {},
                "Unable to create events for a calendar without an invitation."
            );
        }
    }
}

export default new EventController;