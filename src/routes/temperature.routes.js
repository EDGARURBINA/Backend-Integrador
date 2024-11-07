import { Router } from "express";
import  * as  temperatureCtrl from "../controllers/temperature.controller.js"

const router = Router();


router.post("/", temperatureCtrl.createTemperature)
router.get("/", temperatureCtrl.getTemperatures)
router.delete("/:id",temperatureCtrl.deleteTemperature)

export default router;