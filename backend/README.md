# TMIS Backend - How It Works

## 🏗️ Architecture Overview

The TMIS (Tontine Management Information System) backend is built with a **zero-duplication, high-performance architecture** using professional MVC patterns with advanced caching and optimization.

## 📁 Directory Structure

```
backend/
├── server.js                 # Main server entry point
├── controllers/              # Business logic (11 controllers)
├── routes/v1/               # API endpoints (11 route files)
├── utils/                   # Reusable utilities (8 utility files)
├── middleware/              # Request processing (auth, rate limiting)
├── migrations/              # Database setup scripts
└── package.json             # Dependencies and scripts
```

## 🚀 Core Components

### **1. Server (server.js)**
- **Express.js** web server with Socket.io for real-time updates
- **Performance monitoring** with automatic slow query detection
- **Rate limiting** with Redis fallback
- **Database connection pooling** (20 concurrent connections)
- **Cache warming** on startup for frequently accessed data
- **Automated cleanup** of old notifications and performance data

### **2. Controllers (controllers/)**
Each controller handles business logic for a specific feature:
- `authController.js` - User authentication and authorization
- `usersController.js` - User profile and management
- `tontinesController.js` - Tontine creation and management
- `contributionsController.js` - Contribution tracking and processing
- `loansController.js` - Loan applications and management
- `paymentsController.js` - Payment processing and status updates
- `meetingsController.js` - Meeting scheduling and attendance
- `notificationsController.js` - User notifications and alerts
- `membersController.js` - Membership management
- `penaltiesController.js` - Penalty calculation and application
- `applicationsController.js` - Membership applications

### **3. Routes (routes/v1/)**
Clean API endpoints that separate routing from business logic:
- Each route file defines endpoints and applies middleware
- Routes use dependency injection to receive database connections
- All routes follow RESTful conventions with proper HTTP methods

### **4. Utilities (utils/)**
Reusable utility classes that eliminate code duplication:

#### **DatabaseHelpers** (`utils/databaseHelpers.js`)
- **CRUD Operations**: `getById()`, `insert()`, `updateById()`, `deleteById()`
- **Pagination**: `getPaginated()` with automatic total count
- **Validation**: `exists()`, `validateOwnership()`
- **Specialized Methods**: `getUserById()`, `getTontineMembers()`, `isUserMemberOfTontine()`
- **Transactions**: `transaction()` for complex operations

#### **ResponseHelpers** (`utils/responseHelpers.js`)
- **Standardized Responses**: `sendSuccessResponse()`, `sendNotFoundResponse()`
- **HTTP Status Methods**: `sendValidationResponse()`, `sendUnauthorizedResponse()`
- **Paginated Responses**: `paginated()` with consistent format
- **Error Handling**: Standardized error responses

#### **BusinessHelpers** (`utils/businessHelpers.js`)
- **Validation**: `validateUserExists()`, `validateTontineExists()`
- **Business Rules**: `canJoinTontine()`, `canApplyForLoan()`
- **Permissions**: `isAdminOrPresident()`, `isCreator()`
- **Calculations**: `calculateLoanInterest()`, `calculateMaxLoanAmount()`
- **Notifications**: `notifyUsers()`, `notifyTontineMembers()`

#### **PerformanceHelpers** (`utils/performanceHelpers.js`)
- **Multi-level Caching**: User (5min), Tontine (10min), Config (30min), Stats (2min)
- **Batch Operations**: `batchInsert()`, `batchUpdate()` for bulk operations
- **Query Timing**: Automatic slow query detection and logging
- **Cache Warming**: Preloads frequently accessed data on startup
- **Memory Management**: Automatic cleanup and size limits

#### **Common Utilities** (`utils/common.js`)
- **Validation Patterns**: Email, phone, password, names validation
- **Error Responses**: Standardized error and success response formats
- **User Roles**: Role definitions and status codes
- **Date Helpers**: UTC date formatting and validation
- **Code Generators**: Verification codes and reference numbers

#### **Email System** (`utils/email.js`, `utils/emailTemplates.js`)
- **Email Templates**: Consistent HTML email designs
- **Dynamic Admin Fetching**: Automatically fetch admin emails
- **Email Encryption**: Secure email handling and decryption

#### **Encryption** (`utils/encryption.js`)
- **Data Encryption**: Encrypt sensitive user data
- **Decryption**: Secure data decryption with error handling
- **Email Lookup**: Find users by encrypted email

### **5. Middleware (middleware/)**
- **authMiddleware.js**: JWT authentication and role-based access control
- **rateLimitMiddleware.js**: Advanced rate limiting with Redis support

## 🔄 Request Flow

