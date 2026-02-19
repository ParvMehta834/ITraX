const mongoose = require('mongoose');
const Asset = require('./src/models/Asset');
require('dotenv').config();

async function seedAssets() {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/itrax';
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const testAssets = [
      {
        assetId: 'AST-001',
        category: 'Laptop',
        manufacturer: 'Dell',
        model: 'XPS 15',
        status: 'Assigned',
        currentEmployee: 'John Doe',
        currentLocation: 'Office A',
        purchaseDate: new Date('2023-01-15'),
        warrantyExpiryDate: new Date('2025-01-15')
      },
      {
        assetId: 'AST-002',
        category: 'Mobile Phone',
        manufacturer: 'Apple',
        model: 'iPhone 14',
        status: 'Assigned',
        currentEmployee: 'Jane Smith',
        currentLocation: 'Office B',
        purchaseDate: new Date('2023-06-20'),
        warrantyExpiryDate: new Date('2025-06-20')
      },
      {
        assetId: 'AST-003',
        category: 'Keyboard',
        manufacturer: 'Logitech',
        model: 'MX Keys',
        status: 'Available',
        currentLocation: 'Warehouse A',
        purchaseDate: new Date('2022-11-10'),
        warrantyExpiryDate: new Date('2024-11-10')
      },
      {
        assetId: 'AST-004',
        category: 'Monitor',
        manufacturer: 'LG',
        model: '27UP550',
        status: 'Available',
        currentLocation: 'Warehouse A',
        purchaseDate: new Date('2023-03-05'),
        warrantyExpiryDate: new Date('2025-03-05')
      },
      {
        assetId: 'AST-005',
        category: 'Laptop',
        manufacturer: 'MacBook',
        model: 'Pro 16"',
        status: 'Maintenance',
        currentLocation: 'IT Department',
        purchaseDate: new Date('2022-09-15'),
        warrantyExpiryDate: new Date('2024-09-15')
      },
      {
        assetId: 'AST-006',
        category: 'Mouse',
        manufacturer: 'Logitech',
        model: 'MX Master 3S',
        status: 'Assigned',
        currentEmployee: 'Bob Johnson',
        currentLocation: 'Office C',
        purchaseDate: new Date('2023-02-28'),
        warrantyExpiryDate: new Date('2025-02-28')
      },
      {
        assetId: 'AST-007',
        category: 'Monitor',
        manufacturer: 'Dell',
        model: 'U2723DE',
        status: 'Assigned',
        currentEmployee: 'Sarah Wilson',
        currentLocation: 'Office A',
        purchaseDate: new Date('2023-07-12'),
        warrantyExpiryDate: new Date('2025-07-12')
      },
      {
        assetId: 'AST-008',
        category: 'Tablet',
        manufacturer: 'Samsung',
        model: 'Galaxy Tab S9',
        status: 'Available',
        currentLocation: 'Warehouse B',
        purchaseDate: new Date('2023-08-01'),
        warrantyExpiryDate: new Date('2025-08-01')
      },
      {
        assetId: 'AST-009',
        category: 'Headphones',
        manufacturer: 'Sony',
        model: 'WH-1000XM5',
        status: 'Assigned',
        currentEmployee: 'Michael Brown',
        currentLocation: 'Office D',
        purchaseDate: new Date('2023-04-18'),
        warrantyExpiryDate: new Date('2025-04-18')
      },
      {
        assetId: 'AST-010',
        category: 'Laptop',
        manufacturer: 'HP',
        model: 'EliteBook 850',
        status: 'Assigned',
        currentEmployee: 'Emma Davis',
        currentLocation: 'Office B',
        purchaseDate: new Date('2023-05-22'),
        warrantyExpiryDate: new Date('2025-05-22')
      },
      {
        assetId: 'AST-011',
        category: 'Monitor',
        manufacturer: 'ASUS',
        model: 'ProArt PA279CV',
        status: 'Available',
        currentLocation: 'Warehouse A',
        purchaseDate: new Date('2023-09-10'),
        warrantyExpiryDate: new Date('2025-09-10')
      },
      {
        assetId: 'AST-012',
        category: 'Mobile Phone',
        manufacturer: 'Samsung',
        model: 'Galaxy S23',
        status: 'Available',
        currentLocation: 'Warehouse C',
        purchaseDate: new Date('2023-10-05'),
        warrantyExpiryDate: new Date('2025-10-05')
      },
      {
        assetId: 'AST-013',
        category: 'Webcam',
        manufacturer: 'Logitech',
        model: 'C920',
        status: 'Assigned',
        currentEmployee: 'Alice Thompson',
        currentLocation: 'Office E',
        purchaseDate: new Date('2023-01-30'),
        warrantyExpiryDate: new Date('2025-01-30')
      },
      {
        assetId: 'AST-014',
        category: 'Keyboard',
        manufacturer: 'Corsair',
        model: 'K95 RGB Platinum',
        status: 'Assigned',
        currentEmployee: 'Chris Martin',
        currentLocation: 'Office C',
        purchaseDate: new Date('2023-11-08'),
        warrantyExpiryDate: new Date('2025-11-08')
      },
      {
        assetId: 'AST-015',
        category: 'SSD Storage',
        manufacturer: 'Kingston',
        model: 'NV2',
        status: 'Maintenance',
        currentLocation: 'IT Department',
        purchaseDate: new Date('2023-02-14'),
        warrantyExpiryDate: new Date('2025-02-14')
      }
    ];

    // Clear existing assets
    await Asset.deleteMany({});

    // Insert test assets
    const created = await Asset.insertMany(testAssets);
    console.log(`✅ Created ${created.length} test assets`);

    mongoose.connection.close();
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seedAssets();
