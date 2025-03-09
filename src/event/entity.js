import Entity from "../entity.js";

class EventEntity extends Entity {
    /**
     * @param {EventModel} model
     * @param {Object} data
     */
    constructor(model, data = {}) {
        super(model, data);
    }
}

export default EventEntity;