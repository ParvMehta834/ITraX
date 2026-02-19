# ITraX - Production-Grade Multi-Tenant SaaS Architecture & Dashboard Analytics

## Overview

This document describes the complete production-grade, scalable backend schema and multi-tenant architecture implemented for ITraX (IT Asset Management & Tracking System), along with the comprehensive Dashboard Analytics page with real MongoDB aggregation.

---

## 1. MULTI-TENANT ARCHITECTURE

### Organization Isolation
Every single database record is scoped to an **Organization (orgId)**. This ensures complete data isolation between tenants.

**Organization Model**:
```javascript
- _id (ObjectId)
- name (String)
- plan (String: Free | Paid | Enterprise)
- adminId (Reference to User)
- createdAt, updatedAt
```

**Key Principle**: Every API query must include `{ orgId: req.user.orgId }` filter.

### User Authentication with Org Scoping
Users now include `orgId` reference, enabling role-based access control within organizations.

**User Model Updates**:
```javascript
- orgId (Reference to Organization) ← NEW
- email (Unique per org: compound index { orgId, email })
- role (ADMIN | EMPLOYEE)
- status (ACTIVE | DISABLED)
- lastLoginAt ← NEW
```

**Org Scoping Middleware**:
```javascript
// Route: /server/src/middleware/orgScoping.js
const orgScopingMiddleware = (req, res, next) => {
  if (!req.user || !req.user.orgId) {
    return res.status(403).json({ message: 'Organization not found' });
  }
  req.orgId = req.user.orgId; // Attach to request
  next();
};
```

---

## 2. COMPLETE DATA MODEL & RELATIONSHIPS

### 2.1 Core Business Entities

#### **Department**
```javascript
- orgId (Reference to Organization)
- name (unique per org)
- description
```

#### **Location**
```javascript
- orgId (Reference to Organization)
- name (unique per org)
- type (Office | Warehouse)
- address, city, state, country
- capacity (Number)
- status (Active | Inactive)
- createdBy (Reference to User)

Indexes:
  - { orgId: 1, name: 1 } unique
  - { orgId: 1, type: 1 }
  - { orgId: 1, status: 1 }
  - Text index: orgId, name, city, state
```

#### **Category**
```javascript
- orgId (Reference to Organization)
- name (unique per org)
- description
- iconKey (String for UI icons)
- createdBy (Reference to User)

Indexes:
  - { orgId: 1, name: 1 } unique
  - Text index: orgId, name, description
```

#### **Employee**
```javascript
- orgId (Reference to Organization)
- userId (Optional reference to User if employee can login)
- firstName, lastName
- email (unique per org)
- phone
- departmentId (Reference to Department)
- locationId (Reference to Location)
- status (Active | OnLeave | Inactive)

Indexes:
  - { orgId: 1, email: 1 } unique
  - { orgId: 1, departmentId: 1 }
  - { orgId: 1, locationId: 1 }
  - { orgId: 1, status: 1 }
```

### 2.2 Asset Management (Core)

#### **Asset**
Production-grade schema with soft deletes, audit trails, and comprehensive tracking.

```javascript
- orgId (Reference to Organization)
- assetTag (unique per org) ← Asset ID
- name
- categoryId (Reference to Category)
- status (Available | Assigned | Maintenance | Retired)
- manufacturer, model
- serialNumber (unique per org, optional, sparse)
- purchaseDate, warrantyExpiry, endOfLifeDate
- locationId (Reference to Location)
- assignedToEmployeeId (Reference to Employee, nullable)
- assignedAt, returnedAt ← Timestamps
- cost
- notes, imageUrl
- createdBy, updatedBy (References to User)
- isDeleted (Boolean for soft delete)

Pre-save Hook:
  - If assignedToEmployeeId set → status must be 'Assigned'
  - If assignedToEmployeeId null → assignedAt cleared

Indexes:
  - { orgId: 1, assetTag: 1 } unique
  - { orgId: 1, serialNumber: 1 } unique, sparse
  - { orgId: 1, categoryId: 1 }
  - { orgId: 1, locationId: 1 }
  - { orgId: 1, assignedToEmployeeId: 1 }
  - { orgId: 1, status: 1 }
  - { orgId: 1, isDeleted: 1 }
  - { orgId: 1, warrantyExpiry: 1 }
  - Text index: orgId, assetTag, name, manufacturer, model, serialNumber
```

