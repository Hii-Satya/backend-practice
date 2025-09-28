import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    createPlaylist,
    getPlaylist,
    getUserPlaylist,
    updatePlaylist} from "../controllers/playlist.controller.js"


    const router =Router();
    router.use(verifyJWT)

    router.route("/create").post(createPlaylist)
    router.route("/update/:playlistId").patch(updatePlaylist)
    router.route("/delete/:playlistId").delete(deletePlaylist)
    router.route("/add-video/:playlistId/:videoId").patch(addVideoToPlaylist)
    router.route("/remove-video/:playlistId/:videoId").patch(removeVideoFromPlaylist)
    router.route("/user/:userId").get(getUserPlaylist)
    router.route("/:playlistId").get(getPlaylist)

    export default router