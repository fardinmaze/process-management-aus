<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-bold text-slate-800 m-0">Welcome{{ userName ? `, ${userName}` : '' }}</h1>
      <p class="text-sm text-slate-500 mt-1 mb-0">Jump into projects, reports and access control.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <router-link
        v-for="card in visibleCards"
        :key="card.routeName"
        :to="{ name: card.routeName }"
        class="card flex items-start gap-3 p-4 no-underline bg-white border border-slate-200 rounded-xl transition-shadow hover:shadow-md"
      >
        <i :class="card.icon" class="text-2xl text-brand-600 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-bold text-slate-800 m-0">{{ card.title }}</p>
          <p class="text-xs text-slate-500 mt-1 mb-0">{{ card.text }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { can }      from '@/utils/permission'

const CARDS = [
  { title: 'Projects',        text: 'Plan, track and archive projects and their task boards.', icon: 'ri-folder-3-line',    routeName: 'ProjectList',      permission: 'view_projects' },
  { title: 'Project Tracker', text: 'Progress overview across all running projects.',          icon: 'ri-route-line',       routeName: 'ProjectTrackerList', permission: 'project_tracking' },
  { title: 'My Tasks',        text: 'Tasks assigned to you across projects.',                  icon: 'ri-task-line',        routeName: 'MyTasks',          permission: null },
  { title: 'EOD Reports',     text: 'Review daily end-of-day reports from your team.',         icon: 'ri-file-list-line',   routeName: 'AdminEODList',     permission: 'view_eod' },
  { title: 'Submit EOD',      text: 'Submit your own end-of-day report.',                      icon: 'ri-edit-2-line',      routeName: 'EODCreate',        permission: null },
  { title: 'Approval Chain',  text: 'Define who approves what, and in which order.',           icon: 'ri-flow-chart',       routeName: 'ApprovalChain',    permission: null },
  { title: 'Designations',    text: 'Role based access: manage permissions per designation.',  icon: 'ri-shield-user-line', routeName: 'DesignationList',  permission: null },
  { title: 'Activity Log',    text: 'Audit trail of actions taken in the system.',             icon: 'ri-archive-line',     routeName: 'ActivityLog',      permission: null },
]

export default {
  name: 'DashboardView',
  setup() {
    const store    = useStore()
    const userName = computed(() => store.getters['auth/user']?.name ?? '')
    const visibleCards = computed(() => CARDS.filter((c) => !c.permission || can(c.permission)))
    return { userName, visibleCards }
  },
}
</script>
