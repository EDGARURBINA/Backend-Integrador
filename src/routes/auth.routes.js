import { Router } from "express";
const router= Router();

import *as authCtrl from "../controllers/auth.controller"

router.post("/singin", authCtrl.singin)
router.post("/singup",authCtrl.singUp)
router.put("/updateAdmin",authCtrl.updateAdmin)

export default router;
