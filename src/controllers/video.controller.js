import mongoose ,{isValidObjectId} from "mongoose";
import { User } from "../models/user.models.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { removeCloudinaryFile } from "../utils/removeCloudinaryFile.js";
import { Like } from "../models/like.model.js";
import {Comment} from "../models/comment.model.js"

const getAllVideos =asyncHandler(async(req,res)=>{
  /* 
   example queries: 
    page = 2
    limit = 5
    query = "developer"
    sortBy = "createdAt"
    sortType = "desc" || "asc" // asc mean small or last comes first(date) and desc mean big come first, recent date first
    userId = "45sjhehr"
    */
  /**
     -> Get query params from frontend - page, limit, query, sortBy, sortType, userId 
     -> Explore mongoose-aggregate-paginate-v2 and implement aggregation
     -> get 
     */
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "",
    sortType = "",
    userId,
  } = req.query;

  const options = {
    page,
    limit,
    offset: page * limit - limit,
  };

  if (sortBy) {
    options.sort = { [sortBy]: sortType };
  }

  const aggregateVideos = Video.aggregate([
    {
      $match: {
        owner: { $ne: new mongoose.Types.ObjectId(userId) }, // don't send user videos
      },
    },
    {
      $match: {
        $or: [
          {
            title: {
              $regex: query,
              $options: "i",
            },
          },
          {
            description: {
              $regex: query,
              $options: "i",
            },
          },
        ],
      },
    },
  ]);

  const videos = await Video.aggregatePaginate(aggregateVideos, options);

  return res
    .status(200)
    .json(new ApiResponse(200, { videos: videos.docs }, "videos fetched"));
});


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!req.files?.video || !req.files?.video[0]) {
    throw new ApiError(400, "Video file is required");
  }

  try {
    // Upload video
    const videoResult = await uploadOnCloudinary(req.files.video[0].path);
    if (!videoResult) throw new ApiError(500, "Video upload failed");

    // Upload thumbnail if provided
    let thumbnailUrl = "";
    if (req.files?.thumbnail?.[0]) {
      const thumbResult = await uploadOnCloudinary(req.files.thumbnail[0].path);
      thumbnailUrl = thumbResult?.secure_url || "";
    } else {
      // Or auto-generate thumbnail from Cloudinary
      thumbnailUrl = cloudinary.url(videoResult.public_id + ".jpg", {
        resource_type: "video",
        format: "jpg",
        transformation: [{ width: 500, height: 300, crop: "fill" }]
      });
    }

    // Save to DB
    const videoData = await Video.create({
      title,
      description,
      videoFile: videoResult.secure_url,
      thumbnail: thumbnailUrl,
      duration: videoResult.duration,
      owner: req.user?._id
    });

    return res.status(201).json(
      new ApiResponse(201, videoData, "Video Published Successfully")
    );
  } catch (error) {
    console.error(error);
    throw new ApiError(500, "Error in publishing video");
  }
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.query

    const matchVideo =await Video.aggregate([
      {
        $match : {
        _id:new mongoose.Types.ObjectId(videoId)
      },
    },

    {
      $lookup:{
       from: "subscription",
       localField:_id,
       foreignField:"video",
       as:"subscribers"
      },
    },
       {
        $lookup:{
        from :"likes",
        localField:"_id",
        foreignField:"video",
        as:"likes"
      },
    },
      { 
       $lookup:{
        from :"comments",
        localField:"_id",
        foreignField:"video",
        as:"comments"
      },

    },

    {
      $addFields:{
        subscriberCount:{
          $size:"$subscribers"
        },
        likeCount:{
          $size:"$likes"
        },
      },

    },
    {
      $project:{
        likeCount:1,
         thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        subscribersCount: 1,
        comments: 1,
        createdAt: 1,
      }
    }
    ])

    if(!matchVideo[0]?.isPublished){
        return res
        .status(200)
        .json(
          new ApiResponse(200,{},"This Video is private")
        )
    }

    return res
    .status(200)
    .json(
      new ApiResponse(200,matchVideo[0],"video fetch successfull")
    )
    
  })

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
     const data = req.body
    let title =data?.title
    let description=data?.description
    const updatableFields={}
    if(title){
      updatableFields.title=title;
    }

    if(description){
      updatableFields.description=description;
    }

    const newThumbnailLocalPath=req.file?.path;
    if(!title && !description && !newThumbnailLocalPath){
      throw new ApiError(400,"Atleast one filed is required to update video")
    }

    let thumbnail;
    if(newThumbnailLocalPath){
      updatableFields.thumbnail=null
      thumbnail=await uploadOnCloudinary(newThumbnailLocalPath)

      if(!thumbnail){
        throw new ApiError(401,"Something went wrong while updating thumbnail")
      }

      updatableFields.thumbnail=thumbnail.url
    }

    const oldImageInstance=req.user.thumbnail

    const updateVideoRespose =await Video.findByIdAndUpdate(
      videoId,

      
      {
        $set:{
          ...updatableFields,
        },
      },
      {new :true}
    )

    if(oldImageInstance){
      await removeCloudinaryFile(oldImageInstance)
    }

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {updateVideo : updateVideoRespose},
        "Video Updated Successfully"
      )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
   if(!videoId){
    throw new ApiError(401,"Video is required")
   }

   const video =await Video.findById(new mongoose.Types.ObjectId(videoId))
   if(!video){
    throw new ApiError(401, "Video not found")
   }

   const videoObjectId=new mongoose.Types.ObjectId(video._id)
   await User.updateMany(
    {
      watchHistory:videoObjectId,
    },
    {
      $pull:{watchHistory:videoObjectId}
    }
   );

   await  Like.deleteMany({
    video :videoObjectId})
   await Comment.deleteMany({
    video:videoObjectId
   });

   const thumbnail=video.thumbnail
   const videoUrl=video.videoUrl
   await Video.findByIdAndDelete(videoObjectId)

  await removeCloudinaryFile(thumbnail);
  await removeCloudinaryFile(videoUrl, "video");
   return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const  response= await Video.findByIdAndUpdate(
      videoId,
      [
        {
          $set:{
            isPublished : { $not : "$isPublished"}
          },
        },
      ],
      {
        new:true,
      }
    )


    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {isPublished: response.isPublished},
        "Toogle Published Video Status"
      )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}