### **1. API Request Processing**
```
Client Request → Rate Limiting → Authentication → Route → Controller → Database → Response
```

### **2. Authentication Flow**
1. **JWT Token Verification**: Decode and validate JWT tokens
2. **User Role Check**: Verify user permissions (admin/president/member)
3. **Database Injection**: Pass database connection to controllers

### **3. Business Logic Processing**
1. **Input Validation**: Use common validation utilities
2. **Business Rules**: Apply business logic using BusinessHelpers
3. **Database Operations**: Use DatabaseHelpers for optimized queries
4. **Caching**: Check cache first, store results in cache
5. **Response Generation**: Use ResponseHelpers for consistent responses

## 📊 Performance Features

### **1. Caching System**
- **Multi-level Caching**: Different TTLs for different data types
- **Intelligent Warming**: Preloads frequently accessed data
- **Cache Hit Rate Monitoring**: Tracks caching effectiveness
- **Memory Management**: Automatic cleanup and size limits

### **2. Database Optimization**
- **Connection Pooling**: 20 concurrent connections with idle management
- **Query Optimization**: Pre-optimized query templates
- **Batch Operations**: Efficient bulk inserts/updates
- **Index Recommendations**: Automated performance suggestions

### **3. Rate Limiting**
- **Redis-backed**: Distributed rate limiting with fallback
- **Endpoint-specific**: Different limits for different endpoints
- **Role-based**: Dynamic limits based on user roles
- **WebSocket Protection**: Connection management for real-time features

### **4. Performance Monitoring**
- **Query Timing**: Automatic slow query detection (>100ms)
- **Request Tracking**: Monitor API usage patterns
- **Cache Analytics**: Hit rate and performance metrics
- **Resource Monitoring**: Memory and connection usage

## 🛡️ Security Features

### **1. Authentication & Authorization**
- **JWT Tokens**: Secure token-based authentication
- **Role-based Access**: Admin, President, Member roles
- **Password Security**: Bcrypt hashing with salt
- **Session Management**: Secure token handling

### **2. Data Protection**
- **Encryption**: Sensitive data encrypted at rest
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: Protection against brute force attacks

### **3. API Security**
- **CORS Configuration**: Secure cross-origin requests
- **Request Size Limits**: Prevent large payload attacks
- **Rate Limiting**: Prevent abuse and DoS attacks
- **Error Handling**: Secure error message responses

## 📡 Real-time Features

### **Socket.io Integration**
- **Real-time Updates**: Live payment status updates
- **Room Management**: `tontine-{id}` and `user-{id}` rooms
- **Connection Monitoring**: Track active connections
- **Event Broadcasting**: Send updates to relevant users

### **Automated Processes**
- **Payment Polling**: Check payment status every 30 seconds
- **Penalty Calculation**: Automated penalty application
- **Notification Cleanup**: Remove old notifications daily
- **Cache Warming**: Preload frequently accessed data

## 🗄️ Database Schema

### **Core Tables**
- **users**: User accounts and profiles
- **tontines**: Tontine groups and settings
- **tontine_members**: Membership relationships
- **contributions**: Financial contributions
- **loans**: Loan applications and tracking
- **payments**: Payment processing records
- **notifications**: User notifications
- **meetings**: Meeting scheduling
- **penalties**: Penalty tracking
- **applications**: Membership applications

### **Performance Indexes**
- **User Indexes**: Email lookup, role filtering
- **Tontine Indexes**: Status filtering, date ordering
- **Contribution Indexes**: User-tontine relationships, payment status
- **Loan Indexes**: User loans, status tracking
- **Notification Indexes**: User notifications, read status

## 🎯 API Endpoints

### **Authentication** (`/api/v1/auth`)
- `POST /login` - User login
- `POST /register` - User registration
- `POST /admin/register` - Admin registration
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation
- `GET /admins` - Get admin users

### **Users** (`/api/v1/users`)
- `GET /:userId` - Get user profile
- `PUT /:userId` - Update user profile
- `PUT /:userId/password` - Change password
- `GET /` - List all users (admin)
- `POST /` - Create user (admin)
- `PUT /:userId/role` - Update user role (admin)
- `DELETE /:userId` - Delete user (admin)

### **Tontines** (`/api/v1/tontines`)
- `GET /` - List tontines
- `GET /:id` - Get tontine details
- `POST /` - Create tontine (admin)
- `PUT /:id` - Update tontine (admin)
- `PUT /:id/status` - Update tontine status (admin)
- `DELETE /:id` - Delete tontine (admin)
- `POST /:id/join` - Join tontine
- `GET /user/:userId` - Get user tontines

