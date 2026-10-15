// Ported from the legacy SMICEE frontend's `task.js` store module. Dropped:
// raw axios + manually-attached Bearer header (the `api` instance already
// injects it), the `dataMagic` encode/decode step, the `asyncHelper`
// boilerplate generator, and an unused `vue-rate-it` import — none of which
// exist/apply in this project.
import api  from '@/plugins/axios'
import V1API from '@/utils/apiPaths'

const state = () => ({
  taskCategory: [],
  taskList:     [],
  taskDetail:   {},
  comments:     [],
  subTaskList:  [],

  taskLoading: false,
  taskError:   false,

  taskCommentLoading: false,
  taskCommentError:   false,

  submitLoading: false,
  submitError:   false,
  submitSuccess: false,

  // Task Label Templates (task.txt Part 1)
  taskLabelTemplates: [],
  templateLoading:    false,
  templateError:      false,

  // Task Time Logs (task.txt Part 2)
  runningTimers:    [],
  timeLogsByTask:   [],
  timeLogTotals:    { total_seconds: 0, total_hours: 0 },
  projectTimeSummary: { total_hours: 0, data: [] },
  timeLogLoading:   false,
  timeLogError:     false,

  // Project report screen (task.txt Part 2B) — Team Management tab's Task
  // Progress / Employee Logged Time tables. Both calls return the same
  // `project` (card header) + `summary` (four headline stats) blocks
  // alongside their own `data` rows, so either response alone could paint
  // the header — reportProject/reportSummary just track whichever loaded
  // most recently.
  reportProject:    {},
  reportSummary:    {},
  taskProgress:     [],
  employeeTimeLog:  [],
  reportLoading:    false,
  reportError:      false,

  // Project History timeline (ProjectDetails.vue's "Quick View" button) —
  // `activityLog` is an array of date groups ({ date, date_label, time,
  // label, entries: [...] }). The endpoint returns everything in one shot
  // (no pg_count/next/previous in the real response, despite the API guide
  // describing pagination params) — fetched and rendered as a single flat
  // list, no paging.
  activityLog:        [],
  activityLogLoading: false,
  activityLogError:   false,

  // Project Activity (the diary) — PROJECT_ACTIVITY_API.md Part 1. Plain
  // array of Activity rows for whatever `type` filter is currently applied
  // (see fetchProjectActivity).
  projectActivity:        [],
  projectActivityLoading: false,
  projectActivityError:   false,
})

const getters = {
  taskCategory:       (state) => state.taskCategory,
  taskList:           (state) => state.taskList,
  taskDetail:         (state) => state.taskDetail,
  comments:           (state) => state.comments,
  subTaskList:        (state) => state.subTaskList,
  taskLoading:        (state) => state.taskLoading,
  taskError:          (state) => state.taskError,
  taskCommentLoading: (state) => state.taskCommentLoading,
  taskCommentError:   (state) => state.taskCommentError,
  submitLoading:      (state) => state.submitLoading,
  submitError:        (state) => state.submitError,

  taskLabelTemplates: (state) => state.taskLabelTemplates,
  templateLoading:    (state) => state.templateLoading,
  templateError:      (state) => state.templateError,

  runningTimers:      (state) => state.runningTimers,
  timeLogsByTask:     (state) => state.timeLogsByTask,
  timeLogTotals:      (state) => state.timeLogTotals,
  projectTimeSummary: (state) => state.projectTimeSummary,
  timeLogLoading:     (state) => state.timeLogLoading,
  timeLogError:       (state) => state.timeLogError,

  reportProject:      (state) => state.reportProject,
  reportSummary:      (state) => state.reportSummary,
  taskProgress:       (state) => state.taskProgress,
  employeeTimeLog:    (state) => state.employeeTimeLog,
  reportLoading:      (state) => state.reportLoading,
  reportError:        (state) => state.reportError,

  activityLog:        (state) => state.activityLog,
  activityLogLoading: (state) => state.activityLogLoading,
  activityLogError:   (state) => state.activityLogError,

  projectActivity:        (state) => state.projectActivity,
  projectActivityLoading: (state) => state.projectActivityLoading,
  projectActivityError:   (state) => state.projectActivityError,
}

