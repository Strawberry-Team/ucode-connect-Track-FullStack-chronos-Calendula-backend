class Where {
    /**
     * @type {string} field
     */
    field;

    /**
     * @type {string} operator
     */
    operator;

    /**
     * @type {string|number|[string]|[Where]} value
     */
    value;


    /**
     * @param {string} field
     * @param {string} operator
     * @param {string|number|[string|number]|[Where]} value
     */
    constructor(field, operator, value) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }

    toString() {
        let value = '';
        if (Array.isArray(this.value)) {
            value = `(${this.value.map(item => 
                Number.isInteger(item) ? item : `"${item}"`
            ).join(', ')})`;
        } else if(Number.isInteger(this.value)) {
            value = this.value;
        } else if(this.value === null) {
            value = this.value;
        } else {
            value = `"${this.value}"`;
        }

        return `${this.field} ${this.operator} ${value}`;
    }
}

export default Where;