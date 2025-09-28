import { Router } from "express";
import { addLike,getLikedVideo} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router =Router()

router.use(verifyJWT)

router.route("/toggle").post(addLike)
router.route("/liked-videos").get(getLikedVideo)

export default router