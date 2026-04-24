import imagekit from "../config/imageKit.js";
import { inngest } from "../inngest/index.js";
import StoryModel from "../models/story.model.js";
import UserModel from "../models/user.model.js";
import fs from "fs";

// Add User Story

export const addUserStory = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {content, media_type, background_color} = req.body;
        const media = req.file
        let media_url = '';

        // Upload media to Imagekit
        if(media_type === "image" || media_type === "video"){
            const fileBuffer = fs.readFileSync(media.path);
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            })
            media_url = response.url;
        }

        // Create story

        const story = await StoryModel.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color
        });


        // Schedule story deletion after 24 hours
        await inngest.send({
            name: 'app/story.delete',
            data: {storyId: story._id}
        })

        res.status(200).json({success: true});
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}

// Get User Stories

export const getStories = async (req, res) => {
    try {
        const {userId} = req.auth();

        const user = await UserModel.findById(userId);

        // User Connections and followings
        const userIds = [userId, ...user.connections, ...user.following];

        const stories = await StoryModel.find({user: {$in: userIds}}).populate('user').sort({createdAt: -1});

        res.status(200).json({success: true, stories});
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}
