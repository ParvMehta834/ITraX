// Simple in-memory database for testing without MongoDB
const users = [];
const assets = [];
const licenses = [];
const inventoryItems = [];
const notifications = [];
const categories = [];
const locations = [];
const employees = [];

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

  // Assets (continued)
  static getAssetById(id) {
    return assets.find(a => a._id === id);
  }

  static updateAsset(id, updates) {
    const asset = assets.find(a => a._id === id);
    if (asset) {
      Object.assign(asset, updates, { updatedAt: new Date() });
    }
    return asset;
  }

  static deleteAsset(id) {
    const index = assets.findIndex(a => a._id === id);
    if (index > -1) {
      return assets.splice(index, 1)[0];
    }
    return null;
  }

  // Licenses (continued)
  static getLicenseById(id) {
    return licenses.find(l => l._id === id);
  }

  static updateLicense(id, updates) {
    const license = licenses.find(l => l._id === id);
    if (license) {
      Object.assign(license, updates, { updatedAt: new Date() });
    }
    return license;
  }

  static deleteLicense(id) {
    const index = licenses.findIndex(l => l._id === id);
    if (index > -1) {
      return licenses.splice(index, 1)[0];
    }
    return null;
  }

  // Categories (continued)
  static getCategoryById(id) {
    return categories.find(c => c._id === id);
  }

  static updateCategory(id, updates) {
    const category = categories.find(c => c._id === id);
    if (category) {
      Object.assign(category, updates, { updatedAt: new Date() });
    }
    return category;
  }

  static deleteCategory(id) {
    const index = categories.findIndex(c => c._id === id);
    if (index > -1) {
      return categories.splice(index, 1)[0];
    }
    return null;
  }

  // Locations (continued)
  static getLocationById(id) {
    return locations.find(l => l._id === id);
  }

  static updateLocation(id, updates) {
    const location = locations.find(l => l._id === id);
    if (location) {
      Object.assign(location, updates, { updatedAt: new Date() });
    }
    return location;
  }

  static deleteLocation(id) {
    const index = locations.findIndex(l => l._id === id);
    if (index > -1) {
      return locations.splice(index, 1)[0];
    }
    return null;
  }

  // Inventory (continued)
  static getInventoryItems() {
    return inventoryItems;
  }

  static getInventoryItemById(id) {
    return inventoryItems.find(i => i._id === id);
  }

  static updateInventoryItem(id, updates) {
    const item = inventoryItems.find(i => i._id === id);
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date() });
    }
    return item;
  }

  static deleteInventoryItem(id) {
    const index = inventoryItems.findIndex(i => i._id === id);
    if (index > -1) {
      return inventoryItems.splice(index, 1)[0];
    }
    return null;
  }

  // Employees
  static getEmployees() {
    return employees;
  }

  static getEmployeeById(id) {
    return employees.find(e => e._id === id);
  }

  static createEmployee(data) {
    const employee = {
      _id: `emp_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
    employees.push(employee);
    return employee;
  }

  static updateEmployee(id, updates) {
    const employee = employees.find(e => e._id === id);
    if (employee) {
      Object.assign(employee, updates, { updatedAt: new Date() });
    }
    return employee;
  }

  static deleteEmployee(id) {
    const index = employees.findIndex(e => e._id === id);
    if (index > -1) {
      return employees.splice(index, 1)[0];
    }
    return null;
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
    employees.length = 0;
  }
}

module.exports = MockDB;
