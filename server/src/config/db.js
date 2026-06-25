import dns from 'dns';
import mongoose from 'mongoose';

// Windows often fails SRV lookups on system DNS — use Google DNS for MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 20000,
  family: 4
};

function isSrvDnsError(err) {
  const msg = String(err?.message || err || '');
  return msg.includes('querySrv') || (msg.includes('ECONNREFUSED') && msg.includes('_mongodb._tcp'));
}

/** Prefer MONGODB_URI_STANDARD when set; otherwise MONGODB_URI (srv or standard). */
function getMongoUri() {
  const standard = process.env.MONGODB_URI_STANDARD?.trim();
  if (standard) return standard;
  return process.env.MONGODB_URI?.trim();
}

export async function connectDB() {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error(
      'Set MONGODB_URI or MONGODB_URI_STANDARD in server/.env (copy from server/.env.example).'
    );
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, CONNECT_OPTIONS);
    console.log('MongoDB connected');
    return;
  } catch (err) {
    if (isSrvDnsError(err) && uri.startsWith('mongodb+srv://')) {
      throw new Error(
        [
          'MongoDB SRV DNS lookup failed.',
          'Add MONGODB_URI_STANDARD with the Standard connection string from Atlas (mongodb://...).',
          `Original: ${err.message}`
        ].join('\n')
      );
    }
    throw err;
  }
}
