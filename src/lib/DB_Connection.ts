import mongoose from "mongoose";

type ConnectionObject = {
    isConnected : number
}

const connection : ConnectionObject = {
    isConnected: 0
}

const connectDB = async (): Promise<void> => {
    try {

        if (connection.isConnected) {
            console.log("Already connected to database")
            return
        }
        const db = await mongoose.connect(process.env.MONGO_URI || "")

        console.log("connection", connection);
        
        connection.isConnected = db.connections[0].readyState
        console.log("Connected to database")

    } catch (error) {
        
        console.log("Error connecting to database", error)
        process.exit(1)

    }

}

export default connectDB