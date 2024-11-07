import { Router } from "express";
import * as pre_setCtrl from "../controllers/pre_set.controller.js";

const router = Router();


router.post("/", pre_setCtrl.createPreset)
router.get("/", pre_setCtrl.getAllPresets)
router.get("/:id", pre_setCtrl.getPresetById)
router.put("/:id",pre_setCtrl.updatePreset)
router.delete("/:id",pre_setCtrl.deletePreset)

export default router;

