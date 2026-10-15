<template>
  <div>
    <h4 v-if="label" class="assign__title">{{ label }}</h4>

    <!-- Pill mode: chips + a round "+" trigger in one wrapped row (matches
         the EOD Submit page's "Referred to" MultiSelect), instead of chips
         stacked above a full-width dropdown button. -->
    <div v-if="pill" ref="assignPicker" class="assign__chips assign__chips--inline">
      <span v-for="m in visibleAssignedMembers" :key="m.id" class="assign-chip assign-chip--pill">
        <span class="assign-chip__avatar">
          <img v-if="photoUrl(m)" :src="photoUrl(m)" :alt="memberName(m)" />
          <span v-else>{{ getInitials(memberName(m)) }}</span>
        </span>
        <span class="assign-chip__name">{{ memberName(m) }}</span>
        <button type="button" class="assign-chip__remove" title="Remove" :disabled="assigning" @click="$emit('unassign', m.id)" v-if="canRemove">
          <i class="ri-close-line" />
        </button>
      </span>
      <button v-if="hiddenAssignedCount > 0" type="button" class="assign-chip assign-chip--more" @click="showAllAssigned = true">
        +{{ hiddenAssignedCount }}
      </button>
      <button v-else-if="showAllAssigned && assignedMembers.length > 4" type="button" class="assign-chip assign-chip--more" @click="showAllAssigned = false">
        Show less
      </button>

      <button type="button" class="assign-add-trigger" title="Add member" :disabled="assigning" @click="toggleAssignOpen">
        <i class="ri-add-line" />
      </button>

      <div v-if="assignOpen" class="assign-picker__panel assign-picker__panel--pill">
        <div class="assign-picker__search">
          <i class="ri-search-line" />
          <input v-model="assignSearch" type="text" placeholder="Search members…" />
        </div>

        <div class="assign-picker__options">
          <label v-for="m in filteredUnassignedMembers" :key="m.id" class="assign-picker__option">
            <input v-model="assignSelected" type="checkbox" :value="m.id" class="hidden"/>
            <span class="assign-picker__option-avatar">
              <img v-if="photoUrl(m)" :src="photoUrl(m)" :alt="memberName(m)" />
              <span v-else>{{ getInitials(memberName(m)) }}</span>
            </span>
            <span class="assign-picker__option-name">{{ memberName(m) }}</span>
            <i class="ri-check-line assign-picker__option-check" />
          </label>
          <p v-if="!filteredUnassignedMembers.length" class="assign-picker__empty">
            {{ unassignedMembers.length ? 'No matches.' : 'Everyone is already referred.' }}
          </p>
        </div>

        <div class="assign-picker__footer">
          <button type="button" class="btn btn--ghost btn--sm" @click="closeAssignPicker">Cancel</button>
          <button
            type="button"
            class="btn btn--primary btn--sm"
            :disabled="!assignSelected.length || assigning"
            @click="confirmAssign"
          >
            Add{{ assignSelected.length ? ` (${assignSelected.length})` : '' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Default mode: chips stacked above a full-width dropdown trigger. -->
    <template v-else>
      <div v-if="assignedMembers.length" class="assign__chips">
        <span v-for="m in visibleAssignedMembers" :key="m.id" class="assign-chip">
          <span class="assign-chip__avatar">
            <img v-if="photoUrl(m)" :src="photoUrl(m)" :alt="memberName(m)" />
            <span v-else>{{ getInitials(memberName(m)) }}</span>
          </span>
          <span class="assign-chip__name">{{ memberName(m) }}</span>
          <button
            type="button"
            class="assign-chip__remove"
            title="Remove"
            :disabled="assigning"
            @click="$emit('unassign', m.id)"
          >
            <i class="ri-close-line" />
          </button>
        </span>
        <button
          v-if="hiddenAssignedCount > 0"
          type="button"
          class="assign-chip assign-chip--more"
          @click="showAllAssigned = true"
        >
          +{{ hiddenAssignedCount }}
        </button>
        <button
          v-else-if="showAllAssigned && assignedMembers.length > 4"
          type="button"
          class="assign-chip assign-chip--more"
          @click="showAllAssigned = false"
        >
          Show less
        </button>
      </div>
      <p v-else class="assign__empty">{{ emptyText }}</p>

      <div ref="assignPicker" class="assign-picker">
        <button
          type="button"
          class="form-select assign-picker__trigger"
          :disabled="assigning"
          @click="toggleAssignOpen"
        >
          <span :class="{ 'assign-picker__placeholder': !assignSelected.length }">
            {{ assignSelected.length ? `${assignSelected.length} selected` : placeholder }}
          </span>
          <i class="ri-arrow-down-s-line" />
        </button>

        <div v-if="assignOpen" class="assign-picker__panel">
          <div class="assign-picker__search">
            <i class="ri-search-line" />
            <input v-model="assignSearch" type="text" placeholder="Search members…" />
          </div>

          <div class="assign-picker__options">
            <label v-for="m in filteredUnassignedMembers" :key="m.id" class="assign-picker__option">
              <input v-model="assignSelected" type="checkbox" :value="m.id" />
              <span class="assign-picker__option-avatar">
                <img v-if="photoUrl(m)" :src="photoUrl(m)" :alt="memberName(m)" />
                <span v-else>{{ getInitials(memberName(m)) }}</span>
              </span>
              <span class="assign-picker__option-name">{{ memberName(m) }}</span>
              <i class="ri-check-line assign-picker__option-check" />
            </label>
            <p v-if="!filteredUnassignedMembers.length" class="assign-picker__empty">
              {{ unassignedMembers.length ? 'No matches.' : 'Everyone is already referred.' }}
            </p>
          </div>

          <div class="assign-picker__footer">
            <button type="button" class="btn btn--ghost btn--sm" @click="closeAssignPicker">Cancel</button>
            <button
              type="button"
              class="btn btn--primary btn--sm"
              :disabled="!assignSelected.length || assigning"
              @click="confirmAssign"
            >
              Add{{ assignSelected.length ? ` (${assignSelected.length})` : '' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { getInitials } from '@/utils/helpers'
import { API_HOST }    from '@/utils/apiPaths'

// Reusable "refer/assign members" widget — chips for the currently assigned
// members plus a searchable checkbox picker for adding more. Embedded inline
// on detail pages (e.g. EodDetails, LeaveDetails).
export default {
  name: 'MemberAssignPicker',
  emits: ['assign', 'unassign'],

  props: {
    label:            { type: String,  default: 'Referred To' },
    emptyText:        { type: String,  default: 'Not referred to anyone yet.' },
    placeholder:      { type: String,  default: '+ Refer to someone…' },
    assignedMembers:  { type: Array,   default: () => [] },
    availableMembers: { type: Array,   default: () => [] },
    assigning:        { type: Boolean, default: false },
    pill:             { type: Boolean, default: false },
    canRemove: { type: Boolean, default: false },
  },

  data() {
    return {
      assignOpen:      false,
      assignSelected:  [],
      assignSearch:    '',
      showAllAssigned: false,
    }
  },

  computed: {
    visibleAssignedMembers() {
      return this.showAllAssigned ? this.assignedMembers : this.assignedMembers.slice(0, 4)
    },

    hiddenAssignedCount() {
      return this.showAllAssigned ? 0 : Math.max(0, this.assignedMembers.length - 4)
    },

    unassignedMembers() {
      const assignedIds = new Set(this.assignedMembers.map((m) => m.id))
      return this.availableMembers.filter((m) => !assignedIds.has(m.id))
    },

    filteredUnassignedMembers() {
      const q = this.assignSearch.trim().toLowerCase()
      if (!q) return this.unassignedMembers
      return this.unassignedMembers.filter((m) => this.memberName(m).toLowerCase().includes(q))
    },
  },

  mounted() {
    document.addEventListener('mousedown', this.handleClickOutside)
  },
  beforeUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside)
  },

  methods: {
    getInitials,

    memberName(m) {
      return m.full_name
        || [m.first_name, m.last_name].filter(Boolean).join(' ')
        || m.username
        || 'Unknown'
    },

    photoUrl(m) {
      const photo = m.photo
      if (!photo) return null
      return photo.startsWith('http') ? photo : API_HOST + photo
    },

    toggleAssignOpen() {
      this.assignOpen = !this.assignOpen
    },

    closeAssignPicker() {
      this.assignOpen     = false
      this.assignSelected = []
      this.assignSearch   = ''
    },

    handleClickOutside(e) {
      if (!this.assignOpen) return
      if (this.$refs.assignPicker?.contains(e.target)) return
      this.assignOpen = false
    },

    confirmAssign() {
      if (!this.assignSelected.length) return
      this.$emit('assign', [...this.assignSelected])
      this.closeAssignPicker()
    },
  },
}
</script>

<style scoped>
.assign__title {
  margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: .02em;
  text-transform: uppercase; color: #6E6E6F;
}
.assign__empty { margin: 0 0 12px; font-size: 13px; color: #A3A3A4; }
.assign__chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }

.assign-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 8px 4px 4px; border-radius: 999px;
  background: #F5F4FF; border: 1px solid #E4E1FF;
  font-size: 12px; font-weight: 600; color: #272727;
}
.assign-chip__avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #573FE0; color: #fff; font-size: 10px; font-weight: 700;
}
.assign-chip__avatar img { width: 100%; height: 100%; object-fit: cover; }
.assign-chip__name { white-space: nowrap; }
.assign-chip__remove {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border: none; border-radius: 50%; padding: 0;
  background: transparent; color: #6E6E6F; cursor: pointer; font-size: 13px;
  transition: background-color .15s, color .15s;
}
.assign-chip__remove:hover:not(:disabled) { background: #FFC2C0; color: #B3261E; }
.assign-chip__remove:disabled { opacity: .5; cursor: not-allowed; }

.assign-chip--more {
  border: 1px dashed #C4C4C5; background: #F9F9F9; color: #6E6E6F;
  cursor: pointer; padding: 4px 10px;
}
.assign-chip--more:hover { background: #F0F0F0; color: #272727; }

/* ── Pill variant: chips + a round "+" trigger in one wrapped row ───────── */
.assign__chips--inline {
  position: relative; margin-bottom: 0;
  display: flex; flex-wrap: wrap; align-items: center;
}
.assign-chip--pill {
  background: #F9F9F9; border: 1px solid #DCDCDC; padding: 6px 8px 6px 6px;
}
.assign-chip--pill .assign-chip__avatar { width: 18px; height: 18px; font-size: 9px; }
.assign-chip--pill .assign-chip__name { font-size: 11px; font-weight: 500; color: #3D3D3E; }

.assign-add-trigger {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 999px; flex-shrink: 0;
  background: #EBFFED; border: 1.5px solid #BAEFBF; color: #008610;
  font-size: 15px; cursor: pointer; padding: 0; transition: background-color .15s;
}
.assign-add-trigger:hover:not(:disabled) { background: #BAEFBF; }
.assign-add-trigger:disabled { opacity: .5; cursor: not-allowed; }

.assign-picker { position: relative; }
.assign-picker__trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  gap: 8px; text-align: left; cursor: pointer;
}
.assign-picker__trigger:disabled { opacity: .6; cursor: not-allowed; }
.assign-picker__placeholder { color: #A3A3A4; }

/* Floats over the surrounding layout instead of pushing it down — the
   picker used to sit in normal flow, which expanded whatever card/page
   it was embedded in every time it opened. */
.assign-picker__panel {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 20;
  background: #fff; border: 1px solid #DCDCDC; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  display: flex; flex-direction: column; overflow: hidden;
}

/* Must come after the base rule above: both classes are applied together
   in pill mode, and with equal specificity the later declaration wins —
   this has to override `left: 0` back to `auto`, or the over-constrained
   left+right+width box drops `right` and the fixed-width panel pins to
   the container's left edge instead, pushing it off-screen. */
/* max-width caps it to the viewport on small devices — a fixed 300px can
   be wider than the whole screen there, pushing it off-screen even though
   the anchor itself is already bounded within the page. */
.assign-picker__panel--pill { left: auto; right: 0; width: 300px; max-width: calc(100vw - 48px); }

.assign-picker__search {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-bottom: 1px solid #F0F0F0;
  color: #A3A3A4; font-size: 13px;
}
.assign-picker__search input {
  flex: 1; border: none; outline: none; font-size: 13px; color: #272727; background: transparent;
}

.assign-picker__options { max-height: 200px; overflow-y: auto; padding: 4px; }
.assign-picker__option {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 8px; border-radius: 8px; cursor: pointer;
  font-size: 13px; color: #272727; transition: background-color .15s;
}
.assign-picker__option:hover { background: #F9F9F9; }
.assign-picker__option input[type="checkbox"] { accent-color: #573FE0; width: 14px; height: 14px; flex-shrink: 0; }
.assign-picker__option-avatar {
  width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #CFD4FF; color: #4010BD; font-size: 10px; font-weight: 700;
}
.assign-picker__option-avatar img { width: 100%; height: 100%; object-fit: cover; }
.assign-picker__option-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.assign-picker__option-check { display: none; color: #573FE0; }
.assign-picker__option input:checked ~ .assign-picker__option-check { display: block; }

.assign-picker__empty { margin: 0; padding: 16px 8px; text-align: center; font-size: 12.5px; color: #A3A3A4; }

.assign-picker__footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 10px 12px; border-top: 1px solid #F0F0F0; background: #FAFAFA;
}
</style>
