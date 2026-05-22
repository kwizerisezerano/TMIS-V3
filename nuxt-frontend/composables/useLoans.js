export const useLoans = () => {
  const { api } = useApi()

  const getTontineLoans = async (tontineId) => {
    return await api(`/loans/tontine/${tontineId}`)
  }

  const getUserLoans = async (userId) => {
    return await api(`/loans/user/${userId}`)
  }

  const submitLoanRequest = async (loanData) => {
    return await api('/loans', {
      method: 'POST',
      body: loanData
    })
  }

  const updateLoanStatus = async (loanId, status) => {
    return await api(`/loans/${loanId}/status`, {
      method: 'PUT',
      body: { status }
    })
  }

  const getLoanPayments = async (loanId) => {
    return await api(`/loans/${loanId}/payments`)
  }

  const enforcePayment = async (loanId, enforcedBy, paymentAmount) => {
    return await api(`/loans/${loanId}/enforce-payment`, {
      method: 'POST',
      body: { enforcedBy, paymentAmount }
    })
  }

  return {
    getTontineLoans,
    getUserLoans,
    submitLoanRequest,
    updateLoanStatus,
    getLoanPayments,
    enforcePayment
  }
}