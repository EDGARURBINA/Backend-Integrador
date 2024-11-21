import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js"; 

const router = Router();

router.post('/signup', authCtrl.signUp);
router.post('/signin', authCtrl.signin);
router.post('/recover-password', authCtrl.recoverPassword);
router.put("/:id",authCtrl.updateUserDevice)

export default router;