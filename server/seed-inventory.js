const mongoose = require('mongoose');

// Import model
const InventoryItem = require('./src/models/InventoryItem');

const seedInventory = async () => {
  try {
    // Connect to MongoDB directly
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/itrax';
    console.log('Connecting to MongoDB at:', mongoUri);
    
    await mongoose.connect(mongoUri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    console.log('✓ Connected to MongoDB');

    // Clear existing inventory
    await InventoryItem.deleteMany({});
    console.log('✓ Cleared existing inventory');

    // Sample inventory data
    const inventoryItems = [
      {
        name: 'Office Supplies - Pens (Blue)',
        location: 'Warehouse A',
        quantityOnHand: 500,
        quantityMinimum: 100,
        costPerItem: 0.50,
        total: 250.00
      },
      {
        name: 'Office Supplies - Notebooks',
        location: 'Warehouse A',
        quantityOnHand: 200,
        quantityMinimum: 50,
        costPerItem: 2.50,
        total: 500.00
      },
      {
        name: 'Printer Paper (A4, 500 sheets)',
        location: 'Office Floor 2',
        quantityOnHand: 30,
        quantityMinimum: 50,
        costPerItem: 5.00,
        total: 150.00
      },
      {
        name: 'USB Cables (Type-C)',
        location: 'IT Storage',
        quantityOnHand: 75,
        quantityMinimum: 20,
        costPerItem: 3.00,
        total: 225.00
      },
      {
        name: 'Whiteboard Markers',
        location: 'Office Floor 1',
        quantityOnHand: 15,
        quantityMinimum: 25,
        costPerItem: 1.50,
        total: 22.50
      },
      {
        name: 'Coffee Pods',
        location: 'Breakroom',
        quantityOnHand: 120,
        quantityMinimum: 100,
        costPerItem: 0.75,
        total: 90.00
      },
      {
        name: 'Hand Sanitizer (500ml)',
        location: 'Office Floor 1',
        quantityOnHand: 8,
        quantityMinimum: 20,
        costPerItem: 4.00,
        total: 32.00
      },
      {
        name: 'Sticky Notes (Pack)',
        location: 'Warehouse A',
        quantityOnHand: 100,
        quantityMinimum: 30,
        costPerItem: 1.25,
        total: 125.00
      },
      {
        name: 'HDMI Cables (2m)',
        location: 'IT Storage',
        quantityOnHand: 20,
        quantityMinimum: 15,
        costPerItem: 8.00,
        total: 160.00
      },
      {
        name: 'Cleaning Wipes',
        location: 'Office Floor 2',
        quantityOnHand: 25,
        quantityMinimum: 40,
        costPerItem: 3.50,
        total: 87.50
      },
      {
        name: 'Stapler',
        location: 'Warehouse B',
        quantityOnHand: 15,
        quantityMinimum: 10,
        costPerItem: 6.00,
        total: 90.00
      },
      {
        name: 'File Folders (Pack of 25)',
        location: 'Warehouse B',
        quantityOnHand: 40,
        quantityMinimum: 20,
        costPerItem: 4.50,
        total: 180.00
      }
    ];

    // Insert inventory
    const result = await InventoryItem.insertMany(inventoryItems);
    console.log(`✓ Successfully seeded ${result.length} inventory items`);

    // Display summary
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.total, 0);
    const lowStockItems = inventoryItems.filter(item => item.quantityOnHand < item.quantityMinimum);
    
    console.log('\nInventory Summary:');
    console.log(`  Total Items: ${result.length}`);
    console.log(`  Total Value: $${totalValue.toFixed(2)}`);
    console.log(`  Low Stock Items: ${lowStockItems.length}`);

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding inventory:', error.message);
    process.exit(1);
  }
};

seedInventory();
