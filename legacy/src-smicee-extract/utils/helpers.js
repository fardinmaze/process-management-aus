import dayjs from 'dayjs'
import { ToWords } from 'to-words'
import { DISPLAY_DATE, DISPLAY_DATETIME, AMOUNT_IN_WORDS_SUFFIX } from './constants'
import { API_HOST } from './apiPaths'

const toWords = new ToWords()

// ── Date formatting ───────────────────────────────────────────────────────────

/**
 * Format an ISO date string to a human-readable date.
 */
export function formatDate(value, format = DISPLAY_DATE) {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format(format) : '—'
}

export function formatDateTime(value) {
  return formatDate(value, DISPLAY_DATETIME)
}

/** Time-only, e.g. "3:45 PM" — the V9 sticky-bar "As of HH:MM" timestamp. */
export function formatTime(value) {
  if (!value) return '—'
  const d = dayjs(value)
  return d.isValid() ? d.format('h:mm A') : '—'
}

/**
 * Combine a date-only value (e.g. a DatePicker's 'YYYY-MM-DD') with the
 * current time-of-day into a full ISO 8601 timestamp — for payload fields
 * the backend expects as a datetime even though the picker only lets the
 * user choose a day.
 */
export function toISODateTime(dateValue) {
  if (!dateValue) return null
  const now = dayjs()
  const combined = dayjs(dateValue)
    .hour(now.hour()).minute(now.minute()).second(now.second()).millisecond(now.millisecond())
  return combined.isValid() ? combined.toISOString() : null
}

export function timeAgo(value) {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return formatDate(value)
}

// ── String helpers ────────────────────────────────────────────────────────────

