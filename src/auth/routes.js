import express from "express";
const router = express.Router();
import authController from './controller.js';

router.post('/register',
    authController.setAccessPolicy.bind(authController),
    authController.checkAccess.bind(authController),
    authController.validateBody.bind(authController),
    authController.create.bind(authController)
);

router.post('/login',
    authController.setAccessPolicy.bind(authController),
    authController.checkAccess.bind(authController),
    authController.validateLogin.bind(authController),
    authController.login.bind(authController)
);

router.get('/confirm-email/:token/',
    authController.checkAccess.bind(authController),
    authController.confirmEmail.bind(authController)
);

router.post('/password-reset/',
    authController.setAccessPolicy.bind(authController),
    authController.checkAccess.bind(authController),
    authController.validatePasswordReset.bind(authController),
    authController.passwordReset.bind(authController)
);

router.post('/password-reset/:token/',
    authController.setAccessPolicy.bind(authController),
    authController.checkAccess.bind(authController),
    authController.validatePasswordConfirm.bind(authController),
    authController.confirmPasswordReset.bind(authController)
);

router.post('/logout',
    authController.setAccessPolicy.bind(authController),
    authController.logout.bind(authController)
);

export default router;