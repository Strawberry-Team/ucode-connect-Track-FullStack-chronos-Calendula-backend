import Model from "../model.js";
import EventEntity from "./entity.js";
import UserModel from "../user/model.js";

class EventModel extends Model {
    constructor() {
        super(
            'events',
            [
                'id',
                'creationByUserId',
                'title',
                'description',
                'category',
                'type',
                'startAt',
                'endAt',
                'creationAt'
            ],
            EventEntity);
    }
}

export default EventModel;