### **Contributions** (`/api/v1/contributions`)
- `GET /` - List contributions (admin)
- `GET /tontine/:tontineId` - Get tontine contributions (admin)
- `GET /user/:userId` - Get user contributions
- `POST /` - Create contribution (admin)
- `PUT /:contributionId/status` - Update contribution status (admin)
- `DELETE /:contributionId` - Delete contribution (admin)

### **Loans** (`/api/v1/loans`)
- `GET /` - List loans (admin)
- `GET /user/:userId` - Get user loans
- `GET /tontine/:tontineId` - Get tontine loans (admin)
- `POST /` - Apply for loan
- `PUT /:loanId/status` - Update loan status (admin)
- `DELETE /:loanId` - Delete loan (admin)

### **Payments** (`/api/v1/payments`)
- `GET /` - List payments (admin)
- `GET /user/:userId` - Get user payments
- `POST /contribution` - Process contribution payment
- `POST /loan` - Process loan payment
- `PUT /:paymentId/status` - Update payment status (admin)

### **Meetings** (`/api/v1/meetings`)
- `GET /` - List meetings (admin)
- `GET /tontine/:tontineId` - Get tontine meetings
- `POST /` - Create meeting (admin)
- `PUT /:meetingId` - Update meeting (admin)
- `PUT /:meetingId/attendance` - Record attendance (admin)
- `GET /:meetingId/attendance` - Get meeting attendance

### **Notifications** (`/api/v1/notifications`)
- `GET /user/:userId` - Get user notifications
- `PUT /:notificationId/read` - Mark notification as read
- `PUT /user/:userId/read-all` - Mark all notifications as read
- `DELETE /:notificationId` - Delete notification
- `POST /` - Create notification (admin)
- `POST /broadcast` - Broadcast notification (admin)

### **Members** (`/api/v1/members`)
- `GET /tontine/:tontineId` - Get tontine members
- `POST /tontine/:tontineId/join` - Join tontine
- `PUT /:membershipId/status` - Update membership status (admin)
- `PUT /:membershipId/leave` - Leave tontine
- `DELETE /:membershipId` - Remove member (admin)

### **Applications** (`/api/v1/applications`)
- `POST /` - Submit membership application
- `GET /` - List applications (admin)
- `GET /:applicationId` - Get application details
- `POST /:applicationId/files` - Upload application files
- `PUT /:applicationId/status` - Update application status (admin)
- `DELETE /:applicationId` - Delete application (admin)

## 🔧 Configuration

### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ikimina_db
DB_CONNECTION_LIMIT=20
DB_SSL=false

# Server
PORT=3300
NODE_ENV=development
FRONTEND_URLS=http://localhost:3000,http://localhost:3200

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **Code Quality Tools**
- **ESLint**: Code quality and security rules
- **Prettier**: Code formatting and consistency
- **Performance Monitoring**: Real-time performance analysis
- **Query Optimization**: Automated performance suggestions

## 🚀 Getting Started

### **1. Installation**
```bash
cd backend
npm install
```

### **2. Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

### **3. Database Setup**
```bash
npm run setup
```

### **4. Start Server**
```bash
npm start
# or for development
npm run dev
```

### **5. Performance Analysis**
```bash
node performance-monitoring.js
```

## 📈 Performance Metrics

### **Expected Performance**
- **Response Time**: <200ms for cached requests
- **Database Queries**: <100ms average
- **Cache Hit Rate**: >80% for frequently accessed data
- **Concurrent Users**: 1000+ with current configuration

### **Monitoring**
- **Slow Query Detection**: Automatically logged (>100ms)
- **Cache Analytics**: Hit rate and performance tracking
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **Resource Monitoring**: Memory and connection usage

## 🎯 Key Features

### **Zero Duplication**
- **Reusable Utilities**: All common code centralized
- **Consistent Patterns**: Standardized across all controllers
- **DRY Principle**: No repeated code anywhere in the system

### **High Performance**
- **Multi-level Caching**: Intelligent caching strategies
- **Database Optimization**: Optimized queries and indexing
- **Connection Pooling**: Efficient resource management
- **Batch Operations**: Bulk processing for efficiency

### **Professional Architecture**
- **MVC Pattern**: Clean separation of concerns
- **Dependency Injection**: Testable and maintainable code
- **Error Handling**: Comprehensive error management
- **Security**: Enterprise-grade security features

### **Scalability**
- **Microservice Ready**: Modular architecture
- **Horizontal Scaling**: Redis-backed rate limiting
- **Database Optimization**: Performance monitoring
- **Resource Management**: Efficient resource usage

This backend provides a solid foundation for a scalable, maintainable, and high-performance tontine management system with professional code quality standards.
