import express from "express";
import { addTodo, deleteTodo, updateTodo , toggleComplete } from "../controllers/todo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const TodoRouter = express.Router()

TodoRouter.use(verifyJWT)

// upload.none() solves the problem of not getting the data form form-data from postman api

TodoRouter.route("/addTodo").post(upload.none() , addTodo)
TodoRouter.route("/updateTodo/:todoId").post(upload.none() , updateTodo)
TodoRouter.route("/updateTodo").post(upload.none() , updateTodo)
TodoRouter.route("/deleteTodo").delete(upload.none() , deleteTodo)
TodoRouter.route("/deleteTodo/:todoId").delete(upload.none() , deleteTodo)
TodoRouter.route("/toggleCompleteness/:todoId").get( upload.none() , toggleComplete);
TodoRouter.route("/toggleCompleteness").get( upload.none() , toggleComplete);


export {TodoRouter}