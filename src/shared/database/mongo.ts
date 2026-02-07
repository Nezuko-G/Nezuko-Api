import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const dbUri = process.env.DB_URI as string;

    if (!dbUri) {
      throw new Error("DB_URI environment variable is not defined");
    }

    await mongoose.connect(dbUri);
    console.log("Database connected");
  } catch (error) {
    console.error("DB connection failed", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("Database disconnected");
  } catch (error) {
    console.error("DB disconnection failed", error);
  }
};
