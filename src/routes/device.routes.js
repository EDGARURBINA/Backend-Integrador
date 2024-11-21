import { Router } from "express";
import * as deviceCtrl from "../controllers/device.controller.js"
import { verifyToken , isAdmin } from "../middlewares/authJwt.js"

const router = Router();

router.post("/",[verifyToken, isAdmin],deviceCtrl.createDevice)
router.get("/",deviceCtrl.getAllDevices)
router.get("/:id",deviceCtrl.getDeviceById)
router.put("/:id",deviceCtrl.updateDevice)
router.delete("/:id",deviceCtrl.deleteDevice)

router.post("/manual-history", deviceCtrl.addManualHistory);





router.get("/:id/history", deviceCtrl.getDeviceHistory);

export default router;



