import Controller from "../controller.js";
import CalendarModel from "./model.js";
import { body } from "express-validator";
import CalendarUserModel from "./user/model.js";


class CalendarController extends Controller {
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
                    .isArray({ min: 1 })
                    .withMessage('Participants must be an array with at least one item.'),
                body('participants.*.userId')
                    .if(body('participants').exists())
                    .exists().withMessage('userId is required.')
                    .isInt({ gt: 0 }).withMessage('userId must be a positive integer.'),
                body('participants.*.role')
                    .if(body('participants').exists())
                    .exists().withMessage('role is required.')
                    .isIn(['owner', 'editor', 'viewer']).withMessage('role must be either editor or viewer.'),
            ]
        );

        const allowedFields = ['title', 'description'];

        this._accessPolicies.user
            .setCreate(allowedFields)
            .setRead()
            .setUpdate(allowedFields, [{
                field: this._model._creationByRelationFieldName, operator: '=', value: null
            }])
            .setDelete(allowedFields, [{
                field: this._model._creationByRelationFieldName, operator: '=', value: null
            }]);

        this._accessPolicies.guest
            .removeAll();
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
            participants = participants.filter(participant => participant.role !== 'owner');
            participants.push({
                userId: req?.user.id,
                role: 'owner'
            });
        } else {
            participants = [
                {
                    userId: req?.user.id,
                    role: 'owner'
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
            if (this._model._fields.includes(this._model._creationByRelationFieldName)) {
                fields[this._model._creationByRelationFieldName] = req.user.id;
            }

            let newEntity = this._model.createEntity(fields);
            await newEntity.save();

            const calendarUserModel = new CalendarUserModel();
            await calendarUserModel.syncParticipants(newEntity.id, this._prepareParticipants(req));

            newEntity = await this._model.getEntityById(newEntity.id);

            return res.status(201).json({
                data: newEntity.toJSON(),
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

            const calendarUserModel = new CalendarUserModel();
            await calendarUserModel.syncParticipants(entity.id, this._prepareParticipants(req));

            const calendar = await this._model.getEntityById(entity.id);

            return this._returnResponse(res, 200, {
                data: calendar.toJSON()
            });
        } catch (e) {
            next(e);
        }
    }
}

export default new CalendarController;