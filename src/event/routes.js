import express from "express";
import controller from "./controller.js";
const router = express.Router();

router.get('/',
    controller.setAccessPolicy.bind(controller),
    controller.getAll.bind(controller)
);

router.get('/:id/',
    controller.setAccessPolicy.bind(controller),
    controller.getById.bind(controller)
);

router.post('/',
    controller.setAccessPolicy.bind(controller),
    controller.validateBody.bind(controller),
    controller._canCreateEvents.bind(controller),
    controller.create.bind(controller)
);

router.patch('/:id/',
    controller.setAccessPolicy.bind(controller),
    controller.validateBody.bind(controller),
    controller.update.bind(controller)
);

router.delete('/:id/',
    controller.setAccessPolicy.bind(controller),
    controller.delete.bind(controller)
);

router.patch('/:id/:command/',
    controller.setAccessPolicy.bind(controller),
    controller.joinOrLeaveOrTentative.bind(controller)
);

export default router;