# ITraX Assets Management Page - Complete Implementation

## Overview
A full-featured enterprise Assets management page with modern SaaS design, complete backend API, and responsive frontend.

## Frontend Implementation ✅

### Page: AdminAssets.jsx 
- **Location**: `client/src/pages/AdminAssets.jsx`
- **Features**:
  - Search with 500ms debounce (searches: assetId, manufacturer, model, category)
  - Filter drawer (Status, Category, Location)
  - Add/Edit Asset modal
  - CSV Export functionality
  - Pagination (10 items per page, server-side)
  - Action menu (Edit, Delete) for each row
  - Delete confirmation dialog
  - Status badges (Available, Assigned, Maintenance)
  - Loading states & empty states
  - Toast notifications

### Components Created

#### 1. **AddEditAssetModal.jsx**
- Add new assets or edit existing ones
- Form validation (real-time error display)
- Auto-generate Asset ID if not provided
- Fields:
  - Asset ID (optional, auto-generated)
  - Category (required)
  - Manufacturer (required)
  - Model (required)
  - Status (default: Available)
  - Current Location (required)
  - Current Employee (optional)
  - Purchase Date
  - Warranty Expiry Date
  - Notes

#### 2. **FilterDrawer.jsx**
- Right-side drawer interface
- Filter by:
  - Status: All / Available / Assigned / Maintenance
  - Category: Text search
  - Location: Text search
- Apply & Reset buttons
- Overlay click to close

#### 3. **StatusBadge.jsx**
- Displays asset status with color coding:
  - Available → Gray badge
  - Assigned → Blue badge
  - Maintenance → Yellow badge

### Service API

#### **assetService.js**
```javascript
- getAssets(params)              // Get all assets with filters/pagination
- getAssetById(id)               // Get single asset
- createAsset(data)              // Create new asset
- updateAsset(id, data)          // Update asset
- deleteAsset(id)                // Delete asset
- exportAssets(params)           // Export as CSV
```

### Styling
- Tailwind CSS utility classes
- Enterprise design system:
  - Primary Blue: #2563eb
  - Text Dark: #0f172a
  - Secondary Text: #475569
  - Border: #e2e8f0
  - White cards with subtle shadows
  - Responsive table layout

## Backend Implementation ✅

### Asset Model (Mongoose)
**File**: `server/src/models/Asset.js`

