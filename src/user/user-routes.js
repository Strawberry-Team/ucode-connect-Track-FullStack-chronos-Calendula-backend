import express from "express";
import UserController from "./user-controller.js";
import uploadMiddleware from "../middlewares/profile-picture-uploader-middleware.js";
const router = express.Router();
const controller = new UserController();

router.get('/',
    controller.setAccessPolicy.bind(controller),
    controller.getAll.bind(controller)
);

router.get('/:id/',
    controller.setAccessPolicy.bind(controller),
    controller.getById.bind(controller)
);

router.patch('/:id/',
    controller.setAccessPolicy.bind(controller),
    controller.validateUpdate.bind(controller),
    controller.update.bind(controller)
);

router.patch('/:id/avatar/',
    controller.setAccessPolicy.bind(controller),
    uploadMiddleware,
    controller.update.bind(controller)
);

export default router;