import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    tasks: [
      {
        title: String,
        description: String,
        createdAt: Date,
        completed: Boolean,
      },
    ],
    otp: Number,
    otp_expiry: Date,
    resetPasswordOtp:Number,
    resetPasswordOtpExpiry:Date,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

userSchema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_COOKIE_EXPIRE *24*60*60  * 1000,
  });
};

userSchema.methods.comparePassword = async   function(newpassword){
  const match = await bcrypt.compare(newpassword, this.password);
  return match
}

userSchema.index({otp_expiry:1}, {expireAfterSeconds:1} )

export const User = mongoose.model("User", userSchema);
