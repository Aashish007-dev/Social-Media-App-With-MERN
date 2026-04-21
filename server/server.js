import express from "express";
import "dotenv/config";
import cors from "cors";
import connectDB from "./config/db.js";
import { inngest, functions } from "./inngest/index.js"
import { serve } from "inngest/express"

await connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api/inngest", serve({ client: inngest, functions }))

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});