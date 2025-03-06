import Model from "./model.js";

class Entity {
    /**
     * @type {Model}
     */
    _model;

    _publicFields = [];

    /**
     * @param {Model} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        this._model = model;
        if (data) {
            for (const key in data) {
                if (this._model._fields.includes(key)) {
                    this[key] = data[key];
                }
            }
        }

        this._publicFields = [...this._model._fields];
    }

    async save() {
        const fields = Object.keys(this)
            .filter(key => this._model._fields.includes(key));
        const values = fields
            .map(field => this[field]);

        if (this.id) {
            const parameters = fields.map(field => `${field} = ?`).join(', ');

            await this._model._dbConnection.query(
                `UPDATE ${this._model._table} SET ${parameters} WHERE id = ?`,
                [...values, this.id]
            );
        } else {
            const parameters = fields.join(', ');
            const placeholders = fields.map(() => '?').join(', ');

            const [result] = await this._model._dbConnection.query(
                `INSERT INTO ${this._model._table} (${parameters}) VALUES (${placeholders})`,
                values
            );

            this.id = result.insertId;
        }
    }

    async delete() {
        if (this.id) {
            await this._model._dbConnection.query(
                `DELETE FROM ${this._model._table} WHERE id = ?`, [this.id]
            );
        }
    }

    _getRelationFields() {
        return {};
    }

    async prepareRelationFields() {
        if (typeof this._getRelationFields !== 'function') {
            return;
        }

        const relationFields = this._getRelationFields();
        await Promise.all(
            Object.keys(relationFields).map(async (field) => this[field] = await relationFields[field]())
        );
    }

    /**
     * @return {Object}
     */
    toJSON() {
        const jsonEntity = {};
        this._publicFields.forEach(field => {
            if (this[field] === undefined || this[field] === null) {
                return;
            }

            let value = this[field];
            if (typeof value === 'object' && (
                value instanceof Entity
                || value?.constructor?.name === 'Entity'
            )) {
                value = value.toJSON();
            }

            if (Array.isArray(value)) {
                value = value.map(item => {
                    if (typeof item === 'object' && (
                        item instanceof Entity
                        || item?.constructor?.name === 'Entity'
                    )) {
                        return item.toJSON();
                    }
                })
            }

            jsonEntity[field] = value;
        });

        return jsonEntity;
    }

}

export default Entity;