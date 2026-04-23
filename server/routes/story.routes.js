import express from "express";
import { addUserStory, getStories } from "../controllers/story.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import upload from "../config/multer.js";

const storyRouter = express.Router();

storyRouter.post("/create", upload.single("media"), protect, addUserStory);
storyRouter.get("/get", protect, getStories);

export default storyRouter;