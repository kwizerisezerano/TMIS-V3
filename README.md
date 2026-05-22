# Ikimina - Digital Tontine Management System

A modern Node.js application for managing tontines (rotating savings groups) with real-time payment integration and live notifications.

## Features

- **Tontine Management**: Create and manage tontines with customizable rules
- **Real-time Payments**: Support for Stripe, PayPal, and Mobile Money
- **Live Notifications**: Real-time updates using Socket.io
- **Member Management**: Track members, contributions, and payouts
- **Loan System**: Request and manage loans within tontines
- **Dashboard Analytics**: Visual charts and statistics
- **Mobile Responsive**: Works on all devices

## Tech Stack

### Backend
- Node.js with Express.js
- MySQL database
- Socket.io for real-time communication
- Stripe & PayPal for payment processing
- JWT authentication
- bcryptjs for password hashing

### Frontend
- React.js with React Router
- Bootstrap for UI components
- Chart.js for data visualization
- Socket.io-client for real-time updates
- Axios for API calls

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MySQL database
- XAMPP (for local development)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials and API keys

4. Run database migration:
```bash
npm run migrate
```

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3001`

## Database Migration

The project includes an automated migration system:

```bash
cd backend
npm run migrate
```

This will:
- Connect to your MySQL database
- Execute all SQL statements from the migration file
- Set up all necessary tables and schema

## Payment Integration

### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe dashboard
3. Update the `.env` file with your Stripe keys
4. Update the frontend with your publishable key

### PayPal Setup
1. Create a PayPal developer account
2. Create a new application
3. Get your Client ID and Secret
4. Update the `.env` file with PayPal credentials

### Mobile Money
The application includes a mock mobile money implementation. For production:
- Integrate with actual mobile money APIs (MTN Mobile Money, Airtel Money, etc.)
- Update the payment processing logic in `routes/payments.js`

## Real-time Features

The application uses Socket.io for real-time updates:

- **Live Notifications**: Instant notifications for payments, approvals, etc.
- **Real-time Dashboard**: Live updates of contributions and statistics
- **Member Activity**: See when members join or make contributions
- **Payment Status**: Real-time payment processing updates

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Tontines
- `GET /api/tontines` - Get all tontines
- `GET /api/tontines/:id` - Get tontine details
- `POST /api/tontines` - Create new tontine
- `POST /api/tontines/:id/join` - Join tontine

### Contributions
- `GET /api/contributions/tontine/:id` - Get tontine contributions
- `GET /api/contributions/user/:id` - Get user contributions
- `POST /api/contributions` - Submit contribution

### Payments
- `POST /api/payments/contribution` - Process contribution payment
- `POST /api/payments/loan-payment` - Process loan payment
- `GET /api/payments/history/:userId` - Get payment history

### Loans
- `GET /api/loans/tontine/:id` - Get tontine loans
- `GET /api/loans/user/:id` - Get user loans
- `POST /api/loans` - Submit loan request

## Project Structure

```
├── backend/
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── migrations/      # Database migrations
│   ├── utils/          # Utility functions
│   ├── server.js       # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services and contexts
│   │   └── utils/      # Utility functions
│   ├── public/
│   └── package.json
└── README.md
```

## Development

### Running in Development Mode

1. Start the backend:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm start
```

### Building for Production

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend in production mode:
```bash
cd backend
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.