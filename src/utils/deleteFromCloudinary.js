import { v2 as cloudinary } from 'cloudinary'
import { ApiError } from './ApiError.js'

const deleteAssetFromCloudinary = async (publicId) => {
    try {
        if(!publicId){
            throw new ApiError(400, "Public Id is required for deleting the asset")
            return null
        }

        const result = await cloudinary.uploader.destroy(publicId)

        return result

    } catch (error) {
        throw new ApiError( 400 , "error while deleting asset from cloudinary" )
    }
}

export {deleteAssetFromCloudinary}