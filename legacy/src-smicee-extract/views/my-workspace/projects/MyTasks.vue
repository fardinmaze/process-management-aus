<template>
<div class="page">
    <div class="page-header">
        <div>
            <h1 class="page-title">My Tasks</h1>
            <p class="page-subtitle">Tasks assigned to you, across every project</p>
        </div>
    </div>

    <div v-if="!loading && !error" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#FFDEDC;color:#DB3545"><i class="ri-calendar-event-line"></i></div>
            <div class="min-w-0">
                <span class="mini-stat__label">Due Today</span>
                <span class="mini-stat__value">{{ todayTasksFlat.length }}</span>
            </div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#E9EFFF;color:#573FE0"><i class="ri-list-check-2"></i></div>
            <div class="min-w-0">
                <span class="mini-stat__label">Total Tasks</span>
                <span class="mini-stat__value">{{ allTasksFlat.length }}</span>
            </div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#EBFFED;color:#008610"><i class="ri-checkbox-circle-line"></i></div>
            <div class="min-w-0">
                <span class="mini-stat__label">Completed</span>
                <span class="mini-stat__value">{{ completedTaskCount }}</span>
            </div>
        </div>
        <div class="mini-stat">
            <div class="mini-stat__icon" style="background:#FEFDE8;color:#A46B04"><i class="ri-time-line"></i></div>
            <div class="min-w-0">
                <span class="mini-stat__label">In Progress</span>
                <span class="mini-stat__value">{{ openTaskCount }}</span>
            </div>
        </div>
    </div>

    <div v-if="loading" class="page-loader text-muted mt-4">Loading…</div>

    <div v-else-if="error" class="card mt-4">
        <div class="empty-state">
            <i class="ri-error-warning-line"></i>
            <h3>Couldn't load your tasks</h3>
            <p>Please try again.</p>
        </div>
    </div>

    <div v-else class="card p-4 mt-4">
        <!-- ===== TOP TABS: TODAY / ALL ===== -->
        <div class="tx-tabs" role="tablist">
            <button
                type="button"
                role="tab"
                class="tx-tab tx-tab--today"
                :class="{ 'tx-tab--active': activeTab === 'today' }"
                :aria-selected="activeTab === 'today'"
                @click="activeTab = 'today'"
            >
                <i class="ri-calendar-event-line"></i>
                Today
                <span class="tx-tab__count">{{ validDeadlineTask.length }}</span>
            </button>

            <button
                type="button"
                role="tab"
                class="tx-tab tx-tab--all"
                :class="{ 'tx-tab--active': activeTab === 'all' }"
                :aria-selected="activeTab === 'all'"
                @click="activeTab = 'all'"
            >
                <i class="ri-list-check-2"></i>
                All
                <span class="tx-tab__count">{{ validAllTask.length }}</span>
            </button>
        </div>

        <!-- ===== SEARCH: filter by project or task name, auto-opens matches ===== -->
        <div class="search-box mb-4">
            <i class="ri-search-line"></i>
            <input
                v-model="projectSearch"
                type="text"
                placeholder="Search by project or task name…"
            >
            <button
                v-if="projectSearch"
                type="button"
                class="search-box__clear"
                title="Clear search"
                @click="projectSearch = ''"
            >
                <i class="ri-close-line"></i>
            </button>
        </div>

        <!-- ===== ONE TABLE FOR THE SELECTED TAB — starts as a Project /
             Completion list; clicking a project drills the same table into
             its Task / Status / Priority / Date rows, with a Back row to
             return. ===== -->
        <div v-if="filteredList.length > 0">
            <div v-if="expandedProject" class="task-table__toolbar">
                <button type="button" class="task-table__back" @click="expandedProjectId = null">
                    <i class="ri-arrow-left-line"></i> Back to Projects
                </button>
                <span class="project-row__avatar" :style="{ background: projectColor(expandedProject.project_id.id) }">
                    {{ getInitials(expandedProject.project_id.title) }}
                </span>
                <span class="project-row__title">{{ expandedProject.project_id.title }}</span>
            </div>

            <div class="table-wrap">
                <table class="table task-table" :class="{ 'task-table--tasks': expandedProject }">
                    <!-- ===== PROJECT / COMPLETION VIEW ===== -->
                    <template v-if="!expandedProject">
                        <thead>
                            <tr>
                                <th class="task-table__check-col"></th>
                                <th>Project</th>
                                <th>Completion</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="project in filteredList"
                                :key="activeTab + '-' + project.project_id.id"
                                class="project-row"
                                @click="toggleProject(project.project_id.id)"
                            >
                                <td>
                                    <i class="ri-arrow-right-s-line project-row__chevron"></i>
                                </td>
                                <td>
                                    <div class="project-row__inner">
                                        <span class="project-row__avatar" :style="{ background: projectColor(project.project_id.id) }">
                                            {{ getInitials(project.project_id.title) }}
                                        </span>
                                        <span class="project-row__title" :title="project.project_id.title">{{ project.project_id.title }}</span>
                                        <span class="text-xs text-typo-500">
                                            {{ project.tasks.length }} task{{ project.tasks.length === 1 ? '' : 's' }}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div class="project-row__completion">
                                        <span class="project-row__progress-track">
                                            <span class="project-row__progress-fill" :style="{ width: progressPercent(project) + '%' }"></span>
                                        </span>
                                        <span class="project-row__count">
                                            {{ completedCount(project) }}/{{ project.tasks.length }} completed
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </template>

                    <!-- ===== TASK / STATUS / PRIORITY / DATE VIEW ===== -->
                    <template v-else>
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Status</th>
                                <th>Timeline</th>
                                <th class="task-table__time-col">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!expandedProject.tasks.length">
                                <td colspan="4" class="text-center text-typo-400">No tasks in this project.</td>
                            </tr>
                            <tr v-for="task in expandedProject.tasks" :key="task.task_id.id" class="task-row">
                                <!-- Task + its subtasks live in one row, one cell — checkbox
                                     sits right beside each title instead of its own column,
                                     and subtasks are an inline list here rather than
                                     separate table rows. -->
                                <td class="task-row__title-cell" :style="{ borderLeftColor: priorityAccentColor(task.task_id.priority) }">
                                    <div class="task-row__main">
                                        <input
                                            type="checkbox"
                                            class="task-checkbox"
                                            v-model="task.task_id.complete"
                                            @click="Task(task.task_id.id)"
                                        >
                                        <div class="min-w-0">
                                            <span class="task-row__title-row">
                                                <router-link
                                                    :to="{ name: 'MyProjectDetails', params: { id: task.task_id.project }, query: { openTask: task.task_id.id } }"
                                                    class="task-row__title"
                                                    :class="{ 'task-row__title--done': task.task_id.complete }"
                                                    :title="task.task_id.title"
                                                >
                                                    {{ task.task_id.title }}
                                                </router-link>
                                                <span class="task-item__meta-entry" :class="priorityTextClass(task.task_id.priority)">
                                                    <i class="ri-flag-2-line"></i> {{ task.task_id.priority }}
                                                </span>
                                            </span>
                                            <p v-if="task.task_id.description" class="task-row__desc">
                                                {{ stripHtml(task.task_id.description) }}
                                            </p>
                                            <span v-if="task.task_id.complete && task.task_id.completed_date" class="task-badge task-badge--done task-row__completed">
                                                <i class="ri-check-line"></i> {{ task.task_id.completed_date }}
                                            </span>
                                        </div>
                                    </div>

                                    <div v-if="task.subtasks.length" class="subtask-list">
                                        <div v-for="subtask in task.subtasks" :key="subtask.id" class="subtask-line">
                                            <input
                                                type="checkbox"
                                                class="task-checkbox"
                                                v-model="subtask.complete"
                                                @click="subTask(subtask.id)"
                                            >
                                            <router-link
                                                :to="{ name: 'MyProjectDetails', params: { id: task.task_id.project }, query: { openTask: task.task_id.id } }"
                                                class="subtask-line__title"
                                                :class="{ 'task-row__title--done': subtask.complete }"
                                                :title="subtask.title"
                                            >
                                                <span class="subtask-line__icon"><i class="ri-corner-down-right-line"></i></span>
                                                {{ subtask.title }}
                                            </router-link>
                                            <span class="task-meta-text task-meta-text--sm">
                                                {{ subtask.start_date }} → {{ subtask.end_date }}
                                            </span>
                                            <span v-if="subtask.complete && subtask.completed_date" class="task-badge task-badge--sm task-badge--done">
                                                <i class="ri-check-line"></i> {{ subtask.completed_date }}
                                            </span>
                                            <button
                                                type="button"
                                                class="clock-btn clock-btn--sm"
                                                :class="runningTimerFor(subtask.id) ? 'clock-btn--danger' : 'clock-btn--success'"
                                                :title="runningTimerFor(subtask.id) ? 'Clock Out' : 'Clock In'"
                                                :disabled="clockBusy"
                                                @click="toggleClock(subtask.id)"
                                            >
                                                <i :class="runningTimerFor(subtask.id) ? 'ri-stop-circle-line' : 'ri-play-circle-line'"></i>
                                            </button>
                                            <span v-if="runningTimerFor(subtask.id)" class="task-timer task-timer--sm">
                                                {{ elapsedLabel(subtask.id) }}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="task-badge" :class="statusClass(task.task_id.status)">
                                        {{ task.task_id.status }}
                                    </span>
                                </td>
                                <td class="whitespace-nowrap">
                                    <span class="task-item__meta-entry">
                                        <i class="ri-calendar-line"></i>
                                        {{ task.task_id.start_date }} → {{ task.task_id.end_date }}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        class="clock-btn"
                                        :class="runningTimerFor(task.task_id.id) ? 'clock-btn--danger' : 'clock-btn--success'"
                                        :title="runningTimerFor(task.task_id.id) ? 'Clock Out' : 'Clock In'"
                                        :disabled="clockBusy"
                                        @click="toggleClock(task.task_id.id)"
                                    >
                                        <i :class="runningTimerFor(task.task_id.id) ? 'ri-stop-circle-line' : 'ri-play-circle-line'"></i>
                                    </button>
                                    <div v-if="runningTimerFor(task.task_id.id)" class="task-timer">
                                        {{ elapsedLabel(task.task_id.id) }}
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </template>
                </table>
            </div>
        </div>

        <div v-else-if="projectSearch.trim()" class="empty-state">
            <i class="ri-search-line"></i>
            <h3>No matches for "{{ projectSearch.trim() }}"</h3>
            <p>Try a different project or task name.</p>
            <button type="button" class="btn btn--ghost btn--sm" @click="projectSearch = ''">Clear search</button>
        </div>

        <div v-else class="empty-state">
            <i :class="activeTab === 'today' ? 'ri-calendar-check-line' : 'ri-inbox-line'"></i>
            <h3>{{ activeTab === 'today' ? 'No tasks due today' : 'No tasks found' }}</h3>
            <p>{{ activeTab === 'today' ? "You're all caught up for today." : "You don't have any tasks assigned yet." }}</p>
        </div>
    </div>
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
    inject: ['toast'],

    data() {
        return {
            activeTab: 'today',      // 'today' or 'all' - both tabs live together at the top
            expandedProjectId: null, // id of the project currently drilled into, or null for the project list
            projectSearch: '',    // live filter by project or task name — matches auto-drill-in
            nowTick: Date.now(),  // ticks every second so elapsed-timer labels stay live
            timerIntervalId: null,
            clockBusy: false
        }
    },

    computed: {
        ...mapState({
            allTask: state => state.project.myTask,
            loading: state => state.project.submitLoading,
            error: state => state.project.submitError,
            deadlineTask: state => state.project.myTaskDeadline,
        }),

        // My own running timers (task/fetchRunningTimers already scopes the
        // list to the current user), keyed by task or subtask id — same
        // clock-in/out endpoints handle both, per ProjectDetails.vue.
        ...mapState({
            runningTimers: state => state.task.runningTimers,
        }),

        // Filter out any malformed entries (missing project_id / tasks / ids)
        // so a bad record from the API can't crash the render.
        validDeadlineTask() {
            return this.safeProjectList(this.deadlineTask);
        },

        validAllTask() {
            return this.safeProjectList(this.allTask);
        },

        activeList() {
            return this.activeTab === 'today' ? this.validDeadlineTask : this.validAllTask;
        },

        // Narrows activeList to projects that match the search box — either
        // the project's own title or any task inside it — so searching for
        // a task name jumps you straight to the project that holds it.
        filteredList() {
            const query = this.projectSearch.trim().toLowerCase();
            if (!query) return this.activeList;
            return this.activeList.filter(p => this.projectMatches(p, query));
        },

        // The project currently drilled into, if any — switches the table
        // from the Project/Completion list to that project's Task/Status/
        // Priority/Date rows.
        expandedProject() {
            if (!this.expandedProjectId) return null;
            return this.filteredList.find(p => p.project_id.id === this.expandedProjectId) || null;
        },

        // Flattened task counts for the summary tiles at the top of the page.
        allTasksFlat() {
            return this.flattenTasks(this.validAllTask);
        },

        todayTasksFlat() {
            return this.flattenTasks(this.validDeadlineTask);
        },

        completedTaskCount() {
            return this.allTasksFlat.filter(t => t.task_id.complete).length;
        },

        openTaskCount() {
            return this.allTasksFlat.length - this.completedTaskCount;
        }
    },

    watch: {
        // Auto drill in when the search narrows to exactly one project — an
        // unambiguous match jumps straight to its tasks instead of making
        // you click through the project list.
        projectSearch() {
            this.expandSearchMatches();
        },
        activeTab() {
            this.expandedProjectId = null;
            this.expandSearchMatches();
        }
    },

    mounted() {
        // === API calls happen here ===
        this.$store.dispatch("project/fetchMyTask")               // -> populates allTask
        this.$store.dispatch("project/fetchMyTaskDeadlineToday")  // -> populates deadlineTask
        // task/fetchRunningTimers also force-closes any timer left running
        // from a previous day server-side (close_stale()).
        this.$store.dispatch("task/fetchRunningTimers")
        this.startTimerTick()
    },

    unmounted() {
        this.stopTimerTick()
    },

    methods: {
        // Keeps only entries that actually have a project_id and a tasks array,
        // and drops any task/subtask entries missing their own id fields.
        safeProjectList(list) {
            if (!Array.isArray(list)) return [];

            return list
                .filter(p => p && p.project_id && p.project_id.id != null)
                .map(p => ({
                    ...p,
                    tasks: Array.isArray(p.tasks)
                        ? p.tasks
                            .filter(t => t && t.task_id && t.task_id.id != null)
                            .map(t => ({
                                ...t,
                                subtasks: Array.isArray(t.subtasks)
                                    ? t.subtasks.filter(s => s && s.id != null)
                                    : []
                            }))
                        : []
                }));
        },

        toggleProject(projectId) {
            this.expandedProjectId = this.expandedProjectId === projectId ? null : projectId;
        },

        projectMatches(project, lowerQuery) {
            if ((project.project_id.title || '').toLowerCase().includes(lowerQuery)) return true;
            return (project.tasks || []).some(t => (t.task_id.title || '').toLowerCase().includes(lowerQuery));
        },

        expandSearchMatches() {
            const query = this.projectSearch.trim().toLowerCase();
            if (!query) { this.expandedProjectId = null; return; }
            const matches = this.activeList.filter(p => this.projectMatches(p, query));
            this.expandedProjectId = matches.length === 1 ? matches[0].project_id.id : null;
        },

        flattenTasks(list) {
            return (list || []).flatMap(p => p.tasks || []);
        },

        completedCount(project) {
            return (project.tasks || []).filter(t => t.task_id.complete).length;
        },

        progressPercent(project) {
            const total = project.tasks.length;
            if (!total) return 0;
            return Math.round((this.completedCount(project) / total) * 100);
        },

        getInitials(title) {
            const words = (title || '').trim().split(/\s+/).filter(Boolean);
            if (!words.length) return '?';
            return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
        },

        projectColor(id) {
            const palette = ['#573FE0', '#008610', '#CE9700', '#BF0022', '#0850b8', '#8180F7'];
            return palette[Math.abs(Number(id) || 0) % palette.length];
        },

        statusClass(status) {
            const key = (status || '').toLowerCase();
            if (key === 'completed' || key === 'done') return 'bg-secondary-50 text-secondary-700';
            if (key === 'working' || key === 'in_progress' || key === 'in-progress') return 'bg-brand-50 text-brand-600';
            if (key === 'pending') return 'bg-warning-100 text-warning-700';
            return 'bg-typo-100 text-typo-700';
        },

        // Best-effort coloring for the priority text — handles both the
        // numeric 1/2/3 (LOW/MEDIUM/HIGH) vocabulary used by task/priority
        // elsewhere in the app and a plain string label, falling back to
        // a neutral tone for anything unrecognized.
        priorityTextClass(priority) {
            const key = String(priority ?? '').toLowerCase();
            if (key === '3' || key.includes('high') || key.includes('urgent')) return 'text-accent-600';
            if (key === '1' || key.includes('low')) return 'text-secondary-600';
            if (key === '2' || key.includes('medium')) return 'text-warning-700';
            return 'text-typo-500';
        },

        // Same tone as priorityTextClass, as a hex color for the task/
        // subtask row's left accent bar — subtasks reuse their parent
        // task's color (they have no priority of their own), which visually
        // ties each subtask back to the task it belongs to at a glance.
        priorityAccentColor(priority) {
            const key = String(priority ?? '').toLowerCase();
            if (key === '3' || key.includes('high') || key.includes('urgent')) return '#DB3545';
            if (key === '1' || key.includes('low')) return '#28A645';
            if (key === '2' || key.includes('medium')) return '#EFC203';
            return '#DCDCDC';
        },

        stripHtml(html) {
            if (!html) return '';
            const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
            return text.length > 220 ? text.slice(0, 220) + '…' : text;
        },

        Task(id) {
            this.$store.dispatch("project/toggleTaskComplete", {
                id: id
            }).then(response => {
                if (response.code == 200) {
                    this.toast?.success(response.response);
                } else {
                    this.toast?.error(response.response);
                }
            })
        },

        subTask(id) {
            this.$store.dispatch("project/toggleSubTaskComplete", {
                id: id,
            }).then(response => {
                if (response.code == 200) {
                    this.toast?.success(response.response);
                } else {
                    this.toast?.error(response.response);
                }
            })
        },

        // ── Time tracking (Clock In/Out — same task/clockIn|clockOut
        // endpoints ProjectDetails.vue uses; subtasks use the same
        // endpoints keyed by their own id) ──────────────────────────────
        runningTimerFor(id) {
            return (this.runningTimers || []).find(t => t.task === id);
        },

        elapsedLabel(id) {
            const timer = this.runningTimerFor(id);
            if (!timer) return '';
            const seconds = Math.max(0, Math.floor((this.nowTick - new Date(timer.clock_in).getTime()) / 1000));
            return this.formatDuration(seconds);
        },

        formatDuration(totalSeconds) {
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
        },

        startTimerTick() {
            if (this.timerIntervalId) return;
            this.timerIntervalId = setInterval(() => { this.nowTick = Date.now() }, 1000);
        },

        stopTimerTick() {
            if (this.timerIntervalId) {
                clearInterval(this.timerIntervalId);
                this.timerIntervalId = null;
            }
        },

        toggleClock(id) {
            if (this.runningTimerFor(id)) {
                this.clockOutTask(id);
            } else {
                this.clockInTask(id);
            }
        },

        async clockInTask(id) {
            this.clockBusy = true;
            try {
                const res = await this.$store.dispatch('task/clockIn', { taskId: id });
                if (res?.code == 200) {
                    this.toast?.success(res?.response || 'Clocked in.');
                } else {
                    this.toast?.error(res?.response || 'Failed to clock in.');
                }
            } catch {
                this.toast?.error('Failed to clock in.');
            } finally {
                this.clockBusy = false;
            }
        },

        async clockOutTask(id) {
            this.clockBusy = true;
            try {
                const res = await this.$store.dispatch('task/clockOut', { taskId: id });
                if (res?.code == 200) {
                    this.toast?.success(res?.response || 'Clocked out.');
                } else {
                    this.toast?.error(res?.response || 'Failed to clock out.');
                }
            } catch {
                this.toast?.error('Failed to clock out.');
            } finally {
                this.clockBusy = false;
            }
        }
    }
};
</script>

