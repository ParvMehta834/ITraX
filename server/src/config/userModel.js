const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const MockDB = require('./mockDb');
const dbConfig = require('./db');

// Mongoose User model (original)
const UserSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  role: { type: String, enum: ['ADMIN', 'EMPLOYEE'], default: 'EMPLOYEE' },
  firstName: String,
  lastName: String,
  email: { type: String, required: true },
  phone: String,
  passwordHash: { type: String, required: true },
  timezone: String,
  department: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ orgId: 1, email: 1 }, { unique: true });

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

const MongoUser = mongoose.model('User', UserSchema);

// Adapter class that works with both Mongo and Mock DB
class UserModel {
  static async findOne(query) {
    if (dbConfig.isConnected()) {
      return MongoUser.findOne(query);
    }
    
    // Mock DB implementation
    if (query.email) {
      const user = MockDB.findUserByEmail(query.email);
      if (user) {
        // Add comparePassword method
        user.comparePassword = (candidate) => bcrypt.compare(candidate, user.passwordHash);
      }
      return user;
    }
    if (query._id) {
      return MockDB.findUserById(query._id);
    }
    return null;
  }

  static async findById(id) {
    if (dbConfig.isConnected()) {
      return MongoUser.findById(id);
    }
    return MockDB.findUserById(id);
  }

  static async find(query) {
    if (dbConfig.isConnected()) {
      return MongoUser.find(query);
    }
    // Simple find for mock DB
    if (!Object.keys(query).length) {
      return MockDB.getUsers();
    }
    return [];
  }

  static async countDocuments(query = {}) {
    if (dbConfig.isConnected()) {
      return MongoUser.countDocuments(query);
    }
    return MockDB.countUsers();
  }

  static async create(userData) {
    if (dbConfig.isConnected()) {
      return MongoUser.create(userData);
    }
    return MockDB.createUser(userData);
  }

  static async findByIdAndUpdate(id, updates, options = {}) {
    if (dbConfig.isConnected()) {
      return MongoUser.findByIdAndUpdate(id, updates, { new: true, ...options });
    }
    return MockDB.updateUser(id, updates);
  }

  // For filtering with select
  static async findOne_Select(query, selectOptions) {
    if (dbConfig.isConnected()) {
      return MongoUser.findOne(query).select(selectOptions);
    }
    const user = await this.findOne(query);
    if (user && selectOptions === '-passwordHash') {
      const { passwordHash, ...rest } = user;
      return rest;
    }
    return user;
  }
}

module.exports = UserModel;
module.exports.MongoUser = MongoUser;
