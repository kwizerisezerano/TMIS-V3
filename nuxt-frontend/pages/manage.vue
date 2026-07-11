<template>
  <div class="space-y-4 sm:space-y-6 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Admin Management</h1>
        <p class="text-gray-600">Manage members, contributions, loans, and payments</p>
      </div>
      <button v-if="activeTab === 'members'" @click="openAddMemberModal" class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 w-full sm:w-auto cursor-pointer">
        <Icon name="i-heroicons-plus" class="w-4 h-4" />
        Add Member
      </button>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-6">
      <nav class="flex space-x-8 border-b border-gray-200">
        <button 
          @click="activeTab = 'members'"
          :class="activeTab === 'members' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Members
        </button>
        <button 
          @click="activeTab = 'contributions'"
          :class="activeTab === 'contributions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Contributions
        </button>
        <button 
          @click="activeTab = 'loans'"
          :class="activeTab === 'loans' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Loans
        </button>
        <button 
          @click="activeTab = 'payments'"
          :class="activeTab === 'payments' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Payments
        </button>
        <button 
          v-if="isAdminOrPresident"
          @click="activeTab = 'meetings'"
          :class="activeTab === 'meetings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Meetings
        </button>
        <button 
          @click="activeTab = 'penalties'"
          :class="activeTab === 'penalties' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Penalties
        </button>
        <button 
          @click="activeTab = 'tontines'"
          :class="activeTab === 'tontines' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Tontines
        </button>
        <button 
          @click="activeTab = 'activity-logs'"
          :class="activeTab === 'activity-logs' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Activity Log
        </button>
        <button 
          @click="activeTab = 'surplus'"
          :class="activeTab === 'surplus' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Surplus
        </button>
      </nav>
    </div>

    <!-- Members Tab -->
    <div v-if="activeTab === 'members'">
      <UCard class="glass-card">
      <template #header>
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold">Tontine Members ({{ filteredMembers.length }}/20)</h3>
        </div>
      </template>

      <!-- Search and Filters -->
      <div class="mb-4 flex flex-col sm:flex-row gap-4">
        <input v-model="searchQuery" placeholder="Search members..." class="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" />
        <USelect v-model="roleFilter" :options="[{label: 'All Roles', value: ''}, ...roleOptions]" class="w-full sm:w-32" />
        <USelect v-model="statusFilter" :options="[{label: 'All Status', value: ''}, {label: 'Verified', value: 'verified'}, {label: 'Pending', value: 'pending'}]" class="w-full sm:w-32" />
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="text-gray-500">Loading members...</div>
      </div>

      <div v-else-if="paginatedMembers.length === 0" class="text-center py-8">
        <div class="text-gray-500">No members found</div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="member in paginatedMembers" :key="member.id" class="hover:bg-gray-50">
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ member.names }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ member.email }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ member.phone }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="isExecutiveRole(member.role) ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.role }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ member.shares || 1 }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span :class="member.email_verified ? 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {{ member.email_verified ? 'Verified' : 'Pending' }}
                </span>
              </td>
              <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <UButton @click="editMember(member)" color="blue" variant="ghost" size="xs">
                  Edit
                </UButton>
                <UButton @click="showDeleteModal(member)" color="red" variant="ghost" size="xs">
                  Remove
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex justify-between items-center">
        <div class="text-sm text-gray-500">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredMembers.length) }} of {{ filteredMembers.length }} members
        </div>
        <UPagination v-if="totalPages > 1" v-model="currentPage" :page-count="totalPages" :total="filteredMembers.length" />
      </div>
      </UCard>
    </div>

    <!-- Contributions Tab -->
    <div v-if="activeTab === 'contributions'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Contributions Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading contributions...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="contribution in contributions" :key="contribution.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ getContributionMemberName(contribution) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(contribution.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(contribution.contribution_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="getContributionStatusColor(contribution.payment_status)" size="xs">
                    {{ contribution.payment_status }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Loans Tab -->
    <div v-if="activeTab === 'loans'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Loans Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading loans...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="loan in loans" :key="loan.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ loan.member_name }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(loan.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ loan.interest_rate }}%
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(loan.due_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="getLoanStatusColor(loan.status)" size="xs">
                    {{ loan.status }}
                  </UBadge>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <UButton v-if="loan.status && loan.status.toLowerCase() === 'pending'" @click="approveLoan(loan.id)" color="green" variant="ghost" size="xs">
                    Approve
                  </UButton>
                  <UButton v-if="loan.status && loan.status.toLowerCase() === 'pending'" @click="rejectLoan(loan.id)" color="red" variant="ghost" size="xs">
                    Reject
                  </UButton>
                  <UButton v-if="loan.status && loan.status.toLowerCase() === 'received'" @click="disburseLoan(loan.id)" color="blue" variant="ghost" size="xs">
                    Disburse
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Payments Tab -->
    <div v-if="activeTab === 'payments'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Payments History</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading payments...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="payment in payments" :key="payment.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ getPaymentMemberName(payment) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ payment.payment_type }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(payment.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ payment.payment_method }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(payment.created_at) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="getPaymentStatusColor(payment.status)" size="xs">
                    {{ payment.status || 'pending' }}
                  </UBadge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Meetings Tab -->
    <div v-if="activeTab === 'meetings' && isAdminOrPresident">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Meetings Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading meetings...</div>
        </div>

        <div v-else-if="meetings.length === 0" class="text-center py-8">
          <div class="text-gray-500">No meetings found</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agenda</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="meeting in meetings" :key="meeting.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ meeting.title }}
                  <div v-if="meeting.description" class="text-xs text-gray-500 mt-1">{{ meeting.description }}</div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-900 max-w-xs">
                  <div v-if="meeting.agenda" class="truncate" :title="meeting.agenda">{{ meeting.agenda }}</div>
                  <span v-else class="text-gray-400 italic">No agenda</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDateTime(meeting.meeting_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ meeting.location }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="meeting.status === 'completed' ? 'green' : meeting.status === 'scheduled' ? 'blue' : meeting.status === 'cancelled' ? 'red' : 'gray'" size="xs">
                    {{ meeting.status }}
                  </UBadge>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <UButton 
                    v-if="meeting.status === 'scheduled'" 
                    @click="markMeetingAttendance(meeting)" 
                    color="green" 
                    variant="ghost" 
                    size="xs"
                  >
                    Mark Attendance
                  </UButton>
                  <UButton @click="editMeeting(meeting)" color="blue" variant="ghost" size="xs">
                    Edit
                  </UButton>
                  <UButton @click="deleteMeeting(meeting)" color="red" variant="ghost" size="xs">
                    Delete
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Create/Edit Meeting Modal -->
    <UModal v-model="showMeetingModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ editingMeeting?.id ? 'Edit Meeting' : 'Create New Meeting' }}</h3>
        </template>

        <UForm :state="meetingForm" @submit="saveMeeting" class="space-y-4">
          <UFormGroup label="Title" name="title" required>
            <UInput v-model="meetingForm.title" placeholder="Enter meeting title" />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea v-model="meetingForm.description" placeholder="Enter meeting description (optional)" />
          </UFormGroup>

          <UFormGroup label="Agenda" name="agenda" required>
            <UTextarea v-model="meetingForm.agenda" placeholder="Enter meeting agenda (topics to discuss)" :rows="4" />
          </UFormGroup>

          <UFormGroup label="Meeting Date & Time" name="meetingDate" required>
            <UInput v-model="meetingForm.meetingDate" type="datetime-local" />
          </UFormGroup>

          <UFormGroup label="Location" name="location" required>
            <UInput v-model="meetingForm.location" placeholder="Enter meeting location" />
          </UFormGroup>

          <UFormGroup label="Status" name="status">
            <USelect v-model="meetingForm.status" :options="meetingStatusOptions" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="closeMeetingModal" variant="outline" :disabled="submittingMeeting">
              Cancel
            </UButton>
            <UButton type="submit" :loading="submittingMeeting" color="green">
              {{ editingMeeting?.id ? 'Update Meeting' : 'Create Meeting' }}
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Penalties Tab -->
    <div v-if="activeTab === 'penalties'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Penalties Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading penalties...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="penalty in penalties" :key="penalty.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ penalty.member_name || penalty.user_name || `Member #${penalty.user_id}` }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatCurrency(penalty.amount) }}
                </td>
                <td class="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {{ penalty.reason }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="penalty.status === 'paid' ? 'green' : penalty.status === 'pending' ? 'amber' : 'red'" variant="subtle" size="xs" :class="penalty.status === 'pending' ? 'bg-amber-900/50 text-amber-200 dark:bg-amber-800/60 dark:text-amber-100' : ''">
                    {{ penalty.status }}
                  </UBadge>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDate(penalty.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Tontines Tab -->
    <div v-if="activeTab === 'tontines'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Tontines Management</h3>
        </template>

        <div v-if="loading" class="text-center py-8">
          <div class="text-gray-500">Loading tontines...</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="tontine in tontines" :key="tontine.id">
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ tontine.name }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <UBadge v-if="tontine.tontine_type === 'main'" color="green" size="xs" variant="solid">
                      <Icon name="i-heroicons-building-office" class="w-3 h-3" />
                      Main
                    </UBadge>
                    <UBadge v-else-if="tontine.tontine_type === 'branch'" color="blue" size="xs" variant="subtle">
                      <Icon name="i-heroicons-building-library" class="w-3 h-3" />
                      Branch
                    </UBadge>
                    <span v-if="tontine.parent_tontine_name" class="text-xs text-gray-500 ml-1">
                      of {{ tontine.parent_tontine_name }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {{ tontine.description }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ tontine.member_count || 0 }}/{{ tontine.max_members }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <UBadge :color="tontine.status === 'active' ? 'green' : tontine.status === 'inactive' ? 'yellow' : 'gray'" size="xs">
                    {{ tontine.status }}
                  </UBadge>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <UButton v-if="tontine.status === 'inactive'" @click="activateTontine(tontine.id)" color="green" variant="ghost" size="xs">
                    Activate
                  </UButton>
                  <UButton v-if="tontine.status === 'active'" @click="deactivateTontine(tontine.id)" color="yellow" variant="ghost" size="xs">
                    Deactivate
                  </UButton>
                  <UButton @click="openTontineManagement(tontine.id)" color="blue" variant="ghost" size="xs">
                    Manage
                  </UButton>
                  <UButton @click="navigateTo(`/tontine-surplus/${tontine.id}`)" color="purple" variant="ghost" size="xs">
                    View Surplus
                  </UButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Surplus Tab -->
    <div v-if="activeTab === 'surplus'">
      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <UCard class="border-0 shadow-sm">
          <div class="text-center p-4">
            <div class="text-2xl font-bold text-yellow-600">RWF {{ surplusSummaryTotals.pending.toLocaleString() }}</div>
            <div class="text-sm text-gray-500 mt-1">Pending Allocation</div>
            <div class="text-xs text-gray-400">Members haven't allocated yet</div>
          </div>
        </UCard>
        <UCard class="border-0 shadow-sm">
          <div class="text-center p-4">
            <div class="text-2xl font-bold text-blue-600">RWF {{ surplusSummaryTotals.allocated.toLocaleString() }}</div>
            <div class="text-sm text-gray-500 mt-1">Allocated — Ready to Apply</div>
            <div class="text-xs text-gray-400">Will be used on next recording</div>
          </div>
        </UCard>
        <UCard class="border-0 shadow-sm">
          <div class="text-center p-4">
            <div class="text-2xl font-bold text-green-600">RWF {{ surplusSummaryTotals.used.toLocaleString() }}</div>
            <div class="text-sm text-gray-500 mt-1">Used</div>
            <div class="text-xs text-gray-400">Already applied to payments</div>
          </div>
        </UCard>
      </div>

      <!-- Per-member breakdown -->
      <UCard class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold">Per-Member Surplus Breakdown</h3>
        </template>
        <div v-if="surplusLoading" class="text-center py-8 text-gray-500">Loading surplus...</div>
        <div v-else-if="surplusMembers.length === 0" class="text-center py-8 text-gray-500">No surplus records found.</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocated</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <template v-for="member in surplusMembers" :key="member.user_id">
                <tr class="hover:bg-gray-50 cursor-pointer" @click="toggleSurplusExpand(member.user_id)">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ member.user_name }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span v-if="member.pending > 0" class="text-yellow-700 font-semibold">RWF {{ member.pending.toLocaleString() }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span v-if="member.allocated > 0" class="text-blue-700 font-semibold">RWF {{ member.allocated.toLocaleString() }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <span v-if="member.used > 0" class="text-green-700 font-semibold">RWF {{ member.used.toLocaleString() }}</span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-3 text-sm text-blue-600">
                    {{ surplusExpanded === member.user_id ? '▲ Hide' : '▼ Show' }}
                  </td>
                </tr>
                <!-- Expanded rows -->
                <template v-if="surplusExpanded === member.user_id">
                <tr v-for="row in member.rows" :key="row.id">
                  <td colspan="5" class="px-6 py-2 bg-gray-50">
                    <div class="flex flex-wrap items-center gap-3 text-xs text-gray-700">
                      <span class="px-2 py-0.5 rounded-full font-medium" :class="surplusStatusClass(row.status)">{{ row.status }}</span>
                      <span>RWF {{ parseFloat(row.amount).toLocaleString() }}</span>
                      <span class="text-gray-500">From: <span class="capitalize font-medium">{{ row.source }}</span> #{{ row.source_id }}</span>
                      <span v-if="row.destination" class="text-blue-600">→ <span class="capitalize">{{ row.destination }}</span><span v-if="row.destination_id"> #{{ row.destination_id }}</span></span>
                      <span v-if="row.member_note" class="text-gray-500 italic">"{{ row.member_note }}"</span>
                      <span v-if="row.status === 'used'" class="text-green-600 font-medium">✓ Applied</span>
                      <span class="text-gray-400 ml-auto">{{ formatDate(row.created_at) }}</span>
                    </div>
                  </td>
                </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- Activity Log Tab -->
    <div v-if="activeTab === 'activity-logs'">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">System Activity Log</h3>
        </template>

        <div v-if="activityLogsLoading" class="text-center py-8">
          <div class="text-gray-500">Loading activity logs...</div>
        </div>

        <div v-else-if="activityLogs.length === 0" class="text-center py-8">
          <div class="text-gray-500">No activity logs found</div>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="log in activityLogs" :key="log.id" class="hover:bg-gray-50">
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.user_name || 'System' }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span :class="getActionTypeClass(log.action_type)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ log.action_type }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span :class="getActivityStatusClass(log.status)" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {{ (log.status || 'success').toUpperCase() }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ log.entity_type }}
                  <span v-if="log.entity_id" class="text-xs text-gray-500 ml-1">(ID: {{ log.entity_id }})</span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-900 max-w-xs truncate" :title="log.action_description">
                  {{ log.action_description }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ formatDateTime(log.created_at) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="activityLogsPagination && activityLogsPagination.pages > 1" class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-500">
            Showing {{ (activityLogsPagination.page - 1) * activityLogsPagination.limit + 1 }} to {{ Math.min(activityLogsPagination.page * activityLogsPagination.limit, activityLogsPagination.total) }} of {{ activityLogsPagination.total }} logs
          </div>
          <UPagination v-model="activityLogsCurrentPage" :page-count="activityLogsPagination.pages" :total="activityLogsPagination.total" @update:model-value="fetchActivityLogs" />
        </div>
      </UCard>
    </div>

    <!-- Add Member Modal -->
    <UModal v-model="showAddModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Add New Member</h3>
        </template>

        <UForm :state="newMember" @submit="addMember" class="space-y-4">
          <!-- Success Message -->
          <div v-if="addSuccess" class="p-4 rounded-lg border border-green-300 bg-green-50">
            <p class="text-sm font-semibold text-green-800">
              <Icon name="i-heroicons-check-circle" class="w-4 h-4 inline mr-1" />
              Member Added Successfully!
            </p>
            <p class="text-sm text-green-700 mt-1">{{ addSuccess }}</p>
          </div>

          <!-- Error Message -->
          <div v-else-if="addError" class="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
            <p class="text-sm font-semibold text-yellow-800">
              <Icon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
              Failed to Add Member
            </p>
            <p class="text-sm text-yellow-700 mt-1">{{ addError }}</p>
          </div>
          
          <UFormGroup label="Full Names" name="names" required>
            <UInput v-model="newMember.names" placeholder="Enter full names" :disabled="Boolean(addSuccess)" />
          </UFormGroup>

          <UFormGroup label="Email" name="email" required>
            <UInput v-model="newMember.email" type="email" placeholder="Enter email" :disabled="Boolean(addSuccess)" />
          </UFormGroup>

          <UFormGroup label="Phone" name="phone" required>
            <UInput v-model="newMember.phone" placeholder="078XXXXXXX" :disabled="Boolean(addSuccess)" />
          </UFormGroup>

          <UFormGroup label="Password" name="password" required>
            <UInput v-model="newMember.password" type="password" placeholder="Enter password" :disabled="Boolean(addSuccess)" />
          </UFormGroup>

          <UFormGroup label="Role" name="role">
            <USelect v-model="newMember.role" :options="roleOptions" :disabled="Boolean(addSuccess)" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="handleCloseAddModal" variant="outline" :disabled="submitting">
              {{ addSuccess ? 'Close' : 'Cancel' }}
            </UButton>
            <UButton v-if="!addSuccess" type="submit" :loading="submitting" color="primary">Add Member</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Edit Member Modal -->
    <UModal v-model="showEditModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Edit Member</h3>
        </template>

        <UForm :state="editingMember" @submit="updateMember" class="space-y-4">
          <!-- Success Message -->
          <div v-if="editSuccess" class="p-4 rounded-lg border border-green-300 bg-green-50">
            <p class="text-sm font-semibold text-green-800">
              <Icon name="i-heroicons-check-circle" class="w-4 h-4 inline mr-1" />
              Member Updated Successfully!
            </p>
            <p class="text-sm text-green-700 mt-1">{{ editSuccess }}</p>
          </div>

          <!-- Error Message -->
          <div v-else-if="editError" class="p-4 rounded-lg border border-yellow-300 bg-yellow-50">
            <p class="text-sm font-semibold text-yellow-800">
              <Icon name="i-heroicons-exclamation-triangle" class="w-4 h-4 inline mr-1" />
              Update Failed
            </p>
            <p class="text-sm text-yellow-700 mt-1">{{ editError }}</p>
          </div>
          
          <UFormGroup label="Full Names" name="names" required>
            <UInput v-model="editingMember.names" placeholder="Enter full names" :disabled="Boolean(editSuccess)" />
          </UFormGroup>

          <UFormGroup label="Email" name="email" required>
            <UInput v-model="editingMember.email" type="email" placeholder="Enter email" :disabled="Boolean(editSuccess)" />
          </UFormGroup>

          <UFormGroup label="Phone" name="phone" required>
            <UInput v-model="editingMember.phone" placeholder="078XXXXXXX" :disabled="Boolean(editSuccess)" />
          </UFormGroup>

          <UFormGroup label="Role" name="role">
            <USelect v-model="editingMember.role" :options="roleOptions" :disabled="Boolean(editSuccess)" />
          </UFormGroup>

          <UFormGroup label="Shares" name="shares">
            <USelect v-model="editingMember.shares" :options="sharesOptions" :disabled="Boolean(editSuccess)" />
          </UFormGroup>

          <div class="flex gap-2 justify-end">
            <UButton @click="handleCloseEditModal" variant="outline" :disabled="submitting">
              {{ editSuccess ? 'Close' : 'Cancel' }}
            </UButton>
            <UButton v-if="!editSuccess" type="submit" :loading="submitting" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Update Member</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
    
    <!-- Status Modal -->
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
definePageMeta({
  middleware: 'admin',
  layout: 'default'
})

import { USER_ROLES, isAdminOnly, isExecutiveRole } from '~/utils/authGuard'

const { user, initAuth } = useAuth()
const { api } = useApi()
const toast = useToast()
const route = useRoute()
const router = useRouter()
const tontineId = ref(route.query.tontine || '1')

const activeTab = ref(route.query.tab || 'members')

const isAdminOrPresident = computed(() => isAdminOnly(user.value))
const members = ref([])
const contributions = ref([])
const loans = ref([])
const payments = ref([])
const tontines = ref([])
const meetings = ref([])
const penalties = ref([])
const loading = ref(true)
const submitting = ref(false)
const submittingMeeting = ref(false)
const showAddModal = ref(false)
const showEditModal = ref(false)
const memberToDelete = ref(null)
const addError = ref('')
const editError = ref('')
const addSuccess = ref('')
const editSuccess = ref('')

// Pagination and filters
const currentPage = ref(1)
const itemsPerPage = 6
const searchQuery = ref('')
const roleFilter = ref('')
const statusFilter = ref('')

const newMember = ref({
  names: '',
  email: '',
  phone: '',
  password: '',
  role: USER_ROLES.MEMBER
})

const editingMember = ref({
  id: null,
  membership_id: null,
  names: '',
  email: '',
  phone: '',
  role: USER_ROLES.MEMBER,
  shares: 1
})

const roleOptions = [
  { label: 'Member', value: USER_ROLES.MEMBER },
  { label: 'Admin', value: USER_ROLES.ADMIN }
]

const sharesOptions = [
  { label: '1 Share', value: 1 },
  { label: '2 Shares', value: 2 },
  { label: '3 Shares', value: 3 },
  { label: '4 Shares', value: 4 },
  { label: '5 Shares', value: 5 },
  { label: '6 Shares', value: 6 },
  { label: '7 Shares', value: 7 },
  { label: '8 Shares', value: 8 },
  { label: '9 Shares', value: 9 },
  { label: '10 Shares', value: 10 }
]

const meetingStatusOptions = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' }
]

const showMeetingModal = ref(false)
const editingMeeting = ref(null)
const meetingForm = ref({
  title: '',
  description: '',
  agenda: '',
  meetingDate: '',
  location: '',
  status: 'scheduled'
})

// Activity Log state
const activityLogs = ref([])
const activityLogsLoading = ref(false)
const activityLogsPagination = ref(null)
const activityLogsCurrentPage = ref(1)

// Surplus state
const surplusMembers = ref([])
const surplusLoading = ref(false)
const surplusExpanded = ref(null)
const surplusSummaryTotals = computed(() => {
  const totals = { pending: 0, allocated: 0, used: 0 }
  for (const m of surplusMembers.value) {
    totals.pending += m.pending || 0
    totals.allocated += m.allocated || 0
    totals.used += m.used || 0
  }
  return totals
})

const fetchSurplusSummary = async () => {
  surplusLoading.value = true
  try {
    const res = await api(`/v1/surplus/summary/${tontineId.value}`)
    const data = res.data || res
    surplusMembers.value = data.members || []
  } catch (e) {
    surplusMembers.value = []
  } finally {
    surplusLoading.value = false
  }
}

const toggleSurplusExpand = (userId) => {
  surplusExpanded.value = surplusExpanded.value === userId ? null : userId
}

const surplusStatusClass = (status) => {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-700'
  if (status === 'allocated') return 'bg-blue-100 text-blue-700'
  if (status === 'used') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

onMounted(() => {
  // Initialize auth state from localStorage before making API calls
  initAuth()
  fetchActiveTab()
})

watch(activeTab, (newTab) => {
  fetchActiveTab(newTab)
  router.replace({ query: { ...route.query, tontine: tontineId.value, tab: newTab } })
})

watch(() => route.query.tontine, (newTontineId) => {
  if (!newTontineId || newTontineId === tontineId.value) return
  tontineId.value = newTontineId
  fetchActiveTab()
})

const fetchActiveTab = (tab = activeTab.value) => {
  if (tab === 'members') return fetchMembers()
  if (tab === 'contributions') return fetchContributions()
  if (tab === 'loans') return fetchLoans()
  if (tab === 'payments') return fetchPayments()
  if (tab === 'meetings') return fetchMeetings()
  if (tab === 'penalties') return fetchPenalties()
  if (tab === 'tontines') return fetchTontines()
  if (tab === 'activity-logs') return fetchActivityLogs()
  if (tab === 'surplus') return fetchSurplusSummary()
}

const fetchActivityLogs = async (page = activityLogsCurrentPage.value) => {
  activityLogsLoading.value = true
  const { api } = useApi()
  try {
    console.log('=== FETCH ACTIVITY LOGS ===')
    const response = await api('/v1/activity-logs', { params: { page, limit: 20 } })
    console.log('Full activity logs response:', response)
    
    // Handle all possible nested response structures
    let responseData = response
    if (response?.data) responseData = response.data
    if (responseData?.data) responseData = responseData.data
    
    console.log('Extracted responseData:', responseData)
    
    activityLogs.value = responseData?.logs || []
    activityLogsPagination.value = responseData?.pagination || null
    console.log('Final activityLogs:', activityLogs.value)
    console.log('Final activityLogsPagination:', activityLogsPagination.value)
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    activityLogs.value = []
  } finally {
    activityLogsLoading.value = false
  }
}

const getActionTypeClass = (actionType) => {
  switch (actionType) {
    case 'POST':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'PUT':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
    case 'DELETE':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getActivityStatusClass = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'failure':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    case 'success':
    default:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchMembers = async () => {
  try {
    loading.value = true
    const response = await api(`/v1/members/tontine/${tontineId.value}`)
    // Extract members from the nested data structure: { success, data: { members, pagination } }
    members.value = response.data?.members || []
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to fetch members',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

// Computed properties for filtering and pagination
const filteredMembers = computed(() => {
  let filtered = members.value
  
  if (searchQuery.value) {
    filtered = filtered.filter(member => 
      member.names.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      member.phone.includes(searchQuery.value)
    )
  }
  
  if (roleFilter.value) {
    filtered = filtered.filter(member => member.role === roleFilter.value)
  }
  
  if (statusFilter.value) {
    if (statusFilter.value === 'verified') {
      filtered = filtered.filter(member => member.email_verified === 1 || member.email_verified === true)
    } else if (statusFilter.value === 'pending') {
      filtered = filtered.filter(member => member.email_verified === 0 || member.email_verified === false)
    }
  }
  
  return filtered
})

const totalPages = computed(() => Math.ceil(filteredMembers.value.length / itemsPerPage))

const paginatedMembers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMembers.value.slice(start, end)
})

// Reset pagination when filters change
watch([searchQuery, roleFilter, statusFilter], () => {
  currentPage.value = 1
})

const modal = useStatusModal()

const openAddMemberModal = () => {
  addError.value = ''
  addSuccess.value = ''
  submitting.value = false
  newMember.value = { names: '', email: '', phone: '', password: '', role: USER_ROLES.MEMBER }
  showAddModal.value = true
}

const addMember = async () => {
  addError.value = ''
  
  try {
    submitting.value = true
    
    const response = await api('/v1/users', {
      method: 'POST',
      body: {
        ...newMember.value,
        tontineId: tontineId.value
      }
    })
    
    // Handle both response.success and HTTP status 200
      if (response.success || response.status === 200) {
      // Show success message in modal
      addSuccess.value = `${newMember.value.names} has been added successfully! Welcome email sent with login credentials.`
      
      // After 2 seconds, close modal and reset
      setTimeout(() => {
        showAddModal.value = false
        addSuccess.value = ''
        newMember.value = { names: '', email: '', phone: '', password: '', role: USER_ROLES.MEMBER }
        fetchMembers()
      }, 2000)
    } else {
      addError.value = response.message || 'Failed to add member'
    }
    
  } catch (error) {
    addError.value = error.data?.message || 'Failed to add member. Please check the details and try again.'
  } finally {
    submitting.value = false
  }
}

const handleCloseAddModal = () => {
  addError.value = ''
  addSuccess.value = ''
  newMember.value = { names: '', email: '', phone: '', password: '', role: USER_ROLES.MEMBER }
  showAddModal.value = false
}

const editMember = (member) => {
  editError.value = ''
  editSuccess.value = ''
  submitting.value = false
  editingMember.value = {
    id: member.user_id,           // User ID for updating user info
    membership_id: member.id,      // Membership ID for updating shares
    names: member.names,
    email: member.email,
    phone: member.phone,
    role: member.role,
    shares: member.shares || 1
  }
  showEditModal.value = true
}

const updateMember = async () => {
  editError.value = ''
  
  try {
    submitting.value = true
    
    const userResponse = await api(`/v1/users/${editingMember.value.id}`, {
      method: 'PUT',
      body: {
        names: editingMember.value.names,
        email: editingMember.value.email,
        phone: editingMember.value.phone,
        role: editingMember.value.role
      }
    })
    
    let sharesResponse = { success: true }
    if (editingMember.value.membership_id) {
      sharesResponse = await api(`/v1/members/${editingMember.value.membership_id}/shares`, {
        method: 'PUT',
        body: { shares: editingMember.value.shares }
      })
    }
    
    if (userResponse.success && sharesResponse.success) {
      // Show success message in modal
      editSuccess.value = `${editingMember.value.names}'s information has been updated successfully.`
      
      // After 2 seconds, close modal and reset
      setTimeout(() => {
        showEditModal.value = false
        editSuccess.value = ''
        fetchMembers()
      }, 2000)
    } else {
      editError.value = userResponse.message || sharesResponse.message || 'Failed to update member'
    }
    
  } catch (error) {
    editError.value = error.data?.message || 'Failed to update member information.'
  } finally {
    submitting.value = false
  }
}

const handleCloseEditModal = () => {
  editError.value = ''
  editSuccess.value = ''
  showEditModal.value = false
}

const showDeleteModal = (member) => {
  memberToDelete.value = {
    id: member.id,
    user_id: member.user_id,
    names: member.names
  }
  
  modal.showWarning(
    `Are you sure you want to remove ${member.names} from the tontine? This action cannot be undone and the member will lose access to all tontine features.`,
    'Remove Member?',
    'Yes, Remove',
    () => confirmDelete()
  )
}

const confirmDelete = async () => {
  try {
    const response = await api(`/v1/members/${memberToDelete.value.id}`, { method: 'DELETE' })
    
    // Handle both response.success and HTTP status 200
      if (response.success || response.status === 200) {
      await fetchMembers()
      modal.showSuccess(
        `${memberToDelete.value.names} has been removed from the tontine successfully.`,
        'Member Removed'
      )
    } else {
      modal.showError(
        response.message || 'Failed to remove member from tontine.',
        'Removal Failed'
      )
    }
  } catch (error) {
    modal.showError(
      error.data?.message || 'Failed to remove member. Please try again.',
      'Removal Failed'
    )
  }
}

const fetchContributions = async () => {
  try {
    loading.value = true
    const response = await api(`/v1/contributions?tontineId=${tontineId.value}`)
    contributions.value = response.data?.contributions || response.data || []
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch contributions', color: 'red' })
  } finally {
    loading.value = false
  }
}

const getContributionMemberName = (contribution) => {
  return contribution.member_name || contribution.user_name || `Member #${contribution.user_id}`
}

const getContributionStatusColor = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'approved':
      return 'green'
    case 'pending':
      return 'yellow'
    case 'rejected':
    case 'failed':
      return 'red'
    default:
      return 'gray'
  }
}

const getPaymentStatusColor = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
      return 'green'
    case 'pending':
      return 'yellow'
    case 'failed':
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

const getLoanStatusColor = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'approved':
    case 'disbursed':
    case 'completed':
      return 'green'
    case 'pending':
    case 'waiting':
      return 'yellow'
    case 'received':
      return 'blue'
    case 'rejected':
    case 'defaulted':
      return 'red'
    default:
      return 'gray'
  }
}

