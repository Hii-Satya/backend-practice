import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getChannelSubscriber,
         getSubbscribedChannel,
         toggleSubscription} from "../controllers/subscription.controller.js"


    const router = Router();
    router.use(verifyJWT)

    router.route("/toogle/:channelId").post(toggleSubscription);
    router.route("/subscribers/:channelId").get(getChannelSubscriber)
    router.route("/subscribed").get(getSubbscribedChannel)

    export default router;
