import Controller from "../controller.js";
import UserModel from "./model.js";
import { body } from "express-validator";

/**
 * @property {UserModel} _model
 */
class UserController extends Controller {
    constructor() {
        super(new UserModel(),
            [
                body('email')
                    .notEmpty().withMessage('Email address is required.')
                    .isEmail().withMessage('Please enter a valid email address.'),

                body('fullName')
                    .isLength({ min: 3 }).withMessage('Full name should be at least 3 characters long.'),

                body('country')
                    .notEmpty().withMessage('Please provide a country.')
                    .isIn(['Ukraine', 'Poland', 'Spain']).withMessage('Countries: Ukraine, Poland, Spain'),

                body('password')
                    .isStrongPassword({ minLength: 5 })
                    .withMessage("Password should be at least 5 characters long and include an uppercase letter, a symbol, and a number."),

                body('password_confirm')
                    .notEmpty().withMessage('Please confirm your password.')
                    .custom((value, { req }) => {
                        if (value !== req.body.password) {
                            throw new Error('Password confirmation does not match the password.');
                        }
                        return true;
                    })
            ]
        );

        this._validationRulesForUpdate = [
            body('fullName')
                .optional()
                .isLength({ min: 3 }).withMessage('Full name should be at least 3 characters long.'),

            body('password')
                .optional()
                .isStrongPassword({ minLength: 5 })
                .withMessage("Password should be at least 5 characters long and include an uppercase letter, a symbol, and a number."),

            body('password_confirm')
                .optional()
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Password confirmation does not match the password.');
                    }
                    return true;
                })
        ];

        this._accessPolicies.admin.setUpdate(this._model._fields.filter(field => !['email'].includes(field)));

        this._accessPolicies.user
            .removeCreate()
            .setRead([], [])
            .setUpdate(
                this._model._fields.filter(field => !['email',  'isVerified', 'role', 'creationAt'].includes(field)), [
                    {
                        field: 'id',
                        operator: '=',
                        value: null
                    }
                ]
            )
            .removeDelete();

        this._accessPolicies.guest
            .setRead();
    }

    /**
     * @inheritDoc
     */
    async create(req, res, next) {
        try {
            const validationErrors = [];

            let user = await this._model.getByEmail(req?.body?.email);
            if (user) {
                validationErrors.push({ path: 'email', msg: 'Email is exist.' });
            }

            if (validationErrors.length > 0) {
                return this._returnResponse(
                    res,
                    400,
                    {
                        validationErrors,
                        validationSuccesses: req.validationSuccesses
                    },
                    "Validation failed"
                );
            }

            const fields = this._prepareFields(req);
            if (fields.password) {
                fields.password = await this._model.createPassword(fields.password);
            }

            if (fields.email) {
                fields.confirmToken = await this._model.createConfirmToken({ userEmail: fields.email });
            }

            const newUser = this._model.createEntity(fields);
            await newUser.save();

            req.confirmToken = newUser?.confirmToken;
            req.newUser = newUser.toJSON();

            return res.status(201).json({
                data: newUser.toJSON(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async validateUpdate(req, res, next) {
        return await this.validateBody(req, res, next,
            this._validationRulesForUpdate
        );
    }

    async update(req, res, next) {
        if (req?.user?.role === 'user' && req?.accessOperation) {
            req.accessOperation.filter.forEach(item => {
                if (item.field === 'id') {
                    item.value = req.user.id
                }
            });
        }

        if (req?.body?.password) {
            req.body.password = await this._model.createPassword(req.body.password);
        }

        return super.update(req, res, next);
    }
}

export default UserController;