const fetchLoans = async () => {
  try {
    loading.value = true
    const response = await api(`/v1/loans?tontineId=${tontineId.value}`)
    loans.value = response.data?.loans || response.data || []
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch loans', color: 'red' })
  } finally {
    loading.value = false
  }
}

const fetchPayments = async () => {
  try {
    loading.value = true
    const response = await api('/v1/payments')
    payments.value = response.data?.payments || response.data || []
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch payments', color: 'red' })
  } finally {
    loading.value = false
  }
}

const getPaymentMemberName = (payment) => {
  return payment.member_name || payment.user_name || `Member #${payment.user_id}`
}

const approveContribution = async (id) => {
  try {
    await api(`/v1/contributions/${id}`, { method: 'PUT', body: { status: 'Approved' } })
    await fetchContributions()
    modal.showSuccess('Contribution has been approved successfully.', 'Contribution Approved')
  } catch (error) {
    modal.showError('Failed to approve contribution. Please try again.', 'Approval Failed')
  }
}

const rejectContribution = async (id) => {
  modal.showWarning(
    'Are you sure you want to reject this contribution? This action cannot be undone.',
    'Reject Contribution?',
    'Yes, Reject',
    async () => {
      try {
        await api(`/v1/contributions/${id}`, { method: 'PUT', body: { status: 'Rejected' } })
        await fetchContributions()
        modal.showSuccess('Contribution has been rejected.', 'Contribution Rejected')
      } catch (error) {
        modal.showError('Failed to reject contribution.', 'Rejection Failed')
      }
    }
  )
}

