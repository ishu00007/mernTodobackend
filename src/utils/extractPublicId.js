import { ApiError } from "./ApiError.js"

const extractPublicIdFromUrl = async(url) => {

    if(typeof(url) !== 'string'){
        throw new ApiError(400 , "error while extracting public id from url , url must be a string")
    }

    const startIndex = url.lastIndexOf('/')+1   
    const lasttIndex = url.lastIndexOf('.')

    const publicId = url.substring(startIndex , lasttIndex)

    return publicId
}

export {extractPublicIdFromUrl}