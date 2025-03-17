import Controller from "../controller.js";
import CalendarModel from "./model.js";
import { body } from "express-validator";
import CalendarUserModel from "./user/model.js";
import UserModel from "../user/model.js";
import * as mailer from "../../mailer/service.js";
import Where from "../sql/where.js";


class CalendarController extends Controller {
    /**
     * @type {[]}
     */
    _validationRulesForUpdateColor = [];

    constructor() {
        super(new CalendarModel(),
            [
                body('title')
                    .notEmpty().withMessage('Title is required.')
                    .isLength({ min: 1, max: 50 }).withMessage('Title should be at most 50 characters long.'),

                body('description')
                    .optional()
                    .isLength({ max: 250 }).withMessage('Description should be at most 250 characters long.'),

                body('participants')
                    .optional()
                    .isArray({ min: 1 }).withMessage('Participants must be an array with at least one item.'),

                body('participants.*.userId')
                    .if(body('participants').exists())
                    .exists().withMessage('User id is required.')
                    .isInt({ gt: 0 }).withMessage('User id must be a positive integer.'),

                body('participants.*.role')
                    .if(body('participants').exists())
                    .exists().withMessage('Role is required.')
                    .isIn(['owner', 'member', 'viewer']).withMessage('Role must be either member or viewer.')
            ]
        );

        this._validationRulesForUpdateColor = [
            body('color')
                .notEmpty().withMessage('Color is required.')
                .isLength({ min: 7, max: 7 }).withMessage('Length of color should be 7 characters long.')
                .matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Color must be in the format #RRGGBB.'),
        ];

        const allowedFields = ['title', 'description'];

        this._accessPolicies.user
            .setCreate(allowedFields)
            .setRead()
            .setUpdate(allowedFields, [{
                field: this.model._creationByRelationFieldName, operator: '=', value: null
            }])
            .setDelete(allowedFields, [{
                field: this.model._creationByRelationFieldName, operator: '=', value: null
            }]);

        this._accessPolicies.guest
            .removeAll();
    }

