import express from "express"
const app = express()
import cors from "cors"
import cookieParser from "cookie-parser"

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//we are setting limit for preventing server crash that how much amount of data we accept in json .There are various ways in which data is sent here we are handling only json data

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
//static is use for storing pdf image in the server
app.use(express.static("public"))  //here public is the folder where we store the files

//cookieparser is used to set and access the cookies of user's browser from the server
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js" 

// routes declaration
app.use("/api/v1/users",userRouter)


app.use(express.json({ limit: "16kb" })); // Allows json and limit of the json file size
app.use(express.urlencoded({ extended: true })); // parses incoming URL-encoded form data (like data submitted via HTML forms).
app.use(express.static("public")); // This serves static files (images, CSS, PDFs, etc.) directly from the public/ folder.
app.use(cookieParser()); // Allows read cookies sent by the client and also send cookies back.


import videoRoute from "./routes/video.route.js"
app.use("/api/v1/videos",videoRoute)
export {app}