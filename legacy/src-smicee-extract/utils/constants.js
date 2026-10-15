// ── API ───────────────────────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// ── Pagination ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE  = 25
export const PAGE_SIZE_OPTIONS  = [25, 50, 100]

// ── Token storage keys ────────────────────────────────────────────────────────
export const TOKEN_KEY         = 'admin_token'
export const REFRESH_TOKEN_KEY = 'admin_refresh_token'

// ── User statuses ─────────────────────────────────────────────────────────────
export const USER_STATUS = {
  ACTIVE:   'active',
  INACTIVE: 'inactive',
  BANNED:   'banned',
}

export const USER_STATUS_LABELS = {
  [USER_STATUS.ACTIVE]:   'Active',
  [USER_STATUS.INACTIVE]: 'Inactive',
  [USER_STATUS.BANNED]:   'Banned',
}

export const USER_STATUS_COLORS = {
  [USER_STATUS.ACTIVE]:   'success',
  [USER_STATUS.INACTIVE]: 'warning',
  [USER_STATUS.BANNED]:   'danger',
}


// ── EOD Status ────────────────────────────────────────────────────────────────
export const EOD_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DISCUSSION: 'DISCUSSION',
}

export const EOD_STATUS_LABELS = {
  [EOD_STATUS.PENDING]: 'PENDING',
  [EOD_STATUS.APPROVED]: 'APPROVED',
  [EOD_STATUS.DISCUSSION]: 'DISCUSSION',
}

export const EOD_STATUS_COLORS = {
  [EOD_STATUS.PENDING]: 'warning',
  [EOD_STATUS.APPROVED]: 'success',
  [EOD_STATUS.DISCUSSION]: 'info',
}

// ── Employee active/inactive status ────────────────────────────────────────
export const EMPLOYEE_STATUS = {
  ACTIVE:   'active',
  INACTIVE: 'inactive',
}

export const EMPLOYEE_STATUS_LABELS = {
  [EMPLOYEE_STATUS.ACTIVE]:   'Active',
  [EMPLOYEE_STATUS.INACTIVE]: 'Inactive',
}

export const EMPLOYEE_STATUS_COLORS = {
  [EMPLOYEE_STATUS.ACTIVE]:   'success',
  [EMPLOYEE_STATUS.INACTIVE]: 'warning',
}


// ── REQUISITION Status ────────────────────────────────────────────────────────────────
export const REQUISITION_STATUSES = [
  { id: 1, name: 'Pending',    value: 'PENDING' },
  { id: 2, name: 'Approved',   value: 'APPROVED' },
  { id: 3, name: 'Discussion', value: 'DUE' },
  { id: 4, name: 'Rejected',   value: 'REJECTED' },
  { id: 5, name: 'Settled',    value: 'SETTLED' },
  { id: 6, name: 'Unsettled',  value: 'UNSETTLED' },
  { id: 7, name: 'Acknowledged',  value: 'ACKNOWLEDGED' },
]

export const REQUISITION_STATUS_COLORS = {
  PENDING: 'warning',
  APPROVED: 'role',
  DUE: 'info',
  REJECTED: 'danger',
  SETTLED: 'success',
  UNSETTLED: 'warning',
  ACKNOWLEDGED: 'success',
}

// ── QUOTATION Status ────────────────────────────────────────────────────────────────
export const QUOTATION_STATUSES = [
  { id: 1, name: 'Pending',    value: 'pending' },
  { id: 2, name: 'On Process',   value: 'on_process' },
  { id: 3, name: 'Approved', value: 'approved' },
  { id: 4, name: 'Cancelled',   value: 'cancelled' }
]

export const QUOTATION_STATUS_COLORS = {
  pending: 'warning',
  approved: 'success',
  on_process: 'info',
  cancelled: 'danger'
}