const mutations = {
  SET_TASK_CATEGORY(state, taskCategory) { state.taskCategory = taskCategory },
  SET_TASK_LIST(state, list) { state.taskList = list },
  SET_TASK_DETAILS(state, detail) { state.taskDetail = detail },
  SET_COMMENTS(state, list) { state.comments = list },
  SET_SUB_TASK_LIST(state, list) { state.subTaskList = list },
  TASK_LOADING(state, loading) { state.taskLoading = loading },
  TASK_ERROR(state, hasError) { state.taskError = hasError },
  TASK_COMMENT_LOADING(state, loading) { state.taskCommentLoading = loading },
  TASK_COMMENT_ERROR(state, hasError) { state.taskCommentError = hasError },
  SUBMIT_LOADING(state, loading) { state.submitLoading = loading },
  SUBMIT_ERROR(state, hasError) { state.submitError = hasError },
  SUBMIT_SUCCESS(state, success) { state.submitSuccess = success },

  SET_TASK_LABEL_TEMPLATES(state, list) { state.taskLabelTemplates = list },
  TEMPLATE_LOADING(state, loading) { state.templateLoading = loading },
  TEMPLATE_ERROR(state, hasError) { state.templateError = hasError },

  SET_RUNNING_TIMERS(state, list) { state.runningTimers = list },
  SET_TIME_LOGS_BY_TASK(state, { list, total_seconds, total_hours }) {
    state.timeLogsByTask = list
    state.timeLogTotals = { total_seconds, total_hours }
  },
  SET_PROJECT_TIME_SUMMARY(state, summary) { state.projectTimeSummary = summary },
  TIME_LOG_LOADING(state, loading) { state.timeLogLoading = loading },
  TIME_LOG_ERROR(state, hasError) { state.timeLogError = hasError },

  SET_TASK_PROGRESS(state, { project, summary, data }) {
    state.reportProject = project
    state.reportSummary = summary
    state.taskProgress = data
  },
  SET_EMPLOYEE_TIME_LOG(state, { project, summary, data }) {
    state.reportProject = project
    state.reportSummary = summary
    state.employeeTimeLog = data
  },
  REPORT_LOADING(state, loading) { state.reportLoading = loading },
  REPORT_ERROR(state, hasError) { state.reportError = hasError },

  SET_PROJECT_ACTIVITY_LOG(state, list) { state.activityLog = list },
  ACTIVITY_LOG_LOADING(state, loading) { state.activityLogLoading = loading },
  ACTIVITY_LOG_ERROR(state, hasError) { state.activityLogError = hasError },

  SET_PROJECT_ACTIVITY(state, list) { state.projectActivity = list },
  PROJECT_ACTIVITY_LOADING(state, loading) { state.projectActivityLoading = loading },
  PROJECT_ACTIVITY_ERROR(state, hasError) { state.projectActivityError = hasError },
}