const approveLoan = async (id) => {
  try {
    await api(`/v1/loans/${id}`, { method: 'PUT', body: { status: 'approved' } })
    await fetchLoans()
    modal.showSuccess('Loan has been approved successfully. Member will be notified.', 'Loan Approved')
  } catch (error) {
    modal.showError('Failed to approve loan. Please try again.', 'Approval Failed')
  }
}

const rejectLoan = async (id) => {
  modal.showWarning(
    'Are you sure you want to reject this loan request? The member will be notified of the rejection.',
    'Reject Loan?',
    'Yes, Reject',
    async () => {
      try {
        await api(`/v1/loans/${id}`, { method: 'PUT', body: { status: 'rejected' } })
        await fetchLoans()
        modal.showSuccess('Loan has been rejected. Member will be notified.', 'Loan Rejected')
      } catch (error) {
        modal.showError('Failed to reject loan.', 'Rejection Failed')
      }
    }
  )
}

const disburseLoan = async (id) => {
  modal.showWarning(
    'Are you sure you want to mark this loan as disbursed? The funds will be transferred to the member.',
    'Disburse Loan?',
    'Yes, Disburse',
    async () => {
      try {
        await api(`/v1/loans/${id}`, { method: 'PUT', body: { status: 'disbursed' } })
        await fetchLoans()
        modal.showSuccess('Loan has been disbursed successfully. Member will be notified.', 'Loan Disbursed')
      } catch (error) {
        modal.showError('Failed to disburse loan.', 'Disbursement Failed')
      }
    }
  )
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF'
  }).format(amount)
}

