import Controller from "../controller.js";
import EventModel from "./model.js";
import { body } from "express-validator";

/**
 * @property {EventModel} _model
 */
class EventController extends Controller {
    constructor() {
        super(new EventModel(), [
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
                })]);

        const allowedFields = ['title', 'description', 'category', 'type', 'startAt', 'endAt'];

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
}

export default new EventController;