#### **AssetAssignmentHistory (Audit Trail)**
Immutable log of all asset assignments and returns.

```javascript
- orgId (Reference to Organization)
- assetId (Reference to Asset)
- fromEmployeeId (Reference to Employee, nullable)
- toEmployeeId (Reference to Employee)
- changedBy (Reference to User)
- changedAt (Date)
- note

Indexes:
  - { orgId: 1, assetId: 1 }
  - { orgId: 1, toEmployeeId: 1 }
  - { orgId: 1, changedAt: -1 }
```

### 2.3 Inventory Management

#### **InventoryItem**
Consumables and supplies tracking with computed totals (not stored).

```javascript
- orgId (Reference to Organization)
- name
- categoryId (Optional reference to Category)
- locationId (Reference to Location)
- quantityOnHand
- quantityMinimum
- costPerItem
- createdBy (Reference to User)

Virtual: total = quantityOnHand × costPerItem (computed, not stored)

Indexes:
  - { orgId: 1, name: 1 }
  - { orgId: 1, locationId: 1 }
  - Text index: orgId, name
```

### 2.4 Procurement & Order Management

#### **ProcurementOrder**
Tracks purchase orders through delivery.

```javascript
- orgId (Reference to Organization)
- orderId (unique per org) ← Order number
- supplier
- assetName
- categoryId (Optional reference to Category)
- quantity
- orderDate
- estimatedDelivery
- currentLocationText
- status (Ordered | Processing | Shipped | InTransit | OutForDelivery | Delivered | Cancelled)
- createdBy (Reference to User)

Indexes:
  - { orgId: 1, orderId: 1 } unique
  - { orgId: 1, status: 1 }
  - { orgId: 1, orderDate: -1 }
  - Text index: orgId, orderId, supplier, assetName
```

#### **OrderTrackingEvent (Timeline)**
Immutable events logging order status changes.

```javascript
- orgId (Reference to Organization)
- orderId (Reference to ProcurementOrder)
- stage (Enum: status stages)
- date
- note

Indexes:
  - { orgId: 1, orderId: 1 }
  - { orgId: 1, stage: 1 }
  - { orgId: 1, date: -1 }
```

### 2.5 License Management

#### **SoftwareLicense (previously License)**
```javascript
- orgId (Reference to Organization)
- name
- vendor
- seatsTotal
- seatsAssigned
- renewalDate
- cost
- status (Active | ExpiringSoon | Expired) ← Computed

Pre-save Hook:
  - status = 'Expired' if renewalDate < today
  - status = 'ExpiringSoon' if within 30 days
  - status = 'Active' otherwise

Indexes:
  - { orgId: 1, name: 1 }
  - { orgId: 1, renewalDate: 1 }
  - { orgId: 1, status: 1 }
  - Text index: orgId, name, vendor
```

### 2.6 Reporting

#### **ReportDefinition**
```javascript
- orgId (Reference to Organization)
- name
- category (Assets | Employees | Licenses | Inventory | Orders)
- format (PDF | CSV | Excel)
- queryKey (identifies aggregation to run)
- description
- createdBy (Reference to User)

Indexes:
  - { orgId: 1, category: 1 }
  - { orgId: 1, queryKey: 1 }
```

---

## 3. BACKEND IMPLEMENTATION

### 3.1 Directory Structure
```
server/src/
├── models/
│   ├── Organization.js ← NEW
│   ├── User.js (updated with orgId)
│   ├── Employee.js ← NEW
│   ├── Department.js ← NEW
│   ├── Location.js (updated with orgId)
│   ├── Category.js (updated with orgId)
│   ├── Asset.js (major update)
│   ├── AssetAssignmentHistory.js ← NEW
│   ├── InventoryItem.js (updated with orgId)
│   ├── ProcurementOrder.js ← NEW
│   ├── OrderTrackingEvent.js ← NEW
│   ├── License.js (renamed from License.js, updated with orgId)
│   └── ReportDefinition.js ← NEW
├── middleware/
│   ├── auth.js (existing)
│   └── orgScoping.js ← NEW
├── routes/
│   ├── dashboard.js ← NEW (analytics API)
│   └── (existing routes)
├── utils/
│   └── dashboardAggregations.js ← NEW (MongoDB aggregations)
└── app.js (updated to include dashboard routes)
```

