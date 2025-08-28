const express = require('express')
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

//cookieparser is used to setand access the cookies of user's browser from the server


export {app}