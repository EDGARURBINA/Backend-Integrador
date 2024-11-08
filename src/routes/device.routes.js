import { Router } from "express";
import * as deviceCtrl from "../controllers/device.controller.js"

const router = Router();

router.post("/", deviceCtrl.createDevice)
router.get("/",deviceCtrl.getAllDevices)
router.get("/:id",deviceCtrl.getDeviceById)
router.put("/:id",deviceCtrl.updateDevice)
router.delete("/:id",deviceCtrl.deleteDevice)

export default router;



