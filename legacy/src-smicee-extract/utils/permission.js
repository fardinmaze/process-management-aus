import store from '@/store'
import { isBdVatTaxScheme } from '@/utils/helpers'

/**
 * Check if the current user has a single permission.
 */
export function can(permission) {
  return store.getters['permission/hasPermission'](permission)
}

/**
 * Check if the current user has ALL of the given permissions.
 */
export function canAll(permissions = []) {
  return store.getters['permission/hasAllPermissions'](permissions)
}

/**
 * Check if the current user has ANY of the given permissions.
 */
export function canAny(permissions = []) {
  return store.getters['permission/hasAnyPermission'](permissions)
}

/**
 * Check if the current user holds a specific role.
 */
export function hasRole(role) {
  return store.getters['permission/hasRole'](role)
}

/**
 * Check if the current user holds any of the given roles.
 */
export function hasAnyRole(roles = []) {
  return store.getters['permission/hasAnyRole'](roles)
}

/**
 * Check if the current user is a super-admin (bypasses all permission checks).
 */
export function isSuperAdmin() {
  return store.getters['permission/isSuperAdmin']
}

/**
 * Check if this org is on the BD_VAT_TAX scheme (withholding-at-source
 * VAT/TDS tracking — see finance/fin_core/withholding.py on the backend).
 * Reads the store singleton directly, same convention as `can()` above, so
 * it's usable from a nav-config filter (Sidebar.vue) as well as components.
 * Delegates to `isBdVatTaxScheme()` (utils/helpers.js) for the actual
 * 'BD_VAT_TAX' comparison, so that literal only ever lives in one place.
 */
export function isOrgBdVatTaxScheme() {
  return isBdVatTaxScheme(store.getters['organization/organizationSetting'])
}

/**
 * Vue directive registration helper.
 * Usage in template:  v-can="'user.create'"
 *                     v-can.any="['user.create', 'user.edit']"
 *                     v-can.all="['user.create', 'user.edit']"
 */
export const vCan = {
  mounted(el, binding) {
    const { value, modifiers } = binding
    let allowed = false

    if (modifiers.any) {
      allowed = canAny(Array.isArray(value) ? value : [value])
    } else if (modifiers.all) {
      allowed = canAll(Array.isArray(value) ? value : [value])
    } else {
      allowed = can(value)
    }

    if (!allowed) {
      el.style.display = 'none'
    }
  },

  updated(el, binding) {
    const { value, modifiers } = binding
    let allowed = false

    if (modifiers.any) {
      allowed = canAny(Array.isArray(value) ? value : [value])
    } else if (modifiers.all) {
      allowed = canAll(Array.isArray(value) ? value : [value])
    } else {
      allowed = can(value)
    }

    el.style.display = allowed ? '' : 'none'
  },
}

/**
 * Vue directive: v-role="'admin'"  or  v-role="['admin','manager']"
 */
export const vRole = {
  mounted(el, binding) {
    const roles   = Array.isArray(binding.value) ? binding.value : [binding.value]
    const allowed = hasAnyRole(roles)
    if (!allowed) el.style.display = 'none'
  },

  updated(el, binding) {
    const roles   = Array.isArray(binding.value) ? binding.value : [binding.value]
    const allowed = hasAnyRole(roles)
    el.style.display = allowed ? '' : 'none'
  },
}
