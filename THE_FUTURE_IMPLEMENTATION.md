# The Future Cooperative - Implementation Guide

## Overview
This implementation is specifically designed for "The Future" cooperative as per their constitution dated January 14, 2024, adopted at Runda, Kamonyi District.

## Key Features Implemented

### 1. Cooperative Structure
- **Name**: The Future
- **Headquarters**: Southern Province, Kamonyi District, Runda Sector, Gihara Cell, Bimba Village
- **Founded**: January 14, 2024
- **Max Members**: 20 (as per Article 7.a)

### 2. Executive Committee (Article 17)
- **President**: Florien NDAGIJIMANA (0788570890)
- **Vice-President**: Dr. Athanase HATEGEKIMANA (0788738036)
- **Secretary/Accountant**: NIYONGOMBWA Didier (0788602741)
- **Advisors**: RUZIGANA Victor, HABIMANA Adolphe
- **Auditors**: KWIZERA Ivan (President), DUSABIMANA Edmond (V/President), NIYIRORA Jean Damascene (Secretary)

### 3. Financial Rules (Chapter V)

#### Monthly Contributions (Article 26)
- **Amount**: 20,000 RWF per month (mandatory)
- **New Member Fee**: Share amount + 10% of current share value
- **Payment Method**: Lanari Pay integration (0790989830)

#### Loan System (Article 28)
- **Maximum Amount**: 2/3 of member's total contributions
- **Interest Rate**: 1.7% per month
- **Repayment Period**: Maximum 6 months
- **Eligibility**: No outstanding loans
- **Late Payment**: 3.4% per month after 3 months overdue

### 4. Penalties System (Article 36)

All penalty configurations are centralized in `backend/utils/theFutureConfig.js`

#### Meeting Penalties
- **Unexcused Absence**: 5,000 RWF
- **Late Arrival** (>15 minutes): 1,000 RWF

#### Contribution Penalties
- **Late Payment** (10-17 days): 1,000 RWF
- **Late Payment** (after 17th): 200 RWF per day

#### Loan Penalties
- **Default Payment**: 10% of remaining balance per month
- **Increased Interest**: After 3 months overdue, interest rate increases to 3.4% per month (from 1.7%)

### 5. Member Exit Rules (Article 8)

#### Resignation Process
1. Written request to Executive Committee
2. Executive Committee review and recommendation  
3. General Assembly final decision
4. **Retention**: 20% of net amount (contributions - loans - penalties) retained by cooperative
5. **Payout Period**: Maximum 2 months after accounting

#### Expulsion Criteria
- Non-compliance with statutes
- 3 consecutive months of missed contributions (automatic eligibility)
- **Decision**: 2/3 majority of General Assembly required
- **Same Financial Terms**: 20% retention applies

#### Refund Calculation
- Implemented in `backend/controllers/membersController.js`
- `calculateRefundAmount()` method calculates:
  - Total approved contributions
  - Minus outstanding loans
  - Minus outstanding penalties
  - Minus 20% retention
  - Final refund amount

#### Death of Member
- Legal heirs can request funds or replacement
- Follows Rwandan inheritance laws
- Executive Committee review → General Assembly decision

### 6. Database Schema

#### Key Tables
- `users` - Member information with roles and member types
- `tontines` - The Future cooperative details
- `tontine_members` - Membership records with status tracking
- `contributions` - Monthly 20,000 RWF payments
- `loans` - Loan applications with 1.7% interest (up to 2/3 of savings)
- `loan_payments` - Loan repayment tracking
- `penalties` - Fine tracking system (includes `type` field for categorization)
- `meetings` - Meeting records
- `meeting_attendance` - Attendance tracking with penalty flags
- `applications` - Membership applications
- `notifications` - Real-time notifications

### 7. API Endpoints

#### Penalties Management
```
POST /api/penalties/meeting-absence
POST /api/penalties/late-contribution
POST /api/penalties/late-meeting
POST /api/penalties/loan-default
GET /api/penalties/user/:userId
GET /api/penalties/tontine/:tontineId
POST /api/penalties/pay/:penaltyId
```

