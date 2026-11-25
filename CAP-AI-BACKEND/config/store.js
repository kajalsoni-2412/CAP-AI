
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'capai_store.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultData = {
  users: [],
  currentAffairs: [],
  analyses: [],
  knowledgeMaps: [],
  generatedQuestions: [],
  questions: [],
  revisions: [],
  quizAttempts: [],
  userPerformances: [],
  revisionHistories: [],
  bookmarks: []
};

function readDb() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      writeDb(defaultData);
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);

    for (const key of Object.keys(defaultData)) {
      if (!Array.isArray(data[key])) {
        data[key] = [];
      }
    }

    return data;
  } catch (err) {
    console.error('Error reading JSON store:', err.message);
    return JSON.parse(JSON.stringify(defaultData));
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON store:', err.message);
    throw err;
  }
}

function matchQuery(item, query) {
  for (const [key, value] of Object.entries(query)) {
    if (key === '_id' || key === 'id') {
      const itemId = item._id || item.id;
      if (itemId !== value && itemId !== String(value)) return false;
      continue;
    }

    if (value && typeof value === 'object') {
      if (value.$regex && !new RegExp(value.$regex, value.$options || '').test(item[key] || '')) {
        return false;
      }

      if (value.$in && !value.$in.includes(item[key])) {
        return false;
      }
    } else if (item[key] !== value) {
      return false;
    }
  }

  return true;
}

class Collection {
  constructor(name) {
    this.name = name;
  }

  async find(query = {}) {
    const db = readDb();
    return (db[this.name] || []).filter(item => matchQuery(item, query));
  }

  async findOne(query = {}) {
    const db = readDb();
    return (db[this.name] || []).find(item => matchQuery(item, query)) || null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    const db = readDb();

    if (!db[this.name]) {
      db[this.name] = [];
    }

    const item = {
      _id: doc._id || crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db[this.name].push(item);
    writeDb(db);

    return item;
  }

  async insertOne(doc) {
    return this.create(doc);
  }

  async updateOne(query, updates) {
    const db = readDb();
    if (!db[this.name]) db[this.name] = [];

    const index = db[this.name].findIndex(item => matchQuery(item, query));
    if (index === -1) return null;

    const updated = {
      ...db[this.name][index],
      ...(updates.$set || updates),
      updatedAt: new Date().toISOString()
    };

    db[this.name][index] = updated;
    writeDb(db);

    return updated;
  }

  async deleteOne(query) {
    const db = readDb();
    if (!db[this.name]) return false;

    const initialLength = db[this.name].length;
    db[this.name] = db[this.name].filter(item => !matchQuery(item, query));

    writeDb(db);
    return db[this.name].length < initialLength;
  }
}

module.exports = {
  isMongoActive: () => mongoose.connection.readyState === 1,

  users: new Collection('users'),
  currentAffairs: new Collection('currentAffairs'),
  analyses: new Collection('analyses'),
  knowledgeMaps: new Collection('knowledgeMaps'),
  generatedQuestions: new Collection('generatedQuestions'),
  questions: new Collection('questions'),
  revisions: new Collection('revisions'),
  quizAttempts: new Collection('quizAttempts'),
  userPerformances: new Collection('userPerformances'),
  revisionHistories: new Collection('revisionHistories'),
  bookmarks: new Collection('bookmarks'),

  readDb,
  writeDb
};