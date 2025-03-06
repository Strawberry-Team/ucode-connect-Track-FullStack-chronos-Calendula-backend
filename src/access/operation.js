import Where from './../sql/where.js';

class AccessOperation {
    /**
     * @type {[string]}
     */
    fields;

    /**
     * @type {[Where]}
     */
    filter;

    /**
     * @param {[string]} fields
     * @param {[Where]} filter
     */
    constructor(fields = [], filter = []) {
        this.fields = fields;
        this.filter = filter;
    }
}

export default AccessOperation;