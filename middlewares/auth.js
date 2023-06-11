import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler.js";
import { catchAsyncError } from "./catchAsyncErrors.js";
import { User } from "../models/users.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
    const {token } = req.cookies

    if(!token) return next(new ErrorHandler("Please login to access this page",401));

    const decoded = jwt.verify(token , process.env.JWT_SECRET)

    req.user = await User.findById(decoded._id)

    next()

});
