 /**
 * The Future Cooperative Configuration
 * Contains all constitution-specific rules and calculations as per the constitution
 * Adopted on 14/01/2024 at Runda, Kamonyi District
 */

const THE_FUTURE_CONFIG = {
  // Article 26: Monthly contribution amount
  MONTHLY_CONTRIBUTION: 20000, // RWF

  // Article 7(a): Maximum number of members
  MAX_MEMBERS: 20,

  // Article 28: Loan rules
  LOAN: {
    // Maximum loan amount as fraction of savings
    MAX_LOAN_FRACTION: 2 / 3,
    
    // Monthly interest rate (1.7%)
    MONTHLY_INTEREST_RATE: 1.7,
    
    // Maximum repayment period in months
    MAX_REPAYMENT_MONTHS: 6,
    
    // Increased interest rate after 3 months of default (3.4%)
    DEFAULT_INTEREST_RATE_AFTER_3_MONTHS: 3.4,
    
    // Months after which interest rate increases
    DEFAULT_INTEREST_INCREASE_THRESHOLD: 3
  },

  // Article 8: Member exit rules
  EXIT: {
    // Retention rate on resignation/expulsion (20%)
    RETENTION_RATE: 0.20,
    
    // Payout period in months
    PAYOUT_PERIOD_MONTHS: 2
  },

  // Article 27: New member entry fee
  NEW_MEMBER: {
    // Entry fee as percentage of accumulated shares (10%)
    ENTRY_FEE_PERCENTAGE: 0.10
  },

  // Article 36: Penalties
  PENALTIES: {
    // Meeting absence (unexcused)
    MEETING_ABSENCE: 5000,
    
    // Late contribution (10th-17th of month)
    LATE_CONTRIBUTION_FIRST_PERIOD: 1000,
    
    // Late contribution after 17th (per day)
    LATE_CONTRIBUTION_AFTER_17TH: 200,
    
    // Late arrival to meeting (>15 minutes)
    LATE_ARRIVAL: 1000,
    
    // Loan default penalty (percentage of remaining balance per month)
    LOAN_DEFAULT_PENALTY: 0.10
  },

  // Article 8: Automatic expulsion criteria
  EXPULSION: {
    // Consecutive months of non-contribution before automatic expulsion
    CONSECUTIVE_MONTHS_NON_CONTRIBUTION: 3,
    
    // Required majority for expulsion vote (2/3)
    REQUIRED_MAJORITY: 2 / 3
  },

  // Article 12: General Assembly
  GENERAL_ASSEMBLY: {
    // Minimum frequency in months
    MIN_FREQUENCY_MONTHS: 4,
    
    // Notice period in days
    NOTICE_PERIOD_DAYS: 14,
    
    // Quorum requirement (2/3 of members)
    QUORUM_REQUIREMENT: 2 / 3,
    
    // Reduced quorum for second meeting (1/2 of members)
    REDUCED_QUORUM: 1 / 2
  },

  // Article 19: Executive Committee reporting
  EXECUTIVE_COMMITTEE: {
    // Annual report deadline (January 15)
    ANNUAL_REPORT_DEADLINE: { month: 1, day: 15 },
    
    // Minimum meeting frequency in months
    MIN_MEETING_FREQUENCY_MONTHS: 3,
    
    // Decision publication deadline in days
    DECISION_PUBLICATION_DAYS: 7
  },

  // Article 29: Loan approval timeline
  LOAN_APPROVAL: {
    // Maximum days for loan decision
    MAX_DECISION_DAYS: 3
  }
};

/**
 * Calculate new member entry fee
 * Article 27: New members pay accumulated shares plus 10% entry fee
 * @param {number} accumulatedShares - Total accumulated shares value
 * @returns {object} - Entry fee calculation details
 */
function calculateNewMemberEntryFee(accumulatedShares) {
  const entryFee = accumulatedShares * THE_FUTURE_CONFIG.NEW_MEMBER.ENTRY_FEE_PERCENTAGE;
  const totalDue = accumulatedShares + entryFee;
  
  return {
    accumulatedShares,
    entryFee,
    entryFeePercentage: THE_FUTURE_CONFIG.NEW_MEMBER.ENTRY_FEE_PERCENTAGE * 100,
    totalDue
  };
}

/**
 * Calculate loan amount and interest
 * Article 28: Loans up to 2/3 of savings at 1.7% monthly interest
 * @param {number} totalSavings - Member's total savings
 * @param {number} requestedAmount - Amount requested
 * @param {number} repaymentMonths - Repayment period (max 6)
 * @returns {object} - Loan calculation details
 */
