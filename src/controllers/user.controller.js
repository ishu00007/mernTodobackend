import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/uploadOnCloudinary.js";
import { asyncHandler } from '../utils/asyncHandler.js'
import { Todo } from "../models/todo.model.js";
import { extractPublicIdFromUrl } from "../utils/extractPublicId.js";
import { deleteAssetFromCloudinary } from "../utils/deleteFromCloudinary.js";


var accessToken;

const generateAccess_RefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        accessToken = user.generateAccessToken()

        const refreshToken = user.generateRefreshToken()

        if (!accessToken || !refreshToken) {
            throw new ApiError(500, "error while generating access and refresh token")
        }

        user.refreshToken = refreshToken

        // here we havent stored access token in database because of security reasons and also because it will be updated in short period of time because of refresh token so the database have to update which will reduce the performances

        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        // console.log("error while generating access and refresh token :", error)
    }
}

const createNewUser = asyncHandler(async (req, res) => {

    const { name, username, age, password, email } = req.body;

    let avatar;

    if (req.file) {
        avatar = req.file?.path
    } else {
        avatar = null
    }

    if (
        [name, email, age, password, username].some(item => item === "" || item === null)
    ) {
        throw new ApiError(400, "name , email , age , password , username every field is required!")
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })


    if (existedUser) {
        throw new ApiError(400, "this user already exists!!")
        // return  res.json("user already exists")
    }

    var uploadedAvatar;

    if (avatar) {
        uploadedAvatar = await uploadOnCloudinary(avatar)
    } else {
        uploadedAvatar = null
    }


    const user = await User.create({
        username: username,
        name: name,
        email: email,
        age: age,
        password: password,
        avatar: uploadedAvatar ? uploadedAvatar.url : null
    })


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "new user registered successfully !"
            )
        )

})

const logIn = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    if ((!email && !username) || !password) {
        throw new ApiError(400, " please fill all fields ")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "this user does not exist!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "wrong password!!")
    }

    const { accessToken, refreshToken } = await generateAccess_RefreshToken(user._id)

    const loggedInUser = { ...user._doc }
    loggedInUser.accessToken = accessToken;
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        // .clearCookie("access token") 
        // .clearCookie("refresh token") 
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                loggedInUser,
                "user logged in successfully"
            )
        )

})

const updatePassword = asyncHandler(async (req, res) => {

    try {
        const loggedInUser = req.user  // i get this because before this a middleware (verifyJWT) ran  which set the user on the request object

        const { oldPassword, newPassword } = req.body

        if (!oldPassword || !newPassword) {
            throw new ApiError(400, "please provide all fields")
        }

        const user = await User.findById(loggedInUser._id).select("  -refreshToken ")

        if (!user) {
            throw new ApiError(400, "cannot find the user in database!")
        }

        const isOldPasswordValid = await user.isPasswordCorrect(oldPassword)

        if (!isOldPasswordValid) {
            throw new ApiError(401, "old password must match your previous password for updating the password !")
        }

        user.password = newPassword

        await user.save()

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    user,
                    "password updated successfully!"
                )
            )


    } catch (error) {
        throw new ApiError(400, error?.message || "catched error while updating password")
    }


})


