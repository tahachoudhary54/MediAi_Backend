import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mediai-healthcare').then(async () => {
  await mongoose.connection.collection('doctors').deleteMany({});
  console.log('Deleted all doctors');
  process.exit(0);
});
