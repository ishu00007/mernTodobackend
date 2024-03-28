import express from 'express'
import { createNewUser, deleteAccount, getAllTodo_User, getLoggedInUser, logIn, logOut, refreshAccessToken, updateAvatar, updatePassword, updateProfile } from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const userRouter = express.Router()

userRouter.route("/signUp").post( upload.single("avatar") , createNewUser)
userRouter.route("/login").post( upload.none() , logIn )
userRouter.route("/updatepassword").post(upload.none() , verifyJWT , updatePassword)
userRouter.route("/refreshAccessToken").get(refreshAccessToken)
userRouter.route("/deleteaccount").delete(verifyJWT , upload.none() , deleteAccount)
userRouter.route("/getalltodos").get(verifyJWT, getAllTodo_User) 
userRouter.route("/getLoggedInUser").get(verifyJWT , getLoggedInUser)
userRouter.route("/logOut").get(verifyJWT , logOut)
userRouter.route("/updateAvatar").post(verifyJWT , upload.single("avatar") , updateAvatar)
userRouter.route("/updateProfile").post(verifyJWT , upload.single("avatar") , updateProfile)

export {userRouter}