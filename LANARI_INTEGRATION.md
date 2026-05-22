# Lanari Payment Integration & Refund System

## New Features Added

### 1. Lanari Payment Integration
- **Real-world payment processing** using Lanari Pay API
- All payments automatically route to `0790989830` as specified
- Supports both contribution and loan payments
- Uses RWF currency for Rwanda market

### 2. Tontine Owner Refund System
- Tontine owners can now process refunds for member contributions
- Refunds are processed through Lanari Pay API
- Full audit trail with refund reasons and transaction references

### 3. Loan Payment Enforcement
- Tontine owners can enforce loan payments for overdue loans
- Real-time notifications to borrowers
- Payment tracking and status updates

## API Endpoints

### Payment Processing
```
POST /api/payments/contribution
POST /api/payments/loan-payment
POST /api/payments/refund
```

### Loan Management
```
POST /api/loans/:loanId/enforce-payment
GET /api/loans/:loanId/payments
```

## Lanari API Configuration

The system uses the following Lanari Pay configuration:
- **API Key**: `5a257d53460ade03b19daf2ed8195938d0586ff6297e8fc5ab840958200ceeb8`
- **API Secret**: `1b0903514c0d2192a3b0f9e57857807287ef2da754396a5c63d7d586eba4c4f2b8929a4e069f65d27aec05a3d3b0a47226e432236076ea6e0e9fde51a85c164a`
- **Payout Number**: `0790989830` (all payments route here)
- **Currency**: RWF (Rwandan Francs)

## Frontend Components

### New Composables
- `usePayments.js` - Payment processing functions
- `useLoans.js` - Loan management functions

### New Components
- `RefundModal.vue` - Refund processing interface
- `LoanPaymentModal.vue` - Loan payment interface

### Updated Pages
- `payments.vue` - Enhanced with Lanari integration and refund functionality

## Database Changes

### New Tables
```sql
-- Refunds table
CREATE TABLE refunds (
  id int(11) NOT NULL AUTO_INCREMENT,
  contribution_id int(11) NOT NULL,
  refund_amount decimal(10,2) NOT NULL,
  reason text NOT NULL,
  processed_by int(11) NOT NULL,
  transaction_ref varchar(255) NOT NULL,
  status enum('pending','completed','failed') DEFAULT 'pending',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  FOREIGN KEY (contribution_id) REFERENCES contributions(id),
  FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

### Updated Tables
- `contributions` - Added `refund_status` field
- `loan_requests` - Added `payment_enforced` and `enforced_at` fields

## Usage Examples

### Making a Contribution Payment
```javascript
const { processLanariPayment } = usePayments()

await processLanariPayment(
  1000, // amount in RWF
  '0781234567', // customer phone
  'Monthly contribution for Tontine ABC'
)
```

### Processing a Refund (Tontine Owner)
```javascript
const { processRefund } = usePayments()

await processRefund({
  userId: ownerId,
  contributionId: 123,
  refundAmount: 1000,
  reason: 'Member requested refund due to emergency'
})
```

### Enforcing Loan Payment
```javascript
const { enforcePayment } = useLoans()

await enforcePayment(loanId, ownerId, paymentAmount)
```

## Security Notes

- All Lanari API calls are server-side only
- API credentials are stored securely in environment variables
- Only tontine owners can process refunds
- All transactions are logged with full audit trails

## Testing

To test the integration:
1. Start the backend server: `npm run dev`
2. Start the frontend: `npm start`
3. Navigate to the Payments page
4. Use test phone numbers for Lanari integration
5. Monitor transaction logs in the backend console