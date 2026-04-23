import imagekit from "../config/imageKit.js";
import UserModel from "../models/user.model.js";
import PostModel from "../models/post.model.js";
import ConnectionModel from "../models/connection.model.js";
import fs from "fs";
import { inngest } from "../inngest/index.js";

// Get user Data using userId

export const getUserData = async (req, res) => {
    try {
        const {userId} = req.auth();
        const user = await UserModel.findById(userId);
        if(!user){
            return res.status(404).json({success: false, message: "User not found"});
        }
        return res.status(200).json({success: true, user});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}


// Update user Data using userId

export const updateUserData = async (req, res) => {
    try {
        const {userId} = req.auth();
        let {full_name, bio, location, username} = req.body;
        const tempUser = await UserModel.findById(userId);

        !username && (username = tempUser.username)

        if(tempUser.username !== username){
            const user = await UserModel.findOne({username})
            if(user){
                // we will not change the username if it is already taken
                username = tempUser.username;

            }
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name
        }

        const profile = req.files.profile && req.files.profile[0];
        const cover = req.files.cover && req.files.cover[0];

        if(profile){
            const buffer = fs.readFileSync(profile.path);
            const response = await imagekit.upload({
                file: buffer,
                fileName: profile.originalname,
            }
            )

            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '512' }
                ]
            })
            updatedData.profile_picture = url;
        }

        if(cover){
            const buffer = fs.readFileSync(cover.path);
            const response = await imagekit.upload({
                file: buffer,
                fileName: cover.originalname,
            }
            )

            const url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' }
                ]
            })
            updatedData.cover_photo = url;
        }

        const user = await UserModel.findByIdAndUpdate(userId, updatedData, {new: true});
        return res.status(200).json({success: true, user, message: "Profile updated successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}

// Find Users using username, email, location, name

export const discoverUsers = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {input} = req.body;

        const allUsers = await UserModel.find({
            $or: [
                {username: new RegExp(input, "i")},
                {email: new RegExp(input, "i")},
                {full_name: new RegExp(input, "i")},
                {location: new RegExp(input, "i")}
            ]
        })

        const filteredUsers = allUsers.filter(user => user._id !== userId);

        res.status(200).json({success: true, users: filteredUsers});

    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}


// Follow User

export const followUser = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await UserModel.findById(userId);
        
        if(user.following.includes(id)){
            return res.status(400).json({success: false, message: "You are already following this user"});
        }

        user.following.push(id);

        await user.save();

        const toUser = await UserModel.findById(id);
        toUser.followers.push(userId);
        await toUser.save();


        res.status(200).json({success: true, message: "Now you are following this user"});


    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}

// Unfollow User

export const unfollowUser = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const user = await UserModel.findById(userId);
        
        user.following = user.following.filter(user => user !== id);
        await user.save();

        const toUser = await UserModel.findById(id);
        toUser.followers = toUser.followers.filter(user => user !== userId);
        await toUser.save();

        res.status(200).json({success: true, message: "You are no longer following this user"});


    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}


// Send Connection Request

export const sendConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        // Check if user has sent more than 20 connection requests in the last 24 hours

        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const connectionRequests = await ConnectionModel.find({
            from_user_id: userId,
            created_at: {$gt: last24Hours}
        });
        
        if(connectionRequests.length >= 20){
            return res.status(400).json({success: false, message: "You have sent more than 20 connection requests in the last 24 hours"});
        }

        // check if users are already connected
        const connection = await ConnectionModel.findOne({
            $or: [
                {from_user_id: userId, to_user_id: id},
                {from_user_id: id, to_user_id: userId}
            ]
        });
        
        if(!connection){
            const newConnection = await ConnectionModel.create({
                from_user_id: userId,
                to_user_id: id,
            });

            await inngest.send({
                name: 'app/connection-request',
                data: {connectionId: newConnection._id}
            })

            return res.status(200).json({success: true, message: "Connection request sent successfully"});
        } else if(connection && connection.status === "accepted"){
            return res.status(400).json({success: false, message: "You are already connected with this user"});
        } 
        return res.status(400).json({success: false, message: "You have already sent a connection request to this user"});

    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}


// Get user connections
export const getUserConnections = async (req, res) => {
    try {
        const {userId} = req.auth();
        
        const user = await UserModel.findById(userId).populate("connections followers following");

        const connections = user.connections
        const followers = user.followers
        const following = user.following

        const pendingConnections = (await ConnectionModel.find({
            to_user_id: userId,
            status: "pending"
        }).populate("from_user_id")).map(connection => connection.from_user_id);
        
        res.status(200).json({success: true, connections, followers, following, pendingConnections});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}

// Accept Connection Request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {id} = req.body;

        const connection = await ConnectionModel.findOne({
            from_user_id: id,
            to_user_id: userId,
        });
        
        if(!connection){
            return res.status(404).json({success: false, message: "Connection request not found"});
        }

        const user = await UserModel.findById(userId);
        user.connections.push(id);
        await user.save();


        const toUser = await UserModel.findById(id);
        toUser.connections.push(userId);
        await toUser.save();
       

        connection.status = "accepted";
        await connection.save();

        res.status(200).json({success: true, message: "Connection request accepted successfully"});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}


// Get user Profiles

export const getUserProfiles = async (req, res) => {
    try {
        const {profileId} = req.body;
        const profile = await UserModel.findById(profileId);
        
        if(!profile){
            return res.status(404).json({success: false, message: "Profile not found"});
        }

        const posts = await PostModel.find({user: profileId}).populate("user");

        res.status(200).json({success: true, profile, posts});
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}