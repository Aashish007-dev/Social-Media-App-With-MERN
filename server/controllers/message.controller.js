import fs from 'fs';
import imageKit from '../config/imagekit.js';
import MessageModel from '../models/message.model.js';
import imagekit from '../config/imagekit.js';


// Create an empty object to store SS Event connection
const connections = {};

// Controller function for SSE endpoint
export const sseController = async (req, res) => {
    try {
        const {userId} = req.params;
        console.log("New client connected: ", userId);

        // set SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");

        // Store the connection
        connections[userId] = res;

        // Send initial event
        res.write('log: Connected to SSE stream\n\n')

        // Handle client disconnection
        req.on('close', () => {
            delete connections[userId];
            console.log(`Client disconnected: ${userId}`);
        })
        
    } catch (error) {
        console.log("Error in SSE controller: ", error);
    }
}

// Send message
export const sendMessage = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id, text} = req.body;

        const image = req.file;

        let media_url = '';
        let message_type = image ? 'image' : 'text';

        if(message_type === "image"){
            const fileBuffer = fs.readFileSync(image.path);
            const response = await imageKit.upload({
                file: fileBuffer,
                fileName: image.originalname,
            });

            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    {quality: 'auto'},
                    {width: 1280},
                    {format: 'webp'}
                ]
            })

        }

        const message = await MessageModel.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url,
          
        })

        res.status(200).json({success: true, message: "Message sent successfully"});


        // send message to to_user_idusing SSC

        const messageWithUserData = await MessageModel.findById(message._id).populate("from_user_id");

        if(connections[to_user_id]){
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`);
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Failed to send message"});
    }
}


// Get chat Messages

export const getChatMessages = async (req, res) => {
    try {
        const {userId} = req.auth();
        const {to_user_id} = req.body;

        const messages = await MessageModel.find({
            $or: [
                {from_user_id: userId, to_user_id},
                {from_user_id: to_user_id, to_user_id: userId}
            ]
        }).sort({created_at: 1});

        // mark messages as seen
        await MessageModel.updateMany(
            {from_user_id: to_user_id, to_user_id: userId},
            {seen: true}
        );

        res.status(200).json({success: true, messages});
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Failed to get chat messages"});
    }
}

export const getUserRecentMessages = async (req, res) => {
    try {
        const {userId} = req.auth();

        const messages = await MessageModel.find({to_user_id: userId}.populate('from_user_id to_user_id')).sort({created_at: -1});

        res.status(200).json({success: true, messages});
    } catch (error) {
        console.log(error);
        res.status(500).json({success: false, message: "Failed to get user recent messages"});
    }
}