const updateAvatar = asyncHandler(async (req, res) => {
    const loggedInUserId = req.user._id ? req.user._id : req.headers.id;
    const avatar = req.file.path;

    if (!loggedInUserId) {
        throw new ApiError(400, "logged in user id required for updating avatar");
    }

    if (!avatar) {
        throw new ApiError(400, "avatar required for updating");
    }

    const user = await User.findById(loggedInUserId);

    if (!user) {
        throw new ApiError(500, "error while finding logged in user in database");
    }

    const uploadedAvatar = await uploadOnCloudinary(avatar);

    if (!uploadedAvatar.url) { // Fix: Check if upload was successful
        throw new ApiError(500, "error while uploading avatar to cloudinary server");
    }

    if (user.avatar) {
        const prevAvatarPublicId = await extractPublicIdFromUrl(user.avatar);
        await deleteAssetFromCloudinary(prevAvatarPublicId);
    }

    

    const updatedAvatar = await User.findByIdAndUpdate(loggedInUserId, {avatar : uploadedAvatar.url})

    if(!updateAvatar){
        throw new ApiError("error while updating avatar in database")
    }



    // No need to find and update the user again, as we have already updated the avatar above
    //const updatedUser = await User.findByIdAndUpdate(loggedInUserId, { avatar: uploadedAvatar.url });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {avatar : uploadedAvatar?.url},
                "avatar updated successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const IncomingRefreshToken = req.cookies?.refreshToken

    const IncomingAccessToken = req.cookies?.accessToken

    if (!IncomingRefreshToken) {
        throw new ApiError(400, "no refresh token provided")
    }

    try {
        const decodedToken = jwt.verify(IncomingAccessToken, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select('-password')

        console.log(user.refreshToken);
        console.log(IncomingRefreshToken);

        if (!user) {
            throw new ApiError(400, "Invalid refresh token!")
        }

        if (IncomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, "refresh token is expired or does not match!")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccess_RefreshToken(user?._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    new ApiResponse(200, { accessToken, refreshToken: refreshToken }, "access token refreshed")
                )
            )

    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid refresh token")
    }

})

const deleteAccount = asyncHandler(async (req, res) => {
    const loggedInUser = req.user;
    const { password } = req.body;
    if (!loggedInUser) {
        throw new ApiError(400, "user must be logged in to delete the account!")
    }

    if (!password) {
        throw new ApiError(400, "password is requried for deleting user!")
    }

    try {
        const user = await User.findById(loggedInUser?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(500, "error while finding logged in user in database to delete the account")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)

        if (!isPasswordValid) {
            throw new ApiError(400, "ERROR : wrong password!")
        }

        const deletedUser = await User.findOneAndDelete({ _id: user._id })

        if (!deletedUser) {
            throw new ApiError(500, "not able to delete the account!")
        }

        return res
            .status(200)
            .json(
                new ApiResponse(200, deletedUser, "user deleted successfully!")
            )
    } catch (error) {
        return new ApiError(400, error?.message || "error while deleting acccount!")
    }
})

const getAllTodo_User = asyncHandler(async (req, res) => {
    const loggedInUser = req.user || req.body

    var options = {}

    const { page, limit } = req.query

    options.page = page ? page : 1
    options.limit = limit ? limit : 1



    if (!loggedInUser) {
        throw new ApiError(401, "You are not authorized to perform this action!");
    }

    const user = await User.findById(loggedInUser?._id);

    if (!user) {
        throw new ApiError(500, "Error while finding user in database!!");
    }

    const todos = await Todo.aggregate([
        {
            $match: {
                owner: user?._id
            }
        },
        {
            $group: {
                _id: null,
                todos: { $push: "$$ROOT" },
                totalTodos: { $sum: 1 },
                completedTodos: {
                    $push: {
                        $cond: { if: "$completed", then: "$$ROOT", else: "$$REMOVE" }
                    }
                },
                totalCompletedTodos: {
                    $sum: { $cond: { if: { $eq: ["$completed", true] }, then: 1, else: 0 } }
                },
                uncompletedTodos: {
                    $push: {
                        $cond: { if: { $eq: ["$completed", false] }, then: "$$ROOT", else: "$$REMOVE" }
                    }
                },
                totalUncompletedTodos: {
                    $sum: { $cond: { if: { $eq: ["$completed", false] }, then: 1, else: 0 } }
                }
            }
        },

        {
            $project: {
                _id: false,
                todos: {
                    _id: true,
                    title: true,
                    description: true,
                    owner: true,
                    createdAt: true,
                    completed: true

                },
                completedTodos: true,
                uncompletedTodos: true,
                totalTodos: true,
                totalCompletedTodos: true,
                totalUncompletedTodos: true
            }
        }
    ]);

    if (todos.length === 0) {
        return res.status(200).json(new ApiResponse(200, "there are no todos!!"))
    }


    return res.status(200).json(new ApiResponse(200, todos, "All todos fetched successfully"));
});

