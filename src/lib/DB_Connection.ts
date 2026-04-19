import mongoose from "mongoose";

type MongooseCache = {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
    mongooseCache?: MongooseCache;
};

const cached: MongooseCache =
    globalWithMongoose.mongooseCache ??
    (globalWithMongoose.mongooseCache = {
        conn: null,
        promise: null,
    });

const connectDB = async (): Promise<typeof mongoose> => {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("Missing MONGO_URI (or MONGODB_URI) environment variable");
    }

    // Reuse an active connection across requests.
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    // Reuse in-flight connection attempt to avoid duplicate connects.
    if (cached.promise) {
        return cached.promise;
    }

    cached.promise = mongoose
        .connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        })
        .then((mongooseInstance) => {
            cached.conn = mongooseInstance;
            return mongooseInstance;
        })
        .catch((error: unknown) => {
            cached.promise = null;
            throw error;
        });

    return cached.promise;
};

export default connectDB;