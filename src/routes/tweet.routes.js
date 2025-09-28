import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addTweet,
        deleteTweet,
        getUserTweet,
        updateTweet} from "../controllers/tweet.controller.js"



    const router =Router();
    router.use(verifyJWT)
    router.route("/create").post(addTweet)
    router.route("/delete/:tweetId").delete(deleteTweet)
    router.route("/update/:tweetId").patch(updateTweet)
    router.route("/:userId").get(getUserTweet)

    export default router