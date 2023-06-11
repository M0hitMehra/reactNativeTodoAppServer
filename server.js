import { app } from "./app.js";
import { dbConnect } from "./config/db.js";
import dotenv from "dotenv";
import errorMiddleware from "./middlewares/Error.js";
import cloudinary from "cloudinary"

dotenv.config({
  path: "./config/config.env",
});

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET, 
})

dbConnect();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});


app.use(errorMiddleware )