import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import mongoose from "mongoose";




const app = express()

app.use(cors())

app.use( express.json() )
app.use(express.urlencoded({ extended : false }))
app.use(cookieParser())

// Routes

import { userRouter } from "./src/routes/user.routes.js";
import { TodoRouter } from "./src/routes/todo.routes.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

app.use("/api/v1/users" , userRouter)
app.use("/api/v1/todo" , TodoRouter)


mongoose.plugin(mongooseAggregatePaginate)


export default app