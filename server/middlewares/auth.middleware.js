export const protect = async (req, res, next) => {
    try {
        const {userId} = await req.auth();
        if(!userId){
            return res.status(401).json({success: false, message: "Not authenticated"});
        } 

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}