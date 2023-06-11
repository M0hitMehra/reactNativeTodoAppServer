export const sendToken = (res, user, statusCode = 200, message) => {
  const token = user.getJWTToken();

  const options = {
    httpOnly: true,
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE *24*60 * 60 * 1000,)
  };

  const userData = {
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    tasks: user.tasks,
    verified: user.verified
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user: userData,
  });
};
