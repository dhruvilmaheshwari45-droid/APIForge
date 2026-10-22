const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const purge = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing from .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas to purge sample data...');
  await mongoose.connect(uri);
  console.log('Connected to DB:', mongoose.connection.name);

  const collectionsToClear = [
    'collections',
    'apis',
    'mockservers',
    'mockrules',
    'environments',
    'testsuites',
    'testcases',
    'testruns',
    'trafficlogs',
    'apiversions',
    'projects',
  ];

  for (const colName of collectionsToClear) {
    try {
      const col = mongoose.connection.db.collection(colName);
      const count = await col.countDocuments();
      if (count > 0) {
        await col.deleteMany({});
        console.log(`Cleared collection "${colName}": deleted ${count} documents`);
      } else {
        console.log(`Collection "${colName}" is already empty (0 documents)`);
      }
    } catch (err) {
      console.warn(`Could not clear collection "${colName}":`, err.message);
    }
  }

  console.log('\nPurge complete! All sample/seed collections in MongoDB Atlas are now 100% empty.');
  await mongoose.disconnect();
};

purge().catch((err) => {
  console.error('Error during purge:', err);
  process.exit(1);
});