#### Member Management
```
POST /api/members/resign
POST /api/members/expel
GET /api/members/exit-requests/:tontineId
PUT /api/members/exit-request/:exitId
```

#### Enhanced Loan System
```
POST /api/loans (with 2/3 share limit and 1.7% interest)
POST /api/loans/:loanId/enforce-payment
```

### 8. Frontend Components

#### New Pages
- `/the-future` - Association-specific dashboard
- Enhanced `/payments` with Lanari integration
- Enhanced `/loans` with association rules

#### New Composables
- `useTheFuture.js` - Association-specific functions
- `usePayments.js` - Lanari payment integration
- `useLoans.js` - Loan management with rules

### 9. Lanari Payment Integration

#### Configuration
- **API Endpoint**: https://www.lanari.rw/lanari_pay/api/payment/process.php
- **Payout Number**: 0790989830 (all payments route here)
- **Currency**: RWF (Rwandan Francs)
- **Features**: Contributions, loan payments, refunds

### 10. Real-time Features
- Socket.io integration for live updates
- Real-time notifications for payments, loans, penalties
- Live dashboard updates for executives

### 11. Security & Compliance
- Role-based access control
- Executive Committee permissions
- Audit trails for all financial transactions
- Compliance with Rwandan laws

### 12. Usage Instructions

#### For Members
1. Register with ID number and phone
2. Pay monthly 20,000 RWF contributions (due by 10th of each month)
3. Request loans up to 2/3 of contributions at 1.7% monthly interest
4. Repay loans within 6 months maximum
5. Pay penalties through Lanari Pay
6. Submit resignation requests if needed (20% retention applies)

#### For Executive Committee
1. Review and approve loan requests within 3 days (Article 29)
2. Apply penalties for violations per Article 36
3. Process member resignations/expulsions with 20% retention calculation
4. Monitor cooperative finances
5. Generate annual reports by January 15 (Article 19)
6. Publish decisions within 7 days (Article 19)

#### For Auditors
1. Review financial records
2. Audit penalty applications
3. Verify loan calculations (1.7% interest, 2/3 limit)
4. Verify overdue interest calculations (3.4% after 3 months)
5. Report to General Assembly

### 13. Deployment
1. Run database migration: `npm run migrate`
2. Start backend: `npm run dev`
3. Start frontend: `npm start`
4. Access The Future dashboard: `/the-future`

## Constitution Compliance Summary

This implementation fully complies with "The Future" cooperative's constitution adopted on January 14, 2024:

| Article | Requirement | Implementation Status |
|---------|-------------|----------------------|
| Art. 7(a) | Max 20 members | ✅ Enforced in database and application |
| Art. 26 | 20,000 RWF monthly contribution | ✅ Default in system |
| Art. 27 | 10% new member entry fee | ✅ Implemented in `theFutureConfig.js` |
| Art. 28 | 2/3 loan limit, 1.7% interest, 6 months max | ✅ Implemented in loans controller |
| Art. 28 | 3.4% interest after 3 months default | ✅ Implemented in `calculateOverdueInterest()` |
| Art. 29 | Loan decision within 3 days | ✅ Documented and tracked |
| Art. 8 | 20% retention on exit | ✅ Implemented in `calculateRefundAmount()` |
| Art. 8 | 3 months non-contribution = expulsion | ✅ Check function in `theFutureConfig.js` |
| Art. 36 | Penalty system | ✅ Full implementation with all rates |
| Art. 19 | Annual report by Jan 15 | ✅ Tracked in system |

## Configuration File

All constitution-specific rules are centralized in `backend/utils/theFutureConfig.js`:
- Monthly contribution amounts
- Loan parameters (limits, interest rates)
- Penalty amounts
- Exit/retention rules
- Expulsion criteria

## Recent Updates

1. **Penalties Table Schema Fix**: Added `type` column and `waived` status
2. **20% Retention on Exit**: Implemented in `membersController.js`
3. **Overdue Interest Calculation**: 3.4% after 3 months implemented
4. **Configuration Centralization**: All rules in `theFutureConfig.js`
5. **Migration Script**: `addPenaltyType.js` for existing databases
