import Entity from "../entity.js";

class CalendarEntity extends Entity {
    /**
     * @param {CalendarModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);
    }
}

export default CalendarEntity;