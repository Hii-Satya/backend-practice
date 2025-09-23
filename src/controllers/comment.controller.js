import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model";
import { Video } from "../models/video.model";
import mongoose, { mongo } from "mongoose";


const addComment=asyncHandler(async(req,res)=>{
    const {content,videoId} =req.body;
    const {commenterUserId} =req.user._id;
    if(!content.trim || !content || !videoId ){
        throw new ApiError(401,"All field is required")
    }
    const isvideoExist=await Video.findById(videoId);
    if(!isvideoExist){
        throw new ApiError(401,"Video doesn't exist") 
    }

    const comment =await Comment.create(
        {
            owner:commenterUserId,
            video:videoId,
            content:content.req.trim() //
        }
    );

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            comment,
            "Comment is successfully added to the video"
        )
    )
})

 const deleteComment=asyncHandler(async(req,res)=>{
     const {commenterUserId} = req.params;
     const deletedComment=await Comment.findByIdAndDelete(commenterUserId)
      if(!deletedComment){
         throw new ApiError(401,"Comment doesn't exist") 
      }

      return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            deleteComment,
            "Comment is successfully deleted from the video"
        )
    )
 })

 const updateComment=asyncHandler(async(req,res)=>{
    const {commentId} =req.params
    const {newContent}=req.body
    if(!newContent){
        throw new ApiError(401,"Please provide a new comment to update") 
    }
    if(!commentId){
        throw new ApiError(401,"Video doesn't exist") 
    }
     
    await Video.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:newContent
            },
        },
        {new :true}
    )
return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated successfully"));
 })


 const getVideoComment=asyncHandler(async(req,res)=>{
     const {videoId} = req.params
     const {page=1,limit=10} =req.query
     if(!videoId){
         throw new ApiError(400, "video is required");  
     }
     const isVideoExist=await Video.findById(videoId)
     if(!isVideoExist){
        throw new ApiError(404,"Video not found")
     }

     const options={
        page,
        limit,
        offset:page*limit -limit,
     };

     const aggregateComments=Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            },
        
        },
        {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"commenter",
              pipeline:[
                {
                    $project:{
                        avatar:1,
                        fullName:1
                    }
                }
              ]
            }
        },
        {
            $lookup :{
             from:"likes",
             localField:"_id",
             foreignField:"comment",
             as:"likes",
            }
        },
        {
            $addFields:{
                likeCount:{
                    $size:"$likes",
                },
                commenter:{$first: "$commenter"}
            },
        },
        {
          $project:{
            commenter:1, //owner:1,
            content:1,
            video:1,
            createdAt:1,
            likeCount:1
          }
        }
     ])
 const comments = await Comment.aggregatePaginate(
    aggregateComments,
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, comments?.docs, "Fetched comments"))
 })




export {
    addComment,
    deleteComment,
    updateComment,
    getVideoComment
}