### 3.2 Dashboard Aggregation Utilities

**Location**: `/server/src/utils/dashboardAggregations.js`

**Functions Implemented**:

1. **getAssetTotals(orgId)** → Faceted aggregation returning:
   - totalAssets, assignedAssets, availableAssets, maintenanceAssets, retiredAssets

2. **getLowStockItems(orgId)** → Count of inventory items where quantityOnHand < quantityMinimum

3. **getLicenseStats(orgId)** → Faceted aggregation returning:
   - totalLicenses, activeLicenses, expiringLicenses, expiredLicenses

4. **getOrderStats(orgId)** → Faceted aggregation returning:
   - totalOrders, ordersInTransit, ordersDelivered, ordersCancelled

5. **getAssetsByCategory(orgId)** → Aggregation returning:
   ```javascript
   [
     { _id: 'Laptop', count: 45, available: 20, assigned: 25 },
     { _id: 'Monitor', count: 60, available: 40, assigned: 20 },
     ...
   ]
   ```

6. **getAssetsByLocation(orgId)** → Similar structure for locations

7. **getAssetsByStatus(orgId)** → Pie chart data:
   ```javascript
   [
     { _id: 'Available', count: 85 },
     { _id: 'Assigned', count: 120 },
     ...
   ]
   ```

8. **getOrdersByStatus(orgId)** → Order distribution by status

9. **getLicenseRenewals90Days(orgId)** → Timeline data:
   ```javascript
   [
     { _id: '2026-03-15', count: 3, totalCost: 15000 },
     { _id: '2026-04-20', count: 5, totalCost: 25000 },
     ...
   ]
   ```

10. **getRecentAssetAssignments(orgId, limit)** → Populated documents with asset/employee details

11. **getRecentOrderEvents(orgId, limit)** → Populated documents with order tracking events

12. **getEmployeeCount(orgId)** → Distinct count of unique employees with assigned assets

**All functions use**:
- Compound indexes for optimal query performance
- `.lean()` for read-heavy operations
- `Promise.all()` for parallel execution
- Null/empty array coalescing for safe rendering

### 3.3 Dashboard API Endpoint

**Endpoint**: `GET /api/dashboard/summary`

**Protection**: Requires `authMiddleware` + `orgScopingMiddleware`

**Response Structure**:
```javascript
{
  success: true,
  data: {
    totals: {
      totalAssets: 205,
      assignedAssets: 120,
      availableAssets: 85,
      maintenanceAssets: 5,
      totalEmployees: 45,
      lowStockItems: 12,
      licensesExpiringSoon: 8,
      ordersInTransit: 3
    },
    charts: {
      assetsByCategory: [
        { name: 'Laptop', total: 45, available: 20, assigned: 25 },
        ...
      ],
      assetsByLocation: [ ... ],
      assetsByStatus: [
        { name: 'Available', value: 85 },
        ...
      ],
      ordersByStatus: [ ... ],
      licenseRenewalsNext90Days: [
        { date: '2026-03-15', licenses: 3, cost: 15000 },
        ...
      ]
    },
    recentActivity: {
      assetAssignments: [
        {
          assetTag: 'LAP-001',
          assetName: 'MacBook Pro M3',
          employeeName: 'John Doe',
          changedBy: 'Admin User',
          changedAt: '2026-02-18T10:30:00Z',
          note: 'New hire onboarding'
        },
        ...
      ],
      orderEvents: [
        {
          orderId: 'PO-2026-001',
          supplier: 'Dell Inc',
          stage: 'InTransit',
          date: '2026-02-18T08:00:00Z',
          note: 'Shipped from warehouse'
        },
        ...
      ]
    }
  }
}
```

