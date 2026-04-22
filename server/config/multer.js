import multer from "multer";
import path from "path";

const storage = multer.diskStorage({});

const upload = multer({ storage });

export default upload;