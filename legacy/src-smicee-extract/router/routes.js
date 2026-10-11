// Layout wrapper
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// Auth views
const Login          = () => import('@/views/auth/Login.vue')
const ForgotPassword = () => import('@/views/auth/ForgotPassword.vue')
const ResetPassword  = () => import('@/views/auth/ResetPassword.vue')

// Dashboard
const Dashboard = () => import('@/views/dashboard/Dashboard.vue')

// Profile
const ChangePassword = () => import('@/views/profile/ChangePassword.vue')

// My Workspace — personal projects, tasks and EOD reports
const EodReport    = () => import('@/views/my-workspace/eod/EodReport.vue')
const MyEodList    = () => import('@/views/my-workspace/eod/MyEodList.vue')
const EodDetails   = () => import('@/views/common/eod/EodDetails.vue')
const MyProjects   = () => import('@/views/my-workspace/projects/MyProjects.vue')
const MyTasks      = () => import('@/views/my-workspace/projects/MyTasks.vue')

// Project management
const ProjectList            = () => import('@/views/operations/project/ProjectList.vue')
const ProjectCreate          = () => import('@/views/operations/project/ProjectCreate.vue')
const ProjectEdit            = () => import('@/views/operations/project/ProjectEdit.vue')
const ProjectDetails         = () => import('@/views/operations/project/ProjectDetails.vue')
const ProjectTrackerList     = () => import('@/views/operations/project/ProjectTrackerList.vue')
const ProjectTrackerDetails  = () => import('@/views/operations/project/ProjectTrackerDetails.vue')
const ProjectTypeList        = () => import('@/views/operations/project/ProjectTypeList.vue')
const TaskLabelTemplateList  = () => import('@/views/operations/project/TaskLabelTemplateList.vue')
const ArchivedProjectList    = () => import('@/views/operations/project/ArchivedProjectList.vue')

// Reports (EOD)
const AdminEODList  = () => import('@/views/operations/eod/AdminEODList.vue')
const AdminEODSheet = () => import('@/views/operations/eod/AdminEODSheet.vue')

// Admin — activity log, approval chain, role based access
const ActivityLog            = () => import('@/views/hr/activity-log/ActivityList.vue')
const ApprovalChain          = () => import('@/views/hr/approval-chain/list.vue')
const DesignationList        = () => import('@/views/hr/organization/Designations.vue')
const DesignationPermissions = () => import('@/views/hr/organization/DesignationPermissions.vue')

// Utility
const Unauthorized = () => import('@/views/unauthorized/Unauthorized.vue')
const NotFound     = () => import('@/views/NotFound.vue')