const formatDate = (date) => {
  if (!date) return 'Not set'
  const d = new Date(date)
  if (isNaN(d.getTime())) return 'Invalid Date'
  return d.toLocaleDateString('en-RW')
}

const fetchTontines = async () => {
  try {
    loading.value = true
    const response = await api('/v1/tontines')
    tontines.value = response.data?.tontines || response.data || []
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch tontines', color: 'red' })
  } finally {
    loading.value = false
  }
}

const openTontineManagement = (id) => {
  tontineId.value = String(id)
  activeTab.value = 'members'
  router.push({ path: '/manage', query: { tontine: id, tab: 'members' } })
  fetchMembers()
}

const activateTontine = async (id) => {
  try {
    await api(`/v1/tontines/${id}`, { method: 'PUT', body: { status: 'active' } })
    await fetchTontines()
    modal.showSuccess('Tontine has been activated successfully. Members can now join and contribute.', 'Tontine Activated')
  } catch (error) {
    modal.showError('Failed to activate tontine. Please try again.', 'Activation Failed')
  }
}

const deactivateTontine = async (id) => {
  modal.showWarning(
    'Are you sure you want to deactivate this tontine? Members will not be able to make new contributions or loan requests.',
    'Deactivate Tontine?',
    'Yes, Deactivate',
    async () => {
      try {
        await api(`/v1/tontines/${id}`, { method: 'PUT', body: { status: 'inactive' } })
        await fetchTontines()
        modal.showSuccess('Tontine has been deactivated.', 'Tontine Deactivated')
      } catch (error) {
        modal.showError('Failed to deactivate tontine.', 'Deactivation Failed')
      }
    }
  )
}

