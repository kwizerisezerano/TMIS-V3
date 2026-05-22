export const usePayments = () => {
  const { api } = useApi()

  const processContribution = async (paymentData) => {
    return await api('/payments/contribution', {
      method: 'POST',
      body: paymentData
    })
  }

  const processLoanPayment = async (paymentData) => {
    return await api('/payments/loan-payment', {
      method: 'POST',
      body: paymentData
    })
  }

  const processRefund = async (refundData) => {
    return await api('/payments/refund', {
      method: 'POST',
      body: refundData
    })
  }

  const getPaymentHistory = async (userId) => {
    return await api(`/payments/history/${userId}`)
  }

  const processLanariPayment = async (amount, phone, description = 'Tontine payment') => {
    return await processContribution({
      amount,
      paymentMethod: 'mobile_money',
      paymentData: {
        phone,
        description
      }
    })
  }

  return {
    processContribution,
    processLoanPayment,
    processRefund,
    getPaymentHistory,
    processLanariPayment
  }
}