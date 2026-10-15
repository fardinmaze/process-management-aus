<template>
<div class="page">
  <div class="page-header">
    <div>
      <h1 class="page-title">Project Details</h1>

    </div>
    <div class="flex items-center gap-2">
      <button
        v-if="project.id"
        type="button"
        class="btn btn--primary"
        :disabled="chatOpening"
        title="Open this project's team chat"
        @click="openProjectChat"
      >
        <i :class="chatOpening ? 'ri-loader-4-line spinning' : 'ri-chat-3-line'" /> Chat
      </button>
      <button type="button" class="btn btn--ghost" @click="goBack">
        <i class="ri-arrow-left-line" /> Back
      </button>
    </div>
  </div>

  <div v-if="loading && !project.id" class="page-loader text-muted">Loading…</div>
  <div v-else-if="detailError" class="empty-state">
    <i class="ri-error-warning-line" />
    <h3>Couldn't load this project</h3>
    <p>Please try again.</p>
  </div>

  <template v-else>
    <!-- Figma node 848-21186 — brand row / meta bar / search+tabs / kanban -->
    <div class="bg-white border border-typo-100 rounded-xl p-5 flex flex-col gap-5">
      <!-- Row 1: Reference ID (left) + action buttons (right) -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex items-center gap-2 text-xs text-typo-500">
          <span>Reference ID:</span>
          <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
          <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button v-if="canManage" type="button" class="inline-flex items-center gap-2 bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-md hover:bg-brand-700 whitespace-nowrap" @click="openQuickAdd">
            <i class="ri-add-line" /> Add New Task
          </button>
          <button type="button" class="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-600 text-xs font-semibold px-4 py-2 rounded-md hover:bg-brand-100 whitespace-nowrap" @click="selectTab({ key: 'activity' })">
            <i class="ri-discuss-line" /> Activity Log
          </button>
          <button type="button" class="inline-flex items-center justify-center bg-brand-50 border border-brand-100 text-brand-600 w-8 h-8 rounded-md hover:bg-brand-100 shrink-0" title="Quick View" @click="openQuickView">
            <i class="ri-eye-line" />
          </button>
        </div>
      </div>

      <!-- Row 2: title/health (left) — priority/status (center) — team lead/created date (right).
           Each of the 3 groups is flex-1 (equal thirds) instead of shrink-to-fit,
           so a long project title can't crowd the other two out of position. -->
      <div class="flex flex-col lg:flex-row lg:items-center gap-4">
        <div class="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
          <h2 class="text-2xl text-brand-700 m-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h2>
          <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
            <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
          </span>
        </div>

        <div class="flex-1 flex items-center justify-start lg:justify-center gap-6 text-xs text-typo-500 flex-wrap">
          <div class="flex items-center gap-3">
            <span>Priority:</span>
            <span v-if="canManage" class="status-select-wrap" :class="[priorityStyle(project.priority), { 'status-select-wrap--disabled': prioritySaving }]">
              <select class="status-select" :value="project.priority" :disabled="prioritySaving" @change="handlePriorityChange($event.target.value)">
                <option v-for="p in PRIORITY_LIST" :key="p" :value="p">{{ capitalize(p) }}</option>
              </select>
              <i class="ri-arrow-down-s-line status-select__icon" />
            </span>
            <span v-else class="font-semibold uppercase tracking-wide" :class="priorityTextStyle(project.priority)">{{ project.priority }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span>Status:</span>
            <span v-if="canManage" class="status-select-wrap" :class="[statusStyle(project.status), { 'status-select-wrap--disabled': statusSaving }]">
              <select class="status-select" :value="project.status" :disabled="statusSaving" @change="handleStatusChange($event.target.value)">
                <option v-for="s in STATUS_LIST" :key="s" :value="s">{{ capitalize(s) }}</option>
              </select>
              <i class="ri-arrow-down-s-line status-select__icon" />
            </span>
            <span v-else class="font-semibold uppercase tracking-wide" :class="statusTextStyle(project.status)">{{ project.status }}</span>
          </div>
        </div>

        <div class="flex-1 flex items-center justify-start lg:justify-end gap-6 text-xs text-typo-500 flex-wrap">
          <div class="flex items-center gap-2">
            <span>Team Lead:</span>
            <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-2.5 py-1 text-typo-700 font-medium">
              <span class="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[8px] font-bold shrink-0 overflow-hidden">
                <img v-if="createdByPhoto" :src="createdByPhoto" :alt="createdByName" class="w-full h-full object-cover" />
                <span v-else>{{ getInitials(createdByName) }}</span>
              </span>
              {{ createdByName }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span>Created Date:</span>
            <strong class="text-brand-700 font-medium">{{ formatDate(project.created_at || project.start_date) }}</strong>
          </div>
        </div>
      </div>

      <hr class="border-typo-100 m-0" />

      <div class="flex flex-wrap items-center justify-between gap-4">
        <SearchBox v-model="searchTerm" :active="!!searchTerm" placeholder="Type to Search" @clear="searchTerm = ''" />

        <nav class="flex items-center gap-5 text-sm flex-wrap">
          <button
            v-for="t in TABS" :key="t.key" type="button"
            class="pb-1 border-b-2 transition-colors"
            :class="activeTab === t.key && sidebarOpen ? 'border-brand-600 text-brand-600 font-semibold' : 'border-transparent text-typo-400 hover:text-typo-600'"
            @click="selectTab(t)"
          >{{ t.label }}</button>
        </nav>
      </div>

      <!-- Task Board -->
      <div v-if="taskLoading && !taskCategory.labels" class="page-loader text-muted">Loading…</div>
      <div v-else-if="taskCategory.labels" class="kanban-board">
        <div
          v-for="(stage, sIdx) in visibleStages" :key="stage" class="kanban-col"
          :style="stage !== 'Add New' ? { background: stageColor(stage, sIdx) } : null"
        >
          <div class="kanban-col-header">
            <template v-if="stage === 'Add New'">
              <input v-model="newStageName" type="text" class="form-input" placeholder="New stage name" @keyup.enter="addStage" />
              <button type="button" class="icon-btn icon-btn--success shrink-0" title="Add stage" :disabled="!newStageName.trim() || stageSaving" @click="addStage">
                <i class="ri-add-line" />
              </button>
            </template>
            <template v-else>
              <div class="flex items-center gap-2 min-w-0">
                <span class="kanban-stage-label">{{ stage }}</span>
                <span class="text-[11px] text-brand-600 bg-typo-50 border border-typo-100 rounded-full px-2.5 py-0.5 shrink-0 whitespace-nowrap">
                  {{ pad2(stageTaskCount(stage)) }} Tasks
                </span>
              </div>
              <div v-if="canManage" class="flex items-center gap-0.5 shrink-0">
                <button type="button" class="kanban-icon-btn" title="Add task" @click="toggleAddTask(stage)"><i class="ri-add-line" /></button>
                <div class="kanban-menu">
                  <button type="button" class="kanban-icon-btn" title="More" @click.stop="toggleStageMenu(stage)"><i class="ri-more-2-fill" /></button>
                  <div v-if="openStageMenu === stage" class="kanban-menu__panel">
                    <button type="button" class="icon-btn icon-btn--edit" title="Edit stage" @click="startEditLabel(stage); openStageMenu = null" />
                    <button type="button" class="icon-btn icon-btn--delete" title="Delete stage" @click="askDeleteLabel(stage); openStageMenu = null" />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <div v-if="stage !== 'Add New'" class="kanban-col-divider"></div>

          <div class="kanban-col-body" @dragover.prevent @drop="onDropTask(stage)">
            <div v-if="!visibleTasksForStage(stage).length" class="kanban-empty">No tasks</div>

            <template v-for="t in visibleTasksForStage(stage)" :key="t.id">
              <div v-if="isAddTaskPlaceholder(t)" class="kanban-add-task">
                <input v-model="t.new_title" type="text" class="form-input" placeholder="Enter title" @keyup.enter="addTask(stage, t)" />
                <button type="button" class="btn btn--primary btn--sm mt-2 w-full justify-center" :disabled="!t.new_title || addingTask" @click="addTask(stage, t)">
                  Add
                </button>
              </div>

              <div v-else class="bg-white border border-typo-50 rounded-lg p-3 shadow-[2px_2px_6px_rgba(220,220,220,0.24)] cursor-pointer transition-transform hover:-translate-y-0.5" draggable="true" @dragstart="onDragStart(t)" @click="openTask(t)">
                <div class="flex items-center justify-between gap-2">
                  <h6 class="text-base font-medium text-brand-600 m-0 truncate">{{ t.title }}</h6>
                  <span class="text-[10px] text-typo-500 shrink-0">{{ formatDate(t.start_date, 'DD.MM.YYYY') }}</span>
                </div>
                <div class="flex items-center justify-between gap-2 mt-2 text-[10px]">
                  <span class="text-typo-500">Priority:</span>
                  <button type="button" class="font-semibold" :class="priorityTextClass(t.priority)" @click.stop="cyclePriority(t)">
                    {{ priorityLabel(t.priority) }}
                  </button>
                </div>
                <div class="flex items-center justify-between gap-2 mt-2">
                  <ul class="kanban-card-stats">
                    <li title="Total"><i class="ri-focus-3-line" /> {{ t.subtask_count?.total ?? 0 }}</li>
                    <li title="Pending"><i class="ri-information-line" /> {{ t.subtask_count?.pending ?? 0 }}</li>
                    <li title="Completed"><i class="ri-checkbox-circle-line" /> {{ t.subtask_count?.complete ?? 0 }}</li>
                  </ul>
                  <div class="kanban-card-avatars">
                    <span v-if="t.teammates?.length > 3" class="kanban-card-avatars__more">+{{ t.teammates.length - 3 }}</span>
                    <span v-for="(m, i) in (t.teammates || []).slice(0, 3)" :key="i" class="kanban-card-avatar" :title="m.user_name">
                      <img v-if="teammatePhoto(m)" :src="teammatePhoto(m)" :alt="m.user_name" />
                      <span v-else>{{ getInitials(m.user_name) }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- ───────────────────────── Task / Subtask sidebar ───────────────────────── -->
  <teleport to="body" v-if="taskSidebarOpen">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="closeTaskSidebar">
      <aside class="entity-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[560px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]" style="animation: sidebar-slide-in .22s ease" role="dialog" aria-modal="true">
        <div class="flex items-center justify-end gap-1 px-5 pt-4 pb-2 shrink-0">
        
          <button type="button" class="entity-sidebar__close" @click="closeTaskSidebar"><i class="ri-close-line" /></button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-5 flex flex-col gap-4">
          <!-- Project identity header (Figma node 772-19637) — always first, sidebar contents follow -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{{ getInitials(project.title) }}</span>
              <h4 class="text-xl text-brand-700 m-0 flex-1 min-w-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h4>
              <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
                <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
              </span>
                <button type="button" class="icon-btn icon-btn--chat" title="Discussions" @click="openTaskDiscussion" />
          <button type="button" class="icon-btn icon-btn--delete" title="Delete Task" @click="askDeleteTask" />
            </div>
            <div class="flex items-center gap-2 text-xs text-typo-500">
              <span>Reference ID:</span>
              <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
              <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
            </div>
          </div>
          <hr class="border-typo-100 m-0" />

          <!-- Sidebar contents -->
          <h3 class="text-base font-bold text-slate-800 m-0">{{ taskDetail.title || 'Task' }}</h3>

          <!-- Task edit / view -->
          <div v-if="taskEditing" class="flex flex-col gap-3">
            <div class="form-group">
              <label class="form-label">Task Title</label>
              <input v-model="taskForm.title" type="text" class="form-input" />
            </div>
            <div class="form-row flex gap-3">
              <div class="form-group flex-1">
                <label class="form-label">Start Date</label>
                <DatePicker v-model="taskForm.start_date" />
              </div>
              <div class="form-group flex-1">
                <label class="form-label">Deadline</label>
                <DatePicker v-model="taskForm.end_date" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Task Details</label>
              <BalloonEditor v-model="taskForm.description" placeholder="Enter task details…" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn--ghost" @click="taskEditing = false">Cancel</button>
              <button type="button" class="btn btn--primary" :disabled="taskSaving" @click="saveTask">
                {{ taskSaving ? 'Saving…' : 'Submit' }}
              </button>
            </div>
          </div>

          <div v-else class="flex flex-col gap-2">
            <div class="flex items-start justify-between gap-3">
              <div
                class="task-description text-sm text-slate-600" :class="{ 'line-clamp-4': !taskDescExpanded }"
                v-html="taskDetail.description || '<span class=\'text-slate-400\'>No description.</span>'"
              />
              <button type="button" class="icon-btn icon-btn--edit shrink-0" title="Edit" @click="editTask" />
            </div>
            <button v-if="taskDescIsLong" type="button" class="text-xs font-semibold self-start" style="color:#007aff" @click="taskDescExpanded = !taskDescExpanded">
              {{ taskDescExpanded ? 'Read Less' : 'Read More' }}
            </button>
            <div v-if="taskDetail.start_date || taskDetail.end_date" class="flex items-center justify-between text-xs text-typo-500">
              <span>Time Period:</span>
              <span class="flex items-center gap-2">
                {{ formatDate(taskDetail.start_date) }} - {{ formatDate(taskDetail.end_date) }} <i class="ri-calendar-2-line" />
              </span>
            </div>
          </div>

          <!-- Members -->
          <div>
            <MemberAssignPicker
              label="Members" pill search-when-empty can-remove
              :assigned-members="taskAssignedMembers" :available-members="projectTeamMembers"
              :assigning="assigningMember"
              @assign="(ids) => onAssignMembers(ids, null)"
              @unassign="onUnassignMember"
            />
          </div>

          <hr class="border-slate-100" />

          <!-- Time tracking (task.txt Part 2) -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-bold text-slate-800 m-0">Time Tracking</h4>
              <button
                type="button" class="btn btn--sm" :class="myRunningTimerForTask ? 'btn--danger' : 'btn--success'"
                :disabled="clockBusy" @click="toggleClock"
              >
                <i :class="myRunningTimerForTask ? 'ri-stop-circle-line' : 'ri-play-circle-line'" />
                {{ myRunningTimerForTask ? 'Clock Out' : 'Clock In' }}
              </button>
            </div>
            <div v-if="myRunningTimerForTask" class="text-sm font-semibold text-secondary-600 flex items-center gap-1.5">
              <i class="ri-time-line" /> {{ taskTimerElapsedLabel }} elapsed
            </div>
            <!-- Collapsed to just the Clock In/Out control while creating a
                 subtask below, so the sidebar isn't showing two lists at once. -->
            <template v-if="!subCreateOpen">
              <div v-if="!timeLogsByTask.length" class="text-xs text-slate-400">No time logged yet.</div>
              <template v-else>
                <div v-for="log in timeLogsByTask" :key="log.id" class="flex items-center justify-between gap-2 text-xs text-slate-600 py-1 border-b border-slate-50 last:border-0">
                  <span class="font-medium text-slate-700">{{ log.member_name }}</span>
                  <span>{{ formatDateTime(log.clock_in) }}<template v-if="log.clock_out"> – {{ formatDateTime(log.clock_out) }}</template></span>
                  <span class="font-semibold">{{ formatLoggedDuration(log.duration_seconds) }}</span>
                  <!-- <button type="button" class="icon-btn icon-btn--delete shrink-0" title="Delete log" @click="askDeleteTimeLog(log)"></button> -->
                </div>
                <div class="text-xs font-semibold text-slate-700 text-right">Total: {{ timeLogTotals.total_hours }}h</div>
              </template>
            </template>
          </div>

          <hr class="border-slate-100" />

          <!-- Subtasks -->
          <div class="flex flex-col gap-4">
            <h4 class="text-sm font-bold text-slate-800 m-0">Subtasks</h4>

            <!-- Hidden while creating a new subtask, so the create form is the
                 only thing on screen instead of competing with the full list. -->
            <template v-if="!subCreateOpen">
              <div v-if="!subTaskList.length" class="text-xs text-slate-400">No subtasks yet.</div>

              <div v-for="sub in subTaskList" :key="sub.id" class="subtask-row">
              <template v-if="editSubTarget === sub.id">
                <input v-model="editSubForm.title" type="text" class="form-input mb-2" placeholder="Enter title" />
                <BalloonEditor v-model="editSubForm.description" placeholder="Enter subtask details…" />
                <DatePicker v-model="editSubForm.end_date" placeholder="Deadline" class="mt-2" />
                <div class="form-actions mt-2">
                  <button type="button" class="btn btn--ghost btn--sm" @click="editSubTarget = null">Cancel</button>
                  <button type="button" class="btn btn--primary btn--sm" :disabled="subSaving" @click="saveSubTask(sub)">Submit</button>
                </div>
              </template>
              <template v-else>
                <div class="flex items-start gap-2.5">
                  <input type="checkbox" class="mt-1" :checked="sub.complete" @change="toggleSubtask(sub)" />
                  <div class="flex-1 min-w-0">
                    <h6 class="subtask-row__title">
                      {{ sub.title }}
                      <span v-if="sub.end_date" class="badge badge--danger ml-2">{{ sub.end_date }}</span>
                    </h6>
                    <p class="subtask-row__desc" :class="{ 'line-clamp-3': !expandedSubDescs[sub.id] }" v-html="sub.description" />
                    <button v-if="subDescIsLong(sub)" type="button" class="text-[11px] font-semibold mt-0.5" style="color:#007aff" @click="toggleSubDesc(sub)">
                      {{ expandedSubDescs[sub.id] ? 'Read Less' : 'Read More' }}
                    </button>
                    <div class="flex items-center gap-1.5 mt-1.5">
                      <span v-for="(m, i) in (sub.teammates || [])" :key="i" class="kanban-card-avatar" :title="m.user_name">
                        <img v-if="teammatePhoto(m)" :src="teammatePhoto(m)" :alt="m.user_name" />
                        <span v-else>{{ getInitials(m.user_name) }}</span>
                      </span>
                    </div>
                    <div v-if="subRunningTimer(sub)" class="text-xs font-semibold text-secondary-600 flex items-center gap-1 mt-1.5">
                      <i class="ri-time-line" /> {{ subTimerElapsedLabel(sub) }} elapsed
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button
                      type="button" class="icon-btn" :class="subRunningTimer(sub) ? 'icon-btn--danger' : 'icon-btn--success'"
                      :title="subRunningTimer(sub) ? 'Clock Out' : 'Clock In'" :disabled="clockBusy" @click="toggleClockFor(sub.id)"
                    >
                      <i :class="subRunningTimer(sub) ? 'ri-stop-circle-line' : 'ri-play-circle-line'" />
                    </button>
                    <button type="button" class="icon-btn icon-btn--assign" title="Assign Member" @click="toggleSubAssign(sub)" />
                    <button type="button" class="icon-btn icon-btn--edit" title="Edit" @click="startEditSub(sub)" />
                    <button type="button" class="icon-btn icon-btn--delete" title="Delete" @click="askDeleteSub(sub)" />
                  </div>
                </div>
                <div v-if="subAssignTarget === sub.id" class="mt-2">
                  <MemberAssignPicker
                    :assigned-members="mapTeammates(sub.teammates)" :available-members="availableTaskMembers"
                    :assigning="assigningMember"
                    @assign="(ids) => onAssignMembers(ids, sub.id)"
                    @unassign="onUnassignMember"
                  />
                </div>
              </template>
            </div>
            </template>

            <!-- Create subtask -->
            <button v-if="!subCreateOpen" type="button" class="btn btn--ghost btn--sm w-full justify-center" @click="subCreateOpen = true">
              <i class="ri-add-line" /> Add Subtask
            </button>
            <div v-else class="subtask-create">
              <input v-model.trim="subForm.title" type="text" class="form-input mb-2" placeholder="Enter title" />
              <BalloonEditor v-model="subForm.description" placeholder="Enter subtask details…" />
              <div class="flex justify-end gap-2 mt-2">
                <button type="button" class="btn btn--ghost btn--sm" @click="cancelCreateSubTask">Cancel</button>
                <button type="button" class="btn btn--success btn--sm" :disabled="!subForm.title || subCreating" @click="createSubTask">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </teleport>

  <!-- ───────────────────────── Task discussion sidebar (nested) ───────────────────────── -->
  <teleport to="body" v-if="taskDiscussionOpen">
    <div class="fixed inset-0 bg-slate-900/30 z-[1100]" style="animation: sidebar-backdrop-in .2s ease" @click.self="closeTaskDiscussion">
      <aside class="entity-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[620px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]" style="animation: sidebar-slide-in .22s ease" role="dialog" aria-modal="true">
        <div class="flex items-center justify-end px-5 pt-4 shrink-0">
          <button type="button" class="entity-sidebar__close" @click="closeTaskDiscussion"><i class="ri-close-line" /></button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-5 flex flex-col gap-3">
          <!-- Project identity header (Figma node 772-19637) — always first, sidebar contents follow -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{{ getInitials(project.title) }}</span>
              <h4 class="text-xl text-brand-700 m-0 flex-1 min-w-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h4>
              <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
                <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-typo-500">
              <span>Reference ID:</span>
              <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
              <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
            </div>
          </div>
          <hr class="border-typo-100 m-0" />

          <!-- Sidebar contents -->
          <h3 class="text-base font-bold text-slate-800 m-0 truncate">Discussions — {{ taskDetail.title || 'Task' }}</h3>

          <div v-if="!comments.length" class="text-xs text-slate-400">No comments yet.</div>
          <div v-for="(c, idx) in comments" :key="idx" class="comment-row">
            <span class="comment-row__avatar">
              <img v-if="commentPhoto(c)" :src="commentPhoto(c)" :alt="c.commenter" />
              <span v-else>{{ getInitials(c.commenter) }}</span>
            </span>
            <div class="min-w-0">
              <h7 class="comment-row__name">{{ c.commenter }}</h7>
              <p class="comment-row__msg" v-html="linkify(c.comment)" />
            </div>
          </div>
        </div>

        <div class="flex gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <input v-model.trim="newComment" type="text" class="form-input" placeholder="Write your comment here…" @keyup.enter="addComment" />
          <button type="button" class="btn btn--success shrink-0" :disabled="!newComment || commentSending" @click="addComment">Comment</button>
        </div>
      </aside>
    </div>
  </teleport>

  <!-- ───────────────────────── Supporting Documents sidebar (Figma node 772-19637) ───────────────────────── -->
  <teleport to="body" v-if="showDocsPanel">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="showDocsPanel = false">
      <aside class="entity-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[620px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]" style="animation: sidebar-slide-in .22s ease" role="dialog" aria-modal="true">
        <div class="flex items-center justify-end px-5 pt-4 shrink-0">
          <button type="button" class="entity-sidebar__close" @click="showDocsPanel = false"><i class="ri-close-line" /></button>
        </div>
        <div class="flex-1 min-h-0 overflow-y-auto px-5 pb-5 flex flex-col gap-3">
          <!-- Project identity header (Figma node 772-19637) — always first, sidebar contents follow -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{{ getInitials(project.title) }}</span>
              <h4 class="text-xl text-brand-700 m-0 flex-1 min-w-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h4>
              <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
                <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-typo-500">
              <span>Reference ID:</span>
              <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
              <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
            </div>
          </div>
          <hr class="border-typo-100 m-0" />

          <!-- Sidebar contents — reuses the shared Supporting Documents panel (also used
               by requisition/quotation/invoice/purchase-order details) instead of a
               project-specific table. -->
          <SupportingDocuments
            :documents="projectAttachmentAll"
            :entity-id="project.id"
            file-key="project_attachment"
            id-key="project_id"
            add-action="project/addProjectAttachment"
            delete-action="project/deleteAttachmentFromProjects"
          />
        </div>
      </aside>
    </div>
  </teleport>

  <!-- ───────────────────────── Deliverables sidebar ───────────────────────── -->
  <teleport to="body" v-if="showDeliverables">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="showDeliverables = false">
      <aside class="entity-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[620px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]" style="animation: sidebar-slide-in .22s ease" role="dialog" aria-modal="true">
        <div class="flex items-center justify-end px-5 pt-4 pb-2 shrink-0">
          <button type="button" class="entity-sidebar__close" @click="showDeliverables = false"><i class="ri-close-line" /></button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-5 flex flex-col gap-5">
          <!-- Project identity header (Figma node 772-19637), same as the Overview/Team/Finance sidebar -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5">
              <h4 class="text-xl text-brand-700 m-0 flex-1 min-w-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h4>
              <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
                <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-typo-500">
              <span>Reference ID:</span>
              <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
              <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
            </div>
          </div>
          <hr class="border-typo-100 m-0" />

          <h3 class="text-lg font-bold text-typo-700 m-0">Deliverables</h3>

          <div v-if="!project.project_deliverable?.length" class="empty-state">
            <i class="ri-checkbox-line" />
            <h3>No deliverables</h3>
            <p>No deliverables added for this project.</p>
          </div>
          <template v-else>
            <div v-for="(d, idx) in project.project_deliverable" :key="idx">
              <p class="font-semibold m-0 mb-2">#{{ idx + 1 }} — {{ d.delivery_type?.name }}</p>
              <p v-if="d.date" class="text-sm text-slate-500 mb-2"><strong>Date:</strong> {{ formatDate(d.date) }}</p>
              <div class="table-wrap">
                <table class="table">
                  <thead><tr><th>#</th><th>Expected Deliverables</th><th>Due Date</th></tr></thead>
                  <tbody>
                    <tr v-for="(det, i) in d.details" :key="i">
                      <td>{{ i + 1 }}</td>
                      <td>{{ det.expected_deliverable }}</td>
                      <td>{{ det.due_date ? formatDate(det.due_date) : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Payment installments — each tied to one or more deliverables
                 above by name, so they're shown together here instead of
                 only behind the separate "Installments" finance chip. -->
            <div v-if="project.installments?.length">
              <p class="font-semibold m-0 mb-2">Payment Installments</p>
              <div class="table-wrap">
                <table class="table">
                  <thead><tr><th>#</th><th>Date</th><th>Percentage</th><th>PO Value</th><th>Deliverables</th></tr></thead>
                  <tbody>
                    <tr v-for="(inst, idx) in project.installments" :key="idx">
                      <td>{{ idx + 1 }}</td>
                      <td>{{ formatDate(inst.date) }}</td>
                      <td>{{ inst.text }}%</td>
                      <td>{{ inst.amount }}</td>
                      <td>{{ inst.deliverables ? inst.deliverables.join(', ') : '' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </aside>
    </div>
  </teleport>

  <!-- ───────────────────────── Quick View sidebar (Figma node 772:18802) — project History timeline ───────────────────────── -->
  <teleport to="body" v-if="showQuickView">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="showQuickView = false">
      <aside class="entity-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[620px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]" style="animation: sidebar-slide-in .22s ease" role="dialog" aria-modal="true">
        <div class="flex items-center justify-end px-5 pt-4 pb-2 shrink-0">
          <button type="button" class="entity-sidebar__close" @click="showQuickView = false"><i class="ri-close-line" /></button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-5 flex flex-col gap-5">
          <!-- Project identity header (Figma node 772-19637), same as the Overview/Team/Finance sidebar -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5">
              <h4 class="text-xl text-brand-700 m-0 flex-1 min-w-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h4>
              <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
                <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs text-typo-500">
              <span>Reference ID:</span>
              <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
              <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
            </div>
          </div>
          <hr class="border-typo-100 m-0" />

          <h3 class="text-lg font-bold text-typo-700 m-0">Quick View</h3>

          <div v-if="activityLogLoading && !activityLog.length" class="page-loader text-muted">Loading…</div>
          <div v-else-if="!activityLog.length" class="empty-state">
            <i class="ri-history-line" />
            <h3>No activity yet</h3>
            <p>Actions taken on this project will show up here.</p>
          </div>

          <div v-else class="activity-timeline">
            <div v-for="group in activityLog" :key="group.date" class="activity-group">
              <div class="activity-group__header">
                <span class="activity-group__dot" />
                <span class="activity-group__label">{{ group.label }}</span>
              </div>

              <div class="activity-group__entries">
                <div v-for="entry in group.entries" :key="entry.id" class="activity-entry">
                  <p class="activity-entry__user">{{ entry.user_name }}</p>
                  <div class="activity-entry__line">
                    <span>{{ entry.message }}</span>
                    <span v-if="activityTaskLabel(entry)" class="activity-entry__chip">{{ activityTaskLabel(entry) }}</span>
                    <span v-if="entry.quote" class="activity-entry__quote">- "{{ entry.quote }}"</span>
                  </div>
                  <div v-if="entry.members?.length" class="activity-entry__avatars">
                    <span v-for="m in entry.members" :key="m.id" class="activity-entry__avatar-chip">
                      <img v-if="memberPhotoUrl({ photo: m.photo })" :src="memberPhotoUrl({ photo: m.photo })" :alt="m.name" />
                      <span v-else class="activity-entry__avatar-fallback">{{ getInitials(m.name) }}</span>
                      {{ m.name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </teleport>

  <!-- ───────────────────────── Overview / Team Management / Project Finance sidebar ───────────────────────── -->
  <teleport to="body" v-if="sidebarOpen">
    <div class="fixed inset-0 bg-slate-900/30 z-[1000]" style="animation: sidebar-backdrop-in .2s ease" @click.self="closeSidebar">
      <aside class="entity-sidebar bg-white flex flex-col h-full overflow-hidden ml-auto w-full max-w-[620px] shadow-[-4px_0_24px_rgba(220,220,220,0.4)]" style="animation: sidebar-slide-in .22s ease" role="dialog" aria-modal="true">
        <div class="flex items-center justify-end px-5 pt-4 pb-2 shrink-0">
          <button type="button" class="entity-sidebar__close" @click="closeSidebar"><i class="ri-close-line" /></button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-5 flex flex-col gap-5">
          <!-- Project identity header (Figma node 772-19637) — always first, sidebar contents follow -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2.5">
            
              <h4 class="text-xl text-brand-700 m-0 flex-1 min-w-0 truncate" style="font-family: 'Spline Sans', Poppins, sans-serif">{{ project.title }}</h4>
              <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-3 py-1 text-xs shrink-0" :class="health.textClass">
                <span class="w-2 h-2 rounded-full" :class="health.dotClass" />{{ health.label }}
              </span>
              <router-link v-if="activeTab === 'overview' && canManage" :to="{ name: 'ProjectEdit', params: { id: project.id } }" class="inline-flex items-center justify-center bg-brand-50 border border-brand-100 text-brand-600 w-8 h-8 rounded-md hover:bg-brand-100" title="Edit Project">
                <i class="ri-pencil-line" />
              </router-link>
              <button  v-if="activeTab === 'overview' && canManage" type="button" class="inline-flex items-center justify-center bg-accent-50 border border-accent-100 text-accent-500 w-8 h-8 rounded-md hover:bg-accent-100" title="Delete Project" @click="askDeleteProject">
                <i class="ri-delete-bin-line" />
              </button>
            </div>
            <div class="flex items-center gap-2 text-xs text-typo-500">
              <span>Reference ID:</span>
              <strong class="text-brand-700 font-medium">{{ project.reference_id }}</strong>
              <button type="button" class="text-typo-400 hover:text-brand-600" title="Copy" @click="copyReferenceId"><i class="ri-file-copy-line" /></button>
            </div>
          </div>
          <hr class="border-typo-100 m-0" />

          <!-- Overview (Figma node 772-18723) -->
          <template v-if="activeTab === 'overview'">
            
            <div class="flex flex-col gap-3 text-xs text-typo-500">
              <div class="flex items-center justify-between">
                <span>Time Period:</span>
                <span class="flex items-center gap-2 text-typo-500">{{ formatDate(project.start_date) }} - {{ formatDate(project.deadline) }} <i class="ri-calendar-2-line" /></span>
              </div>
              <div class="flex items-center justify-between">
                <span>Priority:</span>
                <span v-if="canManage" class="status-select-wrap" :class="[priorityStyle(project.priority), { 'status-select-wrap--disabled': prioritySaving }]">
                  <select class="status-select" :value="project.priority" :disabled="prioritySaving" @change="handlePriorityChange($event.target.value)">
                    <option v-for="p in PRIORITY_LIST" :key="p" :value="p">{{ capitalize(p) }}</option>
                  </select>
                  <i class="ri-arrow-down-s-line status-select__icon" />
                </span>
                <span v-else class="font-semibold uppercase tracking-wide" :class="priorityTextStyle(project.priority)">{{ project.priority }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Status:</span>
                <span v-if="canManage" class="status-select-wrap" :class="[statusStyle(project.status), { 'status-select-wrap--disabled': statusSaving }]">
                  <select class="status-select" :value="project.status" :disabled="statusSaving" @change="handleStatusChange($event.target.value)">
                    <option v-for="s in STATUS_LIST" :key="s" :value="s">{{ capitalize(s) }}</option>
                  </select>
                  <i class="ri-arrow-down-s-line status-select__icon" />
                </span>
                <span v-else class="font-semibold uppercase tracking-wide" :class="statusTextStyle(project.status)">{{ project.status }}</span>
              </div>
            </div>

            <hr class="border-typo-100 m-0" />

            <div v-if="project.details">
              <p class="text-xs text-typo-500 leading-relaxed m-0" style="white-space: pre-wrap" :class="{ 'line-clamp-4': !showFull }">{{ project.details }}</p>
              <button v-if="detailsIsLong" type="button" class="text-xs font-semibold mt-1" style="color:#007aff" @click="showFull = !showFull">
                {{ showFull ? 'Read Less' : 'Read More' }}
              </button>
            </div>

            <hr class="border-typo-100 m-0" />

            <div class="flex flex-col gap-3">
              <div v-if="project.category" class="flex items-center justify-between text-xs text-typo-500">
                <span>Project Type:</span>
                <span class="bg-typo-50 border border-brand-50 text-brand-700 rounded-full px-3 py-1.5 text-xs">{{ project.category?.title }}</span>
              </div>
              <div class="flex items-center justify-between text-xs text-typo-500">
                <span>Team Lead</span>
                <span class="inline-flex items-center gap-1.5 bg-typo-50 border border-typo-100 rounded-full px-2.5 py-1 text-typo-700 font-medium">
                  <span class="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[8px] font-bold shrink-0 overflow-hidden">
                <img v-if="createdByPhoto" :src="createdByPhoto" :alt="createdByName" class="w-full h-full object-cover" />
                <span v-else>{{ getInitials(createdByName) }}</span>
              </span>
                  {{ createdByName }}
                </span>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2 text-xs text-typo-500">
                <span>Assigned:</span>
                <div class="flex items-center">
                  <div
                    v-for="t in project.teammates" :key="t.id"
                    class="member-avatar pd-assignee"
                    :class="{ 'member-avatar--lead': t.project_lead, 'member-avatar--clickable': canManage && !t.project_lead }"
                    :title="leadTooltip(t)"
                    @click="canManage && askChangeLead(t)"
                  >
                    <img v-if="teammatePhoto(t)" :src="teammatePhoto(t)" :alt="t.user_name" />
                    <span v-else>{{ getInitials(t.user_name) }}</span>
                    <button v-if="canManage" type="button" class="member-avatar__remove" title="Remove" @click.stop="askRemoveTeammate(t)">
                      <i class="ri-close-line" />
                    </button>
                  </div>
                  <button v-if="canManage" type="button" class="member-avatar pd-assignee member-avatar--add-sm" title="Add Member" @click="addMemberOpen = !addMemberOpen">
                    <i class="ri-add-line" />
                  </button>
                </div>
              </div>
              <div v-if="canManage && addMemberOpen" class="mb-3">
                <MemberAssignPicker
                  label="Assign Member" :assigned-members="[]" :available-members="availableProjectMembers"
                  placeholder="Search employees…" empty-text="" :assigning="assigningProjectMember"
                  @assign="onAssignProjectMembers"
                />
              </div>
              <div class="flex items-center gap-2 bg-warning-200 rounded-lg p-3 text-[11px] text-warning-700">
                <i class="ri-information-line shrink-0" />
                <span>Explore Employee's Contribution from
                  <button type="button" class="font-medium underline text-brand-500" @click="selectTab(TABS.find(t => t.key === 'team'))">Team Management</button>
                </span>
              </div>
            </div>

            <div v-if="canManage || vendorByProject.length">
              <label class="form-label">Vendors</label>
              <div class="flex flex-wrap gap-2" :class="{ 'mb-2': canManage && vendorByProject.length }">
                <span v-for="x in vendorByProject" :key="x.id" class="assigned-pill">
                  {{ x.user_name }}
                  <button v-if="canManage" type="button" @click="askRemoveVendorAlloc(x)"><i class="ri-close-line" /></button>
                </span>
                <span v-if="!vendorByProject.length && !canManage" class="text-xs text-slate-400">No vendors added.</span>
              </div>
              <!-- Same picker as "Refer To" on Apply for Requisition: search input while
                   nothing is picked, chips + "+" once something is. -->
              <div v-if="canManage" class="flex flex-col gap-2">
                <MultiSelect v-model="selectedVendors" :options="vendorOptions" :disabled="vendorSaving" pill search-when-empty placeholder="Search vendors…" search-placeholder="" />
                <button v-if="selectedVendors.length" type="button" class="btn btn--primary btn--sm w-full justify-center" :disabled="vendorSaving" @click="addVendor">
                  {{ vendorSaving ? 'Adding…' : 'Add Vendor' }}
                </button>
              </div>
            </div>

            <div v-if="canManage || clientByProject.length">
              <label class="form-label">Clients</label>
              <div class="flex flex-wrap gap-2" :class="{ 'mb-2': canManage && clientByProject.length }">
                <span v-for="x in clientByProject" :key="x.id" class="assigned-pill">
                  {{ x.company_name }}
                  <button v-if="canManage" type="button" @click="askRemoveClientAlloc(x)"><i class="ri-close-line" /></button>
                </span>
                <span v-if="!clientByProject.length && !canManage" class="text-xs text-slate-400">No clients added.</span>
              </div>
              <!-- Same picker as "Refer To" on Apply for Requisition: search input while
                   nothing is picked, chips + "+" once something is. -->
              <div v-if="canManage" class="flex flex-col gap-2">
                <MultiSelect v-model="selectedClients" :options="clientOptions" :disabled="clientSaving" pill search-when-empty placeholder="Search clients…" search-placeholder="" />
                <button v-if="selectedClients.length" type="button" class="btn btn--primary btn--sm w-full justify-center" :disabled="clientSaving" @click="addClient">
                  {{ clientSaving ? 'Adding…' : 'Add Client' }}
                </button>
              </div>
            </div>
          </template>

          <!-- Team Management -->
          <template v-else-if="activeTab === 'team'">
            <h3 class="text-lg font-bold text-slate-800 m-0">Team Management</h3>

            <div>
              <strong class="block mb-2 text-sm text-slate-700">Members</strong>
              <div class="flex flex-wrap items-center gap-2.5">
                <div
                  v-for="t in project.teammates" :key="t.id"
                  class="member-avatar"
                  :class="{ 'member-avatar--lead': t.project_lead, 'member-avatar--clickable': canManage && !t.project_lead }"
                  :title="leadTooltip(t)"
                  @click="canManage && askChangeLead(t)"
                >
                  <img v-if="teammatePhoto(t)" :src="teammatePhoto(t)" :alt="t.user_name" />
                  <span v-else>{{ getInitials(t.user_name) }}</span>
                  <button v-if="canManage" type="button" class="member-avatar__remove" title="Remove" @click.stop="askRemoveTeammate(t)">
                    <i class="ri-close-line" />
                  </button>
                </div>
                <button v-if="canManage" type="button" class="member-avatar member-avatar--add" title="Add Member" @click="addMemberOpen = !addMemberOpen">
                  <i class="ri-add-line" />
                </button>
              </div>
              <div v-if="canManage && addMemberOpen" class="mt-3">
                <MemberAssignPicker
                  label="Assign Member" :assigned-members="[]" :available-members="availableProjectMembers"
                  placeholder="Search employees…" empty-text="" :assigning="assigningProjectMember"
                  @assign="onAssignProjectMembers"
                />
              </div>
            </div>

            <hr class="border-slate-100" />

            <!-- Project report (task.txt Part 2B — task-progress / employee-time-log
                 by-project). Figma node 813:20595. -->
            <div class="flex items-center justify-between gap-2 text-[8px] text-typo-500">
              <div class="flex flex-col gap-1.5">
                <span>Team Members</span>
                <span class="text-[20px] font-medium text-brand-600">{{ reportSummary.team_members_label ?? '—' }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span>Total Tasks:</span>
                <span class="text-[20px] font-medium text-brand-600">{{ reportSummary.total_tasks_label ?? '—' }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span>Completed Tasks</span>
                <span class="text-[20px] font-medium text-brand-600">{{ reportSummary.completed_tasks_label ?? '—' }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span>Total Logged Time (Minutes)</span>
                <span class="text-[20px] font-medium text-brand-600">{{ reportSummary.total_logged_minutes_label ?? '—' }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2 bg-warning-200 rounded-lg p-3 text-[11px] text-warning-700">
              <i class="ri-information-line shrink-0" />
              <span>Click on an employee's name to see their detailed progression view for this project.</span>
            </div>

            <div>
              <button type="button" class="flex items-center justify-between w-full bg-transparent border-none p-0 cursor-pointer" @click="taskProgressOpen = !taskProgressOpen">
                <strong class="text-base font-medium text-typo-700">Task Progress</strong>
                <i class="ri-arrow-down-s-line text-xl text-typo-500 transition-transform" :class="{ '-rotate-180': !taskProgressOpen }" />
              </button>
              <div v-if="taskProgressOpen" class="table-wrap mt-3">
                <table class="table">
                  <thead><tr><th>Employee Name</th><th>Assigned</th><th>Completed</th><th>Progress</th><th>Logged Time</th></tr></thead>
                  <tbody>
                    <tr v-if="reportLoading && !taskProgress.length"><td colspan="5" class=" text-typo-400">Loading…</td></tr>
                    <tr v-else-if="!taskProgress.length"><td colspan="5" class=" text-typo-400">No data yet.</td></tr>
                    <tr v-for="row in taskProgress" :key="row.member_id">
                      <td><button type="button" class="title-link text-left" @click="openEmployeeProgression(row)">{{ row.employee_name }}</button></td>
                      <td>{{ row.assigned_label }}</td>
                      <td>{{ row.completed_label }}</td>
                      <td>{{ row.progress_label }}</td>
                      <td>{{ row.logged_time_label }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <button type="button" class="flex items-center justify-between w-full bg-transparent border-none p-0 cursor-pointer" @click="employeeTimeLogOpen = !employeeTimeLogOpen">
                <strong class="text-base font-medium text-typo-700">Employee Logged Time</strong>
                <i class="ri-arrow-down-s-line text-xl text-typo-500 transition-transform" :class="{ '-rotate-180': !employeeTimeLogOpen }" />
              </button>
              <div v-if="employeeTimeLogOpen" class="table-wrap mt-3">
                <table class="table">
                  <thead><tr><th>Employee Name</th><th>Total Logged Mins</th><th>Total Completed Task</th><th>Time v/s Tasks</th></tr></thead>
                  <tbody>
                    <tr v-if="reportLoading && !employeeTimeLog.length"><td colspan="4" class=" text-typo-400">Loading…</td></tr>
                    <tr v-else-if="!employeeTimeLog.length"><td colspan="4" class=" text-typo-400">No data yet.</td></tr>
                    <tr v-for="row in employeeTimeLog" :key="row.member_id">
                      <td><button type="button" class="title-link text-left" @click="openEmployeeProgression(row)">{{ row.employee_name }}</button></td>
                      <td>{{ row.total_logged_minutes_label }}</td>
                      <td>{{ row.total_completed_tasks_label }}</td>
                      <td>{{ row.time_vs_tasks_label }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <hr class="border-slate-100" />

            <div v-if="canManage || vendorByProject.length">
              <label class="form-label">Vendors</label>
              <div class="flex flex-wrap gap-2" :class="{ 'mb-2': canManage && vendorByProject.length }">
                <span v-for="x in vendorByProject" :key="x.id" class="assigned-pill">
                  {{ x.user_name }}
                  <button v-if="canManage" type="button" @click="askRemoveVendorAlloc(x)"><i class="ri-close-line" /></button>
                </span>
                <span v-if="!vendorByProject.length && !canManage" class="text-xs text-slate-400">No vendors added.</span>
              </div>
              <!-- Same picker as "Refer To" on Apply for Requisition: search input while
                   nothing is picked, chips + "+" once something is. -->
              <div v-if="canManage" class="flex flex-col gap-2">
                <MultiSelect v-model="selectedVendors" :options="vendorOptions" :disabled="vendorSaving" pill search-when-empty placeholder="Search vendors…" search-placeholder="" />
                <button v-if="selectedVendors.length" type="button" class="btn btn--primary btn--sm w-full justify-center" :disabled="vendorSaving" @click="addVendor">
                  {{ vendorSaving ? 'Adding…' : 'Add Vendor' }}
                </button>
              </div>
            </div>

            <hr class="border-slate-100" />

            <div v-if="canManage || clientByProject.length">
              <label class="form-label">Clients</label>
              <div class="flex flex-wrap gap-2" :class="{ 'mb-2': canManage && clientByProject.length }">
                <span v-for="x in clientByProject" :key="x.id" class="assigned-pill">
                  {{ x.company_name }}
                  <button v-if="canManage" type="button" @click="askRemoveClientAlloc(x)"><i class="ri-close-line" /></button>
                </span>
                <span v-if="!clientByProject.length && !canManage" class="text-xs text-slate-400">No clients added.</span>
              </div>
              <!-- Same picker as "Refer To" on Apply for Requisition: search input while
                   nothing is picked, chips + "+" once something is. -->
              <div v-if="canManage" class="flex flex-col gap-2">
                <MultiSelect v-model="selectedClients" :options="clientOptions" :disabled="clientSaving" pill search-when-empty placeholder="Search clients…" search-placeholder="" />
                <button v-if="selectedClients.length" type="button" class="btn btn--primary btn--sm w-full justify-center" :disabled="clientSaving" @click="addClient">
                  {{ clientSaving ? 'Adding…' : 'Add Client' }}
                </button>
              </div>
            </div>
          </template>

          <!-- Project Finance (Figma node 826:20817) -->
          <template v-else-if="activeTab === 'finance'">
            <h3 class="text-lg font-bold text-slate-800 m-0">Project Finance</h3>

            <div class="grid grid-cols-2 gap-y-4 text-[8px] text-typo-500">
              <div class="flex flex-col gap-1.5">
                <span>Project Budget</span>
                <span class="text-[20px] font-medium text-brand-600">{{ formatMoney(project.budget) }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span>Total Spent</span>
                <span class="text-[20px] font-medium text-accent-500">{{ formatMoney(totalSpent) }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span>Pending Requests</span>
                <span class="text-[20px] font-medium text-typo-700">{{ pendingRequisitionCount }}</span>
              </div>
              <div class="flex flex-col gap-1.5">
                <span>Remaining Budget</span>
                <span class="text-[20px] font-medium text-secondary-600">{{ formatMoney(remainingBudget) }}</span>
              </div>
            </div>

          </template>

          <!-- Activity Log (the diary) — PROJECT_ACTIVITY_API.md Part 1.
               One flat list (always type=all), no sub-tabs — the create
               form has its own Type field instead. Creating replaces the
               list entirely rather than sitting above it. -->
          <template v-else-if="activeTab === 'activity'">
            <div class="flex items-center justify-between w-full">
              <h3 class="text-lg font-bold text-slate-800 m-0">Activity Log</h3>
              <button type="button" class="btn btn--ghost btn--sm" @click="diaryFormOpen = !diaryFormOpen">
                <i :class="diaryFormOpen ? 'ri-close-line' : 'ri-add-line'" />
                {{ diaryFormOpen ? 'Cancel' : 'Add Entry' }}
              </button>
            </div>

            <div v-if="diaryFormOpen" class="flex flex-col gap-3 bg-typo-50 border border-typo-100 rounded-lg p-3">
              <div class="form-group mb-0">
                <label class="form-label">Type</label>
                <select v-model="diaryForm.type" class="form-select">
                  <option v-for="t in DIARY_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                </select>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Label</label>
                <input v-model.trim="diaryForm.label" type="text" class="form-input" placeholder="e.g. Kickoff call with client" />
              </div>

              <div class="form-row flex gap-3">
                <div class="form-group flex-1 mb-0">
                  <label class="form-label">Date</label>
                  <DatePicker v-model="diaryForm.date" />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label">Time</label>
                  <input v-model="diaryForm.time" type="time" class="form-input w-[130px]" />
                </div>
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Outcome</label>
                <select v-model="diaryForm.outcome" class="form-select">
                  <option v-for="o in DIARY_OUTCOMES" :key="o" :value="o" class="capitalize">{{ o.replace('_', ' ') }}</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label">Participants</label>
                <input v-model.trim="diaryForm.participants" type="text" class="form-input" placeholder="e.g. Nadia, Sabbir, client's CTO" />
              </div>

              <div class="form-group mb-0">
                <label class="form-label">Notes</label>
                <textarea v-model.trim="diaryForm.notes" class="form-input" rows="2" placeholder="Notes…" />
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn--ghost btn--sm" @click="diaryFormOpen = false">Cancel</button>
                <button type="button" class="btn btn--primary btn--sm" :disabled="!diaryForm.label || diarySaving" @click="submitDiaryEntry">
                  {{ diarySaving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </div>

            <template v-else>
              <div v-if="projectActivityLoading && !projectActivity.length" class="page-loader text-muted">Loading…</div>
              <div v-else-if="!projectActivity.length" class="empty-state">
                <i class="ri-quill-pen-line" />
                <h3>No entries yet</h3>
                <p>Logged activity will show up here.</p>
              </div>

              <div v-else class="flex flex-col gap-3">
                <div v-for="entry in projectActivity" :key="entry.id" class="diary-entry">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5 flex-wrap mb-1">
                        <span class="diary-entry__type" :class="`diary-entry__type--${entry.type}`">{{ diaryTypeLabel(entry.type) }}</span>
                        <span v-if="entry.outcome && entry.outcome !== 'other'" class="diary-entry__outcome">{{ entry.outcome.replace('_', ' ') }}</span>
                      </div>
                      <p class="diary-entry__label">{{ entry.label }}</p>
                      <p class="diary-entry__meta">{{ entry.created_by_name }} · {{ formatDateTime(entry.date || entry.created_at) }}</p>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <input
                        v-if="entry.type === 'next_action'" type="checkbox" :checked="entry.is_done"
                        title="Mark done" @change="toggleNextActionDone(entry)"
                      />
                      <button type="button" class="icon-btn icon-btn--delete" title="Delete" @click="askDeleteDiaryEntry(entry)" />
                    </div>
                  </div>
                  <p v-if="entry.notes" class="diary-entry__notes">{{ entry.notes }}</p>
                  <p v-if="entry.next_action" class="diary-entry__notes"><strong>Next:</strong> {{ entry.next_action }}</p>
                  <p v-if="participantsLabel(entry)" class="diary-entry__meta">Participants: {{ participantsLabel(entry) }}</p>
                  <div v-if="entry.task_title" class="activity-entry__chip" style="margin-top:4px">Task: {{ entry.task_title }}</div>
                  <div v-if="entry.type === 'next_action'" class="flex items-center gap-3 text-[11px] text-typo-500 mt-1">
                    <span v-if="entry.due_date">Due: {{ formatDate(entry.due_date) }}</span>
                    <span class="font-semibold uppercase" :class="priorityTextStyle((entry.priority || '').toUpperCase())">{{ entry.priority }}</span>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </div>
      </aside>
    </div>
  </teleport>

  <!-- ───────────────────────── Quick "Add New Task" modal ───────────────────────── -->
  <teleport to="body" v-if="quickAddOpen">
    <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4" @click.self="quickAddOpen = false">
      <div class="bg-white rounded-[14px] w-full max-w-[620px] shadow-2xl">
        <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-800 m-0">Add New Task</h3>
          <button class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5" @click="quickAddOpen = false"><i class="ri-close-line" /></button>
        </div>
        <div class="px-5 py-5 flex flex-col gap-4">
          <div class="form-group mb-0">
            <label class="form-label">Stage</label>
            <select v-model="quickAddForm.stage" class="form-select">
              <option v-for="s in stageOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Task Title</label>
            <input v-model.trim="quickAddForm.title" type="text" class="form-input" placeholder="Enter task title" @keyup.enter="submitQuickAdd" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" @click="quickAddOpen = false">Cancel</button>
            <button type="button" class="btn btn--primary" :disabled="!quickAddForm.title || !quickAddForm.stage || quickAddSaving" @click="submitQuickAdd">
              {{ quickAddSaving ? 'Adding…' : 'Add' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- ───────────────────────── Edit stage label modal ───────────────────────── -->
  <teleport to="body" v-if="editLabelTarget !== null">
    <div class="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[1000] p-4" @click.self="editLabelTarget = null">
      <div class="bg-white rounded-[14px] w-full max-w-[400px] shadow-2xl">
        <div class="flex items-center justify-between px-5 pt-[18px] pb-3.5 border-b border-slate-100">
          <h3 class="text-base font-bold text-slate-800 m-0">Edit Stage</h3>
          <button class="bg-transparent border-none text-xl text-slate-400 cursor-pointer p-0.5" @click="editLabelTarget = null"><i class="ri-close-line" /></button>
        </div>
        <div class="px-5 py-5 flex flex-col gap-4">
          <div class="form-group mb-0">
            <label class="form-label">Label</label>
            <input v-model="editLabelName" type="text" class="form-input" />
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn--ghost" @click="editLabelTarget = null">Cancel</button>
            <button type="button" class="btn btn--primary" :disabled="!editLabelName.trim() || editLabelSaving" @click="saveEditLabel">
              {{ editLabelSaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Generic confirm modal — delete task/subtask/label, remove teammate/vendor/client, change lead -->
  <ConfirmModal
    v-if="confirm"
    :title="confirm.title"
    :message="confirm.message"
    confirm-label="Confirm"
    :confirm-variant="confirm.variant || 'danger'"
    :loading="confirmLoading"
    @confirm="runConfirm"
    @cancel="confirm = null"
  />
</div>
</template>

<script>
import { mapState } from 'vuex'
import {
  formatDate, formatDateTime, capitalize, stripHtml, linkify, goBack as goBackTo, getInitials, memberPhotoUrl, formatMoney,
} from '@/utils/helpers'
import ConfirmModal        from '@/components/common/ConfirmModal.vue'
import DatePicker          from '@/components/common/DatePicker.vue'
import MultiSelect         from '@/components/common/MultiSelect.vue'
import MemberAssignPicker  from '@/components/common/MemberAssignPicker.vue'
import SearchBox           from '@/components/common/SearchBox.vue'
import BalloonEditor       from '@/components/common/BalloonEditor.vue'
import SupportingDocuments from '@/components/common/SupportingDocuments.vue'
import { can }              from '@/utils/permission'

// Base (non-archived) statuses, matching ProjectList.vue's own STATUS_TABS
// convention. The status <select> below (STATUS_LIST) adds ARCHIVED back in
// — a project reached via ArchivedProjectList.vue has status ARCHIVED, and
// without a matching <option> the <select> just renders blank, plus this is
// also how a project gets archived/unarchived in the first place (same
// MODAL_STATUS_LIST idea as ProjectList.vue/ArchivedProjectList.vue's own
// inline status <select>).
const PROJECT_STATUSES = ['APPROVED', 'PENDING', 'WORKING', 'POSTPONED', 'PAUSED', 'COMPLETED']
const PROJECT_STATUS_STYLES = {
  APPROVED:  'bg-[#4b8dee] text-white',
  PENDING:   'bg-[#eaa14d] text-white',
  WORKING:   'bg-brand-400 text-white',
  POSTPONED: 'bg-[#ed5b48] text-white',
  PAUSED:    'bg-warning-300 text-warning-900',
  COMPLETED: 'bg-secondary-400 text-white',
  ARCHIVED:  'bg-typo-400 text-white',
}

// Ported from ProjectEdit.vue's own `PRIORITIES` list/field (same values the
// edit form writes), styled per the Figma "Project Details" pill (node
// 772-16752 / 772-18723) — HIGH/MEDIUM/LOW map to the accent/warning/
// secondary palettes respectively.
const PROJECT_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
const PROJECT_PRIORITY_STYLES = {
  HIGH:   'bg-accent-50 text-accent-500 border border-accent-100',
  MEDIUM: 'bg-warning-100 text-warning-700 border border-warning-200',
  LOW:    'bg-secondary-50 text-secondary-600 border border-secondary-100',
}

// Text-only (no pill/background) colors for the read-only status/priority
// display — same color families as the pill styles above, just the text
// color on its own, for the plain-text view a non-`canManage` viewer sees.
const PROJECT_STATUS_TEXT_STYLES = {
  APPROVED:  'text-[#4b8dee]',
  PENDING:   'text-[#eaa14d]',
  WORKING:   'text-brand-500',
  POSTPONED: 'text-[#ed5b48]',
  PAUSED:    'text-warning-600',
  COMPLETED: 'text-secondary-600',
  ARCHIVED:  'text-typo-500',
}
const PROJECT_PRIORITY_TEXT_STYLES = {
  HIGH:   'text-accent-500',
  MEDIUM: 'text-warning-700',
  LOW:    'text-secondary-600',
}

// Health pill ("On Track" in the Figma header/overview panel) — the backend
// has no dedicated health field, so it's derived from the real project
// `status`. Pill shape/background is constant (typo-50/typo-100 per Figma);
// only the dot + label color vary by tone.
const PROJECT_HEALTH = {
  APPROVED:  { label: 'On Track',     dotClass: 'bg-secondary-500', textClass: 'text-secondary-700' },
  WORKING:   { label: 'On Track',     dotClass: 'bg-secondary-500', textClass: 'text-secondary-700' },
  PENDING:   { label: 'Pending Start', dotClass: 'bg-warning-500',  textClass: 'text-warning-700' },
  POSTPONED: { label: 'Delayed',      dotClass: 'bg-accent-500',   textClass: 'text-accent-600' },
  PAUSED:    { label: 'Paused',       dotClass: 'bg-typo-300',     textClass: 'text-typo-500' },
  COMPLETED: { label: 'Completed',    dotClass: 'bg-brand-500',    textClass: 'text-brand-700' },
  ARCHIVED:  { label: 'Archived',     dotClass: 'bg-typo-400',     textClass: 'text-typo-600' },
}

// Kanban column backgrounds — exact tints from the Figma board (node
// 772-16752), keyed by the stage's display name. Custom labels (anything a
// user creates via "Add New" stage) fall back to cycling through the same
// five tints so new columns still read as distinct without a 1:1 name match.
const STAGE_COLORS = {
  'To-Do':     '#F9F9F9',
  'Working':   '#E7E7FD',
  'Pending':   '#FCF3E8',
  'Paused':    '#FFFDE5',
  'Completed': '#EDF7EF',
}
const STAGE_COLOR_FALLBACK = Object.values(STAGE_COLORS)

// Tabs across the top of the board (Figma node 772-16752). Overview / Team
// Management / Project Finance open the same slide-in sidebar with different
// content; Deliverables / Supporting Documents just trigger the modals/
// sidebar that already existed on this page.
// Activity Log isn't in this nav bar — it has its own header button
// (selectTab({ key: 'activity' }) still handles opening it, see selectTab()).
const TABS = [
  { key: 'overview',     label: 'Overview' },
  { key: 'team',         label: 'Team Management' },
  { key: 'deliverables', label: 'Deliverables' },
  { key: 'documents',    label: 'Supporting Documents' },
  { key: 'finance',      label: 'Project Finance' },
]

// Project Activity (the diary) — PROJECT_ACTIVITY_API.md Part 1. No tab
// view: one flat list (always `type=all`) with a Type field on the create
// form instead of a sub-tab per type.
// Next Action isn't offered as a creatable type here — only call/email/
// message/meeting. toggleActivityDone/priority display are kept read-side
// (see the entry list below) for any next_action rows that already exist.
const DIARY_TYPES = [
  { value: 'call',        label: 'Call' },
  { value: 'email',       label: 'Email' },
  { value: 'message',     label: 'Message' },
  { value: 'meeting',     label: 'Meeting' },
]

const DIARY_OUTCOMES = ['connected', 'no_answer', 'positive', 'negative', 'info_sent', 'rescheduled', 'other']

function blankDiaryForm() {
  // `participants` is free text (e.g. "Nadia, Sabbir, client's CTO"), sent
  // straight through as the API's own `participants` field — per the
  // create-payload example, it takes a plain string there, not a user-id
  // array (that shape only shows up in the read-side response).
  // `date`/`time` combine into the API's single `date` ISO datetime field
  // (same DatePicker + <input type="time"> pairing as CrmLeadDetails.vue's
  // own follow-up date/time) — left blank by default so, if never touched,
  // nothing is sent and the backend defaults to "now".
  return { type: 'call', label: '', date: '', time: '09:00', outcome: 'other', notes: '', participants: '' }
}

const REQUISITION_STATUS_COLORS = { PENDING: 'info', APPROVED: 'success', DUE: 'warning', 'PARTIALLY-PAID': 'info', REJECTED: 'danger' }
const INVOICE_STATUS_COLORS     = { 'FULLY-PAID': 'success', DUE: 'warning', 'PARTIALLY-PAID': 'info' }
// Same status vocabulary as PurchaseRequisitionList.vue's PR_STATUS_COLORS.
const PURCHASE_REQUISITION_STATUS_COLORS = { draft: 'default', submitted: 'info', approved: 'success', rejected: 'danger', rfp_raised: 'info' }

// Text-only colors for the Project Finance tab's status cells (no pill/
// background), keyed by the same badge-color keyword the two maps above
// resolve to.
const FINANCE_STATUS_TEXT_CLASSES = {
  success: 'text-secondary-600',
  warning: 'text-warning-700',
  info:    'text-brand-500',
  danger:  'text-accent-500',
  default: 'text-typo-500',
}

// Ported from the legacy SMICEE frontend's "Project Detail" page
// (task.txt) — same store actions/getters, restyled to this app's own
// design system (.card/.badge/.finance-chip, MultiSelect/MemberAssignPicker/
// BalloonEditor common components) instead of bootstrap-vue. The one
// structural change from the legacy page: task and subtask editing
// (previously `b-modal#modal-xl`) is now a right-side slide-in sidebar,
// matching this app's own ProjectSummarySidebar/GrnDetailsSidebar idiom,
// everything else that was a modal stays a modal. The legacy checklist
// feature (`PROJECT_CHECKLIST`) and the password-gated supporting document
// flow are intentionally not ported — the former is behind a flag that
// doesn't exist in this app's constants, and the latter is replaced by a
// Supporting Documents sidebar that reuses the shared SupportingDocuments.vue
// component (also used by requisition/quotation/invoice/purchase-order
// details), wired to this project's own project/addProjectAttachment /
// deleteAttachmentFromProjects actions via its addAction/deleteAction props.
export default {
  name: 'ProjectDetailsView',
  components: { ConfirmModal, DatePicker, MultiSelect, MemberAssignPicker, BalloonEditor, SearchBox, SupportingDocuments },
  inject: ['toast'],

  data() {
    return {
      chatOpening: false,
      STATUS_LIST: [...PROJECT_STATUSES, 'ARCHIVED'],
      PRIORITY_LIST: PROJECT_PRIORITIES,
      TABS,
      DIARY_TYPES,
      DIARY_OUTCOMES,
      statusSaving: false,
      prioritySaving: false,

      searchTerm: '',
      addTaskRevealed: {},

      activeTab: 'overview',
      sidebarOpen: false,

      quickAddOpen: false,
      quickAddForm: { stage: '', title: '' },
      quickAddSaving: false,

      showFull: false,
      addMemberOpen: false,
      assigningProjectMember: false,

      showDocsPanel: false,

      selectedVendors: [],
      selectedClients: [],
      vendorSaving: false,
      clientSaving: false,

      showDeliverables: false,

      taskProgressOpen: true,
      employeeTimeLogOpen: true,
      financeSummaryOpen: true,
      financeActiveTab: 'requisition',
      showQuickView: false,

      // Project Activity (the diary) — Activity Log tab.
      diaryFormOpen: false,
      diaryForm: blankDiaryForm(),
      diarySaving: false,

      newStageName: '',
      openStageMenu: null,
      stageSaving: false,
      editLabelTarget: null,
      editLabelName: '',
      editLabelSaving: false,

      addingTask: false,
      draggedTaskId: null,

      taskSidebarOpen: false,
      taskDiscussionOpen: false,
      activeTaskId: null,
      taskEditing: false,
      taskDescExpanded: false,
      expandedSubDescs: {},

      nowTick: Date.now(),
      timerIntervalId: null,
      clockBusy: false,
      taskForm: { id: null, title: '', description: '', start_date: null, end_date: null },
      taskSaving: false,

      subCreateOpen: false,
      subForm: { title: '', description: '' },
      subCreating: false,
      editSubTarget: null,
      editSubForm: { id: null, title: '', description: '', end_date: '' },
      subSaving: false,
      subAssignTarget: null,
      assigningMember: false,

      newComment: '',
      commentSending: false,

      confirm: null,
      confirmLoading: false,
    }
  },

  computed: {
    // Project-level management — edit/delete project, status/priority
    // change, stage and top-level task creation, team/vendor/client
    // management — needs `view_projects` AND the page must have been opened
    // via the operations ProjectDetails route. The `MyProjectDetails` route
    // (my-workspace, see routes.js) renders this exact same component for
    // "My Projects" but always stays read-only, even for a viewer who
    // happens to also hold `view_projects` — that route's whole point is a
    // personal, non-administrative view, so it shouldn't grow a delete
    // button just because the visitor is also an ops admin.
    canManage() { return this.$route.name !== 'MyProjectDetails' && can('view_projects') },

    ...mapState({
      project:              state => state.project.projectDetail,
      projectAttachmentAll: state => state.project.projectAttachmentAll,
      clientByProject:      state => state.project.clientByProject,
      vendorByProject:      state => state.project.vendorByProject,
      quotationByProject:   state => state.project.quotationByProject,
      invoiceByProject:     state => state.project.invoiceByProject,
      requisitionByProject: state => state.project.requisitionByProject,
      purchaseRequisitionByProject: state => state.project.purchaseRequisitionByProject,
      taskMember:           state => state.project.taskMember,

      loading:     state => state.project.detailLoading,
      detailError: state => state.project.detailError,

      clientWithoutPg: state => state.client.clientWithoutPg,
      vendorWithoutPg: state => state.vendor.vendorWithoutPg,
      employeeList:    state => state.employee.employeeList,

      taskCategory: state => state.task.taskCategory,
      taskDetail:   state => state.task.taskDetail,
      subTaskList:  state => state.task.subTaskList,
      comments:     state => state.task.comments,
      taskLoading:  state => state.task.submitLoading,

      runningTimers:      state => state.task.runningTimers,
      timeLogsByTask:     state => state.task.timeLogsByTask,
      timeLogTotals:      state => state.task.timeLogTotals,
      timeLogLoading:     state => state.task.timeLogLoading,

      reportSummary:   state => state.task.reportSummary,
      taskProgress:    state => state.task.taskProgress,
      employeeTimeLog: state => state.task.employeeTimeLog,
      reportLoading:   state => state.task.reportLoading,

      activityLog:        state => state.task.activityLog,
      activityLogLoading: state => state.task.activityLogLoading,

      projectActivity:        state => state.task.projectActivity,
      projectActivityLoading: state => state.task.projectActivityLoading,
    }),

    // ── Project Finance tab (Figma node 826:20817) — only Requisitions/
    // Quotations/Invoices are shown here now; Budget/Purchase Order/Bill/RFP
    // and the old "Full List" modal were dropped as unneeded.
    requisitionPreview() { return (this.requisitionByProject || []).slice(0, 3) },
    purchaseRequisitionPreview() { return (this.purchaseRequisitionByProject || []).slice(0, 3) },
    quotationPreview()   { return (this.quotationByProject || []).slice(0, 3) },
    invoicePreview()     { return (this.invoiceByProject || []).slice(0, 3) },

    // "Total Spent" = sum of this project's invoiced amounts — the one
    // finance record type here that directly represents money billed
    // against the project. "Remaining Budget" is the plain
    // budget-minus-spent figure the Figma stat row shows.
    totalSpent() {
      return (this.invoiceByProject || []).reduce((sum, row) => sum + (Number(row.subtotal) || 0), 0)
    },
    remainingBudget() {
      return (Number(this.project.budget) || 0) - this.totalSpent
    },
    pendingRequisitionCount() {
      return (this.requisitionByProject || []).filter(r => r.status === 'PENDING').length
    },

    infoFields() {
      const p = this.project
      return [
        { label: 'Tasks',      value: p.task },
        { label: 'Resolved',   value: p.resolved },
        { label: 'Remaining',  value: p.remaining },
        { label: 'Start Date', value: formatDate(p.start_date) },
        { label: 'Deadline',   value: formatDate(p.deadline) },
        { label: 'PO Value',   value: p.po_value },
        { label: 'PO VAT',     value: p.po_vat != null ? `${p.po_vat} (${p.val_type})` : null },
        { label: 'PO AIT',     value: p.po_ait != null ? `${p.po_ait} (${p.ait_type})` : null },
        { label: 'Budget',     value: p.budget },
      ]
    },

    projectLeadName() {
      const lead = (this.project.teammates || []).find(t => t.project_lead)
      return lead?.user_name ?? 'N/A'
    },

    // The backend has no `created_by` on the project itself — fall back to
    // the project lead so the "Created By" field in the Figma header/
    // overview panel always has a real name instead of "N/A".
    createdByName() {
      return this.project.created_by?.username || this.project.created_by?.full_name || this.projectLeadName
    },

    createdByPhoto() {
      const lead = (this.project.teammates || []).find(t => t.project_lead)
      return lead ? this.teammatePhoto(lead) : null
    },

    health() {
      return PROJECT_HEALTH[this.project.status] ?? PROJECT_HEALTH.WORKING
    },

    detailsIsLong() {
      return (this.project.details || '').length > 220
    },

    taskDescIsLong() {
      return stripHtml(this.taskDetail.description || '').length > 220
    },

    stageOptions() {
      return (this.taskCategory.labels || []).filter(l => l !== 'Add New')
    },

    // Kanban board columns — same as taskCategory.labels, minus the "Add
    // New" stage-creator column for a viewer who can't manage stages.
    visibleStages() {
      return (this.taskCategory.labels || []).filter(l => l !== 'Add New' || this.canManage)
    },

    // `project/projectMember` (GET employee/by-project/<id>) returns the
    // project's CURRENT teammates, not the company's employee pool — using
    // it here meant the "Assign Member" picker only ever offered people
    // already on the project. The actual full pool is `employee/employeeList`
    // (already fetched in created()); exclude whoever's already a teammate.
    availableProjectMembers() {
      const assignedUserIds = new Set((this.project.teammates || []).map(t => t.user_id?.id).filter(Boolean))
      return (this.employeeList || [])
        .filter(e => !assignedUserIds.has(e.id))
        .map(e => ({ id: e.id, full_name: e.full_name, photo: e.additional_info?.photo }))
    },

    // Task-level "Members" picker (assigning someone to the task itself)
    // should only offer people already on the PROJECT team, not the whole
    // company employee pool — `project.teammates` already has that list.
    projectTeamMembers() {
      return (this.project.teammates || []).map(t => ({ id: t.user_id?.id, full_name: t.user_name, photo: t.user_id?.additional_info?.photo }))
    },

    // Subtask-level picker should only offer people already on the TASK
    // (fetched fresh per-task via project/fetchTaskMemberList — see openTask).
    availableTaskMembers() {
      return (this.taskMember || []).map(m => ({
        id: m.user_id?.id ?? m.member_id?.id, full_name: m.user_name,
        photo: m.user_id?.additional_info?.photo ?? m.member_id?.additional_info?.photo,
      }))
    },

    taskAssignedMembers() {
      return this.mapTeammates(this.taskDetail.teammates)
    },

    // My own running timer on the open task, if any (task/fetchRunningTimers
    // already scopes the list to the current user — see task.txt §2.2).
    myRunningTimerForTask() {
      return (this.runningTimers || []).find(t => t.task === this.activeTaskId)
    },

    taskTimerElapsedLabel() {
      const timer = this.myRunningTimerForTask
      if (!timer) return null
      const seconds = Math.max(0, Math.floor((this.nowTick - new Date(timer.clock_in).getTime()) / 1000))
      return this.formatDuration(seconds)
    },

    vendorOptions() {
      return (this.vendorWithoutPg || []).map(v => ({ id: v.user?.id, full_name: v.user?.user_name }))
    },

    // `client/fetchClientWithoutPg` rows carry the client's own record id in
    // `c.id`, but adding a client to a project needs the underlying user's
    // id (`c.user.id`) — and the descriptive `company_name` (e.g. "Test
    // Client 1 Catch (BIL-RV-000040)") reads better than the bare company name.
    clientOptions() {
      return (this.clientWithoutPg || []).map(c => ({ id: c.user?.id, full_name: c.company_name ?? 'N/A' }))
    },
  },

  watch: {
    taskDetail(detail) {
      this.taskForm = {
        id: detail?.id ?? null,
        title: detail?.title ?? '',
        description: detail?.description ?? '',
        start_date: detail?.start_date ?? null,
        end_date: detail?.end_date ?? null,
      }
    },
  },

  created() {
    const id = this.$route.params.id
    this.$store.dispatch('project/fetchProjectDetails', id)
    this.$store.dispatch('project/fetchProjectAttachment', id)
    this.$store.dispatch('project/fetchClientByProject', id)
    this.$store.dispatch('project/fetchVendorByProject', id)
    this.$store.dispatch('task/fetchTaskCategory', id)
    this.$store.dispatch('client/fetchClientWithoutPg')
    this.$store.dispatch('vendor/fetchVendorWithoutPg')
    this.$store.dispatch('employee/fetchEmployeeList')

    // Deep link from the Navbar notification bell (?openTask=<task id>) —
    // openTask() only ever reads t.id, so this works without the task
    // needing to already be in the loaded kanban board.
    const openTaskId = this.$route.query.openTask
    if (openTaskId) {
      this.openTask({ id: Number(openTaskId) })
      const query = { ...this.$route.query }
      delete query.openTask
      this.$router.replace({ query })
    }
  },

  mounted() {
    document.addEventListener('mousedown', this.handleStageMenuOutsideClick)
  },

  beforeUnmount() {
    this.stopTimerTick()
    document.removeEventListener('mousedown', this.handleStageMenuOutsideClick)
  },

  methods: {
    formatDate, formatDateTime, capitalize, stripHtml, linkify, getInitials, formatMoney,

    goBack() {
      goBackTo(this.$router, { name: this.$route.name === 'MyProjectDetails' ? 'MyProjects' : 'ProjectList' })
    },

    // Project team chat (chat API §2: membership is derived from the team,
    // synced by this get-or-create call). Non-team viewers get a 400.
    async openProjectChat() {
      this.chatOpening = true
      try {
        await this.$store.dispatch('chat/openProjectChat', this.project.id)
      } catch (e) {
        this.toast?.error(e.message || 'Could not open the project chat.')
      } finally {
        this.chatOpening = false
      }
    },

    statusStyle(status) { return PROJECT_STATUS_STYLES[status] ?? 'bg-typo-100 text-typo-700' },
    priorityStyle(priority) { return PROJECT_PRIORITY_STYLES[priority] ?? 'bg-typo-50 text-typo-500 border border-typo-100' },
    statusTextStyle(status) { return PROJECT_STATUS_TEXT_STYLES[status] ?? 'text-typo-500' },
    priorityTextStyle(priority) { return PROJECT_PRIORITY_TEXT_STYLES[priority] ?? 'text-typo-500' },

    // Project Finance tab's Requisitions/Invoices status — plain uppercase
    // colored text (no pill) instead of a badge, per requisitionStatusColor/
    // invoiceStatusColor's badge-color keyword.
    requisitionStatusColor(status) { return REQUISITION_STATUS_COLORS[status] ?? 'default' },
    purchaseRequisitionStatusColor(status) { return PURCHASE_REQUISITION_STATUS_COLORS[status] ?? 'default' },
    invoiceStatusColor(status) { return INVOICE_STATUS_COLORS[status] ?? 'default' },
    financeStatusTextClass(colorKey) { return FINANCE_STATUS_TEXT_CLASSES[colorKey] ?? 'text-typo-500' },

    priorityTextClass(p) {
      const color = this.priorityBadgeColor(p)
      return { danger: 'text-accent-500', info: 'text-brand-500', success: 'text-secondary-600' }[color] ?? 'text-typo-500'
    },

    stageColor(stage, idx) {
      return STAGE_COLORS[stage] ?? STAGE_COLOR_FALLBACK[idx % STAGE_COLOR_FALLBACK.length]
    },

    pad2(n) { return String(n).padStart(2, '0') },

    async copyReferenceId() {
      try {
        await navigator.clipboard.writeText(this.project.reference_id)
        this.toast?.success('Reference ID copied.')
      } catch {
        this.toast?.error('Could not copy reference ID.')
      }
    },

    // Project-level teammates key the user object as `user_id`; task/subtask
    // teammates (task/fetchTaskCategory, fetchTaskDetails, fetchSubTaskList)
    // key it as `member_id` instead — same shape, different field name.
    // Check both so kanban cards and task/subtask avatars don't silently
    // fall back to initials.
    teammatePhoto(t) {
      const photo = t?.user_id?.additional_info?.photo ?? t?.member_id?.additional_info?.photo
      return memberPhotoUrl({ photo })
    },

    commentPhoto(c) {
      return memberPhotoUrl({ photo: c?.commenter_photo })
    },

    mapTeammates(teammates) {
      return (teammates || []).map(t => ({
        id: t.id, full_name: t.user_name,
        photo: t.user_id?.additional_info?.photo ?? t.member_id?.additional_info?.photo,
      }))
    },

    // Every dispatched action here catches its own request errors internally
    // (see store/project.js and store/task.js) and returns `undefined`
    // instead of rejecting, so a plain try/catch never sees an application-
    // level failure — only a genuine thrown exception. The backend also
    // reports failures as an HTTP 200 with `{ code: 400, response: '...' }`
    // in the body. So every dispatch below must check `res?.code === 200`
    // to tell success from failure, matching CrmLeadDetails.vue's `isOk`.
    isOk(res) {
      return res?.code === 200
    },

    askConfirm(title, message, onConfirm, variant = 'danger') {
      this.confirm = { title, message, variant, onConfirm }
    },

    async runConfirm() {
      if (!this.confirm) return
      this.confirmLoading = true
      try {
        await this.confirm.onConfirm()
      } finally {
        this.confirmLoading = false
        this.confirm = null
      }
    },

    reloadProject() {
      return this.$store.dispatch('project/fetchProjectDetails', this.$route.params.id)
    },

    // ── Status ───────────────────────────────────────────────────────────
    async handleStatusChange(status) {
      this.statusSaving = true
      try {
        const res = await this.$store.dispatch('project/updateProjectStatus', { id: this.project.id, status_for_change: status })
        if (this.isOk(res)) {
          await this.reloadProject()
          this.toast?.success(res?.response || 'Status updated.')
        } else {
          this.toast?.error(res?.response || 'Failed to update status.')
        }
      } catch {
        this.toast?.error('Failed to update status.')
      } finally {
        this.statusSaving = false
      }
    },

    // `project/updateProjectPriority` dispatches its own `fetchProjectDetails`
    // refresh internally (see store/project.js), unlike updateProjectStatus —
    // so no explicit reloadProject() call is needed here.
    async handlePriorityChange(priority) {
      this.prioritySaving = true
      try {
        const res = await this.$store.dispatch('project/updateProjectPriority', { id: this.project.id, status: priority })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Priority updated.')
        } else {
          this.toast?.error(res?.response || 'Failed to update priority.')
        }
      } catch {
        this.toast?.error('Failed to update priority.')
      } finally {
        this.prioritySaving = false
      }
    },

    // ── Project lead ─────────────────────────────────────────────────────
    // The lead-select control isn't a separate button — clicking a member's
    // own avatar (on anyone who isn't already lead) promotes them. The
    // tooltip below is the only affordance for that, so it has to spell out
    // the action.
    leadTooltip(t) {
      return t.project_lead ? `${t.user_name} — Project Lead` : `Click to make ${t.user_name} the project lead`
    },

    askChangeLead(teammate) {
      if (teammate.project_lead) return
      this.askConfirm(
        'Change Project Lead',
        `Are you sure you want to make ${teammate.user_name} the project lead?`,
        async () => {
          try {
            const res = await this.$store.dispatch('project/makeNewProjectLead', { project: this.project.id, lead: teammate.user_id?.id })
            if (this.isOk(res)) {
              this.toast?.success(res?.response || 'Project lead updated.')
            } else {
              this.toast?.error(res?.response || 'Failed to update project lead.')
            }
          } catch {
            this.toast?.error('Failed to update project lead.')
          }
        },
        'primary',
      )
    },

    // ── Members ──────────────────────────────────────────────────────────
    async onAssignProjectMembers(ids) {
      this.assigningProjectMember = true
      try {
        const results = await Promise.all(ids.map(id => this.$store.dispatch('project/assignProjectEmployee', { project_id: this.project.id, member_id: id })))
        if (results.every(r => this.isOk(r))) {
          this.toast?.success('Member added.')
          this.addMemberOpen = false
        } else {
          this.toast?.error(results.find(r => !this.isOk(r))?.response || 'Failed to add member.')
        }
      } catch {
        this.toast?.error('Failed to add member.')
      } finally {
        this.assigningProjectMember = false
      }
    },

    askRemoveTeammate(t) {
      this.askConfirm('Remove Member', `Remove ${t.user_name} from this project?`, async () => {
        try {
          const res = await this.$store.dispatch('project/deleteTeammateFromProjects', { id: t.id, detail_id: this.project.id })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Member removed.')
          } else {
            this.toast?.error(res?.response || 'Failed to remove member.')
          }
        } catch {
          this.toast?.error('Failed to remove member.')
        }
      })
    },

    // ── Documents ────────────────────────────────────────────────────────
    openDocsPanel() {
      this.showDocsPanel = true
    },

    // All of these share the same docked-right slot (Overview/Team/Finance/
    // Activity Log, Deliverables, Supporting Documents, Quick View) — close
    // every other one before opening one, so two can never render stacked
    // on top of each other.
    closeSidePanels() {
      this.sidebarOpen = false
      this.showDeliverables = false
      this.showDocsPanel = false
      this.showQuickView = false
    },

    // ── Tabs (Figma node 772-16752) ──────────────────────────────────────
    // Overview / Team Management / Project Finance share one slide-in
    // sidebar (content switches on activeTab); Deliverables / Supporting
    // Documents just trigger the modal/sidebar that already existed here.
    selectTab(tab) {
      this.closeSidePanels()
      if (tab.key === 'deliverables') { this.openDeliverables(); return }
      if (tab.key === 'documents') { this.openDocsPanel(); return }
      // Guard on `project.project_id` (the human-readable code these two
      // report endpoints key on, e.g. "PRO-CB-000012" — NOT `project.id`)
      // being present before firing. A request with a missing/undefined id
      // segment risks a real HTTP 404, and the shared axios interceptor
      // (plugins/axios.js) redirects the WHOLE app to the NotFound route on
      // any 404 from anywhere — so a bad background fetch here would bounce
      // the user off the page entirely, not just fail quietly.
      if (tab.key === 'team' && this.project.project_id) {
        this.$store.dispatch('task/fetchTaskProgress', { projectId: this.project.project_id })
        this.$store.dispatch('task/fetchEmployeeTimeLog', { projectId: this.project.project_id })
      }
      // Project Finance's inline Requisitions/Quotations/Invoices tables
      // (Figma node 826:20817) — the only finance record types shown here.
      if (tab.key === 'finance') {
        this.$store.dispatch('project/fetchRequisitionByProject', this.project.id)
        this.$store.dispatch('project/fetchPurchaseRequisitionByProject', this.project.id)
        this.$store.dispatch('project/fetchQuotationByProject', this.project.id)
        this.$store.dispatch('project/fetchInvoiceByProject', this.project.id)
      }
      // Project Activity (the diary) — one flat list, always type=all.
      if (tab.key === 'activity') {
        this.diaryFormOpen = false
        this.$store.dispatch('task/fetchProjectActivity', { projectId: this.project.id, type: 'all' })
      }
      this.activeTab = tab.key
      this.sidebarOpen = true
    },

    closeSidebar() {
      this.sidebarOpen = false
    },

    // ── Header quick actions ─────────────────────────────────────────────
    openQuickView() {
      this.closeSidePanels()
      this.showQuickView = true
      this.$store.dispatch('task/fetchProjectActivityLog', this.project.id)
    },

    // "Task: …" reference chip (Figma node 772:18802) — entry.reference is
    // only ever a task reference per the API guide.
    activityTaskLabel(entry) {
      return entry.reference ? `Task: ${entry.reference.title}` : null
    },

    // Handles both shapes seen for this field: the create payload takes a
    // plain string, while some read-side responses echo it back resolved
    // into an array of { id, name, photo } objects.
    participantsLabel(entry) {
      const p = entry.participants
      if (!p) return null
      if (typeof p === 'string') return p
      if (Array.isArray(p)) return p.map(x => x.name || x).join(', ') || null
      return null
    },

    // DIARY_TYPES no longer lists next_action (not creatable here), but
    // existing rows can still have it — fall back to a plain capitalize.
    diaryTypeLabel(type) {
      return DIARY_TYPES.find(t => t.value === type)?.label ?? capitalize((type || '').replace('_', ' '))
    },

    // ── Project Activity (the diary) — Activity Log tab. One flat list
    // (always type=all), so every mutation below just refetches with
    // type: 'all' rather than tracking a current tab/filter. ────────────────
    async submitDiaryEntry() {
      if (!this.diaryForm.label) return
      this.diarySaving = true
      try {
        const payload = {
          type: this.diaryForm.type,
          label: this.diaryForm.label,
          // Combined into one ISO datetime, same as CrmLeadDetails.vue's own
          // follow-up date/time — omitted entirely (backend defaults to
          // "now") if no date was picked.
          date: this.diaryForm.date ? `${this.diaryForm.date}T${this.diaryForm.time || '09:00'}:00` : undefined,
          notes: this.diaryForm.notes || undefined,
          outcome: this.diaryForm.outcome,
          // Free text (e.g. "Nadia, Sabbir, client's CTO"), sent straight
          // through as the API's own `participants` field.
          participants: this.diaryForm.participants || undefined,
        }
        const res = await this.$store.dispatch('task/createProjectActivity', { projectId: this.project.id, payload, type: 'all' })
        if (res?.code === 200) {
          this.toast?.success(res?.response || 'Activity logged.')
          this.diaryFormOpen = false
          this.diaryForm = blankDiaryForm()
        } else {
          this.toast?.error(res?.response || 'Failed to log activity.')
        }
      } catch {
        this.toast?.error('Failed to log activity.')
      } finally {
        this.diarySaving = false
      }
    },

    async toggleNextActionDone(entry) {
      try {
        await this.$store.dispatch('task/toggleActivityDone', { id: entry.id, projectId: this.project.id, type: 'all' })
      } catch {
        this.toast?.error('Failed to update.')
      }
    },

    askDeleteDiaryEntry(entry) {
      this.askConfirm('Delete Entry', 'Delete this activity log entry? This cannot be undone.', async () => {
        try {
          const res = await this.$store.dispatch('task/deleteProjectActivity', { id: entry.id, projectId: this.project.id, type: 'all' })
          if (res?.code === 200) {
            this.toast?.success(res?.response || 'Entry deleted.')
          } else {
            this.toast?.error(res?.response || 'Failed to delete entry.')
          }
        } catch {
          this.toast?.error('Failed to delete entry.')
        }
      })
    },

    // Task Progress / Employee Logged Time row click (Figma node 813:20595's
    // info banner) — a per-employee progression drill-down isn't part of the
    // task-progress/employee-time-log API yet, so this is still a
    // placeholder ("coming soon" toast).
    openEmployeeProgression(row) {
      this.toast?.info(`Detailed progression view for ${row.employee_name} is coming soon.`, 'Employee Progression')
    },

    askDeleteProject() {
      this.askConfirm('Delete Project', `Delete "${this.project.title}"? This cannot be undone.`, async () => {
        try {
          const res = await this.$store.dispatch('project/deleteProject', { id: this.project.id })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Project deleted.')
            this.$router.push({ name: 'ProjectList' })
          } else {
            this.toast?.error(res?.response || 'Failed to delete project.')
          }
        } catch {
          this.toast?.error('Failed to delete project.')
        }
      })
    },

    // ── Quick "Add New Task" (header button) ─────────────────────────────
    openQuickAdd() {
      this.quickAddForm = { stage: this.stageOptions[0] || '', title: '' }
      this.quickAddOpen = true
    },

    async submitQuickAdd() {
      if (!this.quickAddForm.title || !this.quickAddForm.stage) return
      this.quickAddSaving = true
      try {
        const res = await this.$store.dispatch('task/addTask', {
          title: this.quickAddForm.title, project: this.project.id, label_name: this.quickAddForm.stage,
        })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Task added.')
          this.quickAddOpen = false
        } else {
          this.toast?.error(res?.response || 'Failed to add task.')
        }
      } catch {
        this.toast?.error('Failed to add task.')
      } finally {
        this.quickAddSaving = false
      }
    },

    // ── Vendor / client ──────────────────────────────────────────────────
    async addVendor() {
      this.vendorSaving = true
      try {
        const results = await Promise.all(this.selectedVendors.map(v => this.$store.dispatch('project/projectAddVendor', { project_id: this.project.id, vendor_id: v.id })))
        if (results.every(r => this.isOk(r))) {
          this.toast?.success('Vendor added.')
          this.selectedVendors = []
        } else {
          this.toast?.error(results.find(r => !this.isOk(r))?.response || 'Failed to add vendor.')
        }
      } catch {
        this.toast?.error('Failed to add vendor.')
      } finally {
        this.vendorSaving = false
      }
    },

    askRemoveVendorAlloc(v) {
      this.askConfirm('Remove Vendor', `Remove ${v.user_name} from this project?`, async () => {
        try {
          const res = await this.$store.dispatch('project/deleteVendorFromProjects', { id: v.id, detail_id: this.project.id })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Vendor removed.')
          } else {
            this.toast?.error(res?.response || 'Failed to remove vendor.')
          }
        } catch {
          this.toast?.error('Failed to remove vendor.')
        }
      })
    },

    async addClient() {
      this.clientSaving = true
      try {
        const results = await Promise.all(this.selectedClients.map(c => this.$store.dispatch('project/projectAddClient', { project_id: this.project.id, client_id: c.id })))
        if (results.every(r => this.isOk(r))) {
          this.toast?.success('Client added.')
          this.selectedClients = []
        } else {
          this.toast?.error(results.find(r => !this.isOk(r))?.response || 'Failed to add client.')
        }
      } catch {
        this.toast?.error('Failed to add client.')
      } finally {
        this.clientSaving = false
      }
    },

    askRemoveClientAlloc(c) {
      this.askConfirm('Remove Client', `Remove ${c.company_name} from this project?`, async () => {
        try {
          const res = await this.$store.dispatch('project/deleteClientFromProjects', { id: c.id, detail_id: this.project.id })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Client removed.')
          } else {
            this.toast?.error(res?.response || 'Failed to remove client.')
          }
        } catch {
          this.toast?.error('Failed to remove client.')
        }
      })
    },

    openDeliverables() { this.showDeliverables = true },

    // ── Task board / stages ──────────────────────────────────────────────
    tasksForStage(stage) {
      // Real tasks carry the stage name in `status` (`label` is the stage's
      // numeric FK id) — only the synthetic "Add New" placeholder rows built
      // by task/fetchTaskCategory set `label` to the stage name too, which is
      // why filtering on `label` looked like it worked for those but hid
      // every real task.
      return (this.taskCategory.tasks || []).filter(t => t.status === stage)
    },

    isAddTaskPlaceholder(t) {
      return t.title === 'Add New'
    },

    // Real (non-placeholder) tasks for a stage, filtered by the header
    // search box, plus the "Add New" placeholder card — only when its
    // column's "+" has been clicked (see toggleAddTask).
    visibleTasksForStage(stage) {
      const all = this.tasksForStage(stage)
      const term = this.searchTerm.trim().toLowerCase()
      const real = all.filter(t => !this.isAddTaskPlaceholder(t) && (!term || t.title.toLowerCase().includes(term)))
      const placeholder = all.find(t => this.isAddTaskPlaceholder(t))
      return placeholder && this.addTaskRevealed[stage] ? [...real, placeholder] : real
    },

    stageTaskCount(stage) {
      return this.tasksForStage(stage).filter(t => !this.isAddTaskPlaceholder(t)).length
    },

    toggleAddTask(stage) {
      this.addTaskRevealed = { ...this.addTaskRevealed, [stage]: !this.addTaskRevealed[stage] }
    },

    async addStage() {
      if (!this.newStageName.trim()) return
      this.stageSaving = true
      try {
        const res = await this.$store.dispatch('task/addTaskCategory', { name: this.newStageName.trim(), project: this.project.id })
        if (this.isOk(res)) {
          this.newStageName = ''
        } else {
          this.toast?.error(res?.response || 'Failed to add stage.')
        }
      } catch {
        this.toast?.error('Failed to add stage.')
      } finally {
        this.stageSaving = false
      }
    },

    toggleStageMenu(stage) {
      this.openStageMenu = this.openStageMenu === stage ? null : stage
    },

    handleStageMenuOutsideClick(e) {
      if (this.openStageMenu !== null && !e.target.closest('.kanban-menu')) {
        this.openStageMenu = null
      }
    },

    startEditLabel(stage) {
      this.editLabelTarget = stage
      this.editLabelName = stage
    },

    async saveEditLabel() {
      this.editLabelSaving = true
      try {
        const res = await this.$store.dispatch('task/editTaskLabel', { old_label: this.editLabelTarget, new_label: this.editLabelName.trim(), project_id: this.project.id })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Stage updated.')
          this.editLabelTarget = null
        } else {
          this.toast?.error(res?.response || 'Failed to update stage.')
        }
      } catch {
        this.toast?.error('Failed to update stage.')
      } finally {
        this.editLabelSaving = false
      }
    },

    askDeleteLabel(stage) {
      this.askConfirm('Delete Stage', `Delete the "${stage}" stage and all its tasks?`, async () => {
        try {
          const res = await this.$store.dispatch('task/deleteLabel', { name: stage, project_id: this.project.id })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Stage deleted.')
          } else {
            this.toast?.error(res?.response || 'Failed to delete stage.')
          }
        } catch {
          this.toast?.error('Failed to delete stage.')
        }
      })
    },

    async addTask(stage, placeholder) {
      if (!placeholder.new_title) return
      this.addingTask = true
      try {
        const res = await this.$store.dispatch('task/addTask', { title: placeholder.new_title, project: this.project.id, label_name: stage })
        if (this.isOk(res)) {
          placeholder.new_title = ''
          this.toast?.success(res?.response || 'Task added.')
        } else {
          this.toast?.error(res?.response || 'Failed to add task.')
        }
      } catch {
        this.toast?.error('Failed to add task.')
      } finally {
        this.addingTask = false
      }
    },

    priorityLabel(p) { return { 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH' }[p] ?? 'LOW' },
    priorityBadgeColor(p) { return { 1: 'danger', 2: 'info', 3: 'success' }[p] ?? 'danger' },

    async cyclePriority(t) {
      const next = { 1: 3, 2: 1, 3: 2 }[t.priority] ?? 3
      try {
        const res = await this.$store.dispatch('task/toggleTaskPriority', { id: t.id, priority: next, project: this.project.id })
        if (!this.isOk(res)) this.toast?.error(res?.response || 'Failed to update priority.')
      } catch {
        this.toast?.error('Failed to update priority.')
      }
    },

    onDragStart(t) {
      this.draggedTaskId = t.id
    },

    async onDropTask(stage) {
      if (!this.draggedTaskId || stage === 'Add New') { this.draggedTaskId = null; return }
      const id = this.draggedTaskId
      this.draggedTaskId = null
      try {
        const res = await this.$store.dispatch('task/updateTaskLabel', { id, label: stage, project: this.project.id })
        if (!this.isOk(res)) this.toast?.error(res?.response || 'Failed to move task.')
      } catch {
        this.toast?.error('Failed to move task.')
      }
    },

    // ── Task sidebar ─────────────────────────────────────────────────────
    openTask(t) {
      this.activeTaskId = t.id
      this.taskEditing = false
      this.taskDescExpanded = false
      this.expandedSubDescs = {}
      this.subAssignTarget = null
      this.editSubTarget = null
      this.subCreateOpen = false
      this.subForm = { title: '', description: '' }
      this.taskSidebarOpen = true
      this.$store.dispatch('task/fetchTaskDetails', t.id)
      this.$store.dispatch('task/fetchSubTaskList', t.id)
      this.$store.dispatch('task/fetchComments', t.id)
      this.$store.dispatch('project/fetchTaskMemberList', t.id)
      // task/fetchRunningTimers also force-closes any timer left running from
      // a previous day server-side (close_stale()) — see task.txt §2.1/§2.2.
      this.$store.dispatch('task/fetchRunningTimers')
      this.$store.dispatch('task/fetchTimeLogsByTask', t.id)
      this.startTimerTick()
    },

    closeTaskSidebar() {
      this.taskSidebarOpen = false
      this.taskDiscussionOpen = false
      this.activeTaskId = null
      this.stopTimerTick()
    },

    openTaskDiscussion() {
      this.taskDiscussionOpen = true
    },

    closeTaskDiscussion() {
      this.taskDiscussionOpen = false
    },

    // ── Time tracking (task.txt Part 2) ───────────────────────────────────
    startTimerTick() {
      if (this.timerIntervalId) return
      this.timerIntervalId = setInterval(() => { this.nowTick = Date.now() }, 1000)
    },

    stopTimerTick() {
      if (this.timerIntervalId) {
        clearInterval(this.timerIntervalId)
        this.timerIntervalId = null
      }
    },

    formatDuration(totalSeconds) {
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
    },

    formatLoggedDuration(seconds) {
      if (seconds == null) return 'In progress'
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    },

    async toggleClock() {
      await this.toggleClockFor(this.activeTaskId)
    },

    subDescIsLong(sub) {
      return stripHtml(sub.description || '').length > 160
    },

    toggleSubDesc(sub) {
      this.expandedSubDescs[sub.id] = !this.expandedSubDescs[sub.id]
    },

    // Subtasks are just Task rows with a `parent` (task.txt §1.1 /
    // store/task.js `parent: 0`), so the same clock-in/out endpoints work
    // by passing the subtask's own id as the task id.
    subRunningTimer(sub) {
      return (this.runningTimers || []).find(t => t.task === sub.id)
    },

    subTimerElapsedLabel(sub) {
      const timer = this.subRunningTimer(sub)
      if (!timer) return null
      const seconds = Math.max(0, Math.floor((this.nowTick - new Date(timer.clock_in).getTime()) / 1000))
      return this.formatDuration(seconds)
    },

    async toggleClockFor(taskId) {
      const running = (this.runningTimers || []).find(t => t.task === taskId)
      if (running) {
        await this.clockOutTask(taskId)
      } else {
        await this.clockInTask(taskId)
      }
    },

    async clockInTask(taskId = this.activeTaskId) {
      this.clockBusy = true
      try {
        const res = await this.$store.dispatch('task/clockIn', { taskId })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Clocked in.')
        } else {
          this.toast?.error(res?.response || 'Failed to clock in.')
        }
      } catch {
        this.toast?.error('Failed to clock in.')
      } finally {
        // Clocking a subtask in/out refreshes that subtask's own time-log
        // list server-side (task/fetchTimeLogsByTask) — pull the open
        // task's logs back so the Time Tracking panel above stays correct.
        if (taskId !== this.activeTaskId) this.$store.dispatch('task/fetchTimeLogsByTask', this.activeTaskId)
        this.clockBusy = false
      }
    },

    async clockOutTask(taskId = this.activeTaskId) {
      this.clockBusy = true
      try {
        const res = await this.$store.dispatch('task/clockOut', { taskId })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Clocked out.')
        } else {
          this.toast?.error(res?.response || 'Failed to clock out.')
        }
      } catch {
        this.toast?.error('Failed to clock out.')
      } finally {
        if (taskId !== this.activeTaskId) this.$store.dispatch('task/fetchTimeLogsByTask', this.activeTaskId)
        this.clockBusy = false
      }
    },

    askDeleteTimeLog(log) {
      this.askConfirm('Delete Time Log', 'Delete this time log entry?', async () => {
        try {
          const res = await this.$store.dispatch('task/deleteTimeLog', { id: log.id, taskId: this.activeTaskId })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Time log deleted.')
          } else {
            this.toast?.error(res?.response || 'Failed to delete time log.')
          }
        } catch {
          this.toast?.error('Failed to delete time log.')
        }
      })
    },

    editTask() {
      this.taskForm = {
        id: this.taskDetail.id,
        title: this.taskDetail.title ?? '',
        description: this.taskDetail.description ?? '',
        start_date: this.taskDetail.start_date ?? null,
        end_date: this.taskDetail.end_date ?? null,
      }
      this.taskEditing = true
    },

    async saveTask() {
      this.taskSaving = true
      try {
        const res = await this.$store.dispatch('task/updateTask', { detail: this.taskForm, project_id: this.project.id })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Task updated.')
          this.taskEditing = false
          this.$store.dispatch('task/fetchTaskDetails', this.activeTaskId)
        } else {
          this.toast?.error(res?.response || 'Failed to update task.')
        }
      } catch {
        this.toast?.error('Failed to update task.')
      } finally {
        this.taskSaving = false
      }
    },

    askDeleteTask() {
      this.askConfirm('Delete Task', 'Are you sure you want to delete this task?', async () => {
        try {
          const res = await this.$store.dispatch('task/deleteTask', { id: this.activeTaskId, project_id: this.project.id })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Task deleted.')
            this.closeTaskSidebar()
          } else {
            this.toast?.error(res?.response || 'Failed to delete task.')
          }
        } catch {
          this.toast?.error('Failed to delete task.')
        }
      })
    },

    // ── Subtasks ─────────────────────────────────────────────────────────
    cancelCreateSubTask() {
      this.subCreateOpen = false
      this.subForm = { title: '', description: '' }
    },

    async createSubTask() {
      if (!this.subForm.title) return
      this.subCreating = true
      try {
        const res = await this.$store.dispatch('task/addSubTask', {
          title: this.subForm.title, description: this.subForm.description,
          project: this.project.id, parent: this.activeTaskId,
        })
        if (this.isOk(res)) {
          this.subForm = { title: '', description: '' }
          this.subCreateOpen = false
          this.toast?.success(res?.response || 'Subtask created.')
        } else {
          this.toast?.error(res?.response || 'Failed to create subtask.')
        }
      } catch {
        this.toast?.error('Failed to create subtask.')
      } finally {
        this.subCreating = false
      }
    },

    startEditSub(sub) {
      this.editSubTarget = sub.id
      this.editSubForm = { id: sub.id, title: sub.title, description: sub.description, end_date: sub.end_date }
    },

    async saveSubTask() {
      this.subSaving = true
      try {
        const res = await this.$store.dispatch('task/updateSubTask', { sub: this.editSubForm, parent: this.activeTaskId })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Subtask updated.')
          this.editSubTarget = null
        } else {
          this.toast?.error(res?.response || 'Failed to update subtask.')
        }
      } catch {
        this.toast?.error('Failed to update subtask.')
      } finally {
        this.subSaving = false
      }
    },

    async toggleSubtask(sub) {
      try {
        const res = await this.$store.dispatch('task/toggleSubTaskStatus', { id: sub.id, parent: this.activeTaskId })
        if (!this.isOk(res)) this.toast?.error(res?.response || 'Failed to update subtask.')
      } catch {
        this.toast?.error('Failed to update subtask.')
      }
    },

    askDeleteSub(sub) {
      this.askConfirm('Delete Subtask', 'Are you sure you want to delete this subtask?', async () => {
        try {
          const res = await this.$store.dispatch('task/deleteSubTask', { id: sub.id, parent: this.activeTaskId })
          if (this.isOk(res)) {
            this.toast?.success(res?.response || 'Subtask deleted.')
          } else {
            this.toast?.error(res?.response || 'Failed to delete subtask.')
          }
        } catch {
          this.toast?.error('Failed to delete subtask.')
        }
      })
    },

    toggleSubAssign(sub) {
      this.subAssignTarget = this.subAssignTarget === sub.id ? null : sub.id
    },

    // ── Member assign (task + subtask) ──────────────────────────────────
    async onAssignMembers(ids, subtaskId) {
      this.assigningMember = true
      try {
        const results = await Promise.all(ids.map(id => this.$store.dispatch('task/assignEmployee', {
          task_id: this.activeTaskId, subtask_id: subtaskId, member_id: id,
        })))
        if (results.every(r => this.isOk(r))) {
          this.toast?.success('Member assigned.')
          // Assigning someone directly to the task (not a subtask) changes
          // who's eligible for subtask assignment too. task/assignEmployee
          // only refreshes task-module state, not this project-module list,
          // so without this the subtask picker shows a stale candidate list
          // until the sidebar is closed and reopened.
          if (subtaskId == null) this.$store.dispatch('project/fetchTaskMemberList', this.activeTaskId)
        } else {
          this.toast?.error(results.find(r => !this.isOk(r))?.response || 'Failed to assign member.')
        }
      } catch {
        this.toast?.error('Failed to assign member.')
      } finally {
        this.assigningMember = false
      }
    },

    async onUnassignMember(id) {
      this.assigningMember = true
      try {
        const res = await this.$store.dispatch('task/deleteAssignedMember', { id, task: this.activeTaskId })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Member removed.')
          // Same staleness issue as onAssignMembers — this can be a task- or
          // subtask-level removal, and there's no cheap way to tell which
          // from here, so just refresh unconditionally.
          this.$store.dispatch('project/fetchTaskMemberList', this.activeTaskId)
        } else {
          this.toast?.error(res?.response || 'Failed to remove member.')
        }
      } catch {
        this.toast?.error('Failed to remove member.')
      } finally {
        this.assigningMember = false
      }
    },

    // ── Comments ─────────────────────────────────────────────────────────
    async addComment() {
      if (!this.newComment) return
      this.commentSending = true
      try {
        const res = await this.$store.dispatch('task/addComment', { task_id: this.activeTaskId, comment: this.newComment })
        if (this.isOk(res)) {
          this.newComment = ''
        } else {
          this.toast?.error(res?.response || 'Failed to add comment.')
        }
      } catch {
        this.toast?.error('Failed to add comment.')
      } finally {
        this.commentSending = false
      }
    },
  },
}
</script>

<style scoped>
/* Inline status-change control — same markup/classes as ProjectList.vue's
   own status <select>, but that CSS is scoped to ProjectList.vue and never
   reaches this component, so it has to be repeated here. Fully de-chromed
   (appearance: none) with our own chevron icon drawn on top, since a native
   <select>'s own arrow ignores author padding in most browsers. */
.status-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  border-radius: 36px;
}
.status-select-wrap--disabled { opacity: .6; }
.status-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background: transparent;
  color: inherit;
  border: none;
  border-radius: 36px;
  padding: 6px 26px 6px 12px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  cursor: pointer;
  white-space: nowrap;
}
.status-select option { color: #272727; background: #fff; font-weight: 500; }
.status-select__icon {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  pointer-events: none;
}

@keyframes sidebar-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sidebar-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

.entity-sidebar__close {
  background: transparent; border: none; font-size: 20px; color: #A3A3A4; cursor: pointer;
  padding: 2px; border-radius: 6px; line-height: 1; display: flex; flex-shrink: 0;
  transition: color .15s, background-color .15s;
}
.entity-sidebar__close:hover { color: #272727; background: #F0F0F0; }

.details-text { cursor: pointer; max-height: 4.5em; overflow: hidden; font-size: 13.5px; color: #475569; line-height: 1.6; }
.details-text.expanded { max-height: none; }

/* Project Finance's inline "Full List" pill (Figma node 826:20817) — links
   to that record type's real list page (this project isn't a filter those
   pages support, so it's the same unfiltered list any other "Requisitions"/
   "Quotations"/"Invoices" nav entry opens). */
.finance-full-list-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 6px; border: none;
  background: #E9EFFF; color: #573FE0; font-size: 10px; font-weight: 600;
  cursor: pointer; transition: background-color .15s; text-decoration: none;
}
.finance-full-list-btn:hover { background: #DCE4FF; }
.finance-full-list-btn i { font-size: 12px; }

/* Small "+" next to each Financial Summary section title — links to that
   record type's create page with this project preselected via ?project=. */
.finance-add-link {
  display: inline-flex; align-items: center; justify-content: center;
  color: #6B61EF; text-decoration: none; font-size: 12px; line-height: 1;
}
.finance-add-link:hover { color: #573FE0; }

/* Requisitions / Quotations / Invoices tab bar inside Financial Summary —
   same underline-tab idiom as the page's own top nav (Overview/Team/
   Finance), scaled to the sidebar. */
.finance-tabs {
  display: flex; gap: 16px; border-bottom: 1px solid #DCDCDC; margin-bottom: 4px;
}
.finance-tab {
  appearance: none; border: none; background: transparent; padding: 0 0 8px;
  font-size: 13px; font-weight: 600; color: #888889; cursor: pointer;
  border-bottom: 2px solid transparent; transition: color .15s, border-color .15s;
}
.finance-tab:hover { color: #573FE0; }
.finance-tab--active { color: #573FE0; border-bottom-color: #573FE0; }

.member-avatar {
  position: relative; width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; overflow: visible;
  display: flex; align-items: center; justify-content: center; cursor: default;
  background: #573FE0; color: #fff; font-size: 13px; font-weight: 700;
  border: 2px solid transparent; z-index: 1;
}
.member-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.member-avatar--lead { border-color: #F59E0B; }
.member-avatar--clickable { cursor: pointer; }
/* Overlapping rows (.pd-assignee) stack later siblings on top, which used to
   cover the previous avatar's remove "x" on hover — lift the hovered avatar
   above its neighbours so the button stays visible and clickable. */
.member-avatar:hover { z-index: 5; }
.member-avatar--add {
  background: #F8FAFC; border: 1.5px dashed #CBD5E1; color: #64748B; cursor: pointer;
}
.member-avatar__remove {
  position: absolute; top: -2px; right: -2px; width: 16px; height: 16px; border-radius: 50%;
  background: #DB3545; color: #fff; border: none; display: flex; align-items: center; justify-content: center;
  font-size: 10px; cursor: pointer; opacity: 0; transition: opacity .15s;
}
.member-avatar:hover .member-avatar__remove { opacity: 1; }

/* Smaller overlapping avatar row for the Overview sidebar's "Assigned" field
   (Figma node 772-18723) — same component, just 26px and slightly
   overlapping instead of the full-size gap-2.5 row used elsewhere. */
.pd-assignee { width: 26px; height: 26px; font-size: 10px; margin-left: -6px; }
.pd-assignee:first-child { margin-left: 0; }
.member-avatar--add-sm { background: #28A645; border-color: transparent; color: #fff; }

.assigned-pill {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 6px 5px 10px; border-radius: 999px; background: #F5F4FF; border: 1px solid #E4E1FF;
  font-size: 12px; font-weight: 600; color: #272727;
}
.assigned-pill button { background: transparent; border: none; color: #6E6E6F; cursor: pointer; display: flex; padding: 0; }

/* Activity Log timeline (Figma node 772:18802) — one continuous vertical
   line down the left edge with a dot per date group, entries indented
   underneath. */
.activity-timeline { position: relative; padding-left: 16px; }
.activity-timeline::before {
  content: ''; position: absolute; left: 3px; top: 6px; bottom: 6px; width: 2px;
  background: #E4E1FF;
}
.activity-group { position: relative; margin-bottom: 16px; }
.activity-group:last-child { margin-bottom: 0; }
.activity-group__header { display: flex; align-items: center; margin-bottom: 8px; position: relative; }
/* Positioned (not flex-flow) so its center lands exactly on the line's
   center (left:3px + half its 2px width = x:4) regardless of dot/line
   sizing — a flex negative-margin approach here drifted the two apart. */
.activity-group__dot {
  position: absolute; left: -12px; top: 50%; z-index: 1;
  width: 6px; height: 6px; border-radius: 50%; background: #573FE0;
  transform: translate(-50%, -50%);
}
.activity-group__label { font-size: 10px; font-weight: 600; color: #573FE0; }
.activity-group__entries { display: flex; flex-direction: column; gap: 12px; padding-left: 16px; }
.activity-entry { display: flex; flex-direction: column; gap: 4px; }
.activity-entry__user { margin: 0; font-size: 10px; font-weight: 600; color: #555555; }
.activity-entry__line { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 12px; color: #555555; }
.activity-entry__chip {
  display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 36px;
  background: #F9F9F9; border: 1px solid #DCDCDC; font-size: 10px; color: #3D3D3E; white-space: nowrap;
}
.activity-entry__quote { color: #555555; }
.activity-entry__avatars { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
.activity-entry__avatar-chip {
  display: inline-flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 36px;
  background: #F9F9F9; border: 1px solid #DCDCDC; font-size: 10px; color: #3D3D3E;
}
.activity-entry__avatar-chip img {
  width: 16px; height: 16px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
}
.activity-entry__avatar-fallback {
  width: 16px; height: 16px; border-radius: 50%; background: #573FE0; color: #fff;
  font-size: 8px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

/* Project Activity (the diary) — Activity Log tab entries. */
.diary-entry { border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; }
.diary-entry:last-child { border-bottom: none; padding-bottom: 0; }
.diary-entry__label { margin: 0; font-size: 13px; font-weight: 600; color: #272727; word-break: break-word; }
.diary-entry__meta { margin: 2px 0 0; font-size: 11px; color: #888889; }
.diary-entry__notes { margin: 6px 0 0; font-size: 12px; color: #555555; word-break: break-word; }

.diary-entry__type {
  display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 36px;
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em;
  background: #F1F5F9; color: #64748B;
}
.diary-entry__type--call        { background: #E9EFFF; color: #573FE0; }
.diary-entry__type--email       { background: #FFF3E0; color: #C77700; }
.diary-entry__type--message     { background: #E7F9EC; color: #1A8A3E; }
.diary-entry__type--meeting     { background: #FFE9E9; color: #DB3545; }
.diary-entry__type--next_action { background: #F1F5F9; color: #64748B; }
.diary-entry__outcome {
  display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 36px;
  font-size: 9px; font-weight: 600; text-transform: capitalize; background: #F9F9F9; color: #555555;
  border: 1px solid #DCDCDC;
}

/* Kanban board — column shape/shadow and header-blends-into-body layout
   match the Figma board (node 772-16752): top-only radius, no border, a
   soft drop-shadow instead, and the stage label/count/+ sit directly on the
   column's own tinted background rather than a separate white header strip. */
.kanban-board { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: .5rem; align-items: flex-start; }
.kanban-col { flex: 0 0 280px; background: #f8fafc; border-radius: 12px; overflow: hidden; box-shadow: 2px 2px 12px rgba(220,220,220,.24); }
.kanban-col-header {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  padding: 1rem 1rem .5rem;
}
.kanban-stage-label { font-size: .875rem; font-weight: 600; color: #3d3d3e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Plain "+" / kebab icons in the column header — no bg, border, or padding,
   matching the Figma "plus" glyph (node 772-16822) which sits bare on the
   column background. */
.kanban-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; padding: 0; margin: 0;
  background: transparent; border: none; border-radius: 4px;
  color: #6e6e6f; cursor: pointer; font-size: 15px; line-height: 1;
  transition: color .15s ease;
}
.kanban-icon-btn:hover { color: #573fe0; }
.kanban-col-divider { height: 0; border-top: 1.5px solid #fff; margin: 0 1rem; }
.kanban-col-body { padding: .5rem 1rem 1.25rem; display: flex; flex-direction: column; gap: .6rem; min-height: 60px; max-height: 560px; overflow-y: auto; }
.kanban-empty { text-align: center; padding: 1rem 0; font-size: .72rem; color: #94a3b8; font-style: italic; }

.kanban-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: .7rem .75rem;
  cursor: pointer; transition: transform .15s ease, box-shadow .15s ease;
}
.kanban-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(15, 23, 42, .08); }
.kanban-card-title { margin: .4rem 0 0; font-size: .8rem; font-weight: 600; color: #1e293b; line-height: 1.35; word-break: break-word; }
.kanban-card-stats { list-style: none; display: flex; gap: 8px; margin: 0; padding: 0; font-size: .66rem; color: #64748b; }
.kanban-card-stats li { display: flex; align-items: center; gap: 3px; }
.kanban-card-avatars { display: flex; align-items: center; gap: 3px; }
.kanban-card-avatars__more { font-size: .62rem; color: #64748b; margin-right: 2px; }
.kanban-card-avatar {
  width: 20px; height: 20px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center;
  background: #CFD4FF; color: #4010BD; font-size: 8px; font-weight: 700; margin-left: -6px; border: 1.5px solid #fff;
}
.kanban-card-avatar:first-child { margin-left: 0; }
.kanban-card-avatar img { width: 100%; height: 100%; object-fit: cover; }

.kanban-add-task { background: #fff; border: 1.5px dashed #CBD5E1; border-radius: 10px; padding: .6rem .7rem; }

/* Column header "more" menu — Edit/Delete stage, opened via the kebab icon
   instead of being two always-visible icon buttons. Reuses the app's own
   icon-btn--edit/icon-btn--delete icon buttons, just tucked into a popover. */
.kanban-menu { position: relative; }
.kanban-menu__panel {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 20;
  display: flex; gap: 6px; background: #fff; border: 1px solid #DCDCDC; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .12); padding: 6px;
}

/* Task description — BalloonEditor's rich-text output wraps lines in <p>
   with the browser's default 1em margins, which reads as a much bigger gap
   than the flex layout around it actually has; flatten it here instead. */
.task-description :deep(p) { margin: 0 0 6px; }
.task-description :deep(p:last-child) { margin-bottom: 0; }

/* Subtasks / comments */
.subtask-row { border-bottom: 1px solid #F1F5F9; padding-bottom: 14px; }
.subtask-row__title { margin: 0; font-size: 13.5px; font-weight: 600; color: #1e293b; word-break: break-word; }
.subtask-row__desc { margin: 4px 0 0; font-size: 12.5px; color: #64748b; word-break: break-word; }
.subtask-create { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 12px; }

.comment-row { display: flex; gap: 10px; }
.comment-row__avatar {
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 11px; font-weight: 700;
}
.comment-row__avatar img { width: 100%; height: 100%; object-fit: cover; }
.comment-row__name { margin: 0; font-size: 12.5px; font-weight: 700; color: #1e293b; }
.comment-row__msg { margin: 2px 0 0; font-size: 12.5px; color: #475569; word-break: break-word; }
</style>
