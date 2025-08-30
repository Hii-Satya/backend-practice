import mongoose from "mongoose";
import {DB_NAME } from "./constants.js";
import connectDb from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
    path: "./env"
})




connectDb() //it is a async method so it return a promise
.then(() => {
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on Port ${process.env.PORT}`);
        
    })
}).catch((err) => {
    console.log("MongoDb Connection failed !!!",err);
    
});































/*
import express from 'express';
const app = express();

(async ()=>{
try {
    await mongoose.connect(`${process.env.MONGODB_URI} / ${DB_NAME}`)
    app.on("error" ,(error)=>{
        console.log("ERRR",error);
        throw error
    })

    app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
    })
} catch (error) {
    console.error("error" ,error)
    throw error
} 
}) ()
*/