**Additional Endpoints**:
- `GET /api/dashboard/assets/by-status` - Detailed status breakdown
- `GET /api/dashboard/assets/by-category` - Detailed category breakdown
- `GET /api/dashboard/assets/by-location` - Detailed location breakdown
- `GET /api/dashboard/licenses/expiring` - License expiration timeline

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 Directory Structure
```
client/src/
├── services/
│   └── dashboardService.js ← NEW
├── components/
│   ├── StatCard.jsx ← NEW
│   ├── ChartCard.jsx ← NEW
│   ├── ActivityList.jsx ← NEW
│   └── GlassNavbar.jsx (updated with Dashboard link)
├── pages/
│   └── DashboardPage.jsx ← NEW
└── App.jsx (updated with dashboard route)
```

### 4.2 dashboardService.js

Axios-based service for API calls with token authentication.

**Methods**:
- `getSummary()` - Fetch complete dashboard data
- `getAssetsByStatus()` - Detailed status breakdown
- `getAssetsByCategory()` - Detailed category breakdown
- `getAssetsByLocation()` - Detailed location breakdown
- `getLicenseExpirations()` - License renewal timeline

### 4.3 Frontend Components

#### **StatCard Component**
```javascript
Props:
  - title: string
  - value: number
  - icon: lucide-react Icon component
  - color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo'
  - trend: number (optional)
  - trendLabel: string (optional)

Returns:
  - Color-coded metric card with icon
  - Optional trend indicator (↑/↓ percentage)
  - Hover shadow effect
```

#### **ChartCard Component**
```javascript
Props:
  - title: string
  - children: ReactNode (chart)
  - loading: boolean
  - error: string | null
  - empty: boolean

Returns:
  - White card wrapper with conditional rendering
  - Loading spinner
  - Error message
  - Empty state message
  - Chart content container
```

#### **ActivityList Component**
```javascript
Props:
  - title: string
  - activities: array
  - loading: boolean
  - type: 'assignments' | 'orders'

Returns:
  - Sectioned activity feed
  - Time-aware date formatting (Today, Yesterday, dates)
  - Asset assignment view or order event view
  - Icons and visual hierarchy
```

### 4.4 DashboardPage.jsx

**Key Metrics (Top Row = 8 Statistics)**:
1. Total Assets
2. Assigned Assets
3. Available Assets
4. In Maintenance
5. Total Employees
6. Low Stock Items
7. Licenses Expiring Soon
8. Orders In Transit

**Charts (4-Chart Grid)**:
1. **Asset Status Distribution** - Pie chart with color-coded segments
2. **Order Status Distribution** - Bar chart by status
3. **Assets by Category** - Grouped bar chart (total, available, assigned)
4. **Assets by Location** - Grouped bar chart (total, available, assigned)
5. **License Renewals (90 Days)** - Line chart of expirations over time

**Recent Activity (2-Column Section)**:
1. **Recent Asset Assignments** - Latest 5 assignments with timestamps
2. **Recent Order Updates** - Latest 5 order status changes

**Features**:
- Real-time data from MongoDB aggregations (no mock data)
- Responsive grid layout (1 col mobile → 2 col tablet → 4 col desktop for metrics)
- Loading state with spinner
- Error handling with user-friendly messages
- Refresh button for manual data reload
- Color-coded status indicators
- Hover effects on all interactive elements

