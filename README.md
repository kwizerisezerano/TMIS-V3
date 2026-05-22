# TMIS - The Future Tontine Management System

A professional, modern Node.js + Nuxt 3 application for managing "The Future" tontine (rotating savings group) with real-time notifications, activity logging, and role-based access control.

## 🏛️ About "The Future" Tontine

**Location**: Kamonyi District, Runda Sector, Gihara Cell, Bimba Village  
**Founded**: January 14, 2024

### Leadership
- **President**: Florien NDAGIJIMANA
- **Vice President**: Dr. Athanase HATEGEKIMANA
- **Secretary/Accountant**: NIYONGOMBWA Didier
- **Advisor**: RUZIGANA Victor, HABIMANA Adolphe
- **Audit Committee**:
  - President: KWIZERA Ivan
  - Vice President: DUSABIMANA Edmond
  - Secretary: NIYIRORA Jean Damascene

## ✨ Features

### Core Features
- **Tontine Management**: Create and manage tontines
- **Member Management**: Track members, shares, and statuses
- **Contributions**: Record bulk contributions (accountant only)
- **Loans**: Request and manage loans, record bulk loans (accountant only)
- **Penalties**: Apply penalties, record bulk penalty payments (accountant only)
- **Payments**: Record manual loan payments (accountant only)
- **Meetings**: Schedule meetings and mark attendance (admin/president only)
- **Activity Log**: Complete audit trail of all POST/PUT/DELETE actions
- **Dashboard**: Real-time statistics and overview
- **Real-time Notifications**: Socket.io for live updates
- **Email Notifications**: Automated emails for key events

### Role-Based Permissions
| Role | Can Do | Cannot Do |
|------|---------|------------|
| **Admin/President** | Everything except: record contributions, loans, penalty payments | Record contributions, loans, penalty payments |
| **Accountant** | Only: record contributions, loans, penalty payments | Everything else |

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js**
- **MySQL** database
- **Socket.io** for real-time communication
- **JWT** authentication
- **bcryptjs** for password hashing
- **Nodemailer** for email notifications
- **node-cron** for scheduled tasks

### Frontend
- **Nuxt 3** (Vue 3)
- **Tailwind CSS** for styling
- **UIkit** (UButton, UCard, etc.)
- **Socket.io-client** for real-time updates
- **ofetch** for API calls

## 🚀 First-Time Setup Guide

### Prerequisites
1. **Node.js** (v16 or higher)
2. **MySQL** database (or XAMPP/WAMP for local development)
3. **npm** or **yarn** package manager

---

## Step 1: Database Setup

1. **Start MySQL** (if using XAMPP/WAMP, start Apache and MySQL)
2. **Create a database**:
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `ikimina_db`
3. **Configure database credentials**:
   - Open `backend/env.txt`
   - Check the default credentials:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=ikimina_db
     ```
   - Update if your MySQL credentials are different
   - Save as `backend/.env` (create a copy named `.env`)

---

## Step 2: Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd d:\TMIS\backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations**:
   - This creates all tables and seeds initial data (users, tontine, etc.)
   ```bash
   npm run migrate
   ```

4. **Start backend server**:
   ```bash
   npm run dev
   ```
   - Backend will run on **http://localhost:3300**

---

## Step 3: Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd d:\TMIS\nuxt-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start frontend development server**:
   ```bash
   npm run dev
   ```
   - Frontend will run on **http://localhost:3000**

---

## Step 4: First Login

### Default Admin Users (Already Created!)

| Name | Email | Password | Role |
|------|-------|----------|------|
| NDAGIJIMANA Florien | florien.ndagijimana@example.com | future2024 | Admin/President |
| Dr. Athanase HATEGEKIMANA | athanase.hategekimana@example.com | future2024 | Admin/President |
| NIYONGOMBWA Didier | akayezuberna@gmail.com | future2024 | Accountant |

1. Open **http://localhost:3000** in your browser
2. Login with any of the admin accounts above
3. You're ready to use the system!

---

## 📖 Using the System

### For Admins/Presidents (NDAGIJIMANA Florien, Dr. Athanase HATEGEKIMANA)
- **Dashboard**: View overall statistics
- **Tontines**: Manage tontines
- **Members**: Approve/reject membership applications, manage members
- **Meetings**: Schedule meetings and mark attendance
- **Manage Page**:
  - Members: Manage members
  - Contributions: View contributions
  - Loans: Approve/reject loans
  - Payments: View payments
  - Penalties: Apply penalties
  - Activity Log: View all system activity

### For Accountant (NIYONGOMBWA Didier)
- **Dashboard**: View overall statistics
- **Record Contributions**: Record bulk contributions
- **Record Loan Payments**: Record manual loan payments
- **Record Penalty Payments**: Record bulk penalty payments

---

## 🔧 Configuration

### Environment Variables (backend/.env)
```env
PORT=3300
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ikimina_db
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URLS=http://localhost:3000,http://localhost:3200
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## 📊 Project Structure

```
TMIS/
├── backend/
│   ├── controllers/        # Business logic
│   ├── middleware/         # Authentication, activity log, etc.
│   ├── migrations/         # Database setup
│   │   └── setup.js       # Creates tables and seeds data
│   ├── routes/             # API routes (v1)
│   ├── utils/              # Helpers, encryption, email templates
│   ├── server.js           # Main backend server
│   └── package.json
├── nuxt-frontend/
│   ├── pages/              # Nuxt pages
│   ├── layouts/            # Page layouts
│   ├── components/         # Vue components
│   ├── composables/        # Reusable logic (useAuth, useApi, etc.)
│   ├── nuxt.config.ts      # Nuxt configuration
│   └── package.json
└── README.md               # This file
```

---

## 🆘 Troubleshooting

### Backend won't start
- Check if MySQL is running
- Verify database credentials in `backend/.env`
- Make sure port 3300 is not in use

### Frontend shows 403 Forbidden
- Check that you're logged in with the correct role
- Make sure the backend server is running

### Can't see pending penalties on record page
- Make sure you're logged in as the accountant
- Refresh the page

---

## 📝 Activity Log

The system automatically logs **all POST/PUT/DELETE requests** to the `activity_log` table, including:
- User who performed the action
- Action type (POST/PUT/DELETE)
- Entity type (contributions, loans, penalties, etc.)
- Entity ID
- Action description
- Old and new data (where applicable)
- IP address and user agent
- Timestamp

View the activity log in **Manage Page → Activity Log** (admin only).

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit and push

---

## 📄 License

This project is for internal use by "The Future" tontine.

---

## 📞 Support

For support, contact the development team or the tontine leadership.

---

**© 2024 The Future Tontine. All rights reserved.**