function calculateLoan(totalSavings, requestedAmount, repaymentMonths = 6) {
  const maxLoan = totalSavings * THE_FUTURE_CONFIG.LOAN.MAX_LOAN_FRACTION;
  const loanAmount = Math.min(requestedAmount, maxLoan);
  const monthlyRate = THE_FUTURE_CONFIG.LOAN.MONTHLY_INTEREST_RATE / 100;
  const monthlyInterest = loanAmount * monthlyRate;
  const totalInterest = monthlyInterest * Math.min(repaymentMonths, THE_FUTURE_CONFIG.LOAN.MAX_REPAYMENT_MONTHS);
  const totalRepayment = loanAmount + totalInterest;
  
  return {
    maxLoan,
    loanAmount,
    monthlyInterest,
    totalInterest,
    totalRepayment,
    monthlyRepayment: totalRepayment / Math.min(repaymentMonths, THE_FUTURE_CONFIG.LOAN.MAX_REPAYMENT_MONTHS),
    repaymentMonths: Math.min(repaymentMonths, THE_FUTURE_CONFIG.LOAN.MAX_REPAYMENT_MONTHS)
  };
}

/**
 * Calculate overdue interest with penalty rate
 * Article 28: After 3 months, interest increases to 3.4%
 * @param {number} principal - Original loan amount
 * @param {number} monthsOverdue - Number of months past due date
 * @returns {object} - Overdue interest calculation
 */
function calculateOverdueInterest(principal, monthsOverdue) {
  const threshold = THE_FUTURE_CONFIG.LOAN.DEFAULT_INTEREST_INCREASE_THRESHOLD;
  const normalRate = THE_FUTURE_CONFIG.LOAN.MONTHLY_INTEREST_RATE / 100;
  const increasedRate = THE_FUTURE_CONFIG.LOAN.DEFAULT_INTEREST_RATE_AFTER_3_MONTHS / 100;
  
  if (monthsOverdue <= threshold) {
    const interest = principal * normalRate * monthsOverdue;
    return {
      normalInterest: interest,
      increasedInterest: 0,
      totalInterest: interest,
      totalAmount: principal + interest
    };
  }
  
  const normalInterest = principal * normalRate * threshold;
  const increasedMonths = monthsOverdue - threshold;
  const increasedInterest = principal * increasedRate * increasedMonths;
  const totalInterest = normalInterest + increasedInterest;
  
  return {
    normalInterest,
    increasedInterest,
    totalInterest,
    totalAmount: principal + totalInterest,
    effectiveRate: (totalInterest / principal) * 100 / monthsOverdue
  };
}

/**
 * Calculate refund amount with retention
 * Article 8: 20% retention on resignation/expulsion
 * @param {number} totalContributions - Total contributions made
 * @param {number} outstandingLoans - Total outstanding loan amount
 * @param {number} outstandingPenalties - Total outstanding penalties
 * @returns {object} - Refund calculation details
 */
function calculateRefund(totalContributions, outstandingLoans = 0, outstandingPenalties = 0) {
  const netAmount = totalContributions - outstandingLoans - outstandingPenalties;
  const retentionRate = THE_FUTURE_CONFIG.EXIT.RETENTION_RATE;
  const retentionAmount = netAmount * retentionRate;
  const refundAmount = Math.max(0, netAmount - retentionAmount);
  
  return {
    totalContributions,
    outstandingLoans,
    outstandingPenalties,
    netAmount,
    retentionRate: retentionRate * 100,
    retentionAmount,
    refundAmount,
    payoutPeriodMonths: THE_FUTURE_CONFIG.EXIT.PAYOUT_PERIOD_MONTHS
  };
}

/**
 * Check if member should be expelled for non-contribution
 * Article 8: Expulsion after 3 consecutive months of non-contribution
 * @param {Array} contributionHistory - Array of monthly contribution records
 * @returns {object} - Expulsion eligibility check
 */
function checkExpulsionEligibility(contributionHistory) {
  const threshold = THE_FUTURE_CONFIG.EXPULSION.CONSECUTIVE_MONTHS_NON_CONTRIBUTION;
  
  // Sort by month descending (most recent first)
  const sorted = [...contributionHistory].sort((a, b) => 
    new Date(b.month) - new Date(a.month)
  );
  
  // Count consecutive months without contribution
  let consecutiveMissed = 0;
  for (const record of sorted) {
    if (!record.contributed || record.amount === 0) {
      consecutiveMissed++;
    } else {
      break;
    }
  }
  
  return {
    consecutiveMissedMonths: consecutiveMissed,
    threshold,
    eligibleForExpulsion: consecutiveMissed >= threshold,
    requiredMajority: THE_FUTURE_CONFIG.EXPULSION.REQUIRED_MAJORITY
  };
}

module.exports = {
  THE_FUTURE_CONFIG,
  calculateNewMemberEntryFee,
  calculateLoan,
  calculateOverdueInterest,
  calculateRefund,
  checkExpulsionEligibility
};