import { User } from "../models/users.js";
import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs";

export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const avatar = req.files.avatar.tempFilePath;

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please fill all the required fields", 404));
  }

  const isExist = await User.findOne({ email });

  if (isExist) return next(new ErrorHandler("User already exists", 400));

  const mycloud = await cloudinary.v2.uploader.upload(avatar, {
    folder: "todoApp",
  });

  fs.rmSync("./tmp", { recursive: true });

  const otp = Math.floor(Math.random() * 1000000);

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
    otp,
    otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
  });

  sendMail(
    email,
    "Verify Your Account",
    `Your OTP is ${otp} if you haven't requested for this then ignore this message`
  );

  // images

  await user.save();
  sendToken(res, user, 201, "Opt Sent please verify your account");
});

export const verify = catchAsyncError(async (req, res, next) => {
  const otp = Number(req.body.otp);

  const user = await User.findById(req.user._id);
  console.log(user.otp_expiry < Date.now());
  if (user.otp !== otp || user.otp_expiry < Date.now())
    return next(new ErrorHandler("Invalid otp", 400));

  user.verified = true;
  user.otp = null;
  user.otp_expiry = null;

  await user.save();

  sendToken(res, user, 200, "Account verified successfully");
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please fill all required fields", 401));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid credentials", 401));
  const passwordMatcher = await user.comparePassword(password);
  // console.log(passwordMatcher)
  if (!passwordMatcher)
    return next(new ErrorHandler("Invalid credentials", 401));
  sendToken(res, user, 200, "Logged in successfully");
});

export const logout = catchAsyncError(async (req, res, next) => {
   
  const options = {
    httpOnly: true,
    expires: new Date(Date.now()),
  };

  res.status(200).cookie("token", null, options).json({
    success: false,
    message: "Logged out successfully",
  });
});

export const addTask = catchAsyncError(async (req, res, next) => {
  const { title, description } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not exists", 404));

  let task = {
    title,
    description,
    completed: false,
    created: new Date(Date.now()),
  };
  user.tasks.push(task);

  await user.save();

  res.status(200).json({
    success: true,
    message: "Task added successfully",
    tasks: user.tasks,
  });
});

export const removeTask = catchAsyncError(async (req, res, next) => {
  const { taskId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not exists", 404));

  user.tasks = user.tasks.filter(
    (task) => task._id.toString() !== taskId.toString()
  );

  await user.save();

  res.status(200).json({
    success: true,
    message: "Task removed successfully",
    tasks: user.tasks,
  });
});

export const updateTask = catchAsyncError(async (req, res, next) => {
  const { taskId } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not exists", 404));

  user.task = user.tasks.find(
    (task) => task._id.toString() === taskId.toString()
  );
  user.task.completed = !user.task.completed;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Task updated successfully",
    tasks: user.tasks,
  });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const _id = req.user._id;
  const user = await User.findById(_id);

  sendToken(res, user, 200, `Welcome back ${user.name}`);
});

export const updateMyProfile = catchAsyncError(async (req, res, next) => {
  const _id = req.user._id;
  const { name } = req.body;
  const avatar = req.files.avatar.tempFilePath;
  const user = await User.findById(_id);
  if (name) user.name = name;
  if (avatar) {
    await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    const mycloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "todoApp",
    });
    fs.rmSync("./tmp", { recursive: true });
    user.avatar = {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    };
  }
  await user.save();
  res.status(200).json({
    success: true,
    message: "Your profile has been updated",
  });
});

export const updatePassword = catchAsyncError(async (req, res, next) => {
  const _id = req.user._id;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("Please enter all the required fields", 400));
  const user = await User.findById(_id).select("+password");

  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) return next(new ErrorHandler("Invalid old password", 400));
  user.password = newPassword;

  await user.save();
  res.status(200).json({
    success: true,
    message: "Your password has been updated",
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  if (!email)
    return next(new ErrorHandler("Please enter all the required fields", 400));
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("User not exists", 404));

  const otp = Math.floor(Math.random() * 1000000);
  const resetPasswordOtpExpiry = new Date(
    Date.now() + process.env.OTP_EXPIRE * 60 * 1000
  );

  user.resetPasswordOtp = otp;
  user.resetPasswordOtpExpiry = resetPasswordOtpExpiry;

  sendMail(
    email,
    "Request for password reset",
    `Your OTP for reseting password is ${otp} if you haven't requested for this then ignore this message`
  );

  await user.save();
  sendToken(res, user, 201, "Opt Sent for reseting password");
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { otp, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordOtp: otp,
    resetPasswordOtpExpiry: {
      $gt: Date.now(),
    },
  }).select("+password");
  if (!user)
    return next(new ErrorHandler("Invalid Otp or OTP has been expired", 400));

  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpiry = null;
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
