import express from "express";
import { body, validationResult } from "express-validator";
import Model from "./model.js";
import Entity from "./entity.js";
import Where from './sql/where.js';
import AccessPolicy from './access/policy.js';
import AccessOperation from './access/operation.js';

class Controller {
    /**
     * @type {Model}
     */
    _model;

    /**
     * @type {[]}
     */
    _validationRules = [];

    /**
     * @type {{admin: AccessPolicy, guest: AccessPolicy, user: AccessPolicy}}
     */
    _accessPolicies = {};

    /**
     * @type {number}
     */
    _totalEntitiesPerPage;

    constructor(model, validationRules = []) {
        this._model = model;
        this._validationRules = validationRules;

        this._initAccessPolicies();
    }

    /**
     * @param {e.Request} req
     * @return {[Where]}
     */
    _prepareFilters(req) {
        return [];
    }

    /**
     *
     * @param {e.Request} req
     * @return {string}
     */
    _prepareSort(req) {
        return 'id';
    }

    /**
     * @param {e.Request} req
     * @param {number} totalEntitiesCount
     * @return {{entitiesPerPage: number, totalEntitiesCount: number, nextPage: (number|null),
     * totalPages: number, prevPage: (number|null), currentPage: number}}
     */
    _preparePagination(req, totalEntitiesCount = 0) {
        const entitiesPerPage = this._totalEntitiesPerPage;

        const totalPages = Math.ceil(totalEntitiesCount / entitiesPerPage);
        let page = Number(req.query.page);
        page = Number.isNaN(page) || page < 1 ? 1 : page;

        return {
            entitiesPerPage,
            totalEntitiesCount,
            totalPages: totalPages,
            currentPage: page,
            nextPage: page < totalPages ? page + 1 : null,
            prevPage: page >= 2 && page <= totalPages ? page - 1 : null
        };
    }

    /**
     * @param {e.Response} res
     * @param {number} statusCode
     * @param {Object} additionalData
     * @param {string} message
     * @return {Promise<e.Response>}
     */
    async _returnResponse(res, statusCode, additionalData = {}, message = undefined) {
        return res.status(statusCode).json({
            ...{message},
            ...additionalData
        });
    }

    /**
     * @param {e.Response} res
     * @param {number} statusCode
     * @param {Object} additionalData
     * @param {string} message
     * @return {Promise<e.Response>}
     */
    async _returnNotFound(res, statusCode = 404, additionalData = {}, message = "Entity not found") {
        return this._returnResponse(res, statusCode, additionalData, message);
    }

