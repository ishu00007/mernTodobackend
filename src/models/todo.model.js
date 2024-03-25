import mongoose from "mongoose";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const todoSchema = new mongoose.Schema({
    title : {
        type : String , 
        required : true
    } ,
    description : {
        type : String ,
        required : false
    } ,
    completed : {
        type : Boolean ,
        default : false ,
        required : true
    } ,
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    } ,
      
} , { timestamps : true })

todoSchema.plugin(aggregatePaginate)

export const Todo = mongoose.model("Todo" , todoSchema)