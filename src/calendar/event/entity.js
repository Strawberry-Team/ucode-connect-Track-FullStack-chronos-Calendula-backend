import Entity from "../../entity.js";
import UserModel from "../../user/model.js";

class CalendarEventEntity extends Entity {
    /**
     * @param {CalendarEventModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);
    }
}

export default CalendarEventEntity;