**Styling**:
- Enterprise SaaS design: white cards, gray backgrounds (#f8f9fa)
- Gray borders (#e2e8f0)
- Blue primary color (#3b82f6)
- No gradients or glassmorphism
- Tailwind CSS responsive classes
- Lucide React icons

### 4.5 Integration

**App.jsx Updates**:
- Import DashboardPage
- Add route: `<Route path="dashboard" element={<DashboardPage />} />`

**GlassNavbar.jsx Updates**:
- Add: `{ label: 'Dashboard', path: '/admin/dashboard' }` as first menu item
- Dashboard appears prominently in admin navigation

---

## 5. KEY ARCHITECTURAL PATTERNS & BEST PRACTICES

### 5.1 Org Scoping Pattern
```javascript
// Every route must include orgId filter
const assets = await Asset.find({ orgId: req.orgId, isDeleted: false })
  .populate('categoryId locationId assignedToEmployeeId')
  .lean();
```

### 5.2 Soft Deletes
Assets use `isDeleted: boolean` field instead of permanent deletion for audit trails.
```javascript
// Queries must filter soft deletes unless explicitly needed
{ orgId, isDeleted: false }
```

### 5.3 Compound Indexes for Multi-Tenant
```javascript
// Always orgId as first field
AssetSchema.index({ orgId: 1, assetTag: 1 }, { unique: true });
EmployeeSchema.index({ orgId: 1, email: 1 }, { unique: true });
```

### 5.4 Computed Values vs Stored
- **Stored**: Status, counts that drive business logic
- **Computed**: Inventory totals, asset statistics, aggregated metrics
  - Aggregations run on-read for always-accurate data
  - No need for background jobs or cache invalidation

### 5.5 Aggregation Pipeline Advantages
```javascript
// Faceted aggregation (single pass for multiple counts)
$facet: {
  total: [{ $count: 'count' }],
  assigned: [{ $match: { status: 'Assigned' } }, { $count: 'count' }],
  available: [{ $match: { status: 'Available' } }, { $count: 'count' }]
}
// executes all 3 matchers in single scan
```

### 5.6 Promise.all for Parallel Execution
```javascript
// Fetch 12 aggregations in parallel, not sequentially
const [assetTotals, lowStock, licenses, ...] = 
  await Promise.all([
    getAssetTotals(orgId),
    getLowStockItems(orgId),
    getLicenseStats(orgId),
    ...
  ]);
```

---

## 6. SECURITY & VALIDATION

### 6.1 Authentication Flow
1. User logs in with email + password
2. JWT token contains `userId` and implicitly `orgId` (from User.orgId)
3. authMiddleware extracts token → fetches User document
4. orgScopingMiddleware verifies `req.user.orgId` on every request

### 6.2 Request Scoping
```javascript
// All queries automatically scoped
GET /api/dashboard/summary
  → req.orgId = user.orgId
  → aggregations filter({ orgId: req.orgId })
  → Only that org's data returned
```

### 6.3 Role-Based Access (ADMIN/EMPLOYEE)
- ADMIN: Can view all org data, create/edit/delete records
- EMPLOYEE: Can view only assigned assets, limited dashboard metrics

### 6.4 Data Validation
- Mongoose schema validation (required fields, enums)
- Compound unique indexes prevent duplicates
- Foreign key references via `ref`

---

## 7. PERFORMANCE OPTIMIZATIONS

### 7.1 Indexing Strategy
Every collection has:
- **Compound index** on `{ orgId, primaryKey }` for scoped lookups
- **Status index** for filtering: `{ orgId, status }`
- **Foreign key indexes**: `{ orgId, categoryId }`, `{ orgId, locationId }`
- **Date indexes** for sorting: `{ orgId, createdAt: -1 }`
- **Text indexes** for search: Multi-field full-text search

### 7.2 Query Optimization
```javascript
// Use .lean() for dashboards (no Mongoose overhead)
Asset.find({ orgId, isDeleted: false }).lean();

// Use aggregation for complex calculations
Asset.collection.aggregate([...])

// Pagination on list endpoints
.limit(limit).skip((page - 1) * limit)
```

### 7.3 Connection Pooling
MongoDB connection pool handles multiple concurrent requests efficiently.

---

## 8. DEPLOYMENT & SCALING

### 8.1 Single Tenant per Installation
Today: One organization per ITraX instance
Future: Support multi-org by leveraging orgId scoping (already built-in)

### 8.2 Database Scaling
- Indexes on orgId ensure queries scale with data
- Sharding by orgId possible in future (logical separation ready)
- Soft deletes enable archival without rewriting relationships

### 8.3 API Rate Limiting
Recommend implementing per-org rate limits:
```javascript
app.use(rateLimit({
  keyGenerator: (req) => req.user?.orgId || req.ip,
  windowMs: 60 * 1000,
  max: 100
}));
```

---

## 9. USAGE EXAMPLES

### 9.1 Fetch Dashboard Summary
```javascript
// Frontend
const response = await dashboardService.getSummary();
// Returns complete data for rendering all dashboard cards and charts
```

### 9.2 Create Asset with Assignment
```javascript
POST /api/assets
{
  orgId: "org-123",
  assetTag: "LAP-001",
  name: "MacBook Pro",
  categoryId: "cat-456",
  locationId: "loc-789",
  assignedToEmployeeId: "emp-001",  // Auto-sets status: 'Assigned'
  purchaseDate: "2025-01-15",
  warrantyExpiry: "2027-01-15",
  cost: 2500
}
```

### 9.3 Track Asset Assignment History
```javascript
// When asset moves from one employee to another:
POST /api/assets/:id/assign
{
  fromEmployeeId: "emp-001",    // Current holder
  toEmployeeId: "emp-002",      // New holder
  changedBy: "admin-user-id",   // Who made the change
  note: "Transfer: John → Jane"
}
// Creates AssetAssignmentHistory record + updates Asset.assignedToEmployeeId
```

---

## 10. NEXT STEPS & RECOMMENDATIONS

### 10.1 Testing
- Unit tests for aggregation functions
- Integration tests for dashboard endpoints
- E2E tests for dashboard UI with real data

### 10.2 Future Enhancements
1. **Real-time Updates**: WebSocket for live asset movements
2. **Custom Reports**: User-defined report builder
3. **Analytics Export**: Schedule reports via email
4. **Comparison Metrics**: Month-over-month trends
5. **Predictions**: ML-based warranty expiration forecasts
6. **Multi-Org Support**: Enable true SaaS with org switching

### 10.3 Monitoring & Logging
- Log all asset movements (already tracked in AssetAssignmentHistory)
- Monitor aggregation query performance
- Alert on low stock items
- Alert on license expiration warnings

---

## 11. FILE MANIFEST

### Backend Files Created/Updated
1. **Models** (12 total):
   - Organization.js (NEW)
   - User.js (UPDATED with orgId)
   - Employee.js (NEW)
   - Department.js (NEW)
   - Location.js (UPDATED with orgId)
   - Category.js (UPDATED with orgId)
   - Asset.js (MAJOR UPDATE - soft deletes, assignment history)
   - AssetAssignmentHistory.js (NEW)
   - InventoryItem.js (UPDATED with orgId)
   - ProcurementOrder.js (NEW)
   - OrderTrackingEvent.js (NEW)
   - License.js (UPDATED with orgId, renamed field seatsAssigned)
   - ReportDefinition.js (NEW)

2. **Middleware** (1 new):
   - orgScoping.js (NEW - enforces org filtering)

3. **Routes** (1 new):
   - dashboard.js (NEW - analytics endpoints)

4. **Utilities** (1 new):
   - dashboardAggregations.js (NEW - 12 aggregation functions)

5. **Main**:
   - app.js (UPDATED - added dashboard routes)

### Frontend Files Created
1. **Services**:
   - dashboardService.js (NEW)

2. **Components**:
   - StatCard.jsx (NEW)
   - ChartCard.jsx (NEW)
   - ActivityList.jsx (NEW)

3. **Pages**:
   - DashboardPage.jsx (NEW - main dashboard)

4. **Updates**:
   - App.jsx (added DashboardPage import and route)
   - GlassNavbar.jsx (added Dashboard menu item)

---

## Summary

**ITraX now includes**:
- ✅ Production-ready multi-tenant architecture with complete org scoping
- ✅ 13 carefully designed database models with proper relationships and indexes
- ✅ Real MongoDB aggregation pipelines (no mock data)
- ✅ Enterprise dashboard with 8 key metrics + 5 advanced charts
- ✅ Recent activity feed with asset assignments and order events
- ✅ Responsive, professional UI using Tailwind CSS and Recharts
- ✅ Complete separation of concerns (models → utils → routes → services → components)
- ✅ Scalable architecture ready for production deployment

The entire system is designed for reliability, scalability, and excellent user experience. 🚀
