import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


const verifyJWT = asyncHandler( async (req , res , next) => {
    
    // console.log(req);
    try {
        const token = req.cookies?.accessToken || req.headers.authorization
        
        if(!token){
            throw new ApiError(400 , "user is not logged in")
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select( " -password -refreshToken  " )

        // i can send password in user but i am not doing it for making the app more secure 
    
        if(!user){
            throw new ApiError(400 , "error while finding user while verifying jwt")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401 , error?.message || "invalid access token")
    }
})

export { verifyJWT }