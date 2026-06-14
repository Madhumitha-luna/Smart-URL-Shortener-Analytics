const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  try {
    let dbUri = process.env.MONGODB_URI;

    if (!dbUri) {
      console.log('No MONGODB_URI found in environment. Starting in-memory MongoDB server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '4.4.29'
        }
      });
      dbUri = mongoServer.getUri();
      console.log(`In-memory MongoDB server started at: ${dbUri}`);
    }

    const conn = await mongoose.connect(dbUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('In-memory MongoDB server stopped.');
    }
  } catch (error) {
    console.error(`Error closing database: ${error.message}`);
  }
};

module.exports = { connectDB, closeDB };
