import accessControl from '../../shared/accessControl.json'

const cloneValues = (values) => Object.freeze([...values])

export const USER_ROLES = Object.freeze({ ...accessControl.roles })

export const ROLE_GROUPS = Object.freeze({
  EXECUTIVE: cloneValues(accessControl.roleGroups.EXECUTIVE),
  ADMIN_ONLY: cloneValues(accessControl.roleGroups.EXECUTIVE),
  PRIVILEGED: cloneValues(accessControl.roleGroups.PRIVILEGED),
  ACCOUNTING: cloneValues(accessControl.roleGroups.ACCOUNTING),
  RECORDING: cloneValues(accessControl.roleGroups.ACCOUNTING)
})

export const ACCESS_RULES = Object.freeze({
  ...Object.fromEntries(
    Object.entries(accessControl.accessRules).map(([key, values]) => [key, cloneValues(values)])
  )
})

export const PUBLIC_ROUTES = cloneValues(accessControl.routes.PUBLIC)
export const AUTH_ROUTES = cloneValues(accessControl.routes.AUTH)

const resolveRoles = (ruleOrRoles) => {
  if (Array.isArray(ruleOrRoles)) {
    return ruleOrRoles
  }

  return ACCESS_RULES[ruleOrRoles] || ROLE_GROUPS[ruleOrRoles] || []
}

export const hasRoleValue = (role, ruleOrRoles) => {
  const roles = resolveRoles(ruleOrRoles)
  return !!role && roles.includes(role)
}

export const hasRole = (user, ruleOrRoles) => {
  return hasRoleValue(user?.role, ruleOrRoles)
}

export const hasAccess = hasRole
export const isExecutiveRole = (role) => hasRoleValue(role, 'EXECUTIVE_ACTIONS')
export const isPrivilegedRole = (role) => hasRoleValue(role, 'PRIVILEGED_PAGES')
export const isAdminOnly = (user) => hasAccess(user, 'EXECUTIVE_ACTIONS')
export const isAdminLevel = (user) => hasAccess(user, 'PRIVILEGED_PAGES')
export const isAccountant = (user) => hasAccess(user, 'TRANSACTION_RECORDING')
export const canViewTontineDashboard = (user) => hasAccess(user, 'TONTINE_DASHBOARD')
export const canManageTontine = (user) => hasAccess(user, 'TONTINE_MANAGEMENT')

export const getStoredAuthState = () => {
  if (process.server) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false
    }
  }

  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  const rawUser = localStorage.getItem('user')

  let user = null

  if (rawUser) {
    try {
      user = JSON.parse(rawUser)
    } catch {
      user = null
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated: !!(accessToken && refreshToken && user)
  }
}
