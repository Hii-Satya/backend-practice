import mongoose, { Mongoose } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import {Subscription} from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const getChannelSubscriber = asyncHandler(async(req,res)=>{
    const {channelId } =req.params

    if (!channelId) {
    throw new ApiError(400, "Channel id is required");
  }
   
  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "Channel doesn't exist");
  }

  const subscribers=await Subscription.aggregate([
    {
        $match:{
            channel: new mongoose.Types.ObjectId(channelId)
        },
    },
        {
            $lookup:{
              from:"users",
              localField:"subscriber",
              foreignField:"_id",
              as:"subscribers",
              pipeline:[
                {
                    $project:{
                        username:1,
                        fullName:1,
                        email:1,
                        avatar:1

                    }
                }
              ]
            }
        },
        {
            $project:{
                _id:0,
                subscribers:1,
            }
        }
    
  ])


   return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribers: subscribers[0]?.subscribers?.length,
        subscribersChannels: subscribers[0]?.subscribers,
      },
      "fetched subscribers"
    )
  );


})


const getSubbscribedChannel =asyncHandler(async(req,res)=>{
    const {subscriberId} = req.user._id
    const subscribed = await Subscription.aggregate([
        {
            $match:{
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            _id:0,
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channel:{
                    $first:"$channel"
                }
            }
        },
         {
            $project:{channel:1}
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribed, " subscribed user fetched"));
})



const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} =req.params

    const channelObjectId= new mongoose.Types.ObjectId(channelId);
    const currUserObjectId = new mongoose.Types.ObjectId(req.user._id);

    if(!channelObjectId) {
        throw new ApiError(401,"Channel id is required")
    }

     if (channelObjectId.equals(currUserObjectId)) {
    throw new ApiError(400, "Cannot perform this operation with your channel");
  }

  const channel =await User.findById(channelId)
  if(!channel)  throw new ApiError(401,"Channel not found")

  let isSubscribed =await Subscription.findOne({
    subscriber:currUserObjectId,
    channel:channelObjectId
  })

  if(!isSubscribed){
    isSubscribed =await Subscription.create({
    subscriber:currUserObjectId,
    channel:channelObjectId
  })
  }

  else{
    isSubscribed =await Subscription.deleteOne({
    subscriber:currUserObjectId,
    channel:channelObjectId
  })
  }

  console.log(isSubscribed)

   return res
    .status(200)
    .json(new ApiResponse(200, { isSubscribed }, "Toggled subscription"));
})

export {
    getChannelSubscriber,
    getSubbscribedChannel,
    toggleSubscription
}