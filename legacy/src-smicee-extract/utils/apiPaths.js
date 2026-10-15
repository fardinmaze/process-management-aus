// Full endpoint map ported from the legacy SMICEE frontend's `api_path.js`.
// `API_HOST` points at the SMICEE backend (not the generic `VITE_API_BASE_URL`
// used by the rest of this template's placeholder REST calls). Every value
// below is an absolute URL, so it can be passed straight to the shared axios
// instance (`@/plugins/axios`) — axios uses an absolute URL as-is and ignores
// its configured `baseURL`, while the auth interceptor still attaches the
// bearer token because it applies to every outgoing request regardless of URL.

export const API_HOST = import.meta.env.VITE_API_HOST || 'https://api-v2.smicee.com'

const host = API_HOST

export const V1API = {
  getAccessToken: host + '/api/authentication/token',
  refreshAccessToken: host + '/api/authentication/token/refresh',
  verifyLogin: host + '/api/authentication/token/verify',

  // Reset Password
  update_password: host + '/api/authentication/change-password',
  email_check: host + '/api/authentication/check-user',
  verify_otp: host + '/api/access-control/reset-password/verify/otp',
  reset_password: host + '/api/authentication/reset-password',
  otp_list: host + '/api/access-control/otp/list',

  create_sms: host + '/client/sms-template/create',
  get_sms: host + '/client/sms-template/get',
  update_sms: host + '/client/sms-template/update/',
  delete_sms: host + '/client/sms-template/delete/',
  telegram_code_generate: host + '/api/telegram/link-code/generate/',

  // My Updates
  get_my_updates: host + '/api/my-updates/refer/list',
  // GET <this><ref_type>?count=&page=& — same list, scoped server-side to a
  // single ref type via a path segment instead of `get_my_updates`'s
  // query-param filter. Used by MyUpdates.vue's top type-tabs.
  get_my_updates_by_type: host + '/api/my-updates/refer/instances/',
  get_my_updates_count: host + '/api/my-updates/unread/count',
  read_my_updates: host + '/api/my-updates/refer/activity/read/',
  get_my_contact: host + '/api/access-control/user-accounts/contact-list',

  // Project
  create_project: host + '/api/project/create',
  edit_project: host + '/api/project/edit/',
  get_project: host + '/api/project/list',
  get_project_tracking_details: host + '/api/project/tracker/details/',
  get_project_paginated: host + '/api/project/pg-list',
  get_project_archived_paginated: host + '/api/project/archived-list',
  make_new_project_lead: host + '/api/project/employee/lead-update',
  update_project_status: host + '/api/project/edit-project-status/',
  update_project: host + '/api/project/edit/',
  get_project_detail: host + '/api/project/details/',
  get_my_project: host + '/api/project/my-list',
  get_my_project_authorized: host + '/api/project/my-list/details/',
  assign_project_employee: host + '/api/project/employee/create',
  get_my_task: host + '/api/project/task/my-list',
  get_my_task_deadline: host + '/api/project/task/my-list/deadline-today',
  delete_teammate_from_projects: host + '/api/project/employee/delete/',
  budget_by_project: host + '/api/budget-management/request/list/by-project/',
  quotation_by_project: host + '/api/quotation/list/by-project/',
  invoice_by_project: host + '/api/invoice/list/by-project/',
  requisition_by_project: host + '/api/finance/requisition/list/by-project/',
  purchase_requisition_by_project: host + '/api/procurement/pr/by-project/',
  purchase_order_by_project: host + '/api/purchase-order/list/by-project/',
  bill_list_by_project: host + '/api/bill/list/by-project/',
  rfp_list_by_project: host + '/api/rfp/list/by-project/',
  update_project_priority: host + '/api/project/edit-priority-status/',
  add_client_to_project: host + '/api/project/client/create',
  delete_client_from_project: host + '/api/project/client/delete/',
  client_list_by_project: host + '/api/project/client/list/by-project/',
  delete_project: host + '/api/project/delete/',
  project_member_list: host + '/api/project/employee/by-project/',
  project_task_member_list: host + '/api/project/task/employee/by-task/',
  get_project_attachment: host + '/api/project/attachment/list-by-project/',
  team_lead_list: host + '/api/project/team-leads/list',

  add_vendor_to_project: host + '/api/project/vendor/create',
  delete_vendor_from_project: host + '/api/project/vendor/delete/',
  vendor_list_by_project: host + '/api/project/vendor/list/by-project/',
  create_project_attachment: host + '/api/project/add-attachment',
  delete_attachment: host + '/api/project/delete-attachment/',
  check_my_password: host + '/api/authentication/check-password',
  check_lead_password: host + '/api/project/lead/password-check',
  project_list_by_employee: host + '/api/project/list/by-employee/',

  project_search: host + '/api/project/list/search',
  my_project_search: host + '/api/project/my-list/search',

  // Project Type
  get_project_type: host + '/api/project/category/list',
  create_project_type: host + '/api/project/category/create',
  edit_project_type: host + '/api/project/category/edit/',
  delete_project_type: host + '/api/project/category/delete/',

  // EOD
  eod_create: host + '/api/eod/create',
  eod_draft_create: host + '/api/eod/draft/create',
  get_my_draft: host + '/api/eod/draft/my-draft',
  eod_draft_edit: host + '/api/eod/draft/edit/',
  eod_draft_delete: host + '/api/eod/draft/delete/',
  get_my_eod_list: host + '/api/eod/my-list',
  get_eod_list_by_employee: host + '/api/eod/list/by-employee/',
  get_all_eod: host + '/api/eod/list',
  get_eod_sheet: host + '/api/eod/summery',
  get_eod_details: host + '/api/eod/details/',
  eod_delete: host + '/api/eod/delete/',
  eod_add_refer: host + '/api/eod/add-refer/',
  eod_delete_refer: host + '/api/eod/delete-refer/',
  get_reply_of_eod: host + '/api/eod/reply/list/by-eod/',
  add_eod_reply: host + '/api/eod/reply/create',
  edit_eod_status: host + '/api/eod/edit-status/',
  eod_completed_task_tickets: host + '/api/eod/completed/task-ticket',

  // Task
  get_task_category: host + '/api/project/task/list/by-project/sort-label/',
  create_task_category: host + '/api/project/tasks/label/create',
  get_task_list: host + '/api/project/task/list/by-project/',
  get_task_details: host + '/api/project/task/details/',
  create_task: host + '/api/project/task/create',
  update_task: host + '/api/project/task/edit/',
  delete_task: host + '/api/project/task/delete/',
  get_sub_task_list: host + '/api/project/task/sub-task/list/',
  assign_task_employee: host + '/api/project/task/employee/create',
  delete_assigned_employee: host + '/api/project/task/employee/delete/',
  create_task_with_label: host + '/api/project/task/create/with/label-name',
  update_task_with_label: host + '/api/project/task/edit-label',
  toggle_task_priority: host + '/api/project/task/edit-priority-status/',
  toggle_subtask_complete_status: host + '/api/project/task/toggle-complete/',
  toggle_task_complete_status: host + '/api/project/task/toggle-complete-status/parent/',
  toogle_subtask_complete: host + '/api/project/task/toggle-complete-status/sub/',
  update_task_label: host + '/api/project/tasks/label/update',
  delete_task_label: host + '/api/project/tasks/label/delete',

  // Task -> Comments
  get_comments: host + '/api/project/task/comments/by-task/',
  create_comment: host + '/api/project/task/comments/create',

  // Task Label Templates (task.txt Part 1) — reusable label presets stamped
  // onto a project at creation via `label_template` on project/create; no
  // link is kept afterwards (editing a template never touches projects
  // already created from it).
  task_label_template_list:   host + '/api/project/task-label-template/list',
  task_label_template_create: host + '/api/project/task-label-template/create',
  task_label_template_edit:   host + '/api/project/task-label-template/edit/',
  task_label_template_delete: host + '/api/project/task-label-template/delete/',

  // Task Time Logs (task.txt Part 2) — one clock-in/clock-out pair per user
  // per task. Clock-in/out are GET with no body (user comes from the JWT,
  // task from the URL).
  task_clock_in:          host + '/api/project/task/clock-in/',
  task_clock_out:         host + '/api/project/task/clock-out/',
  task_timer_running:     host + '/api/project/task/timer/running',
  task_time_logs_by_task: host + '/api/project/task/time-logs/by-task/',
  task_time_log_delete:   host + '/api/project/task/time-logs/delete/',
  project_time_summary:   host + '/api/project/time-summary/by-project/',

  // Project report screen (task.txt Part 2B) — Task Progress / Employee
  // Logged Time tables on the project's Team Management tab. NOTE: both take
  // the project's human-readable `project_id` STRING (e.g. "PRO-CB-000012"),
  // NOT the numeric pk that project_time_summary above uses.
  project_task_progress:     host + '/api/project/task-progress/by-project/',
  project_employee_time_log: host + '/api/project/employee-time-log/by-project/',

  // Project History timeline — the header's "Quick View" button on
  // ProjectDetails.vue (everything that happened on the project, written
  // automatically by the normal endpoints). Takes the numeric project pk
  // (<int:project_id>), unlike task-progress/employee-time-log above which
  // take the project_id string.
  project_activity_log: host + '/api/project/activity-log/by-project/',

  // Project Activity (the diary) — PROJECT_ACTIVITY_API.md Part 1. User-typed
  // calls/emails/messages/meetings/comments/next-actions, shown on the
  // project's own "Activity Log" tab (distinct from the read-only History
  // timeline above). All take/return the numeric project pk.
  project_activity_create:      host + '/api/project/activity/create/',
  project_activity_by_project:  host + '/api/project/activity/by-project/',
  project_activity_edit:        host + '/api/project/activity/edit/',
  project_activity_toggle_done: host + '/api/project/activity/toggle-done/',
  project_activity_delete:      host + '/api/project/activity/delete/',

  // Client
  create_company: host + '/api/client/company/create',
  get_company: host + '/api/client/company/list',
  get_company_paginated: host + '/api/client/company/pg-list',
  edit_company: host + '/api/client/company/edit/',
  delete_company: host + '/api/client/company/delete/',
  create_client: host + '/api/client/create',
  get_client: host + '/api/client/list',
  get_client_without_pg: host + '/api/client/list-short',
  get_client_by_company: host + '/api/client/list-short/by-company/',
  delete_client: host + '/api/client/delete/',
  client_details: host + '/api/client/details/',
  company_details: host + '/api/client/company/details/',
  client_by_user_id: host + '/api/client/details-short/',
  update_client: host + '/api/client/edit/',
  get_company_stats: host + '/api/client/company/stats',

  // Sales Representative
  create_sales_rep: host + '/api/client/salesrep/create',
  get_sales_rep_paginated: host + '/api/client/salesrep',
  delete_sales_rep: host + '/api/client/salesrep/',
  edit_sales_rep: host + '/api/client/salesrep/',
  get_sales_rep_withoutpg: host + '/api/client/salesrep-short ',

  // Vendor Contact
  create_vendor: host + '/api/vendor/create',
  get_vendor: host + '/api/vendor/list',
  get_vendor_without_pg: host + '/api/vendor/list-short',
  delete_vendor: host + '/api/vendor/delete/',
  vendor_edit: host + '/api/vendor/edit/',
  toggle_vendor_status: host + '/api/vendor/toggle-status/',
  venodr_details: host + '/api/vendor/details/',
  vendor_by_user_id: host + '/api/vendor/details-short/',

  vendor_contact_create: host + '/api/vendor/contact-book/create',
  vendor_contact_edit: host + '/api/vendor/contact-book/edit/',
  get_vendor_contact: host + '/api/vendor/contact-book/list',
  delete_vendor_contact: host + '/api/vendor/contact-book/delete/',
  vendor_contact_label_create: host + '/api/vendor/contact-book/label/create',
  venodr_contact_label_lists: host + '/api/vendor/contact-book/labels/list',
  vendor_contact_label_delete: host + '/api/vendor/contact-book/delete-label/',
  vendor_contact_label_add: host + '/api/vendor/contact-book/add-label/',
  vendor_label_delete: host + '/api/vendor/contact-book/label/delete/',

  add_vendor_category: host + '/api/vendor/category/create',
  edit_vendor_category: host + '/api/vendor/category/edit/',
  delete_vendor_category: host + '/api/vendor/category/delete/',
  get_vendor_categories: host + '/api/vendor/category/list',

  vendor_request_for_quotation: host + '/api/rfp/vendor-quotation/create',
  vendor_rfq_list: host + '/api/rfp/list/by-vendor',

  project_list_by_vendor: host + '/api/project/list/by-vendor/',
  vendor_project_details: host + '/api/project/details/by-vendor/',
  vendor_purchase_order_by_project: host + '/api/purchase-order/list/by-project-vendor/',
  vendor_bill_by_project: host + '/api/bill/list/by-project-vendor/',

  po_list_by_vendor: host + '/api/purchase-order/list/by-vendor',
  accept_vendor_po: host + '/api/purchase-order/vendor-accept/',
  reject_vendor_po: host + '/api/purchase-order/vendor-reject/',
  grn_list_by_vendor: host + '/api/procurement/grn/po/',
  bill_list_by_vendor: host + '/api/bill/list/by-vendor',
  add_vendor_documents: host + '/api/access-control/user-accounts/admin/add-attachment',

  // CRM - Dashboard
  get_crm_dashboard_stats: host + '/api/client/dashboard/stats/',
  get_crm_dashboard_today_activity: host + '/api/client/dashboard/today-activity/',
  get_crm_dashboard_upcoming_work: host + '/api/client/dashboard/upcoming-work/',
  get_crm_dashboard_pipeline: host + '/api/client/dashboard/pipeline-by-stage/',

  // Lead
  create_lead: host + '/api/client/leads/create',
  create_bulk_lead: host + '/api/client/leads/bulk-upload',
  get_lead: host + '/api/client/leads/list',
  delete_lead: host + '/api/client/leads/delete/',
  edit_lead: host + '/api/client/leads/edit/',
  get_lead_details: host + '/api/client/lead/details/',
  lead_update_info: host + '/api/client/lead/',
  get_lead_stats: host + '/api/client/leads/stats',
  add_lead_activity: host + '/api/client/lead/',
  view_lead_activity: host + '/api/client/lead/',
  get_all_lead_activity: host + '/api/client/lead/activity/all/',
  lead_health_status_update: host + '/api/client/lead/',

  // Lead -> Label
  create_label: host + '/api/client/leads/label/create',
  get_label: host + '/api/client/leads/labels/list',
  delete_label: host + '/api/client/leads/label/delete/',
  add_label_to_lead: host + '/api/client/leads/add-label/',
  delete_label_from_lead: host + '/api/client/leads/delete-label/',

  // Lead -> Note
  create_lead_note: host + '/api/client/lead/',
  lead_notes: host + '/api/client/lead/',
  edit_lead_note: host + '/api/client/note/',
  delete_lead_note: host + '/api/client/note/',

  // Opportunity
  get_opportunity_kanban: host + '/api/client/opportunity/kanban/',

  // Deal Room
  get_dealroom_kanban: host + '/api/client/dealroom/kanban/',
  get_dealroom_stats: host + '/api/client/dealroom/stats/',

  // CRM -> Targets
  get_targets_state: host + '/api/client/target/stats/',
  get_targets_table: host + '/api/client/target/table/',
  target_create: host + '/api/client/target/create/',
  target_bulk_update: host + '/api/client/target/bulk-update/',

  // Lead -> Next action
  create_lead_next_action: host + '/api/client/lead/',
  lead_next_actions: host + '/api/client/lead/',
  edit_next_action: host + '/api/client/action/',
  delete_next_action: host + '/api/client/action/',
  toggle_next_action: host + '/api/client/action/',

  // Lead -> File Upload
  add_file_lead: host + '/api/client/lead/',
  lead_file_list: host + '/api/client/lead/',
  delete_lead_file: host + '/api/client/file/',

  // Items
  create_item: host + '/api/item/create',
  get_item: host + '/api/item/list-short',
  get_item_with_pagination: host + '/api/item/list',
  delete_item: host + '/api/item/delete/',
  edit_item: host + '/api/item/edit/',

  // Holiday
  create_holiday: host + '/api/holiday/create',
  get_holiday: host + '/api/holiday/list',
  delete_holiday: host + '/api/holiday/delete/',
  edit_holiday: host + '/api/holiday/edit/',

  // Announcement
  get_announcement:    host + '/api/announcement/list/',
  create_announcement: host + '/api/announcement/create/',
  edit_announcement:   host + '/api/announcement/edit/',
  delete_announcement: host + '/api/announcement/delete/',
  dismiss_announcement: host + '/api/announcement/dismiss/',

  // RFP
  create_rfp_category: host + '/api/rfp/category/create',
  get_rfp_category: host + '/api/rfp/category/list',
  delete_rfp_category: host + '/api/rfp/category/delete/',

  create_rfp: host + '/api/rfp/create',
  get_rfp: host + '/api/rfp/list',
  get_rfp_list_by_category: host + '/api/rfp/list/by-category/',

  get_rfp_by_search: host + '/api/rfp/search/list',

  delete_rfp: host + '/api/rfp/delete/',
  get_rfp_details: host + '/api/rfp/details/',
  edit_rfp: host + '/api/rfp/edit/',
  rfp_active_status_toggle: host + '/api/rfp/toggle-status/',

  get_rfp_form: host + '/api/rfp/form/by-rfp/',
  create_rfp_form: host + '/api/rfp/form/create',
  submit_rfp_form: host + '/api/rfp/form/submission/create',
  delete_rfp_form_responses: host + '/api/rfp/form/submission/delete/',
  get_rfp_form_responses: host + '/api/rfp/form/submission/by-form/',
  rfp_list_user_submitted_form_only: host + '/api/rfp/list/user-submitted',
  rfp_response_by_form: host + '/api/rfp/form/submission/by-form/by-user/',
  rfp_submission_label_add: host + '/api/rfp/form/submission/label/create',
  rfp_submission_label_delete: host + '/api/rfp/form/submission/label/delete/',
  rfp_submission_label_list: host + '/api/rfp/form/submission/labels/list',
  rfp_submission_add_label: host + '/api/rfp/submission/add-label/',
  rfp_submission_delete_label: host + '/api/rfp/submission/delete-label/',
  rfp_submission_details: host + '/api/rfp/form/submission/detail/',
  rfp_submission_reply_create: host + '/api/rfp/submission/reply/create',
  get_rfp_submission_reply: host + '/api/rfp/submission/reply/list/by-submission/',
  update_rfp_status: host + '/api/rfp/edit-status/',
  assign_vendor_by_rfp_form_response: host + '/api/rfp/rfp/',
  rfp_response_comparison: host + '/api/rfp/rfp/',

  // Finance -> Quotation
  create_quotation: host + '/api/quotation/create',
  get_quotation: host + '/api/quotation/list',
  get_quotation_withoutpg: host + '/api/quotation/list-short',
  delete_quotation: host + '/api/quotation/delete/',
  edit_quotation: host + '/api/quotation/edit/',
  get_quotation_details: host + '/api/quotation/details/primary/',
  quotation_add_attachment: host + '/api/quotation/add-attachment',
  quotation_delete_attachment: host + '/api/quotation/delete-attachment/',
  create_quotation_branch: host + '/api/quotation/revise/',
  update_quotation_status: host + '/api/quotation/update-status/',

  // Invoice
  create_invoice: host + '/api/invoice/create',
  get_invoice: host + '/api/invoice/list',
  delete_invoice: host + '/api/invoice/delete/',
  edit_invoice: host + '/api/invoice/edit/',
  edit_invoice_status: host + '/api/invoice/edit/',
  invoice_approval_status_change: host + '/api/invoice/edit-approval-status/',
  // Approval-chain aware approve/reject (body: { comment }) — work with or
  // without a chain enabled for INVOICE. Refer is notify-only (body: { refer_id }).
  invoice_approve: host + '/api/invoice/approve/',
  invoice_reject: host + '/api/invoice/reject/',
  invoice_add_refer: host + '/api/invoice/add-refer/',
  invoice_delete_refer: host + '/api/invoice/delete-refer/',
  get_invoice_details: host + '/api/invoice/details/',
  invoice_attachment_add: host + '/api/invoice/add-attachment',
  invoice_attachment_delete: host + '/api/invoice/delete-attachment/',
  record_invoice_payment: host + '/api/invoice/payments/create',
  invocie_payment_list_by_invoice: host + '/api/invoice/payments/list-by-invoice/',
  invoice_payment_list_status_change: host + '/api/invoice/payments/edit-status/',
  invocie_payments: host + '/api/invoice/payments/list',
  invocie_payments_pg: host + '/api/invoice/payments',
  delete_invoice_payments: host + '/api/invoice/payments/delete/',

  // Purchase Order
  create_purchase_order: host + '/api/purchase-order/create',
  get_purchase_order: host + '/api/purchase-order/list',
  get_purchase_order_withoutpg: host + '/api/purchase-order/list/dropdown',
  delete_purchase_order: host + '/api/purchase-order/delete/',
  edit_purchase_order: host + '/api/purchase-order/edit/',
  get_purchase_order_details: host + '/api/purchase-order/details/primary/',
  add_po_attachment: host + '/api/purchase-order/add-attachment',
  delete_po_attachment: host + '/api/purchase-order/delete-attachment/',
  purchase_order_add_reply: host + '/api/purchase-order/reply/create',
  get_replies_of_po: host + '/api/purchase-order/reply/list/by-po/',
  submit_purchase_order: host + '/api/purchase-order/submit/',
  approve_purchase_order: host + '/api/purchase-order/approve/',
  reject_purchase_order: host + '/api/purchase-order/reject/',

  // Bill
  create_bill: host + '/api/bill/create',
  get_bill: host + '/api/bill/list',
  delete_bill: host + '/api/bill/delete/',
  edit_bill: host + '/api/bill/edit/',
  bill_approval_status_change: host + '/api/bill/edit-approval-status/',
  // Approval-chain aware approve/reject (body: { comment }) — refuse
  // procurement bills, which keep their own procurement/<pk>/approve|reject.
  bill_approve: host + '/api/bill/approve/',
  bill_reject: host + '/api/bill/reject/',
  bill_add_refer: host + '/api/bill/add-refer/',
  bill_delete_refer: host + '/api/bill/delete-refer/',
  get_bill_details: host + '/api/bill/details/primary/',
  // Non-primary detail — the only bill detail shape that includes `refering_to`.
  get_bill_refer_details: host + '/api/bill/details/',
  add_bill_attachment: host + '/api/bill/add-attachment',
  delete_bill_attahment: host + '/api/bill/delete-attachment/',
  record_bill_payment: host + '/api/bill/payments/create',
  bill_payment_list_by_bill: host + '/api/bill/payments/list-by-bill/',
  bill_payment_list_status_change: host + '/api/bill/payments/edit-status/',
  bill_payments: host + '/api/bill/payments/list',
  bill_payments_pg: host + '/api/bill/payments',
  delete_bill_payments: host + '/api/bill/payments/delete/',
  bill_add_reply: host + '/api/bill/reply/create',
  get_replies_of_bill: host + '/api/bill/reply/list/by-bill/',
  bill_by_procurement_prefill_grns: host + '/api/bill/procurement/prefill',
  create_bill_procurement: host + '/api/bill/procurement/create',

  // Accounts -> Category
  create_account_category: host + '/api/finance/category/create',
  get_account_category: host + '/api/finance/category/list',
  get_account_category_pagination: host + '/api/finance/category',
  delete_account_category: host + '/api/finance/category/delete',
  edit_account_category: host + '/api/finance/category/edit',
  edit_account_serial_category: host + '/api/finance/category',

  // group
  create_account_group: host + '/api/finance/group/create',
  get_account_group: host + '/api/finance/group/list',
  get_account_group_pagination: host + '/api/finance/group',
  get_account_group_by_category: host + '/api/finance/group/list/by-category',
  delete_account_group: host + '/api/finance/group/delete',
  edit_account_group: host + '/api/finance/group/edit',

  // ledger
  create_account_ledger: host + '/api/finance/ledger/create',
  get_account_ledger: host + '/api/finance/ledger/list',
  get_account_ledger_pagination: host + '/api/finance/ledger',
  get_account_ledger_details: host + '/api/finance/ledger/details',
  get_account_ledger_by_group: host + '/api/finance/ledger/list/post/by-group',
  delete_account_ledger: host + '/api/finance/ledger/delete',
  edit_account_ledger: host + '/api/finance/ledger/edit',

  // transaction Labels
  create_account_label: host + '/api/finance/label/create',
  get_account_label: host + '/api/finance/label/list',
  get_account_label_pagination: host + '/api/finance/label',
  delete_account_label: host + '/api/finance/label/delete',
  edit_account_label: host + '/api/finance/label/edit',
  get_account_label_details_pagination: host + '/api/finance/label/details',
  // note
  create_account_note: host + '/api/finance/note/create',
  get_account_note: host + '/api/finance/note/list',
  get_account_note_pagination: host + '/api/finance/note',
  get_account_note_details: host + '/api/finance/note/details',
  delete_account_note: host + '/api/finance/note/delete',
  edit_account_note: host + '/api/finance/note/edit',
  note_add_ledger: host + '/api/finance/notes/add-ledger/element',
  note_delete_ledger: host + '/api/finance/notes/delete-ledger/element',

  // Transaction
  record_transaction: host + '/api/finance/transaction/create',
  get_transactions: host + '/api/finance/transaction/list/detailed',
  get_transactions_pagination: host + '/api/finance/transaction/list/detailed/list',
  update_transactions_note: host + '/api/finance/transaction/edit/',
  get_transactions_by_ledger: host + '/api/finance/transaction/by-ledger',
  get_transactions_by_jid: host + '/api/finance/transaction/list/detailed/by-id',
  get_trial_balance: host + '/api/finance/trial-balance',

  // incomeStructure
  income_structure: host + '/api/finance/income-statement/ledger/by-element',
  income_structure_list: host + '/api/finance/income-statement/ledger/list',
  income_structure_add_ledger: host + '/api/finance/income-statement/add-ledger/element',
  income_structure_delete_ledger: host + '/api/finance/income-statement/delete-ledger/element',
  income_statement: host + '/api/finance/income-statement/details',
  income_statement_calculated: host + '/api/finance/income-statement/calculated',

  // balanceSheet
  balance_sheet_element_structure: host + '/api/finance/balance-sheet/element/list',
  balance_sheet: host + '/api/finance/balance-sheet/details',

  // Budget
  create_budget_category: host + '/api/budget-management/category/create',
  request_budget: host + '/api/budget-management/request/create',
  request_budget_update: host + '/api/budget-management/request/edit',
  get_budget_requests: host + '/api/budget-management/request/list',
  get_budget_requests_pagination: host + '/api/budget-management/request',
  get_budget_category: host + '/api/budget-management/category/list',
  delete_budget_category: host + '/api/budget-management/category/delete',
  edit_budget_category: host + '/api/budget-management/category/edit',
  add_refer_to_budget: host + '/api/budget-management/request/add-refer/',
  delete_refer_from_budget: host + '/api/budget-management/request/delete-refer/',
  get_budget_reply: host + '/api/budget-management/request/reply/list/by-br/',
  budget_reply_add: host + '/api/budget-management/request/reply/create',
  budget_request_detail: host + '/api/budget-management/request/details/',

  // Requisition
  create_requisition: host + '/api/finance/requisition/create',
  get_requisition: host + '/api/finance/requisition/list',
  get_requisition_csv: host + '/api/finance/requisitions/export/csv/',
  delete_requisition: host + '/api/finance/requisition/delete/',
  edit_requisition: host + '/api/finance/requisition/edit/',
  edit_requisition_status: host + '/api/finance/requisition/edit-status',
  requisition_approve: host + '/api/finance/requisition/approve/',
  requisition_reject: host + '/api/finance/requisition/reject/',
  get_requisition_details: host + '/api/finance/requisition/details/',
  requisition_add_attachment: host + '/api/finance/requisition/add-attachment',
  requisition_delete_attachment: host + '/api/finance/requisition/delete-attachment/',
  my_requisition: host + '/api/finance/requisition/my-list',
  requisition_add_refer: host + '/api/finance/requisition/request/add-refer/',
  requisition_delete_refer: host + '/api/finance/requisition/request/delete-refer/',
  get_reply_of_req: host + '/api/finance/requisition/reply/list/by-req/',
  add_req_reply: host + '/api/finance/requisition/reply/create',
  settlement_requistion_create: host + '/api/finance/requisition-settlement/create',
  settlement_list: host + '/api/finance/requisition-settlement/by-requisition/',

  add_requisition_type: host + '/api/finance/requisition/type/create',
  delete_requisition_type: host + '/api/finance/requisition/type/delete/',
  requisition_type_list: host + '/api/finance/requisition/type/list',
  update_requisition_type: host + '/api/finance/requisition/type/update/',
  settlement_approval: host + '/api/finance/requisition-settlement/update-status/',

  requisition_summary: host + '/api/finance/requisitions/advance/summary/',
  requisition_summary_by_project: host + '/api/finance/requisition/summary/by-project/',
  requisition_summary_by_user: host + '/api/finance/requisition/summary/by-user/',

  // Requisition Record Payment
  requisition_record_payment: host + '/api/finance/requisition/payments/create',
  requisition_payment_list_by_requisition: host + '/api/finance/requisition/payments/list-by-requisition/',
  requisition_payemnt_list_status_change: host + '/api/finance/requisition/payments/edit-status/',
  requisition_payments: host + '/api/finance/requisition/payments/list',
  requisition_payments_withpg: host + '/api/finance/requisition/payments',
  delete_requisition_payments: host + '/api/finance/requisition/payments/delete/',

  // Banking Details
  bank_list: host + '/api/finance/bank-info/list',
  active_bank_list: host + '/api/finance/bank-info/list-active',
  bank_create: host + '/api/finance/bank-info/create',
  bank_details: host + '/api/finance/bank-info/details/',
  edit_bank: host + '/api/finance/bank-info/edit/',
  bank_delete: host + '/api/finance/bank-info/delete/',
  toggle_active: host + '/api/finance/bank-info/toggle-status/',
  bank_add_attachment: host + '/api/finance/bank-info/add-attachment',
  bank_delete_attachment: host + '/api/finance/bank-info/delete-attachment/',

  // user list
  user_list: host + '/api/authentication/user/list',

  // HR & Admin -> TimeSheet / PUNCH
  employee_punch: host + '/api/access-control/user-accounts/punch',
  latest_timesheet: host + '/api/access-control/user-accounts/time-sheet/today/latest',
  time_sheet_summary: host + '/api/access-control/user-accounts/time-sheet/summary',
  fetch_attendances: host + '/api/access-control/user-accounts/time-sheet/monthly-summary',
  work_history_time_sheet_by_id: host + '/api/access-control/user-accounts/time-sheet/dates/',
  details_time_sheet_by_date_and_id: host + '/api/access-control/user-accounts/time-sheet/',

  // Compliance
  create_compliance: host + '/api/compliance/create',
  get_compliance: host + '/api/compliance/list/short',
  get_compliance_withpg: host + '/api/compliance/list',
  delete_compliance: host + '/api/compliance/delete/',
  edit_compliance: host + '/api/compliance/edit/',
  compliance_details: host + '/api/compliance/details/',
  create_compliance_form: host + '/api/compliance/form/create',
  get_compliance_form: host + '/api/compliance/form/by-compliance/',
  submit_compliance_form: host + '/api/compliance/form/submission/create',
  get_compliance_form_responses: host + '/api/compliance/form/submission/by-form/',
  delete_compliance_form_response: host + '/api/compliance/form/submission/delete/',
  get_compliance_form_list: host + '/api/compliance/form',

  // Policy
  create_policy: host + '/api/policy/create',
  get_policy: host + '/api/policy/list/short',
  get_policy_withpg: host + '/api/policy/list',
  delete_policy: host + '/api/policy/delete/',
  edit_policy: host + '/api/policy/edit/',
  policy_details: host + '/api/policy/details/',
  create_policy_form: host + '/api/policy/form/create',
  get_policy_form: host + '/api/policy/form/by-policy/',
  get_policy_form_detail: host + '/api/policy/form/detail/',
  submit_policy_form: host + '/api/policy/form/submission/create',
  get_policy_form_responses: host + '/api/policy/form/submission/by-form/',
  delete_policy_form_responses: host + '/api/policy/form/submission/delete/',
  get_policy_form_list: host + '/api/policy/form',

  // Policy Compliance — unified model (supersedes Policy/PolicyForm above,
  // see POLICY_COMPLIANCE_API.md). No trailing slash on any of these
  // (APPEND_SLASH = False on this app).
  policy_compliance_list: host + '/api/policy-compliance/list',
  policy_compliance_profile_list: host + '/api/policy-compliance/profile-list',
  policy_compliance_details: host + '/api/policy-compliance/details/',
  policy_compliance_create: host + '/api/policy-compliance/create',
  policy_compliance_update: host + '/api/policy-compliance/update/',
  policy_compliance_delete: host + '/api/policy-compliance/delete/',
  policy_compliance_revisions: host + '/api/policy-compliance/revisions/',

  policy_compliance_attachment_create: host + '/api/policy-compliance/attachment-create',
  policy_compliance_attachment_delete: host + '/api/policy-compliance/attachment-delete/',

  policy_compliance_submissions: host + '/api/policy-compliance/submissions',
  policy_compliance_submission_details: host + '/api/policy-compliance/submission-details/',
  policy_compliance_submission_create: host + '/api/policy-compliance/submission-create',
  policy_compliance_submission_edit: host + '/api/policy-compliance/submission-edit/',
  policy_compliance_submission_approve_toggle: host + '/api/policy-compliance/submission-approve-toggle/',
  policy_compliance_submission_delete: host + '/api/policy-compliance/submission-delete/',
  policy_compliance_submission_by_form: host + '/api/policy-compliance/submission-by-form/',
  policy_compliance_submission_by_form_by_user: host + '/api/policy-compliance/submission-by-form-by-user/',

  // Grievance
  create_grievance: host + '/api/grievance/create',
  update_grievance: host + '/api/grievance/edit/',
  get_grievance: host + '/api/grievance/list',
  get_archive_grievance: host + '/api/grievance/list/archived',
  delete_grievance: host + '/api/grievance/delete/',
  add_refer_to_grievance: host + '/api/grievance/add-refer/',
  delete_refer_to_grievance: host + '/api/grievance/delete-refer/',
  get_replies_of_grievance: host + '/api/grievance/reply/list/by-grievance/',
  add_grievance_reply: host + '/api/grievance/reply/create',
  update_grievance_status: host + '/api/grievance/edit-status',
  grievance_details: host + '/api/grievance/details/',

  // Leave Type
  create_leave_type: host + '/api/leave/type/create',
  update_leave_type: host + '/api/leave/type/edit/',
  get_leave_type_list: host + '/api/leave/type/list',
  delete_leave_type: host + '/api/leave/type/delete/',
  update_leave_status: host + '/api/leave/edit-status',
  add_refer_to_leave: host + '/api/leave/add-refer/',
  delete_refer_to_leave: host + '/api/leave/delete-refer/',
  get_replies_of_leave: host + '/api/leave/reply/list/by-leave/',
  add_leave_reply: host + '/api/leave/reply/create',
  get_remaining_leave: host + '/api/leave/remaining-days',
  leave_approve: host + '/api/leave/approve/',
  leave_reject: host + '/api/leave/reject/',
  leave_detail: host + '/api/leave/details/',
  get_leave_employee: host + '/api/leave/application/list/by-employee/',
  delete_leave_request: host + '/api/leave/delete/',
  leave_remaining_user: host + '/api/leave/admin-dash/remaining-days/',
  leave_create_by_admin: host + '/api/leave/create/by-admin',

  // Payroll
  get_payroll_items: host + '/api/payroll/item/list',
  create_payroll_item: host + '/api/payroll/item/create',
  edit_payroll_item: host + '/api/payroll/item/edit/',
  delete_payroll_item: host + '/api/payroll/item/delete/',
  get_inclusive_payroll_items: host + '/api/payroll/item/list/by-status/INCLUSIVE',
  get_deductive_payroll_items: host + '/api/payroll/item/list/by-status/DEDUCTIVE',

  get_payroll_sheet: host + '/api/payroll/payroll-sheet/list',
  finalise_payroll_sheet: host + '/api/payroll/payroll-sheet/finalize/',
  generate_payroll_sheet: host + '/api/payroll/payroll-sheet/generate',
  get_payroll_sheet_detail: host + '/api/payroll/payroll-sheet-entry/list/',

  get_payroll_slip: host + '/api/payroll/payroll-slip/list',
  get_my_payroll_slip: host + '/api/payroll/payroll-slip/my-slips',

  get_designation_payroll: host + '/api/payroll/designation-payroll/list',
  create_designation_payroll: host + '/api/payroll/designation-payroll/create',
  edit_designation_payroll: host + '/api/payroll/designation-payroll/edit/',
  delete_designation_payroll: host + '/api/payroll/designation-payroll/delete/',

  create_disbursement: host + '/api/payroll/disbursement-sheet/create',
  add_entry_in_disbursement: host + '/api/payroll/disbursement-entry/add/',
  disbursement_sheet_list: host + '/api/payroll/disbursement-sheet-entry/list/',
  disbursement_sheet_detail: host + '/api/payroll/disbursement-sheet/detail/',
  approve_disbursement_sheet: host + '/api/payroll/disbursement-sheet/approve/',
  disbursement_toggle: host + '/api/payroll/disbursement-sheet/',

  get_employee_payroll: host + '/api/payroll/employee-payroll/list',
  create_employee_payroll: host + '/api/payroll/employee-payroll/create',
  edit_employee_payroll: host + '/api/payroll/employee-payroll/edit/',
  delete_employee_payroll: host + '/api/payroll/employee-payroll/delete/',
  get_payroll_by_designation: host + '/api/payroll/designation-payroll/list/by-designation/',
  get_payroll_details: host + '/api/payroll/employee-payroll/details/',
  get_payroll_history: host + '/api/payroll/employee-payroll/history/',
  toggle_payroll_active: host + '/api/payroll/employee-payroll/toggle-active/',

  // Organization -> Department
  get_all_departments: host + '/api/access-control/departments',
  create_department: host + '/api/access-control/departments/create',
  update_department: host + '/api/access-control/departments/edit/',
  delete_department: host + '/api/access-control/departments/delete/',
  designation_by_department: host + '/api/access-control/designations/by-department/',
  user_accounts_by_designation: host + '/api/access-control/user-accounts/short-list',

  // Designations
  get_all_designations: host + '/api/access-control/designations',
  create_designation: host + '/api/access-control/designations/create',
  update_designation: host + '/api/access-control/designations/edit/',
  delete_designaton: host + '/api/access-control/designations/delete/',
  get_designation_by_depratment: host + '/api/access-control/designations/by-department/',
  designation_permission: host + '/api/access-control/designation-permission',
  toggle_designation_permission: host + '/api/access-control/designation-permission-toggle',

  // Employee
  get_all_employee: host + '/api/access-control/user-accounts',
  get_all_employee_optimised: host + '/api/access-control/user-accounts/short-list',
  get_all_employee_withpg: host + '/api/access-control/user-accounts/list',
  employee_details: host + '/api/access-control/user-accounts/employee-info/',
  create_employee: host + '/api/access-control/user-accounts/create',
  update_employee_information: host + '/api/access-control/user-accounts/edit/full/',
  update_employee_delete: host + '/api/access-control/user-accounts/delete',
  my_employee_details: host + '/api/access-control/user-accounts/my-details',
  employee_add_attachment: host + '/api/access-control/user-accounts/add-attachment',
  employee_delete_attachment: host + '/api/access-control/user-accounts/delete-attachment/',
  toggle_employee_active: host + '/api/access-control/user-accounts/status-toggle/',
  create_bank_info: host + '/api/access-control/bank-detail/create',
  get_bank_details_by_employee: host + '/api/access-control/bank-detail/details/',

  // Leave Apply
  get_all_leave_list: host + '/api/leave/list',
  get_my_leave_list: host + '/api/leave/application/my-list',
  get_todays_leaves_count: host + '/api/leave/count/today',
  apply_leave: host + '/api/leave/apply',
  update_leave: host + '/api/leave/edit/',
  delete_leave_apply: host + '/api/leave/delete/',
  get_holidays: host + '/api/org-settings/holidays',
  get_leave_history: host + '/api/leave/history/list/by-employee/',
  leave_history_delete: host + '/api/leave/history/delete/',

  // Trainer
  get_all_trainer: host + '/api/training/trainer/list',
  get_all_trainer_without_pg: host + '/api/training/trainer/list/short',
  create_trainer: host + '/api/training/trainer/create',
  update_trainer: host + '/api/training/trainer/edit/',
  delete_trainer: host + '/api/training/trainer/delete/',
  toggle_trainer_status: host + '/api/training/trainer/toggle-status/',

  // Training
  get_training_lits: host + '/api/training/list',
  create_training: host + '/api/training/create',
  update_training: host + '/api/training/edit/',
  delete_training: host + '/api/training/delete/',
  toggle_training_status: host + '/api/training/toggle-status/',
  assign_employee_training: host + '/api/training/employee/create',
  delete_assign_employee: host + '/api/training/employee/delete/',
  get_my_trainings: host + '/api/training/my-list',

  // Training Type
  get_training_type: host + '/api/training/type/list',
  get_training_type_without_pg: host + '/api/training/type/list/short',
  create_training_type: host + '/api/training/type/create',
  update_training_type: host + '/api/training/type/edit/',
  delete_training_type: host + '/api/training/type/delete/',
  toggle_training_type_status: host + '/api/training/type/toggle-status/',

  // Ticket
  get_ticket: host + '/api/ticket/list',
  get_my_ticket: host + '/api/ticket/list/by-user',
  create_ticket: host + '/api/ticket/create',
  edit_ticket: host + '/api/ticket/edit/',
  delete_ticket: host + '/api/ticket/delete/',
  update_ticket_status: host + '/api/ticket/edit-ticket-status/',
  update_ticket_priority: host + '/api/ticket/edit-priority-status/',
  get_refer_ticket: host + '/api/ticket/list/refered',
  add_refer_to_ticket: host + '/api/ticket/add-refer/',
  delete_refer_to_ticket: host + '/api/ticket/delete-refer/',
  get_ticket_details: host + '/api/ticket/details/',
  get_ticket_list_employee: host + '/api/ticket/list/refered/by-employee/',

  // Activity Log
  get_activity_log: host + '/api/activity/list',

  // Asset
  create_asset: host + '/api/assets/create',
  create_new_lot: host + '/api/assets/lot/',
  update_asset: host + '/api/assets/edit/',
  asset_details: host + '/api/assets/details/',
  asset_lot: host + '/api/assets/lot/',
  get_asset_list: host + '/api/assets/new/list',
  delete_asset: host + '/api/assets/delete/',
  get_my_asset: host + '/api/assets/allocation/my-list',
  asset_allocation_list: host + '/api/assets/allocation/list',
  asset_allocation_delete: host + '/api/assets/allocation/delete/',
  asset_allocation_create: host + '/api/assets/allocation/create',
  asset_allocation_status_update: host + '/api/assets/allocation/edit-status/',

  asset_add_attachment: host + '/api/assets/add-attachment',
  asset_delete_attachment: host + '/api/assets/delete-attachment/',
  get_employee_asset: host + '/api/assets/allocation/by-employee/',

  create_asset_type: host + '/api/assets/type/create',
  get_asset_type: host + '/api/assets/type/list',
  update_asset_type: host + '/api/assets/type/edit/',
  delete_asset_type: host + '/api/assets/type/delete/',

  // Job
  job_create: host + '/api/job/create',
  get_job_list: host + '/api/job/list',
  get_job_count: host + '/api/job/count',
  get_job_details: host + '/api/job/details/',
  update_job: host + '/api/job/edit/',
  delete_job: host + '/api/job/delete/',
  update_job_status: host + '/api/job/edit-job-status/',
  get_job_form: host + '/api/job/form/by-job/',
  create_job_form: host + '/api/job/form/create',
  add_job_category: host + '/api/job/category/create',
  edit_job_category: host + '/api/job/category/edit/',
  get_job_categories: host + '/api/job/category/list',
  delete_job_category: host + '/api/job/category/delete/',
  job_submit_form: host + '/api/job/applicant/form/submission/create',
  get_job_form_responses: host + '/api/job/applicant/form/submission/by-form/',
  delete_job_form_responses: host + '/api/job/applicant/form/submission/delete/',
  job_submission_details: host + '/api/job/applicant/form/submission/detail/',

  // Applicant Labels
  create_applicant_label: host + '/api/job/applicant/label/create',
  get_applicant_label: host + '/api/job/applicant/labels/list',
  delete_applicant_label: host + '/api/job/applicant/label/delete/',

  add_label_to_applicant: host + '/api/job/applicant/add-label/',
  delete_applicant_from_label: host + '/api/job/applicant/delete-label/',

  // Candidate
  create_candidate: host + '/api/job/candidate/register',

  // Applicants
  create_applicant: host + '/api/job/applicant/create',
  get_user_applicant_list: host + '/api/job/applicant/application/list',
  get_applicant_list_by_job: host + '/api/job/applicant/by-job/list/',
  get_applicant: host + '/api/job/applicant/list',
  get_applicant_details: host + '/api/job/applicant/details/',

  // Ticket Reply
  get_ticket_reply: host + '/api/ticket/reply/list',
  get_replies_of_ticket: host + '/api/ticket/reply/list/by-ticket/',
  add_ticket_reply: host + '/api/ticket/reply/create',
  edit_ticket_reply: host + '/api/ticket/reply/edit/',
  delete_ticket_reply: host + '/api/ticket/reply/delete/',

  // Organization Setting
  create_organizaton_setting: host + '/api/org-settings/create',
  get_organization_setting: host + '/api/org-settings/view',
  create_organization_attachment: host + '/api/org-settings/add-attachment',
  delete_organization_attachment: host + '/api/org-settings/delete-attachment/',

  // On Boarding
  on_boarding_list: host + '/api/onboarding/list',

  // On Boarding -> Policy/Compliance links — unified model (supersedes the
  // old split onboarding/compliance + onboarding/policy endpoints below).
  on_board_policy_compliance_create: host + '/api/onboarding/policy-compliance/create',
  on_board_policy_compliance_list: host + '/api/onboarding/policy-compliance/list',
  on_board_policy_compliance_list_by_type: host + '/api/onboarding/policy-compliance/list/by-type/',
  on_board_policy_compliance_edit: host + '/api/onboarding/policy-compliance/edit/',
  on_board_policy_compliance_delete: host + '/api/onboarding/policy-compliance/delete/',

  // Dashboard
  my_workspace_count: host + '/api/count/my-workspace/list',
  get_subtask_completed_percentage: host + '/api/project/task/sub-task/completion-ratio',
  get_activity_summary: host + '/api/project/task/team-members/activity-summery',
  get_subtask_per_day: host + '/api/project/task/sub-task/personal-growth',
  operation_asset_count: host + '/api/count/operation-dashboard/asset',
  operation_project_count: host + '/api/count/operation-dashboard/project',
  operation_lead_client_count: host + '/api/count/operation-dashboard/leads/clients',
  operation_vendor_contact_vendorCount: host + '/api/count/operation-dashboard/vendor/v-contacts',
  operation_eod_count: host + '/api/count/operation-dashboard/eod',
  operation_leave_count: host + '/api/count/operation-dashboard/leave',
  operation_grievance_count: host + '/api/count/operation-dashboard/gievance',
  operation_ticket_count: host + '/api/count/operation-dashboard/ticket',
  operation_requisition_count: host + '/api/count/operation-dashboard/requisition',
  operation_organization_count: host + '/api/count/operation-dashboard/organization',
  get_calendar_data: host + '/api/project/calender-format',

  // Notification
  device_store: host + '/api/notification/record-device',
  get_notification: host + '/api/notification/get-notification',
  toggle_notification: host + '/api/notification/toggle-notification/',
  toggle_notification_all: host + '/api/notification/toggle-notification-all',
  notification_count: host + '/api/notification/count-notification',

  // Sales Orders
  create_order: host + '/api/order/create',
  get_order: host + '/api/order/list',
  delete_order: host + '/api/order/delete/',
  edit_order: host + '/api/order/edit/',
  edit_order_status: host + '/api/order/update-status/',
  get_order_details: host + '/api/order/details/',
  order_attachment_add: host + '/api/order/add-attachment',
  order_attachment_delete: host + '/api/order/delete-attachment/',
  get_order_summary: host + '/api/order/summary',

  // Inventory -> Categories
  update_category: host + '/api/inventory/category/edit/',
  delete_category: host + '/api/inventory/category/delete/',
  get_all_categories: host + '/api/inventory/category/list',
  create_category: host + '/api/inventory/category/create',
  get_subcat_by_cat: host + '/api/inventory/category/list/subcategory/',

  // Inventory -> Product
  create_product: host + '/api/inventory/product/create',
  product_toggle_status: host + '/api/inventory/product/toggle-status/',
  get_product_details: host + '/api/inventory/product/details/',
  update_product: host + '/api/inventory/product/edit/',
  delete_product: host + '/api/inventory/product/delete/',
  get_all_products: host + '/api/inventory/product/list',
  get_all_products_withoutpg: host + '/api/inventory/product/list-short',
  get_inventory_units: host + '/api/inventory/unit/list',

  // Stock - lot
  add_product_lot: host + '/api/inventory/stock-lot/create',
  edit_product_lot: host + '/api/inventory/stock-lot/edit/',

  // Sales Collection
  sales_collection_overview_list: host + '/api/invoice/due-list',
  sales_collection_by_customer: host + '/api/invoice/due-collection',

  // Sales Return
  get_sales_return_delivery: host + '/api/sales-return/delivery-list',
  create_sales_return: host + '/api/sales-return/create',
  get_sales_return_list: host + '/api/sales-return/list',
  update_sales_return_status: host + '/api/sales-return/update/status/',

  // Sales -> Fulfillment
  get_sales_fulfillment: host + '/api/challan/list',
  sales_challan_create: host + '/api/challan/create',
  delete_challan: host + '/api/challan/delete/',
  confirm_collection: host + '/api/sales-collection/create',
  sales_create_bill: host + '/api/invoice/consolidated/create',
  sales_due_bill: host + '/api/invoice/due-bill',
  sales_collected_invoices: host + '/api/sales-collection/invoice/collected/',

  challan_batch_create: host + '/api/challan/batch/create',
  get_batch_list: host + '/api/challan/batch',
  get_challan_details: host + '/api/challan/details/',

  // Territory
  add_territory: host + '/api/location/territory/create/',
  get_territory: host + '/api/location/territory/',
  delete_territory: host + '/api/location/territory/delete/',
  edit_territory: host + '/api/location/territory/update/',

  // Route
  add_route: host + '/api/location/route/create/',
  get_route: host + '/api/location/route/',
  delete_route: host + '/api/location/route/delete/',
  edit_route: host + '/api/location/route/update/',

  // Section
  add_section: host + '/api/location/section/create/',
  get_section: host + '/api/location/section/',
  delete_section: host + '/api/location/section/delete/',
  edit_section: host + '/api/location/section/update/',

  // Office
  add_office: host + '/api/location/office/create/',
  get_office: host + '/api/location/office/',
  delete_office: host + '/api/location/office/delete/',
  edit_office: host + '/api/location/office/update/',

  // Procurement Purchase Requisition
  create_purchase_requisition: host + '/api/procurement/pr/create',
  get_purchase_requisition: host + '/api/procurement/pr/list',
  get_approved_purchase_requisitions: host + '/api/procurement/pr/approved',
  update_purchase_requisition: host + '/api/procurement/pr/',
  purchase_requisition_details: host + '/api/procurement/pr/',
  delete_purchase_requisition: host + '/api/procurement/pr/delete/',
  edit_purchase_requisition_status: host + '/api/procurement/pr/',

  // Procurement GRN
  create_grn: host + '/api/procurement/grn/create',
  get_grn_list: host + '/api/procurement/grn/list',
  get_grn_details: host + '/api/procurement/grn/',
  delete_grn: host + '/api/procurement/grn/delete/',
  update_grn_status: host + '/api/procurement/grn/',

  // Procurement -> Purchase Return
  create_purchase_return: host + '/api/procurement/return/create',
  get_purchase_return_list: host + '/api/procurement/return/list',
  get_purchase_return_detail: host + '/api/procurement/return/',
  delete_purchase_return: host + '/api/procurement/return/delete/',
  confirm_purchase_return: host + '/api/procurement/return/confirm/',
  get_purchase_return_by_grn: host + '/api/procurement/return/grn/',

  // Sales -> Summary
  get_sales_summary: host + '/api/sales-dashboard/summary-cards',
  get_sales_operation_funnel: host + '/api/sales-dashboard/operational-funnel',
  get_sales_orders_needing_action: host + '/api/sales-dashboard/orders-needing-action',
  get_sales_collection_risk: host + '/api/sales-dashboard/collection-risk',

  // HR & Admin -> Approval Chain
  approval_chain_feature_list: host + '/api/approval-chain/feature/list',
  approval_chain_feature_toggle: host + '/api/approval-chain/feature/toggle/',
  approval_chain_create: host + '/api/approval-chain/chain/create',
  approval_chain_activate: host + '/api/approval-chain/chain/activate/',
  approval_chain_list: host + '/api/approval-chain/preset-list/',
  approval_chain_active: host + '/api/approval-chain/chain/active',
  approval_chain_stage_create: host + '/api/approval-chain/stage/create',
  approval_chain_stage_update: host + '/api/approval-chain/stage/update/',
  approval_chain_stage_delete: host + '/api/approval-chain/stage/delete/',
  approval_chain_stage_approver_create: host + '/api/approval-chain/stage-approver/create',
  approval_chain_stage_approver_delete: host + '/api/approval-chain/stage-approver/delete/',
  // GET <this>/<feature>/<instance id> — current stage, pending approvers,
  // and the approve/reject action log for one approval-chain instance
  // (e.g. a single leave application). Used for the "Approved By" section.
  approval_chain_instance_state: host + '/api/approval-chain/instance/state/',

  // AI Assistant — takes { feature_code, raw_text } and returns the parsed
  // field values for whichever module's create form is invoking it.
  ai_assistant_parse: host + '/api/ai/extract',

  // Chat — CHAT_API_DOCUMENTATION.md §3. No trailing slashes (APPEND_SLASH =
  // False). Every endpoint answers with the { code, response, data } envelope
  // on HTTP 200, so branch on `body.code`, never the transport status.
  chat_channels:               host + '/api/chat/channels',
  chat_channel_individual:     host + '/api/chat/channels/individual',
  chat_channel_group:          host + '/api/chat/channels/group',
  // GET <this><project_id> — get-or-create + membership sync
  chat_channel_project:        host + '/api/chat/channels/project/',
  // GET <this><record_id> — record channels (§2a): get-or-create + membership
  // sync from the SMICEE record's requester / referees / approver.
  chat_channel_leave:          host + '/api/chat/channels/leave/',
  chat_channel_eod:            host + '/api/chat/channels/eod/',
  chat_channel_requisition:    host + '/api/chat/channels/requisition/',
  chat_channel_ticket:         host + '/api/chat/channels/ticket/',
  chat_channel_budget_request: host + '/api/chat/channels/budget-request/',
  // <this><channel_id>/messages | /attachments | /read | /members[/<user_id>]
  chat_channel:                host + '/api/chat/channels/',
}

// Chat runs as its own service behind the same domain — nginx routes
// /api/chat/ and /ws/chat/ to it — so the WS host is API_HOST with the
// scheme swapped (https → wss). VITE_CHAT_WS_HOST overrides it for local dev.
export const CHAT_WS_HOST = import.meta.env.VITE_CHAT_WS_HOST || API_HOST.replace(/^http/, 'ws')
export const chatSocketUrl = (channelId, token) =>
  `${CHAT_WS_HOST}/ws/chat/${channelId}/?token=${encodeURIComponent(token)}`

export default V1API
