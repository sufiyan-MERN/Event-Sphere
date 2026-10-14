import fs from 'node:fs';
import path from 'node:path';

function loadEnvFallback() {
  if (process.env.MONGODB_URI) return;
  try { process.loadEnvFile?.(); } catch {}
  if (!process.env.MONGODB_URI) {
    try {
      const envPath = path.resolve(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let value = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) process.env[key] = value;
          }
        }
      }
    } catch {}
  }
}
loadEnvFallback();

export const DATABASES = {
  catalog: 'showbook_catalog',
  bookings: 'showbook_bookings',
  inventory: 'showbook_inventory',
  marketing: 'showbook_marketing',
};

let MongoClientClass = null;

let client = null;
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected' | 'in_memory'
let connectedUri = null;

// Isolated in-memory storage per database
const memoryDatabases = new Map();

function getMemoryCollection(dbStore, colName) {
  if (!dbStore.has(colName)) {
    dbStore.set(colName, []);
  }
  const store = dbStore.get(colName);

  return {
    async find(query = {}) {
      const matchDoc = (doc) => {
        for (const [key, val] of Object.entries(query)) {
          if (key === '$or' && Array.isArray(val)) {
            if (!val.some((subQ) => Object.entries(subQ).every(([k, v]) => {
              if (k === 'id') return doc.id === v || doc._id === v;
              if (k === '_id') return doc._id === v || doc.id === v;
              return doc[k] === v;
            }))) return false;
            continue;
          }
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (val.$in && !val.$in.includes(doc[key])) return false;
            if (val.$nin && !val.$nin.includes(doc[key])) return false;
            if (val.$ne !== undefined && doc[key] === val.$ne) return false;
            if (val.$gt !== undefined && !(doc[key] > val.$gt)) return false;
            if (val.$gte !== undefined && !(doc[key] >= val.$gte)) return false;
            if (val.$lt !== undefined && !(doc[key] < val.$lt)) return false;
            if (val.$lte !== undefined && !(doc[key] <= val.$lte)) return false;
            if (val.$regex) {
              const reg = new RegExp(val.$regex, val.$options || 'i');
              if (!reg.test(String(doc[key] || ''))) return false;
              continue;
            }
            continue;
          }
          if (key === 'id') {
            if (doc.id !== val && doc._id !== val) return false;
            continue;
          }
          if (key === '_id') {
            if (doc._id !== val && doc.id !== val) return false;
            continue;
          }
          if (doc[key] !== val) return false;
        }
        return true;
      };

      const matched = store.filter(matchDoc);

      const makeCursor = (current) => ({
        toArray: async () => [...current],
        limit: (n) => makeCursor(current.slice(0, n)),
        sort: (sortSpec) => {
          const sorted = [...current].sort((a, b) => {
            for (const [k, dir] of Object.entries(sortSpec)) {
              const valA = a[k] instanceof Date ? a[k].getTime() : a[k];
              const valB = b[k] instanceof Date ? b[k].getTime() : b[k];
              if (valA < valB) return dir > 0 ? -1 : 1;
              if (valA > valB) return dir > 0 ? 1 : -1;
            }
            return 0;
          });
          return makeCursor(sorted);
        },
      });

      return makeCursor(matched);
    },

    async findOne(query = {}) {
      const cursor = await this.find(query);
      const res = await cursor.toArray();
      return res[0] || null;
    },

    async countDocuments(query = {}) {
      const cursor = await this.find(query);
      const res = await cursor.toArray();
      return res.length;
    },

    async insertOne(doc) {
      const id = doc.id || doc._id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const saved = { ...doc, id, _id: id };
      store.push(saved);
      return { insertedId: id };
    },

    async updateMany(query, update) {
      let matchedCount = 0;
      const setFields = update?.$set || {};
      for (const item of store) {
        let match = true;
        for (const [k, v] of Object.entries(query)) {
          if (k === 'seatId' && v?.$in) {
            if (!v.$in.includes(item.seatId)) match = false;
          } else if (k === 'id' && v?.$in) {
            if (!v.$in.includes(item.id) && !v.$in.includes(item._id)) match = false;
          } else if (k === '_id' && v?.$in) {
            if (!v.$in.includes(item.id) && !v.$in.includes(item._id)) match = false;
          } else if (k === 'id') {
            if (item.id !== v && item._id !== v) match = false;
          } else if (k === '_id') {
            if (item.id !== v && item._id !== v) match = false;
          } else if (item[k] !== v) {
            match = false;
          }
        }
        if (match) {
          matchedCount++;
          Object.assign(item, setFields);
        }
      }
      return { matchedCount };
    },

    async updateOne(query, update, options = {}) {
      const item = await this.findOne(query);
      if (item) {
        if (update.$set) Object.assign(item, update.$set);
        return { modifiedCount: 1, matchedCount: 1 };
      }
      if (options.upsert) {
        const newDoc = { ...query };
        if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
        if (update.$set) Object.assign(newDoc, update.$set);
        await this.insertOne(newDoc);
        return { modifiedCount: 0, matchedCount: 0, upsertedId: newDoc.id || newDoc._id };
      }
      return { modifiedCount: 0, matchedCount: 0 };
    },

    async deleteOne(query) {
      const idx = store.findIndex((item) => {
        for (const [k, v] of Object.entries(query)) {
          if (k === 'id') {
            if (item.id !== v && item._id !== v) return false;
          } else if (k === '_id') {
            if (item.id !== v && item._id !== v) return false;
          } else if (item[k] !== v) {
            return false;
          }
        }
        return true;
      });
      if (idx !== -1) {
        store.splice(idx, 1);
        return { deletedCount: 1 };
      }
      return { deletedCount: 0 };
    },

    async deleteMany(query) {
      const initialLength = store.length;
      for (let i = store.length - 1; i >= 0; i--) {
        const item = store[i];
        let match = true;
        for (const [k, v] of Object.entries(query)) {
          if (k === 'seatId' && v?.$nin) {
            if (v.$nin.includes(item.seatId)) match = false;
          } else if (k === 'id' && v?.$nin) {
            if (v.$nin.includes(item.id) || v.$nin.includes(item._id)) match = false;
          } else if (k === 'id') {
            if (item.id !== v && item._id !== v) match = false;
          } else if (k === '_id') {
            if (item.id !== v && item._id !== v) match = false;
          } else if (item[k] !== v) {
            match = false;
          }
        }
        if (match) store.splice(i, 1);
      }
      return { deletedCount: initialLength - store.length };
    },

    async bulkWrite(ops) {
      for (const op of ops) {
        if (op.updateOne) {
          const { filter, update, upsert } = op.updateOne;
          const existing = store.find((doc) => Object.entries(filter).every(([k, v]) => doc[k] === v));
          if (existing) {
            if (update.$set) Object.assign(existing, update.$set);
          } else if (upsert) {
            const newDoc = { ...filter };
            if (update.$setOnInsert) Object.assign(newDoc, update.$setOnInsert);
            if (update.$set) Object.assign(newDoc, update.$set);
            store.push(newDoc);
          }
        }
      }
      return { ok: 1 };
    },
  };
}