// Meeting Management Functions
const fetchMeetings = async () => {
  try {
    loading.value = true
    // Use the tontine-specific endpoint for consistent results
    const response = await api(`/v1/meetings/tontine/${tontineId.value}`)
    const data = response.data || response
    // Handle nested response structure: response.data.meetings
    if (data && data.meetings && Array.isArray(data.meetings)) {
      meetings.value = data.meetings.filter(m => m && m.id)
    } else if (Array.isArray(data)) {
      meetings.value = data.filter(m => m && m.id)
    } else {
      meetings.value = []
    }
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch meetings', color: 'red' })
    meetings.value = []
  } finally {
    loading.value = false
  }
}

const openCreateMeetingModal = () => {
  editingMeeting.value = null
  meetingForm.value = {
    title: '',
    description: '',
    agenda: '',
    meetingDate: '',
    location: '',
    status: 'scheduled'
  }
  showMeetingModal.value = true
}

const closeMeetingModal = () => {
  showMeetingModal.value = false
  editingMeeting.value = null
}

const editMeeting = (meeting) => {
  editingMeeting.value = meeting
  meetingForm.value = {
    title: meeting.title || '',
    description: meeting.description || '',
    agenda: meeting.agenda || '',
    meetingDate: meeting.meeting_date ? new Date(meeting.meeting_date).toISOString().slice(0, 16) : '',
    location: meeting.location || '',
    status: meeting.status || 'scheduled'
  }
  showMeetingModal.value = true
}

