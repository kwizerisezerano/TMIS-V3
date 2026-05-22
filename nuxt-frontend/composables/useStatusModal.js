export const useStatusModal = () => {
  const showModal = ref(false)
  const modalType = ref('success')
  const modalTitle = ref('')
  const modalMessage = ref('')
  const modalActionText = ref('')
  const modalAction = ref(null)

  const showSuccess = (message, title = 'Success!', actionText = 'Continue', onAction = null) => {
    modalType.value = 'success'
    modalTitle.value = title
    modalMessage.value = message
    modalActionText.value = actionText
    modalAction.value = onAction
    showModal.value = true
  }

  const showWarning = (message, title = 'Warning!', actionText = 'Proceed', onAction = null) => {
    modalType.value = 'warning'
    modalTitle.value = title
    modalMessage.value = message
    modalActionText.value = actionText
    modalAction.value = onAction
    showModal.value = true
  }

  const showError = (message, title = 'Error!', actionText = 'Close', onAction = null) => {
    modalType.value = 'error'
    modalTitle.value = title
    modalMessage.value = message
    modalActionText.value = actionText
    modalAction.value = onAction
    showModal.value = true
  }

  const showInfo = (message, title = 'Information', actionText = 'Got it', onAction = null) => {
    modalType.value = 'info'
    modalTitle.value = title
    modalMessage.value = message
    modalActionText.value = actionText
    modalAction.value = onAction
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
  }

  return {
    showModal,
    modalType,
    modalTitle,
    modalMessage,
    modalActionText,
    modalAction,
    showSuccess,
    showWarning,
    showError,
    showInfo,
    closeModal
  }
}
