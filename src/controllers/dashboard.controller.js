import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {Video} from "../models/video.model.js"

const getChannelDashboard = asyncHandler(async(req,res)=>{
    const {channelId} = req.user._id

    const stats = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelId)
            },
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"videos",
            },
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $addFields:{
                totalVideo:{
                    $size:"$videos",
                },
                totalVideoViews:{
                    $sum:{
                        $map:{
                            $input:"$videos",
                            as:"$video",
                            in:"$video.views"
                        },
                    },
                },
               subscribers:{
                $size:"$subscribers"
               },
            },
        },
        {
            $project:{
                _id:0,
                subscribers:1,
                totalVideo:1,
                totalVideoViews:1
            }
        }
    ])
      return res.status(200).json(new ApiResponse(200, stats, "fetched stats"));
})





const getChannelVideos =asyncHandler(async(req,res)=>{
    const {channelId} = req.user._id
    if(!channelId) throw new ApiError(404,"Channel not Found")

    const videos = await Video.find({
        owner:new mongoose.Types.ObjectId(channelId),
    }).select("-__v");
     
return res.status(200).json(new ApiResponse(200, videos, "Fetched videos"));

})
export {
    getChannelDashboard,
    getChannelVideos

} 