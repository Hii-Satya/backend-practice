import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Tweet} from "../models/tweet.model.js"
import { User } from "../models/user.models";

const addTweet = asyncHandler(async(req,res)=>{

    const owner =req.user._id
    const content = req.body

    if(!content.trim() ){
        throw new ApiError(400,"Content is requrired")
    }

    const tweet =await Tweet.create({
        owner,
        content
    })

     return res.status(201).json(new ApiResponse(201, tweet, "Tweet created"));
}) 



const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} =req.params
    if(!tweetId ) throw   new ApiError(401,"Please provide a tweet to delete")

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if (!deletedTweet) {
    throw new ApiError(404, "tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
})




const getUserTweet = asyncHandler(async(req,res)=>{
    const {userId} =req.params
    const user= await User.findById(userId)
    if(!user) throw new ApiError(401,"User tweet not exist")
    
    const tweet =  await Tweet.find({
        owner:new mongoose.Types.ObjectId(userId),
    })

      return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Fetched tweets successfully"));

})



const updateTweet =asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const {newContent } = req.body

    if(!newContent.trim()){
        throw new ApiError(400, "new contend should not be empty");
    }
 
    const updatedTweet = await Tweet.updateOne(
       {_id: new mongoose.Types.ObjectId(tweetId)},
       {
        $set:{
           content:newContent
        },
       }
    )

    if(!updatedTweet?.modifiedCount){
      throw new ApiError(401,"Invalid Tweet ")
    }

      return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated"));

})
export{
    addTweet,
    deleteTweet,
    getUserTweet,
    updateTweet
}