export const routes = [
  // ── Public routes ────────────────────────────────────────────────────────
  { path: '/login',                name: 'Login',          component: Login,          meta: { guest: true, title: 'Login' } },
  { path: '/auth/forgot-password', name: 'ForgotPassword', component: ForgotPassword, meta: { guest: true, title: 'Forgot Password' } },
  { path: '/auth/reset-password',  name: 'ResetPassword',  component: ResetPassword,  meta: { guest: true, title: 'Reset Password' } },

  // ── Protected routes (require auth) ──────────────────────────────────────
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'Dashboard' } },
      { path: 'dashboard', name: 'Dashboard', component: Dashboard, meta: { title: 'Dashboard', breadcrumb: 'Dashboard' } },

      // My Workspace — personal self-service pages, no permission gating
      {
        path: 'my-workspace',
        meta: { breadcrumb: 'My Workspace' },
        children: [
          { path: 'eod/eod-report',     name: 'EODCreate',    component: EodReport,  meta: { title: 'Submit EOD', breadcrumb: 'Submit EOD' } },
          { path: 'eod/my-eod-report',  name: 'MyEODList',    component: MyEodList,  meta: { title: 'My EOD',     breadcrumb: 'My EOD' } },
          { path: 'eod/eod-report/:id', name: 'MyEodDetails', component: EodDetails, meta: { title: 'EOD Details', breadcrumb: 'EOD Details', breadcrumbParent: 'MyEODList' } },
          { path: 'projects/list',      name: 'MyProjects',   component: MyProjects, meta: { title: 'My Projects', breadcrumb: 'My Projects' } },
          {
            // Same component as the operations ProjectDetails route — a distinct
            // route *name* lets ProjectDetails.vue tell "opened from My Projects"
            // apart from "opened from operations" and keep edit/delete off.
            path: 'projects/details/:id', name: 'MyProjectDetails', component: ProjectDetails,
            meta: { title: 'Project Details', breadcrumb: 'Project Details', breadcrumbParent: 'MyProjects' },
          },
          { path: 'projects/tasks/list', name: 'MyTasks', component: MyTasks, meta: { title: 'My Tasks', breadcrumb: 'My Tasks' } },
        ],
      },

      // Profile
      {
        path: 'profile',
        meta: { breadcrumb: 'Profile' },
        children: [
          { path: 'change-password', name: 'ChangePassword', component: ChangePassword, meta: { title: 'Change Password', breadcrumb: 'Change Password' } },
        ],
      },

      // Project management & reports
      {
        path: 'operations',
        meta: { breadcrumb: 'Operations' },
        children: [
          {
            path: 'project',
            children: [
              { path: 'list',          name: 'ProjectList',           component: ProjectList,           meta: { title: 'Projects',          breadcrumb: 'Projects',          permission: 'view_projects' } },
              { path: 'create',        name: 'ProjectCreate',         component: ProjectCreate,         meta: { title: 'Create Project',    breadcrumb: 'Create Project',    breadcrumbParent: 'ProjectList', permission: 'view_projects' } },
              { path: 'edit/:id',      name: 'ProjectEdit',           component: ProjectEdit,           meta: { title: 'Edit Project',      breadcrumb: 'Edit Project',      breadcrumbParent: 'ProjectList', permission: 'view_projects' } },
              { path: 'details/:id',   name: 'ProjectDetails',        component: ProjectDetails,        meta: { title: 'Project Details',   breadcrumb: 'Project Details',   breadcrumbParent: 'ProjectList', permission: 'view_projects', breadcrumbParentByQuery: { archived: 'ArchivedProjectList' } } },
              { path: 'tracker-list',  name: 'ProjectTrackerList',    component: ProjectTrackerList,    meta: { title: 'Project Tracker',   breadcrumb: 'Project Tracker',   permission: 'project_tracking' } },
              { path: 'tracker/:id',   name: 'ProjectTrackerDetails', component: ProjectTrackerDetails, meta: { title: 'Project Overview',  breadcrumb: 'Project Overview',  breadcrumbParent: 'ProjectTrackerList', permission: 'project_tracking' } },
              { path: 'type',          name: 'ProjectTypeList',       component: ProjectTypeList,       meta: { title: 'Project Types',     breadcrumb: 'Project Types',     permission: 'view_projects' } },
              { path: 'board-template', name: 'TaskLabelTemplateList', component: TaskLabelTemplateList, meta: { title: 'Board Templates',  breadcrumb: 'Board Templates',   permission: 'view_projects' } },
              { path: 'archived-list', name: 'ArchivedProjectList',   component: ArchivedProjectList,   meta: { title: 'Archived Projects', breadcrumb: 'Archived Projects', permission: 'view_projects' } },
            ],
          },
          {
            path: 'eod',
            children: [
              { path: 'list',        name: 'AdminEODList',    component: AdminEODList,  meta: { title: 'EOD List',    breadcrumb: 'EOD List',    permission: 'view_eod' } },
              { path: 'sheet',       name: 'AdminEODSheet',   component: AdminEODSheet, meta: { title: 'EOD Sheet',   breadcrumb: 'EOD Sheet',   permission: 'view_eod' } },
              { path: 'details/:id', name: 'AdminEODDetails', component: EodDetails,    meta: { title: 'EOD Details', breadcrumb: 'EOD Details', breadcrumbParent: 'AdminEODList', permission: 'view_eod' } },
            ],
          },
        ],
      },

      // Administration — activity log, approval chain, role based access
      {
        path: 'admin',
        meta: { breadcrumb: 'Administration' },
        children: [
          { path: 'activity-log/list', name: 'ActivityLog',   component: ActivityLog,   meta: { title: 'Activity Log',   breadcrumb: 'Activity Log',   permission: null } },
          { path: 'approval-chain',    name: 'ApprovalChain', component: ApprovalChain, meta: { title: 'Approval Chain', breadcrumb: 'Approval Chain', permission: null } },
          { path: 'organization/designation', name: 'DesignationList', component: DesignationList, meta: { title: 'Designations', breadcrumb: 'Designations', permission: null } },
          { path: 'organization/designation/:id/permissions', name: 'DesignationPermissions', component: DesignationPermissions, meta: { title: 'Designation Permissions', breadcrumb: 'Designation Permissions', breadcrumbParent: 'DesignationList', permission: null } },
        ],
      },
    ],
  },

  // ── Utility routes ───────────────────────────────────────────────────────
  { path: '/unauthorized',      name: 'Unauthorized', component: Unauthorized, meta: { title: 'Unauthorized' } },
  { path: '/:pathMatch(.*)*',   name: 'NotFound',     component: NotFound,     meta: { title: 'Page Not Found' } },
]
