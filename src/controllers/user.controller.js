import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken=async(UserId)=>{
  try {
        const user=await User.findById(UserId)
      if (!user) {
      throw new ApiError(404, "User not found while generating tokens");  
    }
      // console.log(user)
        const accessToken= user.generateAccessToken()
        console.log(accessToken)
        const refreshToken =user.generateRefreshToken()
        console.log(refreshToken)

        user.refreshToken=refreshToken
        user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}

  } catch (error) {
    throw new ApiError(500 , "Something went wrong while generating acccess And Refresh token");
  }
}

const registerUser =asyncHandler(async (req,res)=>{
//    get user details from frontend
//    validation not empty
//    check is user already exist : username ,email
//    check for images check for avtar
//    upload them to cloudinary , avtar
//    crate user object - create entry in db
//    remove password and refresh token field from response
//    check for user creation 
//    return res


const{username,fullName , email  , password} =req.body
// console.log("email" , email);
if( [fullName,username,email,password].some((field)=>field?.trim()==="")  ) {
   throw new ApiError(400,"All Fields are required");
}


const existedUser= await User.findOne({
    $or: [{username}, { email }]
  })

  if (existedUser) {
   throw new ApiError(409,"User Already Exist")
  }


const avatarLocalPath=  req.files?.avatar[0]?.path;
//  const coverImageLocalPath =req.files?.coverImage[0]?.path;

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalPath = req.files.coverImage[0].path
}

 if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
 }
  const avatar=await uploadOnCloudinary(avatarLocalPath)
  const coverImage= uploadOnCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(400,"Avatar file is required")
  }

   const user= await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })


   const createdUser=await User.findById(user._id).select(
    "-password  -refreshToken"
   )

   if (!createdUser) {
    throw new ApiError(500,"Something went wrong while registering the user")
   }

   return res.status(201).json(
    new ApiResponse(200,createdUser,"User register Successfully")
   )
})

const loginUser = asyncHandler(async(req,res)=>{ 
// username password from frontend
// check if username is exist or not
// check is username and password match with database 
// if match generate access and refresh token and send it to the user

  const {username , email ,password } =req.body
  if(!username && !email ){
    throw new ApiError(400,"Email or Username is required")
  }
   
   const user = await User.findOne({
    $or: [{ username } , { email }]
   })

   if(!user){
        throw new ApiError(400,"Email or Username is doesn't exist")
   }

    const isPasswordValid= await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Password  is Wrong")
   }

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const  options={
      httpOnly:true,
      secure:true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,{
        user : loggedInUser,accessToken,refreshToken
      },
      "User Logged in Successfully"
      )
    )
})


const logoutUser=asyncHandler(async(req,res)=>{

     await User.findByIdAndUpdate(req.user._id,
      {
        $set:{
          refreshToken:undefined
        },
      },
      {
        new:true
      }
     )
      const  options={
      httpOnly:true,
      secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200 ,{},"User Logout Successfully"));
})


const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request");
  }
try {
  
    const decodedToken =jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user=await User.findById(decodedToken?._id)
     if(!user){
      throw new ApiError(401,"Invalid Refresh Token");
    }
  
    if(incomingRefreshToken!= user?.refreshToken){
       throw new ApiError(401,"Refresh token is expired or used");
    }
    const  options={
        httpOnly:true,
        secure:true
      }
      const {accessToken,newrefreshToken}= await generateAccessAndRefreshToken(user._id)
  
      return res
      .status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newrefreshToken,options)
      .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken :newrefreshToken},
          "Access Token Refreshed"
        )
      )
  
} catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token"  )
}
  })

export { registerUser,loginUser,logoutUser,refreshAccessToken}