import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import { inngest, functions } from "./inngest/index.js"
import { serve } from "inngest/express"
import { clerkMiddleware } from '@clerk/express'
import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import storyRouter from "./routes/story.routes.js";
import messageRouter from "./routes/message.routes.js";

await connectDB();

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api/inngest", serve({ client: inngest, functions }))

app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/story", storyRouter);
app.use("/api/messages", messageRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});