const saveMeeting = async () => {
  if (!meetingForm.value.title || !meetingForm.value.agenda || !meetingForm.value.meetingDate) {
    toast.add({ title: 'Error', description: 'Please fill in all required fields', color: 'red' })
    return
  }

  try {
    submittingMeeting.value = true

    const payload = {
      tontine_id: tontineId.value,
      title: meetingForm.value.title,
      description: meetingForm.value.description,
      agenda: meetingForm.value.agenda,
      meeting_date: meetingForm.value.meetingDate,
      location: meetingForm.value.location,
      status: meetingForm.value.status
    }

    if (editingMeeting.value && editingMeeting.value.id) {
      // Update existing meeting
      const response = await api(`/v1/meetings/${editingMeeting.value.id}`, {
        method: 'PUT',
        body: payload
      })

      // Handle both response.success and HTTP status 200
      if (response.success || response.status === 200) {
        toast.add({ title: 'Success', description: 'Meeting updated successfully', color: 'green' })
        closeMeetingModal()
        await fetchMeetings()
      } else {
        toast.add({ title: 'Error', description: response.message || 'Failed to update meeting', color: 'red' })
      }
    } else {
      // Create new meeting
      const response = await api('/v1/meetings', {
        method: 'POST',
        body: payload
      })

      // Handle both response.success and HTTP status 201
      if (response.success || response.status === 201) {
        toast.add({ title: 'Success', description: 'Meeting created successfully', color: 'green' })
        closeMeetingModal()
        await fetchMeetings()
      } else {
        toast.add({ title: 'Error', description: response.message || 'Failed to create meeting', color: 'red' })
      }
    }
  } catch (error) {
    toast.add({ title: 'Error', description: error.data?.message || 'Failed to save meeting', color: 'red' })
  } finally {
    submittingMeeting.value = false
  }
}

