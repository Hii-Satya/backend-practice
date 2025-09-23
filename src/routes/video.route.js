import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { deleteVideo, getAllVideos, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";


const router =Router();

router.route("/").get(getAllVideos)
router.route("/upload").post(
    verifyJWT,
    upload.fields([
       {
         name: "thumbnail",
         maxCount:1
        },
        {
        name:"video",
        maxCount:1   
        },
    ]),
    publishAVideo
);


router.route("/watch" ).get(verifyJWT,getAllVideos)

router.route("/toggle-publish/:videoId").patch(verifyJWT, togglePublishStatus);

router.route("/delete/:videoId").delete(verifyJWT,deleteVideo)
router.route("/update-video/:videoId").post(upload.single("thumbnail"),verifyJWT,updateVideo)

export default router