import dbConnection from './db/db.js';
import Entity from './entity.js';
import Where from './db/sql/where.js';

class Model {
    _dbConnection;
    _table;
    _fields;
    _entityClass = Entity;
    _creationByRelationFieldName = 'creationByUserId';

    /**
     * @param {string} table
     * @param {[string]} fields
     * @param {Entity} entityClass
     */
    constructor(table, fields = ['id'], entityClass = undefined) {
        this._table = table;
        this._fields = fields;
        this._dbConnection = dbConnection;
        if (entityClass) {
            this._entityClass = entityClass;
        }
    }

    /**
     * @param {[string]} fields
     * @return {string}
     * @private
     */
    _getSelect(fields = []) {
        fields = fields.length === 0 ? this._fields : fields;
        return `
            SELECT
                ${fields.join(', ')}
            FROM
                \`${this._table}\`
        `;
    }

    /**
     * @param {[Where|[Where]]} where
     */
    async _getWhere(where) {
        let result = '';
        for (let i = 0; i < where.length; i++) {
            if (result === '') {
                result = 'WHERE ';
            }

            if (Array.isArray(where[i])) {
                let orPart = where[i].map(item => {
                    return item.toString();
                }).join(' OR ');

                result += `(${orPart})`;
            } else {
                result += where[i].toString();
            }

            if (typeof where[i + 1] === "object" && !Array.isArray(where[i + 1])) {
                result += ' AND ';
            }
        }

        return result;
    }

    /**
     * @param {string} orderBy
     * @return {string}
     * @private
     */
    _getOrderBy(orderBy) {
        return orderBy ? `ORDER BY ${orderBy}` : '';
    }

    /**
     * @param {number} limit
     * @return {string}
     * @private
     */
    _getLimit(limit) {
        return limit ? `LIMIT ${limit}` : '';
    }

    /**
     * @param {number} offset
     * @return {string}
     * @private
     */
    _getOffset(offset) {
        return offset ? `OFFSET ${offset}` : '';
    }

    /**
     * @param {Object} data
     * @return {Entity}
     */
    createEntity(data = {}) {
        return new this._entityClass(this, data);
    }

    /**
     * @param {[string]} fields
     * @param {[Where|[Where]]} where
     * @param {string} orderBy
     * @param {number} limit
     * @param {number} offset
     * @param {boolean} withRelations
     * @return {Promise<[Entity]|Entity>}
     */
    async getEntities(
        fields = [],
        where = [],
        orderBy = 'id',
        limit = undefined,
        offset = undefined,
        withRelations = true
    ) {
        const query = `
            ${this._getSelect(fields)}
            ${await this._getWhere(where)}
            ${this._getOrderBy(orderBy)}
            ${this._getLimit(limit)}
            ${this._getOffset(offset)}
        `;

        const [rawData] = await this._dbConnection.query(query);

        const entities = rawData.map(item => {
            return this.createEntity(item);
        });

        if (withRelations) {
            for (const entity of entities) {
                await entity.prepareRelationFields();
            }
        }

        if (limit === 1) {
            return entities.length === 1 ? entities[0] : null;
        } else {
            return entities;
        }
    }

    /**
     * @param {[Where|[Where]]} where
     * @return {Promise<number>}
     */
    async getEntitiesCount(where) {
        const [result] = await this._dbConnection.query(`
            SELECT
                COUNT(id) AS counter
            FROM
                ${this._table}
            ${await this._getWhere(where)}
        `);

        return result[0].counter;
    }

    /**
     * @param {number} id
     * @param {boolean} withRelations
     * @return {Promise<Entity>}
     */
    async getEntityById(id, withRelations = true) {
        return await this.getEntities(
            [],
            [
                new Where('id', '=', id)
            ],
            'id',
            1,
            undefined,
            withRelations
        );
    }
}

export default Model;