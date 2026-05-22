export const useFutureTech = () => {
  const { api } = useApi()

  const createDigitalPool = async (poolData) => {
    return await api('/tontines', {
      method: 'POST',
      body: { ...poolData, tech_category: poolData.category }
    })
  }

  const joinTechPool = async (poolId, userId) => {
    return await api(`/tontines/${poolId}/join`, {
      method: 'POST',
      body: { userId }
    })
  }

  const makeSmartContribution = async (userId, poolId, phone) => {
    return await api('/payments/contribution', {
      method: 'POST',
      body: {
        userId,
        tontineId: poolId,
        amount: 20000,
        paymentMethod: 'mobile_money',
        paymentData: { phone, description: 'Future Tech digital contribution' }
      }
    })
  }

  const requestAILoan = async (userId, poolId, amount, phone) => {
    return await api('/loans', {
      method: 'POST',
      body: { userId, tontineId: poolId, loanAmount: amount, phoneNumber: phone }
    })
  }

  const getTechPools = async () => {
    return await api('/tontines')
  }

  const getUserTechLevel = (contributions) => {
    if (contributions >= 240000) return 'expert'
    if (contributions >= 120000) return 'advanced'
    if (contributions >= 60000) return 'intermediate'
    return 'beginner'
  }

  const TECH_CATEGORIES = {
    ai: { name: 'AI & Machine Learning', color: 'purple' },
    blockchain: { name: 'Blockchain & Crypto', color: 'orange' },
    fintech: { name: 'FinTech Solutions', color: 'green' },
    mobile: { name: 'Mobile Development', color: 'blue' },
    web: { name: 'Web Technologies', color: 'cyan' },
    iot: { name: 'IoT & Hardware', color: 'red' }
  }

  return {
    createDigitalPool,
    joinTechPool,
    makeSmartContribution,
    requestAILoan,
    getTechPools,
    getUserTechLevel,
    TECH_CATEGORIES
  }
}