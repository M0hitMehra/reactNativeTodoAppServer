import express  from "express";
import { addTask, forgotPassword, getMyProfile, login, logout, register, removeTask, resetPassword, updateMyProfile, updatePassword, updateTask, verify } from "../controllers/userController.js";
import { isAuthenticated } from "../middlewares/auth.js";
 
const router = express.Router()

router.route('/register').post(register)

router.route('/verify').post(isAuthenticated ,verify )

router.route('/login').post( login )

router.route('/logout').get( logout )


router.route("/newtask").post(isAuthenticated,addTask)

router.route("/task/:taskId").get(isAuthenticated,updateTask).delete(isAuthenticated,removeTask)

router.route("/me").get(isAuthenticated,getMyProfile)

router.route("/updateprofile").put(isAuthenticated,updateMyProfile)

router.route("/updatepassword").put(isAuthenticated,updatePassword)

router.route("/forgotpassword").post(forgotPassword)

router.route("/resetpassword").put(resetPassword)




export default router