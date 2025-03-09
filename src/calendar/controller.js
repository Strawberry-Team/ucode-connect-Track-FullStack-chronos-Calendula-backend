import Controller from "../controller.js";
import CalendarModel from "./model.js";
import {body} from "express-validator";


class CalendarController extends Controller {
    constructor() {
        super(new CalendarModel(), [
            body('title')
                .notEmpty().withMessage('Title is required.')
                .isLength({min: 1, max: 50}).withMessage('Title should be at most 50 characters long.'),

            body('description')
                .optional()
                .isLength({min: 1, max: 250}).withMessage('Description should be at most 250 characters long.'),]);

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
    }
}

export default new CalendarController;