function getMemoryDb(dbName = 'showbook_catalog') {
  if (!memoryDatabases.has(dbName)) {
    memoryDatabases.set(dbName, new Map());
  }
  const dbStore = memoryDatabases.get(dbName);
  return {
    databaseName: dbName,
    collection(name) {
      return getMemoryCollection(dbStore, name);
    },
  };
}

const memoryClient = {
  startSession() {
    return {
      async withTransaction(fn) {
        return await fn();
      },
      async endSession() {},
    };
  },
};

export function mongoStatus() {
  return connectionStatus;
}

export function getMongoClient() {
  if (client) {
    return {
      ...client,
      startSession() {
        const session = client.startSession();
        const originalWithTransaction = session.withTransaction.bind(session);
        session.withTransaction = async (fn, options) => {
          try {
            return await originalWithTransaction(fn, options);
          } catch (err) {
            if (err?.message?.includes('replica set') || err?.code === 20 || err?.code === 11600) {
              return await fn();
            }
            throw err;
          }
        };
        return session;
      },
    };
  }
  return memoryClient;
}

// Get database by domain name ('catalog' | 'bookings' | 'inventory' | 'marketing')
export function getDb(domain = 'catalog') {
  const dbName = DATABASES[domain] || domain || 'showbook_catalog';
  if (client && connectionStatus === 'connected') {
    return client.db(dbName);
  }
  return getMemoryDb(dbName);
}

