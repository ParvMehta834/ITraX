const mongoose = require('mongoose');

// Import model
const CompanyOrder = require('./src/models/CompanyOrder');

const seedOrders = async () => {
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

    // Clear existing orders
    await CompanyOrder.deleteMany({});
    console.log('✓ Cleared existing orders');

    // Sample order data
    const orders = [
      {
        orderId: 'ORD-2024-001',
        assetName: 'MacBook Pro 16" M3',
        quantity: 5,
        supplier: 'Apple Business',
        orderDate: new Date('2024-01-15'),
        estimatedDelivery: new Date('2024-02-15'),
        currentLocation: 'In Transit',
        status: 'InTransit',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-01-15'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-01-16'), note: 'Order confirmed' },
          { status: 'Shipped', timestamp: new Date('2024-01-20'), note: 'Shipped from warehouse' },
          { status: 'InTransit', timestamp: new Date('2024-02-01'), note: 'In transit to office' }
        ]
      },
      {
        orderId: 'ORD-2024-002',
        assetName: 'Dell UltraSharp 4K Monitor',
        quantity: 10,
        supplier: 'Dell Computers',
        orderDate: new Date('2024-01-20'),
        estimatedDelivery: new Date('2024-02-10'),
        currentLocation: 'Office Reception',
        status: 'Delivered',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-01-20'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-01-21'), note: 'Processing order' },
          { status: 'Shipped', timestamp: new Date('2024-01-25'), note: 'Shipped' },
          { status: 'InTransit', timestamp: new Date('2024-02-02'), note: 'In transit' },
          { status: 'OutForDelivery', timestamp: new Date('2024-02-08'), note: 'Out for delivery' },
          { status: 'Delivered', timestamp: new Date('2024-02-09'), note: 'Delivered to office' }
        ]
      },
      {
        orderId: 'ORD-2024-003',
        assetName: 'Wireless Keyboard & Mouse Set',
        quantity: 20,
        supplier: 'Logitech',
        orderDate: new Date('2024-02-01'),
        estimatedDelivery: new Date('2024-02-20'),
        currentLocation: 'Distribution Center',
        status: 'Processing',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-01'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-02-02'), note: 'Processing' }
        ]
      },
      {
        orderId: 'ORD-2024-004',
        assetName: 'USB-C Docking Station',
        quantity: 8,
        supplier: 'Anker',
        orderDate: new Date('2024-02-03'),
        estimatedDelivery: new Date('2024-02-25'),
        currentLocation: 'Warehouse',
        status: 'Ordered',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-03'), note: 'Order placed with supplier' }
        ]
      },
      {
        orderId: 'ORD-2024-005',
        assetName: 'HP LaserJet Pro Printer',
        quantity: 3,
        supplier: 'HP Inc',
        orderDate: new Date('2024-01-25'),
        estimatedDelivery: new Date('2024-02-18'),
        currentLocation: 'Out for Delivery',
        status: 'OutForDelivery',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-01-25'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-01-26'), note: 'Processing' },
          { status: 'Shipped', timestamp: new Date('2024-02-02'), note: 'Shipped from supplier' },
          { status: 'InTransit', timestamp: new Date('2024-02-05'), note: 'In transit' },
          { status: 'OutForDelivery', timestamp: new Date('2024-02-15'), note: 'Out for delivery today' }
        ]
      },
      {
        orderId: 'ORD-2024-006',
        assetName: 'Microsoft Office 365 Licenses',
        quantity: 50,
        supplier: 'Microsoft',
        orderDate: new Date('2024-02-05'),
        estimatedDelivery: new Date('2024-02-06'),
        currentLocation: 'Digital Distribution',
        status: 'Delivered',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-05'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-02-05'), note: 'Processing' },
          { status: 'Shipped', timestamp: new Date('2024-02-05'), note: 'Digital shipment' },
          { status: 'Delivered', timestamp: new Date('2024-02-05'), note: 'Licenses activated' }
        ]
      },
      {
        orderId: 'ORD-2024-007',
        assetName: 'Mechanical Keyboard RGB',
        quantity: 15,
        supplier: 'Corsair',
        orderDate: new Date('2024-02-07'),
        estimatedDelivery: new Date('2024-02-28'),
        currentLocation: 'Supplier Warehouse',
        status: 'Shipped',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-07'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-02-08'), note: 'Processing' },
          { status: 'Shipped', timestamp: new Date('2024-02-10'), note: 'Shipped via FedEx' }
        ]
      },
      {
        orderId: 'ORD-2024-008',
        assetName: 'Webcam HD 1080p',
        quantity: 12,
        supplier: 'Logitech',
        orderDate: new Date('2024-02-08'),
        estimatedDelivery: new Date('2024-02-22'),
        currentLocation: 'Distribution Hub',
        status: 'InTransit',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-08'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-02-09'), note: 'Processing' },
          { status: 'Shipped', timestamp: new Date('2024-02-12'), note: 'Shipped' },
          { status: 'InTransit', timestamp: new Date('2024-02-14'), note: 'In transit to destination' }
        ]
      },
      {
        orderId: 'ORD-2024-009',
        assetName: 'External SSD 2TB Portable',
        quantity: 25,
        supplier: 'Samsung',
        orderDate: new Date('2024-02-10'),
        estimatedDelivery: new Date('2024-03-05'),
        currentLocation: 'Warehouse',
        status: 'Processing',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-10'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-02-11'), note: 'Currently processing' }
        ]
      },
      {
        orderId: 'ORD-2024-010',
        assetName: 'Laptop Stand Adjustable',
        quantity: 30,
        supplier: 'Amazon Business',
        orderDate: new Date('2024-02-06'),
        estimatedDelivery: new Date('2024-02-16'),
        currentLocation: 'Office Storage',
        status: 'Delivered',
        createdBy: 'admin@company.com',
        trackingHistory: [
          { status: 'Ordered', timestamp: new Date('2024-02-06'), note: 'Order placed' },
          { status: 'Processing', timestamp: new Date('2024-02-06'), note: 'Processing' },
          { status: 'Shipped', timestamp: new Date('2024-02-08'), note: 'Shipped' },
          { status: 'InTransit', timestamp: new Date('2024-02-10'), note: 'In transit' },
          { status: 'OutForDelivery', timestamp: new Date('2024-02-14'), note: 'Out for delivery' },
          { status: 'Delivered', timestamp: new Date('2024-02-14'), note: 'Received and stored' }
        ]
      }
    ];

    // Insert orders
    const result = await CompanyOrder.insertMany(orders);
    console.log(`✓ Successfully seeded ${result.length} orders`);

    // Display summary
    const summary = await CompanyOrder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    console.log('\nOrder Status Summary:');
    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding orders:', error.message);
    process.exit(1);
  }
};

seedOrders();