export function capitalize(str = '') {
  str = typeof str === 'string' ? str : String(str ?? '')
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function titleCase(str = '') {
  return str.replace(/\w\S*/g, (word) => capitalize(word))
}

export function truncate(str = '', length = 50, suffix = '…') {
  return str.length > length ? str.slice(0, length) + suffix : str
}

/**
 * Strip HTML tags from a rich-text string, returning plain decoded text.
 * Useful for previewing rich-text fields (e.g. report body) outside v-html.
 */
export function stripHtml(html = '') {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent || ''
}

/**
 * Escape a plain-text string and turn any URLs in it into clickable links,
 * for safe use with v-html on user-submitted text (e.g. chat/reply messages).
 */
export function linkify(text = '') {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return escaped.replace(/((?:https?:\/\/|www\.)[^\s<]+)/gi, (match) => {
    // Trim trailing punctuation that's likely sentence punctuation, not part of the URL.
    const trailing = match.match(/[.,!?)]+$/)?.[0] ?? ''
    const url  = trailing ? match.slice(0, -trailing.length) : match
    const href = url.startsWith('http') ? url : `https://${url}`
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="rich-link">${url}</a>${trailing}`
  })
}

export function slugify(str = '') {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ── Number helpers ────────────────────────────────────────────────────────────

export function formatNumber(value, locale = 'en-US') {
  if (value === null || value === undefined) return '—'
  // `maximumFractionDigits: 2` — without it, toLocaleString's own default
  // (up to 3) lets a value like 20266.536 render with three decimal places
  // verbatim (the UX audit's V3/O8 finding: inconsistent, overly-precise
  // number formatting). This is the one narrow, uncontroversial fix pulled
  // out of that audit item — a currency/abbreviation redesign of every
  // number on the dashboard is a separate, much larger change not
  // attempted here.
  return Number(value).toLocaleString(locale, { maximumFractionDigits: 2 })
}

export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
}

/**
 * The dashboard's one money formatter (UX audit's V3 finding: `1601.6k`,
 * `1,692,600`, `23,398.9`, `20,266.536`, `197,554,927` and a 24-digit BIGINT
 * overflow were all rendering on the same page with no shared convention).
 * ৳ prefix, abbreviated above 6 digits (৳1.60M / ৳1.60B), never more than 2
 * decimal places. Use `formatMoneyPrecise` (full, unabbreviated) for a
 * `title` attribute so the exact figure is still one hover away.
 */
export function formatMoney(value, locale = 'en-US') {
  if (value === null || value === undefined) return '৳—'
  const num = Number(value)
  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)
  // A trillion-plus tier exists mainly so a garbage/mistyped data value
  // (a seed-data budget figure with a dozen extra digits, say) still
  // abbreviates to a short string instead of a many-digit "B" number long
  // enough to overflow its card.
  if (abs >= 1_000_000_000_000) return `${sign}৳${(abs / 1_000_000_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}T`
  if (abs >= 1_000_000_000) return `${sign}৳${(abs / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}B`
  if (abs >= 1_000_000) return `${sign}৳${(abs / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })}M`
  return `${sign}৳${abs.toLocaleString(locale, { maximumFractionDigits: 1 })}`
}

/** Full, unabbreviated ৳ figure — pair with `formatMoney` as a `title` attribute. */
export function formatMoneyPrecise(value, locale = 'en-US') {
  if (value === null || value === undefined) return '—'
  return `৳${Number(value).toLocaleString(locale, { maximumFractionDigits: 2 })}`
}

/**
 * Spell out an amount in words, e.g. 1250 -> "One Thousand Two Hundred Fifty Tk Only".
 */
export function amountInWords(value) {
  const amount = Number(value) || 0
  return `${toWords.convert(amount)} ${AMOUNT_IN_WORDS_SUFFIX}`
}

// ── Object / array helpers ────────────────────────────────────────────────────

export function pick(obj, keys) {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key]
    return acc
  }, {})
}

export function omit(obj, keys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !keys.includes(k))
  )
}

/**
 * Drop keys with "no data" — null/undefined, blank strings, and empty
 * arrays — so an optional, untouched form section (e.g. specification rows,
 * a date field left blank) is omitted from the request instead of sent as
 * an empty placeholder value.
 */
export function stripEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => {
      if (v === null || v === undefined) return false
      if (typeof v === 'string' && v.trim() === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    })
  )
}

export function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const group = typeof key === 'function' ? key(item) : item[key]
    ;(acc[group] = acc[group] || []).push(item)
    return acc
  }, {})
}

// ── Form helpers ──────────────────────────────────────────────────────────────

/**
 * Flatten a Laravel validation error response into a simple key→message map.
 * Input:  { errors: { email: ['Email is required.'] } }
 * Output: { email: 'Email is required.' }
 *
 * SMICEE also returns `errors` as a *list* of `{ status_code, message }`
 * objects, which carries no field names — those belong in the page-level
 * alert (see `apiErrorMessage`), not on a form field, so they're skipped.
 */
export function parseValidationErrors(error) {
  const errors = error?.response?.data?.errors
  if (!errors || Array.isArray(errors) || typeof errors !== 'object') return {}
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages[0] : messages,
    ])
  )
}

// ── API error helpers ────────────────────────────────────────────────

/**
 * Pull the failure message out of a SMICEE response *body*:
 *
 *   { code: 401, status_code: 401, message: '…', errors: [{ status_code, message }] }
 *
 * The API sometimes answers with HTTP 200 while reporting the failure only
 * inside the body like this, so the outer HTTP status can't be trusted on its
 * own. Returns the message when the body reports an error status (>= 400),
 * otherwise `null` (including when no status is present at all).
 */
export function bodyErrorMessage(data) {
  if (!data || typeof data !== 'object') return null

  const nested = data.data && typeof data.data === 'object' ? data.data : null
  const status  = Number(
    data.status_code ?? data.code ?? nested?.status_code ?? nested?.code ?? NaN
  )
  if (!(status >= 400)) return null

  return firstMessage(data) || firstMessage(nested) || `Request failed with status ${status}`
}

/**
 * Best human-readable message for a rejected API call — works for both real
 * HTTP errors (message lives on `err.response.data`) and the in-body failures
 * above (thrown locally, so the message lives on the Error itself).
 */
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data
  const fromBody = firstMessage(data) || firstMessage(data?.data)
  if (fromBody) return fromBody

  // Axios' own message for an error status ("Request failed with status code
  // 401") says nothing a user can act on — prefer the caller's wording.
  const local = err?.message
  if (local && !/^Request failed with status code/.test(local)) return local

  return fallback
}

/**
 * Message for a failed approval-chain call (approve/reject/submit/refer on
 * bill, invoice, …). Those endpoints answer `{ code, response, error }` —
 * `response` is the headline ("Approval action rejected") and `error` the
 * reason ("You are not an approver on the current stage."), so show both.
 */
export function approvalErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data
  if (data && typeof data === 'object' && (data.response || data.error)) {
    const head   = typeof data.response === 'string' ? data.response : ''
    const reason = typeof data.error === 'string' ? data.error : ''
    if (head && reason && head !== reason) return `${head}: ${reason}`
    return head || reason
  }
  return apiErrorMessage(err, fallback)
}

function firstMessage(body) {
  if (typeof body === 'string') return body.trim() || null
  if (!body || typeof body !== 'object') return null
  const listed = Array.isArray(body.errors) ? body.errors.find((e) => e?.message) : null
  return body.message || body.detail || listed?.message || null
}

/**
 * Build a FormData object from a plain object, handling File values and arrays.
 */
export function toFormData(obj, form = new FormData(), namespace = '') {
  for (const [key, value] of Object.entries(obj)) {
    const field = namespace ? `${namespace}[${key}]` : key

    if (value === null || value === undefined) {
      form.append(field, '')
    } else if (value instanceof File) {
      form.append(field, value, value.name)
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === 'object' && !(item instanceof File)) {
          toFormData(item, form, `${field}[${i}]`)
        } else {
          form.append(`${field}[${i}]`, item)
        }
      })
    } else if (typeof value === 'object') {
      toFormData(value, form, field)
    } else {
      form.append(field, String(value))
    }
  }
  return form
}

// ── Misc ──────────────────────────────────────────────────────────────────────

export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Navigate to the previous page in browser history, falling back to a given
 * route (e.g. a list view) when there's no previous page to go back to —
 * such as when the page was opened directly via a bookmark or new tab.
 */
export function goBack(router, fallbackRoute) {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push(fallbackRoute)
  }
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
}

/**
 * Single source of truth for the BD_VAT_TAX gate on the frontend — call
 * sites should always go through this rather than comparing
 * `fin_tax_scheme` directly, so the scheme's string value only lives in one
 * place. Mirrors `OrganizationSettings.is_bd_vat_tax_scheme()` on the
 * backend (organization_settings/models.py). `orgSettings` is whatever
 * `organization/organizationSetting` currently holds.
 */
export function isBdVatTaxScheme(orgSettings) {
  return orgSettings?.fin_tax_scheme === 'BD_VAT_TAX'
}

/**
 * Resolve a display name from a member/employee-shaped object (or a bare
 * string, e.g. a legacy refer_to entry that wasn't hydrated into an object).
 */
export function memberName(member) {
  if (typeof member === 'string') return member
  return member?.full_name
    || [member?.first_name, member?.last_name].filter(Boolean).join(' ')
    || member?.name
    || member?.username
    || 'Unknown'
}

/**
 * Resolve an absolute photo URL from a member/employee-shaped object.
 */
export function memberPhotoUrl(member) {
  const photo = member?.photo
  if (!photo) return null
  return photo.startsWith('http') ? photo : API_HOST + photo
}

/**
 * Build a Google Maps link from a `{ latitude, longitude }` location object
 * (e.g. a punch-in/punch-out location). Returns null when coordinates are
 * missing so callers can hide the link instead of pointing it nowhere.
 */
export function googleMapsUrl(location) {
  if (!location?.latitude || !location?.longitude) return null
  return `https://www.google.com/maps/place/${location.latitude},${location.longitude}`
}

export function downloadBlob(blob, filename) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Download `rows` as a CSV. `columns` is [{ key, label, value? }] — `value`
 * lets a column derive from the row rather than read one field.
 *
 * Kept client-side on purpose: this is a manual backup of whatever is on
 * screen, filters and all, so it should match what the user is looking at
 * rather than re-querying the server with different arguments.
 */
export function exportRowsToCsv(rows, columns, filename) {
  const escape = (value) => {
    if (value === null || value === undefined) return ''
    const text = String(value)
    // Quote when the value could otherwise break the row apart.
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const header = columns.map((c) => escape(c.label)).join(',')
  const body = rows.map((row) =>
    columns.map((c) => escape(c.value ? c.value(row) : row[c.key])).join(','),
  )

  // BOM so Excel opens UTF-8 (Bengali names, the ৳ sign) without mangling it.
  const csv = '\uFEFF' + [header, ...body].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename)
}
