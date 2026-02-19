require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const connectDB = require('./src/config/db');
const Organization = require('./src/models/Organization');
const Department = require('./src/models/Department');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Location = require('./src/models/Location');
const Asset = require('./src/models/Asset');
const License = require('./src/models/License');
const InventoryItem = require('./src/models/InventoryItem');

async function seed() {
  await connectDB();

  await Promise.all([
    Organization.deleteMany({}),
    Department.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Location.deleteMany({}),
    Asset.deleteMany({}),
    License.deleteMany({}),
    InventoryItem.deleteMany({}),
  ]);

  const defaultOrgId = process.env.DEFAULT_ORG_ID || new mongoose.Types.ObjectId().toString();
  const org = await Organization.create({
    _id: new mongoose.Types.ObjectId(defaultOrgId),
    name: 'ITraX Demo Org',
    plan: 'Paid',
  });

  const departments = await Department.insertMany([
    { orgId: org._id, name: 'IT', description: 'Infrastructure and support' },
    { orgId: org._id, name: 'HR', description: 'People operations' },
    { orgId: org._id, name: 'Finance', description: 'Accounting and budgeting' },
    { orgId: org._id, name: 'Operations', description: 'Facilities and logistics' },
    { orgId: org._id, name: 'Engineering', description: 'Product development' },
  ]);

  const adminPass = await bcrypt.hash('Admin123!', 10);
  const employeePass = await bcrypt.hash('Employee1!', 10);

  const admin = await User.create({
    orgId: org._id,
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@itrax.local',
    passwordHash: adminPass,
    role: 'ADMIN',
    department: 'IT',
    status: 'ACTIVE',
  });

  const employees = await User.insertMany([
    { orgId: org._id, firstName: 'Alice', lastName: 'Smith', email: 'alice@itrax.local', passwordHash: employeePass, role: 'EMPLOYEE', department: 'Engineering', status: 'ACTIVE' },
    { orgId: org._id, firstName: 'Bob', lastName: 'Jones', email: 'bob@itrax.local', passwordHash: employeePass, role: 'EMPLOYEE', department: 'Finance', status: 'ACTIVE' },
    { orgId: org._id, firstName: 'Carol', lastName: 'Lee', email: 'carol@itrax.local', passwordHash: employeePass, role: 'EMPLOYEE', department: 'HR', status: 'ACTIVE' },
    { orgId: org._id, firstName: 'David', lastName: 'Ng', email: 'david@itrax.local', passwordHash: employeePass, role: 'EMPLOYEE', department: 'Operations', status: 'ACTIVE' },
  ]);

  const locations = await Location.insertMany([
    { orgId: org._id, name: 'Head Office', type: 'Office', address: '123 Main St', city: 'Metro', state: 'CA', country: 'USA', capacity: 200, status: 'Active', createdBy: admin._id },
    { orgId: org._id, name: 'Warehouse A', type: 'Warehouse', address: '45 Dock Rd', city: 'Metro', state: 'CA', country: 'USA', capacity: 500, status: 'Active', createdBy: admin._id },
    { orgId: org._id, name: 'Branch East', type: 'Office', address: '9 Sunrise Ave', city: 'Riverside', state: 'NY', country: 'USA', capacity: 120, status: 'Active', createdBy: admin._id },
  ]);

  const categories = await Category.insertMany([
    { orgId: org._id, name: 'Laptop', description: 'Portable computers', iconKey: 'Laptop', createdBy: admin._id },
    { orgId: org._id, name: 'Monitor', description: 'Displays and screens', iconKey: 'Monitor', createdBy: admin._id },
    { orgId: org._id, name: 'Mobile Phone', description: 'Smartphones', iconKey: 'Smartphone', createdBy: admin._id },
    { orgId: org._id, name: 'Peripheral', description: 'Mice, keyboards, docks', iconKey: 'Keyboard', createdBy: admin._id },
  ]);

  await Asset.insertMany([
    {
      orgId: org._id,
      assetTag: 'AST-1001',
      assetId: 'AST-1001',
      name: 'Dell XPS 13',
      category: 'Laptop',
      categoryId: categories[0]._id,
      manufacturer: 'Dell',
      model: 'XPS 13',
      serialNumber: 'SN-AST-1001',
      status: 'Assigned',
      currentEmployee: 'Alice Smith',
      currentLocation: 'Head Office',
      purchaseDate: new Date('2023-01-15'),
      warrantyExpiryDate: new Date('2026-01-15'),
      createdBy: admin._id,
    },
    {
      orgId: org._id,
      assetTag: 'AST-1002',
      assetId: 'AST-1002',
      name: 'Lenovo ThinkPad T14',
      category: 'Laptop',
      categoryId: categories[0]._id,
      manufacturer: 'Lenovo',
      model: 'ThinkPad T14',
      serialNumber: 'SN-AST-1002',
      status: 'Available',
      currentLocation: 'Warehouse A',
      purchaseDate: new Date('2022-08-20'),
      warrantyExpiryDate: new Date('2025-08-20'),
      createdBy: admin._id,
    },
    {
      orgId: org._id,
      assetTag: 'AST-2001',
      assetId: 'AST-2001',
      name: 'LG 27UP550',
      category: 'Monitor',
      categoryId: categories[1]._id,
      manufacturer: 'LG',
      model: '27UP550',
      serialNumber: 'SN-AST-2001',
      status: 'Available',
      currentLocation: 'Warehouse A',
      purchaseDate: new Date('2023-03-05'),
      warrantyExpiryDate: new Date('2026-03-05'),
      createdBy: admin._id,
    },
  ]);

  await License.insertMany([
    {
      orgId: org._id,
      name: 'Office Suite',
      vendor: 'Microsoft',
      seatsTotal: 25,
      seatsAssigned: 8,
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      cost: 299,
      status: 'Active',
      createdBy: admin._id,
    },
    {
      orgId: org._id,
      name: 'Design Suite',
      vendor: 'Adobe',
      seatsTotal: 10,
      seatsAssigned: 6,
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      cost: 199,
      status: 'ExpiringSoon',
      createdBy: admin._id,
    },
  ]);

  await InventoryItem.insertMany([
    {
      orgId: org._id,
      name: 'USB-C Dock',
      location: 'Warehouse A',
      locationId: locations[1]._id,
      quantityOnHand: 18,
      quantityMinimum: 5,
      costPerItem: 89,
      createdBy: admin._id,
    },
    {
      orgId: org._id,
      name: 'HDMI Cable (2m)',
      location: 'Head Office',
      locationId: locations[0]._id,
      quantityOnHand: 40,
      quantityMinimum: 15,
      costPerItem: 8,
      createdBy: admin._id,
    },
  ]);

  console.log('Seed complete. Admin credentials: admin@itrax.local / Admin123!');
  console.log('Employee credentials: alice@itrax.local / Employee1!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
