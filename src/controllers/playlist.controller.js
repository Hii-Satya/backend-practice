import { Mongoose } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import {User} from"../models/user.models.js"

const addVideoToPlaylist =asyncHandler(async(req,res)=>{

    const {videoId,playlistId} = req.params
    if(!videoId || !playlistId ) throw ApiError(401,"Video Id and Playlist Id both are required")

    const video = await Video.findById(videoId)
    const playlist = await Playlist.findById(playlistId)

    if(!video) throw ApiError(401,"Video not exist")
    if(!playlist) throw ApiError(401,"Playlist not exist")

     const add = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{videos:videoId}, //
        },
        {new:true}
     );
     
    return res
    .status(200)
    .json(new ApiResponse(200, addVideoToPlaylist, "Added video in playlist."));
});


const removeVideoFromPlaylist =asyncHandler(async(req,res)=>{
    const{videoId,playlistId} =req.params
     if(!videoId || !playlistId ) throw ApiError(401,"Video Id and Playlist Id both are required")

     const removeVideo = await Playlist.findByIdAndUpdate(
        playlistId,
        {
           $pull:{videos: new Mongoose.Types.ObjectId(videoId)},
        },
     );

     console.log(removeVideo);

     if(!removeVideo.videos.length) {
        throw new ApiError(401,"Video doesn't exist ")
     }

    const playlist = await Playlist.findById(playlistId)

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Added video in playlist."));
   
})

const deletePlaylist =asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    if(!playlistId) throw ApiError(401," Playlist Id both are required")

    const removePlaylist =await Playlist.findByIdAndDelete(
        playlistId,
    )
    if(!removePlaylist){
        throw ApiError(401,"Playlist does not exist")
    }    
     return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist is deleted successfully"));
})

const createPlaylist = asyncHandler(async(req,res)=>{
    const {description, name} = req.body
       if(!description || !name ) throw ApiError(401,"Name and Description  both are required")
     const newPlaylist=await Playlist.create({
       name:name,
       description,
       owner:req.user._id 
    })

    return res
    .status(200)
    .json(new ApiResponse(200, createPlaylist , "Playlist created successfully"));

})



const getPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId} = req.params
    const playlist = await Playlist.aggregate([
       {
         $match:{
            _id: new Mongoose.Types.ObjectId(playlistId)
        },
    },
    {
        $lookup:{
            from:"videos",
            localField:"videos", // 
            foreignField:"_id",
            as:"videos",
            pipeline:[
                {
                    $project:{
                        title:1,
                        description:1,
                        videoUrl:1,
                        thumbnail:1,
                        duration :1,
                        createdAt:1,
                        views:1,
                    }
                }
            ]
        }
    }
    ])

    if(!playlist){
        throw ApiError(401,"Playlist doesn't exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Fetched Playlist"))
})


const getUserPlaylist = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    const user=  await User.findById(userId)
    if(!user) throw ApiError(401,"User doesn't exist")
    const userPlaylist = await Playlist.find(
    {
    owner : userId,
})

return res
.status(200)
.json(new ApiResponse(200,userPlaylist,"Fetched Playlist"));

})

const updatePlaylist =asyncHandler(async(req,res)=>{
    const {playlistId} =req.params
    const { name,description} = req.body
    if(!description && !name ){ 
         throw ApiError(401,"Name and Description  both are required")

    }
    if(!playlistId) throw ApiError(401,"Playlist id is required for updation")
     
    const nonemptyelement={};
    if(description){
        nonemptyelement.description =description;
    }
    if(name){
        nonemptyelement.name =name;
    }
   
    const updatedPlaylist =await Playlist.findByIdAndUpdate(

        playlistId,
        {
          $set:{...nonemptyelement}
        },
        { new : true},
    );

     return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
    
})

export {
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    createPlaylist,
    getPlaylist,
    getUserPlaylist,
    updatePlaylist
    
}