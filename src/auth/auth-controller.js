import jwt from 'jsonwebtoken';
import * as argon2 from "argon2";
import UserController from "../user/user-controller.js";
import * as mailer from "../services/mailer/mailer-service.js";

class AuthController extends UserController {
    constructor() {
        super();

        this._accessPolicies.admin.removeAll();
        this._accessPolicies.user.removeAll();
        this._accessPolicies.guest.setCreate(
            this.model._fields.filter(field => !['isVerified', 'profilePicture', 'creationAt'].includes(field))
        );

        this._validationRulesForLogin = this._validationRules.filter(rule => {
            return ['email', 'password'].includes(rule.builder.fields[0])
        });

        this._validationRulesForPasswordReset = this._validationRules.filter(rule => {
            return ['email'].includes(rule.builder.fields[0])
        });

        this._validationRulesForPasswordResetConfirm = this._validationRules.filter(rule => {
            return ['password', 'password_confirm'].includes(rule.builder.fields[0])
        });
    }

    /**
     * @returns {UserModel}
     */
    get model() {
        return super.model;
    }

    /**
     * @param req
     * @param res
     * @param next
     * @return {Promise<e.Response>}
     */
    async checkAccess(req, res, next) {
        if (req.user) {
            return this._returnAccessDenied(res);
        }

        next();
    }

    /**
     * @param req
     * @param res
     * @param next
     * @return {Promise<e.Response>}
     */
    async create(req, res, next) {
        const parentResponse = await super.create(req, res, next);

        if (!req.user && parentResponse?.statusCode === 201) {
            mailer.sendConfirm(
                parentResponse.req?.newUser?.email,
                {
                    fullName: parentResponse.req?.newUser?.fullName,
                    token: parentResponse.req?.confirmToken
                }
            ).catch(e => console.log(e));
        } else {
            return parentResponse;
        }
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async confirmEmail(req, res, next) {
        try {
            try {
                const decoded = jwt.verify(req.params.token, process.env.APP_SECRET);
                const user = await this.model.getByEmail(decoded.userEmail);

                if (!user) {
                    return this._returnNotFound(res);
                }

                user.isVerified = true;
                user.confirmToken = null;
                await user.save();

                return this._returnResponse(
                    res, 200, {},
                    'Successful email confirmation'
                );
            } catch (e) {
                return this._returnResponse(
                    res, 400, {},
                    "Invalid token. Please try to receive the email again!"
                );
            }
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
    async validateLogin(req, res, next) {
        return await this.validateBody(req, res, next,
            this._validationRulesForLogin
        );
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async login(req, res, next) {
        try {
            const validationErrors = [];
            const fields = this._prepareFields(req);

            const user = await this.model.getByEmail(fields.email);
            let passwordIsValid = false;

            if (user) {
                passwordIsValid = await argon2.verify(user.password, fields.password ?? '');
            }

            if (!passwordIsValid || !user) {
                validationErrors.push({
                    path: 'email',
                    msg: 'Invalid user data entered. Please check that the data entered is correct.'
                });
            }

            if (user && passwordIsValid && !user.isVerified) {
                validationErrors.push({
                    path: 'email',
                    msg: 'Please confirm your email'
                });
            }

            if (validationErrors.length > 0) {
                return this._returnResponse(
                    res,
                    401,
                    {
                        validationErrors,
                        validationSuccesses: req.validationSuccesses
                    },
                    "Validation failed."
                );
            }

            const accessToken = await this.model.createToken({
                id: user.id,
                email: user.email,
                role: user.role
            });

            return this._returnResponse(
                res, 200, { accessToken, data: user.toJSON() },
                'Successful login'
            );
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
    async validatePasswordReset(req, res, next) {
        return await this.validateBody(req, res, next,
            this._validationRulesForPasswordReset
        );
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async passwordReset(req, res, next) {
        try {
            const fields = this._prepareFields(req);
            const user = await this.model.getByEmail(fields.email);

            if (!user) {
                return this._returnNotFound(res);
            }

            if (!user.isVerified) {
                return this._returnResponse(
                    res, 400, {},
                    "Please confirm your email"
                );
            }

            user.passwordResetToken = await this.model.createToken(
                { userEmail: user.email },
                '1d'
            );
            await user.save();

            res.status(200).json({
                message: 'Successful send an email.',
            });

            mailer.sendPasswordReset(
                user?.email,
                {
                    fullName: user?.fullName,
                    token: user.passwordResetToken
                }
            ).catch(e => console.log(e));
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
    async validatePasswordConfirm(req, res, next) {
        return await this.validateBody(req, res, next,
            this._validationRulesForPasswordResetConfirm
        );
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async confirmPasswordReset(req, res, next) {
        try {
            try {
                const tokenData = jwt.verify(req.params.token, process.env.APP_SECRET);
                const user = await this.model.getByEmail(tokenData.userEmail);

                if (!user) {
                    return this._returnNotFound(res);
                }

                if (!user.isVerified) {
                    return this._returnResponse(
                        res, 400, {},
                        "Please confirm your email"
                    );
                }

                user.password = await this.model.createPassword(req.body.password);
                user.passwordResetToken = null;
                await user.save();

                return this._returnResponse(res, 200, {}, "Successful password update.");
            } catch (e) {
                return this._returnResponse(res, 400, {}, "Invalid token.");
            }
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
    async logout(req, res, next) {
        try {
            return this._returnResponse(res, 200, {}, "Successful logout");
        } catch (e) {
            next(e);
        }
    }
}

export default new AuthController();
