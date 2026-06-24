import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import ScanAuditLog from './models/ScanAuditLog.js';

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const logs = await ScanAuditLog.find().sort({ createdAt: -1 }).limit(5);
    console.log("Recent Scan Logs:");
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
