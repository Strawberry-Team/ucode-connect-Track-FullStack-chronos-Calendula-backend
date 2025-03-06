import jwt from 'jsonwebtoken';
import * as argon2 from "argon2";
import UserController from "../user/controller.js";
import * as mailer from "../../mailer/service.js";

class AuthController extends UserController {
    constructor() {
        super();

        this._accessPolicies.admin.removeAll();
        this._accessPolicies.user.removeAll();
        this._accessPolicies.guest.setCreate(this._model._fields.filter(field => !['isVerified', 'profilePicture', 'creationAt'].includes(field)));

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
     * @param {Object} data
     * @param {string} expiresIn
     * @return {string}
     */
    createAccessToken(data, expiresIn = '7d') {
        return jwt.sign(
            data,
            process.env.APP_SECRET,
            { expiresIn }
        );
    }

    /**
     * @param req
     * @param res
     * @param next
     * @return {Promise<e.Response>}
     */
    async create(req, res, next) {
        const parentResponse = await super.create(req, res, next);
        if (
            !req.user
            && parentResponse?.statusCode === 201
        ) {
            const newUser = parentResponse.req?.newUser;
            await mailer.sendConfirm(
                newUser.email, {
                    fullName: newUser.fullName,
                    token: this.createAccessToken({ userEmail: newUser.email })
                }
            )
        }

        return parentResponse;
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
                const user = await this._model.getByEmail(decoded.userEmail);

                if (!user) {
                    return this._returnNotFound(res);
                }

                user.isVerified = true;
                await user.save();

                return this._returnResponse(res, 200, {}, 'Email is confirmed')
            } catch (e) {
                return this._returnResponse(res, 400, {}, "Invalid token");
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

            const user = await this._model.getByEmail(fields.login);
            let passwordIsValid = false;
            if (user) {
                passwordIsValid = await argon2.verify(user.password, fields.password ?? '');
            }

            if (!passwordIsValid || !user) {
                validationErrors.push({ path: 'email', msg: 'User is not exist or incorrect password.' });
            }

            if (user && !user.isVerified) {
                validationErrors.push({ path: 'email', msg: 'Please verify your email.' });
            }

            if (validationErrors.length > 0) {
                return this._returnResponse(
                    res,
                    401,
                    {
                        validationErrors,
                        validationSuccesses: req.validationSuccesses
                    },
                    "Validation failed"
                );
            }

            const accessToken = this.createAccessToken({
                id: user.id,
                email: user.email,
                role: user.role
            });

            return this._returnResponse(res, 200, { accessToken, data: user.toJSON() }, 'Login success')

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
            const user = await this._model.getByEmail(fields.email);
            if (!user) {
                return this._returnNotFound(res);
            }

            await mailer.sendPasswordReset(
                user.email,
                {
                    fullName: user.fullName,
                    token: this.createAccessToken({ userEmail: user.email })
                }
            )

            return this._returnResponse(res, 200, {}, 'Password reset.')
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
        console.log(this._validationRulesForPasswordResetConfirm);
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
                console.log(tokenData);
                const user = await this._model.getByEmail(tokenData.userEmail);
                if (!user) {
                    return this._returnNotFound(res);
                }

                console.log(req.body);
                user.password = await this._model.createPassword(req.body.password);
                await user.save();

                return this._returnResponse(res, 200, {}, "Password has been changed")
            } catch (e) {
                console.log(e.message);
                return this._returnResponse(res, 400, {}, "Invalid token");
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
            return this._returnResponse(res, 200, {}, "You've logged out of your account")
        } catch (e) {
            next(e);
        }
    }
}

export default new AuthController();
