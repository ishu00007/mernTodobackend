import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config({path : '../.env'})
import { DATABASE_NAME } from "../../constant.js";


const MONGO_URL = process.env.MONGO_URL

const a = `${MONGO_URL}/${DATABASE_NAME}`;

const connectDB = async() => {
    try {
        const connectedDB = await mongoose.connect(a)
        console.log(`mongo db successfully connected : ${connectedDB.connection.host}`);
    } catch (error) {
        console.log(`error while connecting mongodb ${error}`)
        process.exit(1)
    }
}

export {connectDB}