```javascript
{
  assetId: String (unique, required),
  category: String (required),
  manufacturer: String (required),
  model: String (required),
  status: 'Available' | 'Assigned' | 'Maintenance',
  currentEmployee: String (optional),
  currentLocation: String (required),
  purchaseDate: Date,
  warrantyExpiryDate: Date,
  notes: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Text Indexes**: assetId, manufacturer, model, category (for search)

### API Routes
**File**: `server/src/routes/assets.js`

#### **GET /api/assets**
Query Parameters:
- `search` - Search by assetId, manufacturer, model, or category
- `status` - Filter by status (Available, Assigned, Maintenance)
- `category` - Filter by category
- `location` - Filter by location
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

Response:
```json
{
  "data": [...],
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

#### **POST /api/assets** (Admin Only)
Creates a new asset. If `assetId` is not provided, generates one automatically.

Request:
```json
{
  "assetId": "AST-001",
  "category": "Laptop",
  "manufacturer": "Dell",
  "model": "XPS 15",
  "status": "Available",
  "currentEmployee": "John Doe",
  "currentLocation": "Office A",
  "purchaseDate": "2023-01-15",
  "warrantyExpiryDate": "2025-01-15"
}
```

#### **PUT /api/assets/:id** (Admin Only)
Updates an existing asset with validation.

#### **DELETE /api/assets/:id** (Admin Only)
Deletes an asset.

#### **GET /api/assets/export/download** (Admin Only)
Exports filtered assets as CSV file.

Query Parameters: Same as GET /api/assets (search, status, category, location)

### Validation
- Category, Manufacturer, Model, Location are required
- Status must be one of: Available, Assigned, Maintenance
- Proper HTTP status codes:
  - 200: Success
  - 201: Created
  - 400: Validation error
  - 401: Unauthorized
  - 403: Forbidden (non-admin)
  - 404: Not found
  - 500: Server error

### Security
- JWT authentication on all routes
- Role-based access control (Admin only for POST, PUT, DELETE)
- Input validation on all endpoints

## Database Setup

### Test Data
**File**: `server/seed-assets.js`

To populate with 15 test assets:
```bash
cd server
node seed-assets.js
```

Creates assets in categories: Laptop, Mobile Phone, Keyboard, Monitor, Tablet, Headphones, Webcam, SSD Storage

## How to Use

### 1. **Start Backend**
```bash
cd server
npm install json2csv
npm run dev
# Runs on http://localhost:4000
```

### 2. **Seed Database** (Optional)
```bash
cd server
node seed-assets.js
```

### 3. **Start Frontend**
```bash
cd client
npm install axios
npm run dev
# Runs on http://localhost:5174 (or first available port)
```

### 4. **Access Admin Assets Page**
1. Login with admin credentials (role: ADMIN)
2. Navigate to `/admin/assets`
3. Or click "Admin" link in the top navigation

## Features Walkthrough

### Search
- Type in search box
- Searches real-time with 500ms debounce
- Searches across: Asset ID, Manufacturer, Model, Category

### Filter
1. Click "Filter" button
2. Select Status (All, Available, Assigned, Maintenance)
3. Enter Category to search (any value)
4. Enter Location to search (any value)
5. Click "Apply"
6. Data updates instantly

### Add Asset
1. Click "+ Add Asset" button
2. Fill in form (required fields marked with *)
3. Asset ID auto-generates if left empty
4. Click "Create Asset"
5. Toast notification confirms success
6. Modal closes, table refreshes

### Edit Asset
1. Click ⋮ (three dots) on any row
2. Select "Edit"
3. Modal opens with prefilled data
4. Modify fields
5. Click "Update Asset"
6. Changes save, table refreshes

### Delete Asset
1. Click ⋮ on any row
2. Select "Delete"
3. Confirm in dialog
4. Asset removed from database
5. Table refreshes

### Export
1. Apply any filters/search if needed
2. Click "Export" button
3. CSV file downloads with:
   - Headers: assetId, category, manufacturer, model, status, currentEmployee, currentLocation, purchaseDate, warrantyExpiryDate
   - All currently filtered assets

### Pagination
- Shows X to Y of Z assets
- Previous/Next buttons
- Disabled when at first/last page
- Page info displays current page and total pages

## File Structure
```
client/
  src/
    pages/
      AdminAssets.jsx          ← Main page component
    components/
      AddEditAssetModal.jsx    ← Create/Edit modal
      FilterDrawer.jsx         ← Filter drawer
      StatusBadge.jsx          ← Status indicator
    services/
      assetService.js          ← API calls

server/
  src/
    models/
      Asset.js                 ← Mongoose schema
    routes/
      assets.js                ← API endpoints
    app.js                     ← Register routes
  package.json                 ← Dependencies (now includes json2csv)
  seed-assets.js               ← Test data generator
```

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Axios
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Authentication**: JWT
- **Export**: json2csv

## Notes
- All forms have proper validation with error messages
- Toast notifications for success/error feedback
- Responsive design for mobile/tablet/desktop
- Real-time search with debounce to prevent excessive API calls
- Server-side pagination for performance
- All timestamps are ISO format
- Status defaults to "Available" for new assets
- Asset IDs auto-generate as AST-{timestamp}-{count} if not provided
- Delete operations require confirmation
- Export respects current filters and search

## Next Steps
If needed, you can:
1. Add more filters (manufacturer, model search)
2. Add bulk operations (select multiple, batch delete/update)
3. Add asset images/attachments
4. Add asset history/audit log
5. Add asset assignments timeline
6. Create Asset detail page with full history
