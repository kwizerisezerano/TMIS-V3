export const useTheFuture = () => {
  const { api } = useApi()

  // Penalties management
  const applyMeetingAbsencePenalty = async (userId, tontineId, reason) => {
    return await api('/penalties/meeting-absence', {
      method: 'POST',
      body: { userId, tontineId, reason }
    })
  }

  const applyLateContributionPenalty = async (userId, tontineId, daysLate) => {
    return await api('/penalties/late-contribution', {
      method: 'POST',
      body: { userId, tontineId, daysLate }
    })
  }

  const applyLateMeetingPenalty = async (userId, tontineId, minutesLate) => {
    return await api('/penalties/late-meeting', {
      method: 'POST',
      body: { userId, tontineId, minutesLate }
    })
  }

  const applyLoanDefaultPenalty = async (userId, loanId, remainingBalance) => {
    return await api('/penalties/loan-default', {
      method: 'POST',
      body: { userId, loanId, remainingBalance }
    })
  }

  const getUserPenalties = async (userId) => {
    return await api(`/penalties/user/${userId}`)
  }

  const getTontinePenalties = async (tontineId) => {
    return await api(`/penalties/tontine/${tontineId}`)
  }

  const payPenalty = async (penaltyId, paymentMethod, transactionRef) => {
    return await api(`/penalties/pay/${penaltyId}`, {
      method: 'POST',
      body: { paymentMethod, transactionRef }
    })
  }

  // Member management
  const submitResignation = async (userId, tontineId, reason) => {
    return await api('/members/resign', {
      method: 'POST',
      body: { userId, tontineId, reason }
    })
  }

  const expelMember = async (userId, tontineId, reason, processedBy) => {
    return await api('/members/expel', {
      method: 'POST',
      body: { userId, tontineId, reason, processedBy }
    })
  }

  const getExitRequests = async (tontineId) => {
    return await api(`/members/exit-requests/${tontineId}`)
  }

  const approveExitRequest = async (exitId, processedBy) => {
    return await api(`/members/exit-request/${exitId}`, {
      method: 'PUT',
      body: { status: 'approved', processedBy }
    })
  }

  const rejectExitRequest = async (exitId, processedBy) => {
    return await api(`/members/exit-request/${exitId}`, {
      method: 'PUT',
      body: { status: 'rejected', processedBy }
    })
  }

  // Loan management with The Future rules
  const requestLoan = async (userId, tontineId, loanAmount, phoneNumber) => {
    return await api('/loans', {
      method: 'POST',
      body: { userId, tontineId, loanAmount, phoneNumber }
    })
  }

  const calculateMaxLoanAmount = (totalContributions) => {
    return (totalContributions * 2) / 3 // 2/3 of total contributions
  }

  const calculateLoanInterest = (loanAmount, months = 6) => {
    const monthlyRate = 1.7 // 1.7% per month
    const monthlyInterest = (loanAmount * monthlyRate) / 100
    return {
      monthlyInterest,
      totalInterest: monthlyInterest * months,
      totalAmount: loanAmount + (monthlyInterest * months)
    }
  }

  // Contribution management
  const makeMonthlyContribution = async (userId, tontineId, phone) => {
    return await api('/payments/contribution', {
      method: 'POST',
      body: {
        userId,
        tontineId,
        amount: 20000, // Fixed monthly contribution
        paymentMethod: 'mobile_money',
        paymentData: {
          phone,
          description: 'Monthly contribution to The Future association'
        }
      }
    })
  }

  // Association constants
  const ASSOCIATION_RULES = {
    monthlyContribution: 20000, // RWF
    maxMembers: 20,
    loanInterestRate: 1.7, // % per month
    maxLoanPeriod: 6, // months
    retentionPercentage: 20, // % for resignations/expulsions
    penalties: {
      meetingAbsence: 5000, // RWF
      lateContribution10to17Days: 1000, // RWF
      lateContributionAfter17th: 200, // RWF (1% of monthly share)
      lateMeeting: 1000, // RWF
      loanDefaultPercentage: 10 // % of remaining balance
    }
  }

  return {
    // Penalties
    applyMeetingAbsencePenalty,
    applyLateContributionPenalty,
    applyLateMeetingPenalty,
    applyLoanDefaultPenalty,
    getUserPenalties,
    getTontinePenalties,
    payPenalty,
    
    // Member management
    submitResignation,
    expelMember,
    getExitRequests,
    approveExitRequest,
    rejectExitRequest,
    
    // Loans
    requestLoan,
    calculateMaxLoanAmount,
    calculateLoanInterest,
    
    // Contributions
    makeMonthlyContribution,
    
    // Constants
    ASSOCIATION_RULES
  }
}