const getLoggedInUser = asyncHandler(async (req, res) => {
    const LoggedInUser = req.user

    if (!LoggedInUser) {
        throw new ApiError(400, "user is not logged in ")
    }

    const user = await User.findById(LoggedInUser._id)

    if (!user) {
        throw new ApiError(500, "error while finding user")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "logged in user found successfully!"
            )
        )


})

const logOut = asyncHandler(async (req, res) => {
    // console.log(req);
    const loggedInUserId = req.headers.id ? req.headers.id : req.user._id

    console.log(loggedInUserId);

    // if(isValidObjectId(loggedInUserId.toString())){
    //     throw new ApiError(400 , "enter valid user id for logging out" )
    // }

    if (!loggedInUserId) {
        throw new ApiError(400, "user is not logged in")
    }

    // if(!userId || !isValidObjectId(userId)){
    //     throw new ApiError(400 , "need a valid user id to perform this action")
    // }

    const user = await User.findById(loggedInUserId)

    if (loggedInUserId.toString() !== user._id.toString()) {
        // console.log(userId);
        // console.log(loggedInUser._id);
        throw new ApiError(403, 'You can only log out yourself')
    }



    if (!user) {
        throw new ApiError(400, "this user does not exist")
    }

    // console.log(req.cookies);
    // remove the token from cookies and set it to an empty string


    delete req.cookies.accessToken
    delete req.cookies.refreshToken


    return res
        .status(200)
        .json(
            new ApiResponse(200, req.cookies, "user logged out successfully")
        )
})

const updateProfile = asyncHandler(async (req, res) => {
    const LoggedInUserId = req.user._id || req.headers.id

    if (!LoggedInUserId) {
        throw new ApiError(400, "can't update profile ( user not logged in )")
    }

    const { name, username, age, email , password } = req.body;

    let avatar;

    if (req.file) {
        avatar = req.file?.path
    } else {
        avatar = null
    }

    if (!name && !username && !age && !email && !avatar) {
        throw new ApiError(400, "at least one field must be updated")
    }

    if(!password){
        throw new ApiError(400 , "password is required for updating profile")
    }

    const user = await User.findById(LoggedInUserId)

    if (!user) {
        throw new ApiError(400, "error while finding user in database")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400 , "wrong password !")
    }

    var updatingFields = {}

    if (name) {
        updatingFields.name = name
    }
    if (username) {
        updatingFields.username = username
    }
    if (age) {
        updatingFields.age = age
    }
    if (email) {
        updatingFields.email = email
    }

    if (avatar) {
        const uploadedAvatar = await uploadOnCloudinary(avatar, { folder: "to-do" })


        if (updateAvatar.url === null || "") {
            throw new ApiError(500, "error while uploading avatar to cloudinary server")
        }

        if (user.avatar && user.avatar !== null || "") {
            const prevAvatarPulicId = await extractPublicIdFromUrl(user.avatar)
            await deleteAssetFromCloudinary(prevAvatarPulicId)
        }

        updatingFields.avatar = uploadedAvatar.url
    }


    if (user.name === name) {
        delete updatingFields.name
    }
    if (user.username === username) {
        delete updatingFields.user
    }
    if (user.age === age) {
        delete updatingFields.age
    }
    if (user.username === username) {
        delete updatingFields.username
    }
    const updatedUser = await User.findOneAndUpdate({ _id: LoggedInUserId }, { ...updatingFields }, { new: true })
    updatedUser.accessToken = accessToken

    if (!updatedUser) {
        throw new ApiError(500, "error while updating user")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedUser, "user updated successfully!")
        )
})


export {
    createNewUser,
    logIn,
    updatePassword,
    refreshAccessToken,
    deleteAccount,
    getAllTodo_User,
    getLoggedInUser,
    logOut,
    updateAvatar,
    updateProfile
}