const markMeetingAttendance = (meeting) => {
  router.push(`/tontine-meetings-attendance/${meeting.id}`)
}

const deleteMeeting = (meeting) => {
  modal.showWarning(
    `Are you sure you want to delete the meeting "${meeting.title}"? This action cannot be undone.`,
    'Delete Meeting?',
    'Yes, Delete',
    async () => {
      try {
        const response = await api(`/v1/meetings/${meeting.id}`, { method: 'DELETE' })
        // Handle both response.success and HTTP status 200
      if (response.success || response.status === 200) {
          toast.add({ title: 'Success', description: 'Meeting deleted successfully', color: 'green' })
          await fetchMeetings()
          modal.showSuccess('Meeting has been deleted successfully.', 'Meeting Deleted')
        } else {
          modal.showError(response.message || 'Failed to delete meeting.', 'Deletion Failed')
        }
      } catch (error) {
        modal.showError(error.data?.message || 'Failed to delete meeting.', 'Deletion Failed')
      }
    }
  )
}

// Penalty Management Functions
const fetchPenalties = async () => {
  try {
    loading.value = true
    // Use the correct endpoint: /v1/penalties/tontine/:tontineId
    const response = await api(`/v1/penalties/tontine/${tontineId.value}`)
    const data = response.data || response
    penalties.value = data?.penalties || data || []
  } catch (error) {
    toast.add({ title: 'Error', description: 'Failed to fetch penalties', color: 'red' })
    penalties.value = []
  } finally {
    loading.value = false
  }
}

const markPenaltyPaid = async (penalty) => {
  modal.showWarning(
    `Are you sure you want to mark this penalty of ${formatCurrency(penalty.amount)} as paid?`,
    'Mark Penalty Paid?',
    'Yes, Mark Paid',
    async () => {
      try {
        const response = await api(`/v1/penalties/${penalty.id}`, {
          method: 'PUT',
          body: { status: 'paid', paid_at: new Date().toISOString() }
        })
        // Handle both response.success and HTTP status 200
      if (response.success || response.status === 200) {
          toast.add({ title: 'Success', description: 'Penalty marked as paid', color: 'green' })
          await fetchPenalties()
          modal.showSuccess('Penalty has been marked as paid.', 'Penalty Paid')
        } else {
          modal.showError(response.message || 'Failed to mark penalty as paid.', 'Update Failed')
        }
      } catch (error) {
        modal.showError(error.data?.message || 'Failed to update penalty status.', 'Update Failed')
      }
    }
  )
}

</script>

