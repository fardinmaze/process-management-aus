<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Designations</h1>
        <p class="page-subtitle">Manage organization designations</p>
      </div>
    </div>

    <div class="card filters">
      <div class="filters__row">
        <SearchBox v-model="filters.search_term" placeholder="Search designations…" />
        <select v-model="filters.department" class="form-select">
          <option value="">All Departments</option>
          <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
        </select>
      </div>

    <div class="pt-4 flex flex-col">
      <div v-if="loading" class="page-loader text-muted">Loading…</div>

      <div v-else class="table-wrap table-wrap--scroll">
        <table class="table">
          <thead>
            <tr>
              <th>#NO</th>
              <th>Title</th>
              <th>Department</th>
              <th style="width:90px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in filteredList" :key="row.id">
              <td>{{ rowNumber(idx) }}</td>

              <template v-if="editingId === row.id">
                <td><input v-model.trim="editRow.title" type="text" class="form-input" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" /></td>
                <td>
                  <select v-model="editRow.department" class="form-select">
                    <option value="">Select department…</option>
                    <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
                  </select>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="icon-btn icon-btn--check" title="Save" :disabled="savingEdit || !editRow.title || !editRow.department" @click="saveEdit">
                     
                    </button>
                    <button class="icon-btn icon-btn--delete" title="Cancel" @click="cancelEdit">
                    
                    </button>
                  </div>
                </td>
              </template>

              <template v-else>
                <td>{{ row.title }}</td>
                <td>{{ departmentName(row.department) }}</td>
                <td>
                  <div class="action-btns">
                    <router-link
                      :to="{ name: 'DesignationPermissions', params: { id: row.id } }"
                      class="icon-btn icon-btn--primary"
                      title="Permissions"
                    >
                      <i class="ri-git-repository-private-line" />
                    </router-link>
                    <button class="icon-btn icon-btn--edit" title="Edit" @click="openEdit(row)">
                     
                    </button>
                    <button class="icon-btn icon-btn--delete" title="Delete" @click="confirmDelete(row.id)">
                     
                    </button>
                  </div>
                </td>
              </template>
            </tr>

            <tr v-if="!filteredList.length && !adding">
              <td colspan="4" class="text-muted text-center py-4">No designations yet. Add one below.</td>
            </tr>

            <tr v-if="adding">
              <td class="text-muted">—</td>
              <td>
                <input ref="newTitleInput" v-model.trim="newRow.title" type="text" class="form-input" placeholder="Designation title" @keyup.enter="saveNewDesignation" @keyup.esc="cancelAdd" />
              </td>
              <td>
                <select v-model="newRow.department" class="form-select">
                  <option value="">Select department…</option>
                  <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
              </td>
              <td>
                <div class="action-btns">
                  <button class="icon-btn icon-btn--check" title="Save" :disabled="savingNew || !newRow.title || !newRow.department" @click="saveNewDesignation">
                  
                  </button>
                  <button class="icon-btn icon-btn--delete" title="Cancel" @click="cancelAdd">
                   
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button v-if="!adding && !loading" type="button" class="btn btn--primary w-full justify-center mt-3 shrink-0" @click="startAdd">
        <i class="ri-add-line" /> Add New Designation
      </button>
    </div>
    </div>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Designation"
      message="Are you sure you want to delete this designation?"
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script>
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import SearchBox from '@/components/common/SearchBox.vue'

export default {
  name: 'DesignationListView',
  components: { ConfirmModal, SearchBox },
  inject: ['toast'],

  data() {
    return {
      filters:      { search_term: '', department: '' },
      adding:       false,
      newRow:       { title: '', department: '' },
      savingNew:    false,
      editingId:    null,
      editRow:      { title: '', department: '' },
      savingEdit:   false,
      deleteTarget: null,
      deleting:     false,
    }
  },

  computed: {
    list()        { return this.$store.getters['designation/designation'] },
    loading()     { return this.$store.getters['designation/designationLoading'] },
    departments() { return this.$store.getters['department/departments'] },

    filteredList() {
      const q = this.filters.search_term.trim().toLowerCase()
      return this.list.filter((row) => {
        const matchesSearch = !q || row.title?.toLowerCase().includes(q)
        const matchesDept = !this.filters.department || this.departmentId(row.department) === this.filters.department
        return matchesSearch && matchesDept
      })
    },
  },

  created() {
    this.$store.dispatch('department/fetchDepartments')
    this.$store.dispatch('designation/fetchDesignations')
  },

  methods: {
    rowNumber(idx) {
      return String(idx + 1).padStart(2, '0')
    },

    isOk(res) {
      return res?.code === 200
    },

    // `row.department` may come back as either a nested { id, name } object
    // or a bare id, depending on the endpoint — handle both.
    departmentId(department) {
      return department?.id ?? department
    },

    departmentName(department) {
      if (department?.name) return department.name
      const id = this.departmentId(department)
      return this.departments.find((d) => d.id === id)?.name ?? '—'
    },

    startAdd() {
      this.cancelEdit()
      this.newRow = { title: '', department: '' }
      this.adding = true
      this.$nextTick(() => this.$refs.newTitleInput?.focus())
    },

    cancelAdd() {
      this.adding = false
    },

    async saveNewDesignation() {
      if (!this.newRow.title || !this.newRow.department) return
      this.savingNew = true
      try {
        const res = await this.$store.dispatch('designation/addDesignation', { title: this.newRow.title, department: this.newRow.department })
        if (this.isOk(res)) {
          this.toast?.success(res?.message || 'Designation added.')
          this.adding = false
        } else {
          this.toast?.error(res?.message || 'Failed to add designation.')
        }
      } catch (err) {
        this.toast?.error(err.response?.data?.message || 'Failed to add designation.')
      } finally {
        this.savingNew = false
      }
    },

    openEdit(row) {
      this.cancelAdd()
      this.editingId = row.id
      this.editRow = { title: row.title, department: this.departmentId(row.department) }
    },

    cancelEdit() {
      this.editingId = null
    },

    async saveEdit() {
      if (!this.editRow.title || !this.editRow.department) return
      this.savingEdit = true
      try {
        const res = await this.$store.dispatch('designation/updateDesignation', {
          id: this.editingId, title: this.editRow.title, department: this.editRow.department,
        })
        if (this.isOk(res)) {
          this.toast?.success(res?.message || 'Designation updated.')
          this.editingId = null
        } else {
          this.toast?.error(res?.message || 'Failed to update designation.')
        }
      } catch (err) {
        this.toast?.error(err.response?.data?.message || 'Failed to update designation.')
      } finally {
        this.savingEdit = false
      }
    },

    confirmDelete(id) {
      this.deleteTarget = id
    },

    async doDelete() {
      this.deleting = true
      try {
        const res = await this.$store.dispatch('designation/deleteDesignation', this.deleteTarget)
        if (this.isOk(res)) {
          this.toast?.success(res?.message || 'Designation deleted.')
          this.deleteTarget = null
        } else {
          this.toast?.error(res?.message || 'Failed to delete designation.')
        }
      } catch (err) {
        this.toast?.error(err.response?.data?.message || 'Failed to delete designation.')
      } finally {
        this.deleting = false
      }
    },
  },
}
</script>

<style scoped>
/* The list can grow past one screen — cap it so it scrolls internally
   instead of pushing the "Add New Designation" button down the page. Below
   the cap the wrapper just shrinks to fit its rows, so the button still
   sits right under a short table. */
.table-wrap--scroll {
  max-height: max(240px, calc(100vh - 320px));
  overflow-y: auto;
}
.table-wrap--scroll :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
