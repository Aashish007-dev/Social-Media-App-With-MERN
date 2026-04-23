import imagekit from "../config/imageKit.js";
import PostModel from "../models/post.model.js";
import UserModel from "../models/user.model.js";
import fs from "fs";

// Add Post
export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { content, post_type } = req.body;
    const images = req.files;
    let image_urls = [];

    if (images.length) {
      image_urls = await Promise.all(
        images.map(async (image) => {
          const fileBuffer = fs.readFileSync(image.path);
          const response = await imagekit.upload({
            file: fileBuffer,
            fileName: image.originalname,
            folder: "posts",
          });

          const url = imagekit.url({
            path: response.filePath,
            transformation: [
              { quality: "auto" },
              { format: "webp" },
              { width: "1280" },
            ],
          });
          return url;
        }),
      );
    }
    await PostModel.create({
      user: userId,
      content,
      image_urls,
      post_type,
    });
    return res.status(200).json({ success: true, message: "Post created successfully"});

  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};


// Get posts

export const getFeedPosts = async (req, res) => {
    try {
        const {userId} = req.auth();
        const user = await UserModel.findById(userId);
       
        // User connections and followings
        const userIds = [ userId, ...user.connections, ...user.following]
        const posts = await PostModel.find({user: {$in: userIds}}).populate('user').sort({createdAt: -1});

        res.status(200).json({success: true, posts});
    } catch (error) {
        console.log(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
    }
}

// Like post 

export const likePost = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {postId} = req.body;

        const post = await PostModel.findById(postId);
        if(!post){
            return res.status(404).json({success: false, message: "Post not found"});
        }

        if(post.likes_count.includes(userId)){
            post.likes_count = post.likes_count.filter(user => user !== userId);
            await post.save();
            res.status(200).json({success: true, message: "Post unliked "});
        } else {
            post.likes_count.push(userId);
            await post.save();
            res.status(200).json({success: true, message: "Post liked"});
        }
        
    } catch (error) {
        console.log(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
    }
}