const actions = {
  // Adds a synthetic "Add New" card + per-label placeholder task, matching
  // the legacy Kanban board's trailing "add" column/card behavior.
  async fetchTaskCategory({ commit }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_task_category}${payload}`)
      data.data.labels.forEach((label) => {
        data.data.tasks.push({
          complete: false, description: null, end_date: null, id: Math.random(),
          label, parent: 0, priority: '1', progress: null, project: 1,
          start_date: null, status: label, teammates: [], title: 'Add New',
        })
      })
      data.data.labels.push('Add New')
      commit('SET_TASK_CATEGORY', data.data)
    } catch {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addTaskCategory({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_task_category, { name: payload.name, project: payload.project })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async editTaskLabel({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.update_task_label, {
        old_label: payload.old_label, new_label: payload.new_label, project_id: payload.project_id,
      })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project_id)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async deleteLabel({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.delete_task_label, { name: payload.name, project_id: payload.project_id })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project_id)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async toggleTaskPriority({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.toggle_task_priority}${payload.id}/${payload.priority}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async toggleSubTaskStatus({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.toggle_task_complete_status}${payload.id}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.parent)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async toggleSubTaskCompleteFromProject({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.toggle_subtask_complete_status}${payload.id}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.parent)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async updateTask({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.patch(`${V1API.update_task}${payload.detail.id}`, payload.detail)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project_id)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addTask({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_task_with_label, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async addSubTask({ commit, dispatch }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_task, payload)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.parent)
      return data
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  async updateSubTask({ commit, dispatch }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.patch(`${V1API.update_task}${payload.sub.id}`, payload.sub)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.parent)
      return data
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  async deleteSubTask({ commit, dispatch }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.delete_task}${payload.id}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.parent)
      return data
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  async deleteTask({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.delete_task}${payload.id}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project_id)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async fetchSubTaskList({ commit }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_sub_task_list}${payload}`)
      commit('SET_SUB_TASK_LIST', data.data)
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  async fetchTaskDetails({ commit }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_task_details}${payload}`)
      commit('SET_TASK_DETAILS', data.data)
      return data
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  async updateTaskLabel({ commit, dispatch }, payload) {
    commit('SUBMIT_LOADING', true)
    commit('SUBMIT_ERROR', false)
    try {
      const { data } = await api.post(V1API.update_task_with_label, {
        pk: payload.id, label: payload.label, project_id: payload.project,
      })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchTaskCategory', payload.project)
      return data
    } catch (e) {
      commit('SUBMIT_ERROR', true)
    } finally {
      commit('SUBMIT_LOADING', false)
    }
  },

  async assignEmployee({ commit, dispatch }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.post(V1API.assign_task_employee, {
        task_id: payload.task_id, subtask_id: payload.subtask_id, member_id: payload.member_id,
      })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.task_id)
      dispatch('fetchTaskDetails', payload.task_id)
      return data
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  async deleteAssignedMember({ commit, dispatch }, payload) {
    commit('TASK_LOADING', true)
    commit('TASK_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.delete_assigned_employee}${payload.id}`)
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchSubTaskList', payload.task)
      dispatch('fetchTaskDetails', payload.task)
      return data
    } catch (e) {
      commit('TASK_ERROR', true)
    } finally {
      commit('TASK_LOADING', false)
    }
  },

  // Comments
  async fetchComments({ commit }, payload) {
    commit('TASK_COMMENT_LOADING', true)
    commit('TASK_COMMENT_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.get_comments}${payload}`)
      commit('SET_COMMENTS', data.data)
    } catch (e) {
      commit('TASK_COMMENT_ERROR', true)
    } finally {
      commit('TASK_COMMENT_LOADING', false)
    }
  },

  async addComment({ commit, dispatch }, payload) {
    commit('TASK_COMMENT_LOADING', true)
    commit('TASK_COMMENT_ERROR', false)
    try {
      const { data } = await api.post(V1API.create_comment, { task_id: payload.task_id, comment: payload.comment })
      commit('SUBMIT_SUCCESS', true)
      dispatch('fetchComments', payload.task_id)
      return data
    } catch (e) {
      commit('TASK_COMMENT_ERROR', true)
    } finally {
      commit('TASK_COMMENT_LOADING', false)
    }
  },

  // ── Task Label Templates (task.txt Part 1) ────────────────────────────
  // Reusable label presets. Belong to no project — stamping one onto a
  // project happens as a one-time COPY inside project/create (see
  // ProjectCreate.vue's `label_template` field), not through this module.
  async fetchTaskLabelTemplates({ commit }) {
    commit('TEMPLATE_LOADING', true)
    commit('TEMPLATE_ERROR', false)
    try {
      const { data } = await api.get(V1API.task_label_template_list)
      commit('SET_TASK_LABEL_TEMPLATES', data.data)
    } catch (e) {
      commit('TEMPLATE_ERROR', true)
    } finally {
      commit('TEMPLATE_LOADING', false)
    }
  },

  async createTaskLabelTemplate({ commit, dispatch }, payload) {
    commit('TEMPLATE_LOADING', true)
    commit('TEMPLATE_ERROR', false)
    try {
      const { data } = await api.post(V1API.task_label_template_create, { title: payload.title, labels: payload.labels })
      dispatch('fetchTaskLabelTemplates')
      return data
    } catch (e) {
      commit('TEMPLATE_ERROR', true)
    } finally {
      commit('TEMPLATE_LOADING', false)
    }
  },

  async editTaskLabelTemplate({ commit, dispatch }, payload) {
    commit('TEMPLATE_LOADING', true)
    commit('TEMPLATE_ERROR', false)
    try {
      const body = {}
      if (payload.title !== undefined) body.title = payload.title
      if (payload.labels !== undefined) body.labels = payload.labels
      const { data } = await api.patch(`${V1API.task_label_template_edit}${payload.id}`, body)
      dispatch('fetchTaskLabelTemplates')
      return data
    } catch (e) {
      commit('TEMPLATE_ERROR', true)
    } finally {
      commit('TEMPLATE_LOADING', false)
    }
  },

  async deleteTaskLabelTemplate({ commit, dispatch }, payload) {
    commit('TEMPLATE_LOADING', true)
    commit('TEMPLATE_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.task_label_template_delete}${payload.id}`)
      dispatch('fetchTaskLabelTemplates')
      return data
    } catch (e) {
      commit('TEMPLATE_ERROR', true)
    } finally {
      commit('TEMPLATE_LOADING', false)
    }
  },

  // ── Task Time Logs (task.txt Part 2) ──────────────────────────────────
  // Clock-in/out are GET with no body — the user comes from the JWT, the
  // task from the URL (see task.txt §2.2).
  async clockIn({ commit, dispatch }, payload) {
    commit('TIME_LOG_LOADING', true)
    commit('TIME_LOG_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.task_clock_in}${payload.taskId}`)
      dispatch('fetchRunningTimers')
      dispatch('fetchTimeLogsByTask', payload.taskId)
      return data
    } catch (e) {
      commit('TIME_LOG_ERROR', true)
    } finally {
      commit('TIME_LOG_LOADING', false)
    }
  },

  async clockOut({ commit, dispatch }, payload) {
    commit('TIME_LOG_LOADING', true)
    commit('TIME_LOG_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.task_clock_out}${payload.taskId}`)
      dispatch('fetchRunningTimers')
      dispatch('fetchTimeLogsByTask', payload.taskId)
      return data
    } catch (e) {
      commit('TIME_LOG_ERROR', true)
    } finally {
      commit('TIME_LOG_LOADING', false)
    }
  },

  // The page-load/app-resume endpoint — also force-closes any timer left
  // running from a previous day server-side (close_stale()), so this is
  // worth calling whenever the task sidebar opens, not just once at login.
  async fetchRunningTimers({ commit }) {
    try {
      const { data } = await api.get(V1API.task_timer_running)
      commit('SET_RUNNING_TIMERS', data.data)
      return data
    } catch (e) {
      commit('TIME_LOG_ERROR', true)
    }
  },

  async fetchTimeLogsByTask({ commit }, taskId) {
    commit('TIME_LOG_LOADING', true)
    commit('TIME_LOG_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.task_time_logs_by_task}${taskId}`)
      commit('SET_TIME_LOGS_BY_TASK', { list: data.data, total_seconds: data.total_seconds, total_hours: data.total_hours })
    } catch (e) {
      commit('TIME_LOG_ERROR', true)
    } finally {
      commit('TIME_LOG_LOADING', false)
    }
  },

  async deleteTimeLog({ commit, dispatch }, payload) {
    commit('TIME_LOG_LOADING', true)
    commit('TIME_LOG_ERROR', false)
    try {
      const { data } = await api.delete(`${V1API.task_time_log_delete}${payload.id}`)
      dispatch('fetchTimeLogsByTask', payload.taskId)
      return data
    } catch (e) {
      commit('TIME_LOG_ERROR', true)
    } finally {
      commit('TIME_LOG_LOADING', false)
    }
  },

  async fetchProjectTimeSummary({ commit }, projectId) {
    commit('TIME_LOG_LOADING', true)
    commit('TIME_LOG_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.project_time_summary}${projectId}`)
      commit('SET_PROJECT_TIME_SUMMARY', { total_hours: data.total_hours, data: data.data })
    } catch (e) {
      commit('TIME_LOG_ERROR', true)
    } finally {
      commit('TIME_LOG_LOADING', false)
    }
  },

  // ── Project report screen (task.txt Part 2B) ────────────────────────────
  // Both endpoints take the project's human-readable `project_id` STRING
  // (not the numeric pk) and accept an optional inclusive `start_date`/
  // `end_date` (YYYY-MM-DD) range — omit both for the all-time view.
  async fetchTaskProgress({ commit }, { projectId, start_date, end_date } = {}) {
    commit('REPORT_LOADING', true)
    commit('REPORT_ERROR', false)
    try {
      const params = {}
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date
      const { data } = await api.get(`${V1API.project_task_progress}${projectId}`, { params })
      commit('SET_TASK_PROGRESS', { project: data.project, summary: data.summary, data: data.data })
      return data
    } catch (e) {
      commit('REPORT_ERROR', true)
    } finally {
      commit('REPORT_LOADING', false)
    }
  },

  async fetchEmployeeTimeLog({ commit }, { projectId, start_date, end_date } = {}) {
    commit('REPORT_LOADING', true)
    commit('REPORT_ERROR', false)
    try {
      const params = {}
      if (start_date) params.start_date = start_date
      if (end_date) params.end_date = end_date
      const { data } = await api.get(`${V1API.project_employee_time_log}${projectId}`, { params })
      commit('SET_EMPLOYEE_TIME_LOG', { project: data.project, summary: data.summary, data: data.data })
      return data
    } catch (e) {
      commit('REPORT_ERROR', true)
    } finally {
      commit('REPORT_LOADING', false)
    }
  },

  // Project-scoped activity log (History timeline) — takes the numeric
  // project pk. Returns everything in one response, no pagination.
  async fetchProjectActivityLog({ commit }, projectId) {
    commit('ACTIVITY_LOG_LOADING', true)
    commit('ACTIVITY_LOG_ERROR', false)
    try {
      const { data } = await api.get(`${V1API.project_activity_log}${projectId}`)
      commit('SET_PROJECT_ACTIVITY_LOG', data.data || [])
      return data
    } catch (e) {
      commit('ACTIVITY_LOG_ERROR', true)
    } finally {
      commit('ACTIVITY_LOG_LOADING', false)
    }
  },

  // ── Project Activity (the diary) — PROJECT_ACTIVITY_API.md Part 1 ───────
  // `type` filters by call/email/message/meeting/comment/next_action (or
  // 'all'); `task`/`is_done` are the other optional filters the list
  // endpoint accepts. Not paginated ("Sorted newest date first. Not
  // paginated.").
  async fetchProjectActivity({ commit }, { projectId, type, task, is_done } = {}) {
    commit('PROJECT_ACTIVITY_LOADING', true)
    commit('PROJECT_ACTIVITY_ERROR', false)
    try {
      const params = {}
      if (type != null) params.type = type
      if (task != null) params.task = task
      if (is_done != null) params.is_done = is_done
      const { data } = await api.get(`${V1API.project_activity_by_project}${projectId}`, { params })
      commit('SET_PROJECT_ACTIVITY', data.data || [])
      return data
    } catch (e) {
      commit('PROJECT_ACTIVITY_ERROR', true)
    } finally {
      commit('PROJECT_ACTIVITY_LOADING', false)
    }
  },

  // `type` here is the list filter to re-fetch with afterward (the diary
  // sub-tab the caller is currently on), not necessarily the entry's own
  // type — same for edit/toggle/delete below.
  async createProjectActivity({ commit, dispatch }, { projectId, payload, type }) {
    commit('PROJECT_ACTIVITY_LOADING', true)
    try {
      const { data } = await api.post(`${V1API.project_activity_create}${projectId}`, payload)
      if (data?.code === 200) await dispatch('fetchProjectActivity', { projectId, type })
      return data
    } catch (e) {
      commit('PROJECT_ACTIVITY_ERROR', true)
      throw e
    } finally {
      commit('PROJECT_ACTIVITY_LOADING', false)
    }
  },

  async editProjectActivity({ commit, dispatch }, { id, payload, projectId, type }) {
    commit('PROJECT_ACTIVITY_LOADING', true)
    try {
      const { data } = await api.patch(`${V1API.project_activity_edit}${id}`, payload)
      if (data?.code === 200) await dispatch('fetchProjectActivity', { projectId, type })
      return data
    } catch (e) {
      commit('PROJECT_ACTIVITY_ERROR', true)
      throw e
    } finally {
      commit('PROJECT_ACTIVITY_LOADING', false)
    }
  },

  // No body — flips is_done, same as the lead next-actions endpoint.
  async toggleActivityDone({ commit, dispatch }, { id, projectId, type }) {
    try {
      const { data } = await api.patch(`${V1API.project_activity_toggle_done}${id}`)
      await dispatch('fetchProjectActivity', { projectId, type })
      return data
    } catch (e) {
      commit('PROJECT_ACTIVITY_ERROR', true)
    }
  },

  async deleteProjectActivity({ commit, dispatch }, { id, projectId, type }) {
    try {
      const { data } = await api.delete(`${V1API.project_activity_delete}${id}`)
      await dispatch('fetchProjectActivity', { projectId, type })
      return data
    } catch (e) {
      commit('PROJECT_ACTIVITY_ERROR', true)
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
