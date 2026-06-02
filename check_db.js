import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mediai-healthcare').then(async () => {
  const doctors = await mongoose.connection.collection('doctors').find().toArray();
  console.log(JSON.stringify(doctors.map(d => ({ fullName: d.fullName, degreeCertificate: d.degreeCertificate, governmentId: d.governmentId })), null, 2));
  process.exit(0);
});
