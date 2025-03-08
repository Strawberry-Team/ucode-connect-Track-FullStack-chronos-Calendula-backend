import express from "express";
import calendarController from "./controller.js";
const router = express.Router();

router.get('/',
    calendarController.setAccessPolicy.bind(calendarController),
    calendarController.getAll.bind(calendarController)
);

router.get('/:id/',
    calendarController.setAccessPolicy.bind(calendarController),
    calendarController.getById.bind(calendarController)
);
router.post('/',
    calendarController.setAccessPolicy.bind(calendarController),
    calendarController.validateBody.bind(calendarController),
    calendarController.create.bind(calendarController)
);

router.patch('/:id/',
    calendarController.setAccessPolicy.bind(calendarController),
    calendarController.validateBody.bind(calendarController),
    calendarController.update.bind(calendarController)
);

router.delete('/:id/',
    calendarController.setAccessPolicy.bind(calendarController),
    calendarController.delete.bind(calendarController)
);

export default router;