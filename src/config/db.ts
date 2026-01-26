import mongoose from 'mongoose';

export const connectDB = async (mongoUri: string): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
};

export default connectDB;