// ── INVOICE Status ────────────────────────────────────────────────────────────────
export const INVOICE_STATUSES = [
  { id: 1, name: 'Due',            value: 'DUE' },
  { id: 2, name: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { id: 3, name: 'Fully Paid',     value: 'FULLY_PAID' },
]

export const INVOICE_STATUS_COLORS = {
  DUE:             'danger',
  PARTIALLY_PAID:  'warning',
  FULLY_PAID:      'success',
}

// ── PURCHASE ORDER Status ────────────────────────────────────────────────────────────
export const PURCHASE_ORDER_STATUSES = [
  { id: 1, name: 'Pending',   value: 'PENDING' },
  { id: 2, name: 'Approved',  value: 'APPROVED' },
  { id: 3, name: 'Rejected',  value: 'REJECTED' },
  { id: 4, name: 'Dismissed', value: 'DISMISSED' },
]

export const PURCHASE_ORDER_STATUS_COLORS = {
  PENDING:   'warning',
  APPROVED:  'success',
  REJECTED:  'danger',
  DISMISSED: 'default',
}

// ── BILL Status ────────────────────────────────────────────────────────────────
export const BILL_STATUSES = [
  { id: 1, name: 'Due',            value: 'DUE' },
  { id: 2, name: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { id: 3, name: 'Fully Paid',     value: 'FULLY_PAID' },
]

export const BILL_STATUS_COLORS = {
  DUE:             'danger',
  PARTIALLY_PAID:  'warning',
  FULLY_PAID:      'success',
}

// ── BILL / INVOICE approval_status ──────────────────────────────────────────────
// Separate from BILL_STATUSES/INVOICE_STATUSES above, which are *payment*
// state. Approval runs draft → pending_approval → approved | rejected. A
// record submitted with referred users waits in pending_approval until one
// of them acknowledges it (→ acknowledged, chain starts at stage 1); either
// way it stays there until the last stage clears. approved/rejected are
// terminal and lock the record. See INVOICE_BILL_FRONTEND_GUIDE.md §2.
export const FIN_APPROVAL_STATUSES = [
  { id: 1, name: 'Draft',            value: 'draft' },
  { id: 2, name: 'Pending Approval', value: 'pending_approval' },
  { id: 3, name: 'Acknowledged',     value: 'acknowledged' },
  { id: 4, name: 'Approved',         value: 'approved' },
  { id: 5, name: 'Rejected',         value: 'rejected' },
]

export const FIN_APPROVAL_STATUS_COLORS = {
  draft:            'default',
  pending_approval: 'warning',
  acknowledged:     'info',
  approved:         'success',
  rejected:         'danger',
}

// Statuses that still await approval — `acknowledged` is treated like
// `pending_approval` for approve/reject and "awaiting approval" badges.
export const FIN_APPROVAL_PENDING = ['pending_approval', 'acknowledged']

// Which approval_status a list's status dropdown may move a record to from
// its current one — draft can only be submitted, pending can be approved/
// rejected (or pulled back to draft), acknowledged only approved/rejected
// (it can't be set by hand), approved/rejected are locked.
export const FIN_APPROVAL_TRANSITIONS = {
  draft:            ['draft', 'pending_approval'],
  pending_approval: ['draft', 'pending_approval', 'approved', 'rejected'],
  acknowledged:     ['acknowledged', 'approved', 'rejected'],
  approved:         ['approved'],
  rejected:         ['rejected'],
}

// ── ORDERS Status ────────────────────────────────────────────────────────────────
export const ORDER_STATUSES = [
  { id: 1, name: 'Pending',    value: 'pending' },
  { id: 2, name: 'On Process',   value: 'on_process' },
  { id: 3, name: 'Approved', value: 'approved' },
  { id: 4, name: 'Cancelled',   value: 'cancelled' }
]

export const ORDER_STATUS_COLORS = {
  pending: 'warning',
  on_process: 'info',
  approved: 'success',
  cancelled: 'danger',
}


// ── ASSET Status ────────────────────────────────────────────────────────────────
export const ASSET_ALLOCATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  RETURNED: 'RETURNED'
}

export const ASSET_ALLOCATION_STATUS_LABELS = {
  [ASSET_ALLOCATION_STATUS.PENDING]: 'PENDING',
  [ASSET_ALLOCATION_STATUS.APPROVED]: 'APPROVED',
  [ASSET_ALLOCATION_STATUS.RETURNED]: 'RETURNED'
}

export const ASSET_ALLOCATION_STATUS_COLORS = {
  [ASSET_ALLOCATION_STATUS.PENDING]: 'warning',
  [ASSET_ALLOCATION_STATUS.APPROVED]: 'success',
  [ASSET_ALLOCATION_STATUS.RETURNED]: 'danger',
}

export const ASSET_STATUS = {
  AVAILABLE: 'AVAILABLE',
  ALLOCATED: 'ALLOCATED',
  RETURNED: 'RETURNED',
  RETIRED: 'RETIRED'
}

export const ASSET_STATUS_LABELS = {
  [ASSET_STATUS.AVAILABLE]: 'AVAILABLE',
  [ASSET_STATUS.ALLOCATED]: 'ALLOCATED',
  [ASSET_STATUS.RETURNED]: 'RETURNED',
  [ASSET_STATUS.RETIRED]: 'RETIRED'
}

export const ASSET_STATUS_COLORS = {
  [ASSET_STATUS.RETIRED]: 'warning',
  [ASSET_STATUS.AVAILABLE]: 'success',
  [ASSET_STATUS.RETURNED]: 'danger',
  [ASSET_STATUS.ALLOCATED]: 'info'
}


// ── My Updates ref types ────────────────────────────────────────────────────────
export const REF_TYPES = [
  { id: 1, name: 'Leave',       value: 'LEAVE' },
  { id: 2, name: 'Ticket',      value: 'TICKET' },
  { id: 3, name: 'Budget',      value: 'BUDGET' },
  { id: 4, name: 'EOD',         value: 'EOD' },
  { id: 5, name: 'Requisition', value: 'REQUISITION' },
  { id: 6, name: 'Grievance',   value: 'GRIEVANCE' },
]

export const REF_TYPE_COLORS = {
  LEAVE:       'warning',
  TICKET:      'info',
  BUDGET:      'role',
  EOD:         'success',
  REQUISITION: 'default',
  GRIEVANCE:   'danger',
}

// ── Ticket status & priority ────────────────────────────────────────────────────
export const TICKET_STATUSES = ['OPEN', 'CLOSED']

export const TICKET_PRIORITIES = [
  { id: 1, name: 'High',   value: 'HIGH' },
  { id: 2, name: 'Medium', value: 'MEDIUM' },
  { id: 3, name: 'Low',    value: 'LOW' },
]

export const TICKET_STATUS_COLORS = {
  OPEN:   'success',
  CLOSED: 'danger',
}

export const TICKET_PRIORITY_COLORS = {
  HIGH:   'success',
  MEDIUM: 'warning',
  LOW:    'danger',
}

// ── Grievance status  ────────────────────────────────────────────────────
export const GRIEVANCE_STATUSES = ['OPEN', 'CLOSE', 'ARCHIVED']

export const GRIEVANCE_STATUS_COLORS = {
  OPEN:   'success',
  CLOSE: 'danger',
  ARCHIVED: 'default'
}


// ── Payroll - Payslip Status ────────────────────────────────────────────────────
export const PAYSLIP_STATUS = ['PAID', 'UNPAID', 'PARTIALLY_PAID']

export const PAYSLIP_STATUS_COLORS = {
  PAID: 'success',
  UNPAID: 'danger',
  PARTIALLY_PAID: 'warning',
}

// ── Leave status ─────────────────────────────────────────────────────────────
export const LEAVE_STATUSES = ['DUE', 'PENDING', 'APPROVED', 'REJECTED','ACKNOWLEDGED']

export const LEAVE_STATUS_COLORS = {
  DUE:      'info',
  PENDING:  'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  ACKNOWLEDGED: 'info',
}


// ── Policy Compliance — `choice` field (Policy vs Compliance record) ──────────
// Mirrors the backend's choices tuple: (('Policy', 'Policy'), ('Compliance',
// 'Compliance')) — value and label are identical.
export const POLICY_COMPLIANCE_CHOICES = ['Policy', 'Compliance']

// ── Policy Compliance — submission_form field types ───────────────────────────
// `data_type` is only special-cased by the backend for 'filefield' (base64
// decode on submit, see POLICY_COMPLIANCE_API.md §5.3) — the rest are a
// frontend-only convention for which input to render.
export const POLICY_FIELD_TYPES = ['text', 'textarea', 'number', 'date', 'checkbox', 'filefield']

export const POLICY_FIELD_TYPE_LABELS = {
  text:      'Text',
  textarea:  'Long Text',
  number:    'Number',
  date:      'Date',
  checkbox:  'Checkbox',
  filefield: 'File Upload',
}

// ── Permission groups (mirrors backend) ───────────────────────────────────────
export const PERMISSION_GROUPS = [
  'user',
  'role',
  'permission',
  'designation',
  'setting',
]

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete']

// ── Date formats ──────────────────────────────────────────────────────────────
export const DATE_FORMAT      = 'YYYY-MM-DD'
export const DATETIME_FORMAT  = 'YYYY-MM-DD HH:mm:ss'
export const DISPLAY_DATE     = 'DD MMM YYYY'
export const DISPLAY_DATETIME = 'DD MMM YYYY, hh:mm A'

// ── HTTP status codes ─────────────────────────────────────────────────────────
export const HTTP = {
  OK:           200,
  CREATED:      201,
  NO_CONTENT:   204,
  BAD_REQUEST:  400,
  UNAUTHORIZED: 401,
  FORBIDDEN:    403,
  NOT_FOUND:    404,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
}

// ── Notification duration (ms) ────────────────────────────────────────────────
export const TOAST_DURATION = 3000

// ── Feature flags ────────────────────────────────────────────────────────────
// Gates the "Deliverables" step and the Financial Info → Installments section
// on the Project Create/Edit forms. Flip to false to hide both — set to true,
// both show; set to false, neither does.
export const PROJECT_DELIVERABLES = true

// ── Currency amount-in-words suffix ───────────────────────────────────────────
export const AMOUNT_IN_WORDS_SUFFIX = 'Tk Only'






// ── Sidebar nav items ─────────────────────────────────────────────────────────
// Two shapes: a standalone { type: 'link', ... } item, or a { type: 'group', ... }
// item that renders a collapsible header containing its own set of links.
export const NAV_ITEMS = [
  {
    type:       'dashboard-link',
    label:      'Dashboard',
    subtitle:   'Overview & Insights',
    icon:       'layout-grid',
    routeName:  'Dashboard',
    permission: null,
  },

  {
    type:     'group',
    key:      'my-workspace',
    label:    'My Workspace',
    subtitle: 'Your Projects, Tasks & EOD Reports',
    icon:     'layout-grid',
    items: [
      {
        type:  'group',
        key:   'eod-reports',
        label: 'EOD Reports',
        icon:  'ri-file-edit-line',
        items: [
          { label: 'My EOD',     icon: 'ri-file-list-line', routeName: 'MyEODList', permission: null },
          { label: 'Submit EOD', icon: 'ri-edit-2-line',    routeName: 'EODCreate', permission: null },
        ],
      },
      {
        type:  'group',
        key:   'my-projects',
        label: 'My Projects',
        icon:  'ri-file-edit-line',
        items: [
          { label: 'Projects', icon: 'ri-file-list-line', routeName: 'MyProjects', permission: null },
          { label: 'Tasks',    icon: 'ri-edit-2-line',    routeName: 'MyTasks',    permission: null },
        ],
      },
    ],
  },

  {
    type:     'group',
    key:      'operations',
    label:    'Project Management',
    subtitle: 'Projects & EOD Reports',
    icon:     'cube',
    items: [
      {
        type:  'group',
        key:   'project',
        label: 'Project',
        icon:  'ri-folder-line',
        items: [
          { label: 'Projects',           icon: 'ri-folder-3-line',    routeName: 'ProjectList',           permission: 'view_projects' },
          { label: 'Project Tracker',    icon: 'ri-route-line',       routeName: 'ProjectTrackerList',    permission: 'project_tracking' },
          { label: 'Project Types',      icon: 'ri-price-tag-3-line', routeName: 'ProjectTypeList',       permission: 'view_projects' },
          { label: 'Board Templates',    icon: 'ri-layout-grid-line', routeName: 'TaskLabelTemplateList', permission: 'view_projects' },
          { label: 'Archived Projects',  icon: 'ri-archive-line',     routeName: 'ArchivedProjectList',   permission: 'view_projects' },
        ],
      },
      {
        type:  'group',
        key:   'admin-eod-reports',
        label: 'EOD Reports',
        icon:  'ri-file-edit-line',
        items: [
          { label: 'EOD List',  icon: 'ri-file-list-line',    routeName: 'AdminEODList',  permission: 'view_eod' },
          { label: 'EOD Sheet', icon: 'ri-file-chart-2-line', routeName: 'AdminEODSheet', permission: 'view_eod' },
        ],
      },
    ],
  },

  {
    type:     'group',
    key:      'administration',
    label:    'Administration',
    subtitle: 'Approvals, Roles & Audit Trail',
    icon:     'cube',
    items: [
      { label: 'Approval Chain', icon: 'ri-flow-chart',       routeName: 'ApprovalChain',   permission: null },
      { label: 'Designations',   icon: 'ri-shield-user-line', routeName: 'DesignationList', permission: null },
      { label: 'Activity Log',   icon: 'ri-archive-line',     routeName: 'ActivityLog',     permission: null },
    ],
  },

  {
    type:     'group',
    key:      'profile',
    label:    'Profile',
    subtitle: 'Privacy, Security & Account Settings',
    icon:     'cube',
    items: [
      { label: 'Change Password', icon: 'ri-lock-password-line', routeName: 'ChangePassword', permission: null },
    ],
  },
]
