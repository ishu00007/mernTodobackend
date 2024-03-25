import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.js';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async ( filePath ) => {
    try {
        if(!filePath) return null

        const response = await cloudinary.uploader.upload(filePath , {
            resource_type : 'auto'
        })

        console.log(`file uploaded on cloudinary ${response.url}`);

        fs.unlinkSync(filePath)

        return response

    } catch (error) {
        fs.unlinkSync(filePath)
        throw new ApiError(500 , 'error while uploading file on cloudinary')
    }
}

export {uploadOnCloudinary}