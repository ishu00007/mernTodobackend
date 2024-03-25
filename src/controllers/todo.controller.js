import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Todo } from "../models/todo.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";



const addTodo = asyncHandler( async (req , res) => {
    const loggedInUser = req.user;

    const { title , description } = req.body

    if(!title){
        throw new ApiError(400 , "todo is requried!!")
    }

        const user = await User.findById(loggedInUser?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(400 , "error while finding logged in user while adding to do ")
        }

        const existedTodo = await Todo.findOne({
            $and : [ { title : title } , { owner : user._id }]
        })

        if(existedTodo){
            throw new ApiError(400 , "this to do already exists!!")
        }
    
        const newTodo = await Todo.create({
            title : title ,
            description : description ? description : null ,
            owner :  user._id
        })

        if(!newTodo){
            throw new ApiError(500 , "error while adding todo to the database!")
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newTodo,
                "new todo created!!"
            )
        )
    


});

const updateTodo = asyncHandler( async (req , res) => {


    try {
        const { title , description } = req.body
        const  todoId  = req.headers.id ? req.headers.id : req.params.todoId
        const loggedInUser = req.user; // from verify jwt

        if(!loggedInUser){
            throw new ApiError(400 , "user must be logged to update todo")
        }

        const user = await User.findById(loggedInUser._id).select("-password -refreshToken")


        if(!user){
            throw new ApiError(400 , "error while finding logged in user in database to update to-do")
        }

        if(!title && !description){
            throw new ApiError(400 , "atleast one field must be updated !!")
        }

        if(!isValidObjectId(todoId)){
            throw new ApiError(400 , "valid todo id is required ")
        }

        const updatedFields = {}

        if(title){
            updatedFields.title = title
        }
        if(description){
            updatedFields.description = description
        }

        const todo = await Todo.findById(todoId)


        if(!todo){
            throw new ApiError(400 , "this to-do doesnt exist!")
        }

        if(todo.owner.toString() !== user._id.toString()){
            throw new ApiError(400 , "only owner can update this todo!")
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            todoId ,
            updatedFields ,
            {new : true}
        )

        return res
        .status(200)
        .json(
            new ApiResponse(
                200 ,
                updatedTodo ,
                "todo updated successfully"
            )
        )

    } catch (error) {
        throw new ApiError(400 , error?.message || "error while updating the todo!")
    } 
})

const deleteTodo = asyncHandler ( async (req , res) => {
    const  loggedInUser = req.user;
    const { title } = req.body

    // console.log(req.params);
    const todoId = req.headers.id ? req.headers.id : req.params

    // console.log(req);

    if(!title && Object.keys(todoId).length === 0){
        throw new ApiError(400 , "either title or todoId is required for deleting todo")
    }

    if(title && Object.keys(todoId).length !== 0){
        throw new ApiError(400 , "only one is required either title or todoId")
    }

    try {

        const user = await User.findById(loggedInUser?._id).select(" -password -refreshToken")

        var deletedTodo ;

        if( Object.keys(todoId).length !== 0 ){
            deletedTodo = await Todo.findByIdAndDelete(todoId) 

        }else if(title){
            deletedTodo = await Todo.findOneAndDelete({
                $and : [ { title : title } , { owner : user?._id }]
            })
        }

        if(!deletedTodo){
            throw new ApiError(500 , "error while deleting the todo OR this todo does not exist!!")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(
                200 ,
                deletedTodo,
                "to-do deleted successfully"
            )
        )
    } catch (error) {
        throw new ApiError(400 , error?.message || "error while deleting the todo")
    }
})

const toggleComplete = asyncHandler( async (req , res) => {
    const loggedInUser = req.user 

    const  todoId = req.headers.id ? req.headers.id : req.params.todoId

    if(!loggedInUser){
        throw new ApiError(400 , "user is not logged in")
    }

    if(!todoId || !isValidObjectId(todoId)){
        throw new ApiError(400 , "todoId is required ")
    }

    const todo = await Todo.findById(todoId) 
    
    if(!todo){
        throw new ApiError(400 , "error while finding todo in database")
    }

    if(loggedInUser._id.toString() !== todo.owner.toString()){
        throw new ApiError(400 , "only owner can update his own todos")
    }

    const updatedTodo = await Todo.findByIdAndUpdate(todoId , {completed : !todo.completed})

    if(!updatedTodo){
        throw new ApiError(500 , "error while toggling completeness")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200 ,
            updatedTodo , 
            "toggled successfully!"
        )
    )


})



export {
    addTodo,
    updateTodo,
    deleteTodo,
    toggleComplete
}
