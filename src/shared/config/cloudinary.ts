import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
const api_key = process.env.CLOUDINARY_API_KEY;
const api_secret = process.env.CLOUDINARY_API_SECRET;

if (cloud_name && api_key && api_secret) {
  cloudinary.config({ cloud_name, api_key, api_secret });
} else {
  console.warn("Cloudinary not configured — upload features will be unavailable");
}

export default cloudinary;