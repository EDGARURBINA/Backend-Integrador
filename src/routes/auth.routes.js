import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js"; 

const router = Router();

router.post('/signup', authCtrl.signUp);
router.post('/signin', authCtrl.singin);

export default router;