import express from "express";
import { addPost, getFeedPosts, likePost } from "../controllers/post.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import upload from "../config/multer.js";

const postRouter = express.Router();

postRouter.post("/add", upload.array("images", 4), protect, addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/like", protect, likePost);

export default postRouter;