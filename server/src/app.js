const express = require('express');
const cors = require('cors');
const path = require('path');

const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const employeeRoutes = require('./routes/employee');
const categoriesRoutes = require('./routes/categories');
const locationsRoutes = require('./routes/locations');
const inventoryRoutes = require('./routes/inventory');
const licensesRoutes = require('./routes/licenses');
const reportsRoutes = require('./routes/reports');
const assetsRoutes = require('./routes/assets');
const ordersRoutes = require('./routes/orders');

const app = express();

const allowedOrigins = [
	process.env.CLIENT_URL,
	...(process.env.CLIENT_URLS || '').split(',')
].map((origin) => origin && origin.trim()).filter(Boolean);

const isAllowedOrigin = (origin) => {
	if (!origin) return true;
	if (allowedOrigins.includes(origin)) return true;
	try {
		const hostname = new URL(origin).hostname;
		return hostname.endsWith('.vercel.app') || hostname === 'localhost' || hostname === '127.0.0.1';
	} catch {
		return false;
	}
};

app.use(cors({
	origin(origin, callback) {
		if (isAllowedOrigin(origin)) {
			return callback(null, true);
		}
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/licenses', licensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tracking', ordersRoutes);

app.get('/', (req, res) => res.json({ ok: true, app: 'ITraX API' }));

module.exports = app;