<style scoped>
/* ---- Summary tiles (same "mini-stat" pattern as ProjectTrackerDetails.vue's
   Financial Summary row) — smaller and lighter than the dashboard StatCard,
   which is sized for full stat-grid dashboards rather than a compact
   above-the-fold row. ---- */
.mini-stat {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border: 1px solid #F1F5F9;
    border-radius: 10px;
    padding: 10px 14px;
}
.mini-stat__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    flex-shrink: 0;
}
.mini-stat__label { display: block; font-size: 11px; color: #6E6E6F; font-weight: 500; }
.mini-stat__value { display: block; font-size: 18px; font-weight: 800; color: #272727; line-height: 1.3; }

/* ---- Top tabs: TODAY + ALL together (same underline-tab shape as
   MyProjects.vue's .tx-tabs), with distinct accent colors per tab so
   "today" keeps reading as the more urgent one. ---- */
.tx-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 16px;
}
.tx-tab {
    appearance: none;
    border: 0;
    background: transparent;
    padding: 9px 14px;
    margin-bottom: -1px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: color 0.15s ease, border-color 0.15s ease;
}
.tx-tab:hover { color: #334155; }

.tx-tab--today.tx-tab--active { color: #BF0022; border-bottom-color: #DB3545; }
.tx-tab--all.tx-tab--active { color: #573FE0; border-bottom-color: #573FE0; }

.tx-tab__count {
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 9999px;
    padding: 3px 7px;
    min-width: 18px;
    text-align: center;
}
.tx-tab--today.tx-tab--active .tx-tab__count { background: #FFDEDC; color: #BF0022; }
.tx-tab--all.tx-tab--active .tx-tab__count { background: #e9efff; color: #573fe0; }

/* ---- Project / Completion list row — clicking it drills the table into
   that project's Task / Status / Priority / Date rows (see .task-table__
   toolbar below for the way back). ---- */
.project-row {
    cursor: pointer;
    background: #F9F9F9;
}
.project-row:hover td { background: #F1F5F9; }
.project-row td { padding-top: 9px; padding-bottom: 9px; }

.project-row__chevron {
    font-size: 16px;
    color: #888889;
    display: inline-block;
}

.project-row__inner {
    display: flex;
    align-items: center;
    gap: 10px;
}

.project-row__avatar {
    width: 26px;
    height: 26px;
    border-radius: 9999px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.3px;
}

.project-row__title {
    font-size: 13.5px;
    font-weight: 700;
    color: #272727;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
}

.project-row__completion {
    display: flex;
    align-items: center;
    gap: 10px;
}

.project-row__progress-track {
    flex: 1;
    min-width: 80px;
    max-width: 180px;
    height: 5px;
    border-radius: 9999px;
    background: #E2E8F0;
    overflow: hidden;
    display: block;
}
.project-row__progress-fill {
    display: block;
    height: 100%;
    background: linear-gradient(90deg, #8180F7, #573FE0);
    transition: width 0.3s ease;
}

.project-row__count {
    font-size: 11px;
    color: #6E6E6F;
    white-space: nowrap;
    flex-shrink: 0;
}

/* ---- Toolbar shown above the table while drilled into a project ---- */
.task-table__toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}

.task-table__back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #F9F9F9;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #3D3D3E;
    cursor: pointer;
    transition: background-color 0.15s ease;
}
.task-table__back:hover { background: #F1F5F9; color: #573FE0; }

/* Custom circular checkbox — native controls don't take styling well and
   were leaving paint artifacts inside the animated accordion, so both the
   task and subtask checkboxes are built from a plain unstyled input. */
.task-checkbox {
    appearance: none;
    -webkit-appearance: none;
    margin-top: 2px;
    width: 18px;
    height: 18px;
    font-size: 18px;
    border: 2px solid #DCDCDC;
    border-radius: 6px;
    background: #fff;
    flex-shrink: 0;
    cursor: pointer;
    position: relative;
    transition: background-color 0.15s ease, border-color 0.15s ease;
}
.task-checkbox:hover { border-color: #8180F7; }
.task-checkbox:checked { background: #573FE0; border-color: #573FE0; }
/* Checkmark drawn with the standard border-right + border-bottom,
   rotate(45deg) technique, sized in `em` off the checkbox's own font-size
   (set equal to its width above) so every checkbox size — task or subtask —
   renders the exact same proportional tick instead of separately hand-tuned
   pixel offsets that drift out of sync with each other. */
.task-checkbox:checked::after {
    content: '';
    position: absolute;
    left: 0.33em;
    top: 0.11em;
    width: 0.28em;
    height: 0.5em;
    border: solid #fff;
    border-width: 0 0.11em 0.11em 0;
    transform: rotate(45deg);
}
.subtask-line .task-checkbox { margin-top: 0; }

.task-item__meta-entry {
    font-size: 11.5px;
    font-weight: 600;
    color: #6E6E6F;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
}
.task-item__meta-entry--done { color: #008610; }

.task-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 9999px;
    white-space: nowrap;
}
.task-badge--done { background: #EBFFED; color: #006500; }
.task-badge--sm { font-size: 10px; padding: 2px 7px; }

.task-meta-text {
    font-size: 11px;
    color: #6E6E6F;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.task-meta-text--sm { font-size: 10.5px; }

.task-table__dash { color: #DCDCDC; }

/* ---- Clock In/Out (Time Tracking, matching ProjectDetails.vue's icon-btn
   pattern but sized for this page's denser rows) ---- */
.clock-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    font-size: 15px;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease;
}
.clock-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.clock-btn--success { background: #EBFFED; color: #006500; }
.clock-btn--success:hover:not(:disabled) { background: #BAEFBF; }
.clock-btn--danger { background: #FFDEDC; color: #BF0022; }
.clock-btn--danger:hover:not(:disabled) { background: #FFC2C0; }
.clock-btn--sm { width: 22px; height: 22px; font-size: 12px; border-radius: 5px; }

.task-timer {
    font-size: 10.5px;
    font-weight: 600;
    color: #006500;
    white-space: nowrap;
    margin-top: 4px;
}
.task-timer--sm { font-size: 10px; }

/* ---- Task table ---- */
.task-table__check-col { width: 34px; }
.task-table__time-col { width: 74px; }

.task-row td { vertical-align: top; }

/* Task title cell carries a priority-colored accent bar — ties the row
   visually back to its own Priority column value — and holds the task's
   checkbox+title plus its whole subtask list as one block, so a task and
   its subtasks are always one physical table row, never split across
   several. */
.task-row__title-cell {
    border-left: 4px solid #DCDCDC;
}

.task-row__main {
    display: flex;
    align-items: flex-start;
    gap: 10px;
}

.task-row__title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.task-row__title,
.subtask-line__title {
    font-size: 13.5px;
    text-decoration: none;
}
.task-row__title { font-weight: 700; color: #272727; }
.task-row__title:hover { color: #573FE0; }
.task-row__title--done { color: #A3A3A4; text-decoration: line-through; font-weight: 600; }

.task-row__desc {
    font-size: 11.5px;
    color: #6E6E6F;
    margin: 3px 0 0;
    line-height: 1.4;
    max-width: 360px;
}

.task-row__completed { margin-top: 5px; }

/* ---- Subtasks — an inline list inside the task's own cell (not separate
   rows), each line its own checkbox + same-size title + compact status/
   date/clock, indented under the task with a connecting rail. ---- */
.subtask-list {
    margin: 10px 0 0 28px;
    padding-top: 8px;
    border-top: 1px dashed #E2E8F0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.subtask-line {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.subtask-line__title {
    font-weight: 600;
    color: #3D3D3E;
    display: inline-flex;
    align-items: center;
    gap: 7px;
}
.subtask-line__title:hover { color: #573FE0; }

.subtask-line__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    background: #EEF0FA;
    color: #8180F7;
    font-size: 10.5px;
    flex-shrink: 0;
}

/* ---- Minimum widths so columns stay readable on phones instead of
   squeezing down to nothing — .table-wrap (overflow-x: auto, set globally)
   turns this into a horizontal scroll instead of a crushed layout. ---- */
.task-table { min-width: 420px; }
.task-table--tasks { min-width: 560px; }

@media only screen and (max-width: 800px) {
    .task-row__desc {
        max-width: 220px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
}
</style>