    /**
     * @returns {CalendarModel}
     */
    get model() {
        return super.model;
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async getById(req, res, next) {
        try {
            const currentUserAsParticipants = await (new CalendarUserModel()).getCalendarsByUserId(req?.user.id);
            if (!currentUserAsParticipants.find(p => p.calendarId === Number(req.params.id))) {
                return this._returnAccessDenied(
                    res, 403, {},
                    "Unable to access a calendar without an invitation."
                );
            }

            const entity = await this._getEntityByIdAndAccessFilter(req);
            if (!entity) {
                return this._returnNotFound(res);
            }

            const calendar = entity.toJSON();
            calendar.color = calendar.participants.find(p => p.userId === req.user.id)?.color;

            return this._returnResponse(res, 200, {
                data: calendar
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
    async getAll(req, res, next) {
        try {
            const calendarUserModel = new CalendarUserModel();
            const currentUserAsParticipants = await calendarUserModel.getCalendarsByUserId(req?.user.id);

            const filters = [
                new Where(
                    'id',
                    'IN',
                    currentUserAsParticipants.map(p => p.calendarId)
                )
            ];

            const entities = await this.model.getEntities(
                req?.accessOperation?.fields,
                filters
            );

            const calendars = entities.map(entity => entity.toJSON());
            calendars.forEach(calendar => {
                calendar.color = calendar.participants.find(p => p.userId === req.user.id)?.color;
            });

            return this._returnResponse(res, 200, {
                data: calendars
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Prepares and filters the list of participants for a request by excluding existing owners
     * and adding the current user as the owner.
     *
     * @param {e.Request} req
     * @return {Array} The filtered and updated list of participants with the current user added as the owner.
     */
    _prepareParticipants(req) {
        let participants = req?.body?.participants;

        if (participants && Array.isArray(participants)) {
            participants = participants.filter(participant => participant.userId !== req?.user.id);
            participants.push({
                userId: req?.user.id,
                color: req?.user.color,
                role: 'owner',
                isConfirmed: req?.user.isConfirmed,
            });
        } else {
            participants = [
                {
                    userId: req?.user.id,
                    color: req?.user.color,
                    role: 'owner',
                    isConfirmed: req?.user.isConfirmed,
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

            if (this.model._fields.includes(this.model._creationByRelationFieldName)) {
                fields[this.model._creationByRelationFieldName] = req.user.id;
            }

            let entity = this.model.createEntity(fields);
            await entity.save();

            const calendarUserModel = new CalendarUserModel();
            await calendarUserModel.syncCalendarParticipants(entity.id, this._prepareParticipants(req));

            const calendar = await this.model.getEntityById(entity.id);
            const participants = await calendarUserModel.getCalendarsByCalendarId(calendar.id);

            for (const participant of participants) {
                if (participant.userId === calendar.creationByUserId) {
                    continue;
                }

                const userModel = new UserModel();
                const user = await userModel.getEntityById(participant.userId);

                await mailer.sendCalendarInvitation(
                    user.email,
                    {
                        userFullName: user.fullName,
                        calendarId: calendar.id,
                        title: calendar.title,
                        description: calendar.description,
                    }
                );
            }

            return res.status(201).json({
                data: calendar.toJSON(),
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

            if (entity.isMain()) {
                return this._returnResponse(res, 200, {
                    data: entity.toJSON()
                });
            }

            const calendarUserModel = new CalendarUserModel();
            await calendarUserModel.syncCalendarParticipants(entity.id, this._prepareParticipants(req));

            const calendar = await this.model.getEntityById(entity.id);
            const participants = await calendarUserModel.getCalendarsByCalendarId(calendar.id);

            for (const participant of participants) {
                if (participant.userId === calendar.creationByUserId) {
                    continue;
                }

                const userModel = new UserModel();
                const user = await userModel.getEntityById(participant.userId);

                await mailer.sendCalendarInvitation(
                    user.email,
                    {
                        userFullName: user.fullName,
                        calendarId: calendar.id,
                        title: calendar.title,
                        description: calendar.description,
                    }
                );
            }

            return this._returnResponse(res, 200, {
                data: calendar.toJSON()
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
    async delete(req, res, next) {
        try {
            const entity = await this._getEntityByIdAndAccessFilter(req);

            if (!entity) {
                return this._returnNotFound(res);
            }

            if (entity.isMain()) {
                return this._returnResponse(
                    res, 400, {},
                    "Unable to delete a main calendar."
                );
            }

            await entity.delete();

            return this._returnResponse(res, 200, {
                data: entity.toJSON()
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     * Manages the join or leave actions for a calendar based on the user's request.
     *
     * @param {e.Request} req - The request object containing the user's command and parameters (e.g., command and calendar ID).
     * @param {e.Response} res - The response object to send the response to the client.
     * @param {e.NextFunction} next - The next middleware function to handle errors or further requests.
     * @return {Promise<e.Response>} A promise that resolves without a value after processing the join or leave request.
     */
    async joinOrLeave(req, res, next) {
        try {
            const command = req.params.command;

            if (!['join', 'leave'].includes(command)) {
                return this._returnResponse(
                    res, 400, {},
                    "Unknown command for actions with calendars.."
                );
            }

            const calendar = await this.model.getEntityById(req.params.id);

            if (!calendar) {
                return this._returnNotFound(res);
            }

            await calendar.prepareRelationFields();
            const participant = calendar.participants.find(p => p.userId === req.user.id);

            if (!participant) {
                return this._returnAccessDenied(
                    res, 403, {},
                    "Unable to participate a calendar without an invitation."
                );
            }

            if (command === 'join') {
                if (participant.isConfirmed) {
                    return this._returnAccessDenied(
                        res, 400, {},
                        "Unable to join a calendar already joined."
                    );
                }

                participant.isConfirmed = true;
                await participant.save();
            } else if (command === 'leave') {
                if (participant.role === 'owner') {
                    return this._returnAccessDenied(
                        res, 400, {},
                        "Unable to leave a calendar for an owner, only delete it."
                    );
                }

                await participant.delete();
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
     * @return {Promise<e.Response>}
     */
    async updateColor(req, res, next) {
        const calendar = await this.model.getEntityById(req.params.id);
        if (!calendar) {
            return this._returnNotFound(res);
        }

        const color = req.body.color;
        const calendarUserModel = new CalendarUserModel();
        const participants = await calendarUserModel.getCalendarsByCalendarId(calendar.id);

        const participant = participants.find(p => p.userId === req.user.id);
        if (!participant) {
            return this._returnAccessDenied(
                res, 403, {},
                "Unable to change the color of a calendar without an invitation."
            );
        }

        participant.color = color;
        await participant.save();

        return this._returnResponse(res, 200);
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async validateUpdateColor(req, res, next) {
        return await this.validateBody(req, res, next,
            this._validationRulesForUpdateColor
        );
    }
}

export default new CalendarController;