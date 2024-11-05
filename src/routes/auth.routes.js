// src/routes/auth.routes.js
import { Router } from "express";
import * as authCtrl from "../controllers/auth.controller.js"; // Añade la extensión .js

const router = Router();

router.post('/signup', authCtrl.singUp);
router.post('/signin', authCtrl.singin);

export default router;