// Require database with auto-connect
export async function requireMongo(domain = 'catalog') {
  const dbName = DATABASES[domain] || domain || 'showbook_catalog';
  if (client && connectionStatus === 'connected') {
    return client.db(dbName);
  }
  if (!client && connectionStatus === 'disconnected') {
    await connectMongo();
    if (client && connectionStatus === 'connected') {
      return client.db(dbName);
    }
  }
  return getMemoryDb(dbName);
}

export async function connectMongo(customUri) {
  loadEnvFallback();
  const uri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/showbook';
  connectionStatus = 'connecting';
  try {
    if (!MongoClientClass) {
      try {
        const mongoPkg = await import('mongodb');
        MongoClientClass = mongoPkg.MongoClient;
      } catch (pkgErr) {
        connectionStatus = 'in_memory';
        console.warn(`[ShowBook EventDB] "mongodb" npm package is not installed yet in node_modules. Multi-database memory isolation active. Run "pnpm install" to enable live Atlas connections.`);
        return;
      }
    }
    const mongo = new MongoClientClass(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 8000,
      retryWrites: true,
      w: 'majority',
    });
    await mongo.connect();
    client = mongo;
    connectionStatus = 'connected';
    connectedUri = uri;
    const safeUri = uri.replace(/\/\/.*@/, '//***:***@');
    console.log(`[ShowBook EventDB] Connected successfully to MongoDB Atlas: ${safeUri}`);
    console.log(`[ShowBook EventDB] Active Domain Databases:`, Object.values(DATABASES));
  } catch (err) {
    connectionStatus = 'in_memory';
    console.warn(`[ShowBook EventDB] Could not connect to MongoDB Atlas at "${uri.replace(/\/\/.*@/, '//***@')}". Falling back to in-memory store. (${err.message})`);
  }
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null;
    connectionStatus = 'disconnected';
    console.log('[ShowBook EventDB] MongoDB connection closed.');
  }
}

export async function getDatabaseRegistryInfo() {
  loadEnvFallback();
  const rawUri = connectedUri || process.env.MONGODB_URI || '';
  const maskedUri = rawUri ? rawUri.replace(/\/\/.*@/, '//***:***@') : 'Local Memory Store';
  const clusterMatch = rawUri.match(/@([a-zA-Z0-9.-]+\.mongodb\.net)/);
  const clusterName = clusterMatch ? clusterMatch[1] : (connectionStatus === 'connected' ? 'Atlas Cluster' : 'In-Memory Simulation');

  const info = {
    status: connectionStatus,
    provider: connectionStatus === 'connected' ? 'MongoDB Atlas (Cluster0)' : 'In-Memory Domain Isolation',
    cluster: clusterName,
    connectionUri: maskedUri,
    configuredDatabases: Object.values(DATABASES),
    databases: {},
  };

  for (const [key, dbName] of Object.entries(DATABASES)) {
    const db = await requireMongo(key);
    let collections = [];
    if (key === 'catalog') collections = ['catalog'];
    if (key === 'bookings') collections = ['bookings'];
    if (key === 'inventory') collections = ['seat_inventory', 'seat_holds'];
    if (key === 'marketing') collections = ['coupons'];

    const counts = {};
    for (const c of collections) {
      try {
        counts[c] = await db.collection(c).countDocuments();
      } catch {
        counts[c] = 0;
      }
    }

    info.databases[key] = {
      name: dbName,
      domain: key,
      collections: counts,
    };
  }

  return info;
}