    /**
     * @param {e.Response} res
     * @param {number} statusCode
     * @param {Object} additionalData
     * @param {string} message
     * @return {Promise<e.Response>}
     */
    async _returnAccessDenied(res, statusCode = 401, additionalData = {},
                              message = "Access denied") {
        return this._returnResponse(res, statusCode, additionalData, message);
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @return {Promise<e.Response>}
     */
    async getAll(req, res, next) {
        try {
            let filters, sort, pagination, offset;
            filters = this._prepareFilters(req);
            sort = this._prepareSort(req);

            filters = [...req?.accessOperation?.filter, ...filters];

            const totalEntities = await this._model.getEntitiesCount(filters);

            if (this._totalEntitiesPerPage) {
                pagination = this._preparePagination(req, totalEntities);
                offset = pagination.currentPage === 1 ? 0 : (pagination.currentPage - 1) * pagination.entitiesPerPage;
            }

            const entities = await this._model.getEntities(
                req?.accessOperation?.fields,
                filters,
                sort,
                pagination?.entitiesPerPage,
                offset
            );

            return this._returnResponse(res, 200, {
                pagination,
                data: entities.map(entity => entity.toJSON())
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
    async getById(req, res, next) {
        try {
            const entity = await this._getEntityByIdAndAccessFilter(req);

            if (!entity) {
                return this._returnNotFound(res);
            }

            return this._returnResponse(res, 200, {
                data: entity.toJSON()
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
    async create(req, res, next) {
        try {
            const fields = this._prepareFields(req);

            if (this._model._fields.includes(this._model._creationByRelationFieldName)) {
                fields[this._model._creationByRelationFieldName] = req.user.id;
            }

            let newEntity = this._model.createEntity(fields);
            await newEntity.save();

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
     * @return {Promise<express.Response>}
     */
    async update(req, res, next) {
        try {
            const entity = await this._getEntityByIdAndAccessFilter(req);

            if (!entity) {
                return this._returnNotFound(res);
            }

            Object.assign(entity, this._prepareFields(req));
            await entity.save();

            return this._returnResponse(res, 200, {
                data: entity.toJSON()
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

            await entity.delete();

            return this._returnResponse(res, 200, {
                data: entity.toJSON()
            });
        } catch (e) {
            next(e);
        }
    }

    /**
     *
     * @param {e.Request} req
     * @return {Promise<Entity>}
     */
    async _getEntityByIdAndAccessFilter(req) {
        let filters = [
            new Where(
                'id',
                '=',
                Number(req.params.id)
            )
        ];

        filters = [...req?.accessOperation?.filter, ...filters];

        return await this._model.getEntities([], filters, 'id', 1);
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     * @param validationRules
     * @return {Promise<*>}
     */
    async validateBody(req, res, next, validationRules = this._validationRules) {
        await Promise.all(validationRules.map(rule => rule.run(req)));
        const validationErrors = validationResult(req);
        const validationSuccesses = [];

        validationRules.forEach(rule => {
            if (!validationErrors.array().some(error => error.path === rule.builder.fields[0])) {
                validationSuccesses.push(rule.builder.fields[0]);
            }
        });


        if (!validationErrors.isEmpty()) {
            return this._returnResponse(
                res,
                400,
                {
                    validationErrors: validationErrors.array(),
                    validationSuccesses
                },
                "Validation failed"
            );
        }

        req.validationSuccesses = validationSuccesses;
        next();
    }

    _initAccessPolicies() {
        this._accessPolicies = {
            admin: (new AccessPolicy(this._model))
                .setCreate()
                .setRead()
                .setUpdate()
                .setDelete(),
            user: (new AccessPolicy(this._model))
                .setCreate()
                .setRead([], [ { field: this._model._creationByRelationFieldName, operator: '=', value: '' } ])
                .setUpdate([], [ { field: this._model._creationByRelationFieldName, operator: '=', value: '' } ])
                .setDelete([], [ { field: this._model._creationByRelationFieldName, operator: '=', value: '' } ]),
            guest: new AccessPolicy(this._model)
        }
    }

    /**
     * @param {e.Request} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    async setAccessPolicy(req, res, next= undefined) {
        const accessPolicy = this._accessPolicies[(req?.user?.role ?? 'guest')];
        let accessOperation;
        switch (req.method) {
            case 'GET':
                accessOperation = accessPolicy.getRead(req?.user);
                break;
            case 'POST':
                accessOperation = accessPolicy.getCreate(req?.user);
                break;
            case 'PATCH':
                accessOperation = accessPolicy.getUpdate(req?.user);
                break;
            case 'DELETE':
                accessOperation = accessPolicy.getDelete(req?.user);
                break;
        }

        if (!accessOperation) {
            return this._returnAccessDenied(res, req?.user?.id ? 403 : 401);
        }

        req.accessOperation = accessOperation;

        if (typeof next === 'function') {
            next();
        }
    }


    /**
     * @param {e.Request} req
     * @return {{}}
     */
    _prepareFields(req) {
        const fields = {};
        Object.keys(req.body).forEach(key => {
            if (req.accessOperation?.fields.includes(key)) {
                fields[key] = req.body[key];
            }
        });

        return fields;
    }
}

export default Controller;