// Simple in-memory database for testing without MongoDB
const users = [];
const assets = [];
const licenses = [];
const inventoryItems = [];
const notifications = [];
const categories = [];
const locations = [];

class MockDB {
  static getUsers() {
    return users;
  }

  static findUserByEmail(email) {
    return users.find(u => u.email === email);
  }

  static createUser(userData) {
    if (!userData.orgId) {
      userData.orgId = '000000000000000000000001';
    }
    const user = {
      _id: `user_${Date.now()}`,
      ...userData,
      createdAt: new Date(),
    };
    users.push(user);
    return user;
  }

  static findUserById(id) {
    return users.find(u => u._id === id);
  }

  static updateUser(id, updates) {
    const user = users.find(u => u._id === id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  }

  static countUsers() {
    return users.length;
  }

  // Assets
  static getAssets() {
    return assets;
  }

  static createAsset(data) {
    const asset = {
      _id: `asset_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    assets.push(asset);
    return asset;
  }

  // Notifications
  static getNotifications(userId) {
    return notifications.filter(n => !n.userId || n.userId === userId);
  }

  static createNotification(data) {
    const notif = {
      _id: `notif_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    notifications.push(notif);
    return notif;
  }

  // Licenses
  static getLicenses() {
    return licenses;
  }

  static createLicense(data) {
    const license = {
      _id: `license_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    licenses.push(license);
    return license;
  }

  // Categories
  static getCategories() {
    return categories;
  }

  static createCategory(data) {
    const category = {
      _id: `cat_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    categories.push(category);
    return category;
  }

  // Locations
  static getLocations() {
    return locations;
  }

  static createLocation(data) {
    const location = {
      _id: `loc_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    locations.push(location);
    return location;
  }

  // Inventory
  static getInventory() {
    return inventoryItems;
  }

  static createInventoryItem(data) {
    const item = {
      _id: `inv_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    inventoryItems.push(item);
    return item;
  }

  // Clear all (useful for testing)
  static clear() {
    users.length = 0;
    assets.length = 0;
    licenses.length = 0;
    inventoryItems.length = 0;
    notifications.length = 0;
    categories.length = 0;
    locations.length = 0;
  }
}

module.exports = MockDB;
