import mongoose from "mongoose";

const connectDB = async () => {

    try {
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected");
        });
        await mongoose.connect(`${process.env.MONGODB_URL}/pingup`);
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
};

export default connectDB;