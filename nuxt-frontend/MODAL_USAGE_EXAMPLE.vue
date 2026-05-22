<!-- EXAMPLE USAGE OF STATUS MODAL -->
<!-- You can copy this code to any page where you want to use the modal -->

<template>
  <div>
    <!-- Your page content -->
    <div class="p-8 space-y-4">
      <h1 class="text-2xl font-bold">Status Modal Examples</h1>
      
      <div class="flex gap-4">
        <UButton @click="modal.showSuccess('Your action was completed successfully!')" color="emerald">
          Show Success
        </UButton>
        
        <UButton @click="modal.showWarning('Are you sure you want to proceed with this action?', 'Confirm Action')" color="amber">
          Show Warning
        </UButton>
        
        <UButton @click="modal.showError('Something went wrong. Please try again.')" color="red">
          Show Error
        </UButton>
        
        <UButton @click="modal.showInfo('This is some important information for you.')" color="blue">
          Show Info
        </UButton>
      </div>
    </div>

    <!-- Status Modal Component -->
    <StatusModal
      :show="modal.showModal.value"
      :type="modal.modalType.value"
      :title="modal.modalTitle.value"
      :message="modal.modalMessage.value"
      :actionText="modal.modalActionText.value"
      :onAction="modal.modalAction.value"
      @close="modal.closeModal"
    />
  </div>
</template>

<script setup>
// Import the composable
const modal = useStatusModal()

// Example: Show success after form submission
const handleFormSubmit = async () => {
  try {
    // Your API call here
    await submitForm()
    
    // Show success modal
    modal.showSuccess(
      'Your contribution has been recorded successfully!',
      'Payment Successful',
      'View Dashboard',
      () => {
        // This function runs when user clicks the action button
        navigateTo('/dashboard')
      }
    )
  } catch (error) {
    // Show error modal
    modal.showError(
      error.message || 'Failed to process your request.',
      'Payment Failed'
    )
  }
}

// Example: Show warning before delete
const handleDelete = () => {
  modal.showWarning(
    'This action cannot be undone. Are you sure you want to delete this item?',
    'Confirm Deletion',
    'Yes, Delete',
    () => {
      // This function runs when user clicks "Yes, Delete"
      performDelete()
    }
  )
}

// Example: Show info
const showHelp = () => {
  modal.showInfo(
    'You can contribute up to 2/3 of your total savings. Contact support for more information.',
    'Contribution Limits'
  )
}
</script>

<!-- 
QUICK REFERENCE:

1. SUCCESS MODAL:
   modal.showSuccess(message, title?, actionText?, onAction?)
   
2. WARNING MODAL:
   modal.showWarning(message, title?, actionText?, onAction?)
   
3. ERROR MODAL:
   modal.showError(message, title?, actionText?, onAction?)
   
4. INFO MODAL:
   modal.showInfo(message, title?, actionText?, onAction?)

PARAMETERS:
- message: (required) The message to display
- title: (optional) Custom title (defaults: Success!, Warning!, Error!, Information)
- actionText: (optional) Custom button text (defaults: Continue, Proceed, Close, Got it)
- onAction: (optional) Function to run when action button is clicked
-->
