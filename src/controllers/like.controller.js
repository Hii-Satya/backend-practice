import { Mongoose } from "mongoose";
import { Like } from "../models/like.model";
import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";


const addLike=asyncHandler(async(req,res)=>{
    const {videoId} = req.body

    const updatedVideo=await Video.findByIdAndUpdate(
        videoId,
        {
            $inc:{
                likeCount: 1,
            },
        },
        
            {
                $new:true,
                projection:{likeCount:1}
            }
    )
    if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Like added successfully"));
})

const getLikedVideo =asyncHandler(async(req,res)=>{
    const {userId} = req.user._id
    const likedVideo =await Like.aggregate([
        {
            $match:{
                likeBy:new Mongoose.Types.ObjectId(userId),
                video:{$exists :true},
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $project:{
                            videourl:1,
                            thumbnail:1,
                            owner:1,
                            subscribers:1,
                            title:1,
                            description:1,
                            duration:1,
                            views:1,
                            isPublished:1
                        },
                    },
                    {
                        $lookup:{
                           from:"users",
                           localField:"owner",
                           foreignField:"_id",
                           as:"owner",
                           pipeline:[
                            {
                                $lookup:{
                                    from:"subscriptions",
                                    localField:"_id",
                                    foreignField:"channel",
                                    as:"subscribers",
                                }
                            },{
                                $addFields:{
                                    subscribers:{
                                        $size:"$subscribers",
                                    },
                                },
                            },
                            {
                                 $project: {
                                _id: 0,
                                avatar: 1,
                                fullname: 1,
                                username: 1,
                                },
                            },
                           ] 
                        },
                    },
                    {
                        $addFields: {
                           owner: {
                             $first: "$owner",
                            },
                        },
                    }

                ]
            },
        },

        {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },

    {
         $project: {
        video: 1,
      },
    }
    ])
})
return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "fetched liked videos"));

export {
    addLike,
    getLikedVideo

}