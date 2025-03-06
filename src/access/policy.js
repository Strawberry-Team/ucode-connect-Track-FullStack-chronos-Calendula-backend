import AccessOperation from "./operation.js";
import Where from "../sql/where.js";
import UserEntity from "../user/entity.js";

class AccessPolicy {
    #model;

    create;
    read;
    update;
    delete;

    /**
     * @param {Model} model
     */
    constructor(model) {
        this.#model = model;
    }



    /**
     *
     * @param {string} name
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    #setOperationByName(name, fields = [], filter = []) {
        this[name] = {
            fields: fields.length === 0
                ? this.#model._fields
                : fields,
            filter
        }

        return this;
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setCreate(fields = [], filter = []) {
        return this.#setOperationByName('create', fields, filter);
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setRead(fields = [], filter = []) {
        return this.#setOperationByName('read', fields, filter);
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setUpdate(fields = [], filter = []) {
        return this.#setOperationByName('update', fields, filter);
    }

    /**
     * @param {[string]} fields
     * @param {[{field: string, operator: string, value: string|number|[string|number]}]} filter
     */
    setDelete(fields = [], filter = []) {
        return this.#setOperationByName('delete', fields, filter);
    }

    #createFilters(filters = [], user = undefined) {
        const result = [];
        filters.forEach(filter => {
            if (Array.isArray(filter)) {
                result.push(this.#createFilters(filter, user));
            } else {
                result.push(
                    new Where(
                        filter.field,
                        filter.operator,
                        filter.field === this.#model._creationByRelationFieldName
                            ? user?.id
                            : filter.value
                    )
                );
            }
        });

        return result;
    }

    /**
     * @param {string} name
     * @param {UserEntity} user
     * @return {AccessOperation}
     */
    #getOperationByName(name, user = undefined) {
        let accessOperation;
        if (this[name]) {
            accessOperation = new AccessOperation(
                this[name].fields,
                this.#createFilters(
                    this[name].filter,
                    user
                )
            );
        }

        return accessOperation;
    }

    /**
     * @param {UserEntity} user
     * @return {AccessOperation}
     */
    getCreate(user = undefined) {
        return this.#getOperationByName('create', user);
    }

    /**
     * @param {UserEntity} user
     * @return {AccessOperation}
     */
    getRead(user = undefined) {
        return this.#getOperationByName('read', user);
    }

    /**
     * @param {UserEntity} user
     * @return {AccessOperation}
     */
    getUpdate(user = undefined) {
        return this.#getOperationByName('update', user);
    }

    /**
     * @param {UserEntity} user
     * @return {AccessOperation}
     */
    getDelete(user = undefined) {
        return this.#getOperationByName('delete', user);
    }

    #removeAccessForOperation(operationName) {
        this[operationName] = undefined;
        return this;
    }

    removeCreate() {
        return this.#removeAccessForOperation('create');
    }

    removeRead() {
        return this.#removeAccessForOperation('read');
    }

    removeUpdate() {
        return this.#removeAccessForOperation('update');
    }

    removeDelete() {
        return this.#removeAccessForOperation('delete');
    }

    removeAll() {
        return this
            .removeCreate()
            .removeRead()
            .removeUpdate()
            .removeDelete();
    }
}

export default AccessPolicy;
