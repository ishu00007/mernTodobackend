import mongoose from "mongoose"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ApiError } from "../utils/ApiError.js";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'


const validateEmail = (email) => {
    var re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(re.test(email) === false){
        throw new ApiError(400 , "invalid email adress")
    }

    
    return re.test(email)
};

const validatePassword = (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?~]).{7,16}$/;
    return re.test(password)
};

const userSchema = new mongoose.Schema({
    username : {
        type : String ,
        required : true ,
        unique : true
    } ,
    name : {
        type : String ,
        required : true ,
        match : [/^[a-zA-Z]+/ , "name can only have alphabets"]
    } ,
    
    email : {
        type : String ,
        required : true ,
        unique : true ,
        validate : [validateEmail , "please fill a valid email address!"],
        match : [ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ , "Please check your email address."] 
    } ,
    password : {
        type : String ,
        required : true ,
        validate : [ validatePassword , " password must have a lowercase letter , uppercase letter , a special character , a number "],
        match : [ /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{}[\]|\\;:'",.<>/?~]).{7,16}$/ , " password must have a lowercase letter , uppercase letter , a special character , a number "]
        
    } ,

    avatar : {
        type : String   // from cloudinary
    } ,
    age : {
        type : Number ,
        required : true ,
        match  : [ /^([3-9][0-9])$/ , 'Age must be between 3 and 99']
    } ,
    refreshToken : {
        type : String
    },
    todos : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'Todo'
        }
    ] ,
    accessToken : {
        type : String
    }

} , {timestamps: true})

userSchema.plugin(aggregatePaginate)

userSchema.pre("save" , async function (next) {

    if(!this.isModified("password")) return next()

    else {try {
        this.password = await bcrypt.hash(this.password , 10)
        next()
    } catch (error) {
        console.log("error while hashing password!");
    }
}
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id
    } ,
    process.env.ACCESS_TOKEN_SECRET ,
    {expiresIn : process.env.ACCESS_TOKEN_EXPIRY})
}


// we are getting error when we use arrow function because in arrow funciton this keyword does not refer to the userScema it will refer to the window;

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id
    } ,
    process.env.REFRESH_TOKEN_SECRET ,
    {expiresIn : process.env.REFRESH_TOKEN_EXPIRY})
}

export const User = mongoose.model("User" , userSchema)