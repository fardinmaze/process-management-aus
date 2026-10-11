<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Project Types</h1>
        <p class="page-subtitle">Manage project type categories</p>
      </div>
    </div>

    <div class="card p-4 flex flex-col">
      <div class="filters__row justify-between mb-3">
        <SearchBox v-model="search" :active="!!search" />
      </div>

      <div v-if="loading" class="page-loader text-muted">Loading…</div>

      <div v-else class="table-wrap table-wrap--scroll">
        <table class="table">
          <thead>
            <tr>
              <th style="width:60px">#NO</th>
              <th>Title</th>
              <th style="width:120px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in filteredList" :key="row.id">
              <td>{{ rowNumber(idx) }}</td>
              <td>
                <input v-if="editingId === row.id" v-model.trim="editRow.title" type="text" class="form-input" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
                <template v-else>{{ row.title }}</template>
              </td>
              <td>
                <div v-if="editingId === row.id" class="action-btns">
                  <button class="icon-btn icon-btn--check" title="Save" :disabled="saving || !editRow.title" @click="saveEdit"></button>
                  <button class="icon-btn icon-btn--delete" title="Cancel" @click="cancelEdit"></button>
                </div>
                <div v-else class="action-btns">
                  <button class="icon-btn icon-btn--edit" title="Edit" @click="openEdit(row)"></button>
                  <button class="icon-btn icon-btn--delete" title="Delete" @click="confirmDelete(row)"></button>
                </div>
              </td>
            </tr>

            <tr v-if="!filteredList.length && !adding">
              <td colspan="3" class="text-muted text-center py-4">
                {{ search ? 'No project types match your search.' : 'No project types yet. Add one below.' }}
              </td>
            </tr>

            <tr v-if="adding">
              <td class="text-muted">—</td>
              <td>
                <input ref="newTypeInput" v-model.trim="newType.title" type="text" class="form-input" placeholder="e.g. In-house" @keyup.enter="saveNewType" @keyup.esc="cancelAdd" />
              </td>
              <td>
                <div class="action-btns">
                  <button class="icon-btn icon-btn--check" title="Save" :disabled="savingNew || !newType.title" @click="saveNewType"></button>
                  <button class="icon-btn icon-btn--delete" title="Cancel" @click="cancelAdd"></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button v-if="!adding && !loading" type="button" class="btn btn--primary w-full justify-center mt-3 shrink-0" @click="startAdd">
        <i class="ri-add-line" /> Add New Project Type
      </button>
    </div>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Project Type"
      message="Are you sure you want to delete this project type?"
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script>
import { apiErrorMessage } from '@/utils/helpers'
import SearchBox    from '@/components/common/SearchBox.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

// Ported from the legacy Project Types page in task.txt. `projectType`
// store actions (fetchProjectType/addProjectType/updateProjectType/
// deleteProjectType) already existed in src/store/project Type.js — nothing
// missing. The legacy page fetches the whole list in one call (no
// pagination/search params on the backend), so this searches/filters
// client-side; no separate create/edit route either — inline add/edit rows
// instead, matching this app's own convention for this kind of simple
// single-field lookup list (see CategoryList.vue).
export default {
  name: 'ProjectTypeListView',
  components: { SearchBox, ConfirmModal },
  inject: ['toast'],

  data() {
    return {
      search:       '',
      adding:       false,
      newType:      { title: '' },
      savingNew:    false,
      editingId:    null,
      editRow:      { title: '' },
      saving:       false,
      deleteTarget: null,
      deleting:     false,
    }
  },

  computed: {
    list()    { return this.$store.getters['projectType/projectType'] || [] },
    loading() { return this.$store.getters['projectType/projectTypeLoading'] },

    filteredList() {
      const q = this.search.trim().toLowerCase()
      if (!q) return this.list
      return this.list.filter((t) => (t.title || '').toLowerCase().includes(q))
    },
  },

  created() {
    this.$store.dispatch('projectType/fetchProjectType')
  },

  methods: {
    rowNumber(idx) {
      return String(idx + 1).padStart(2, '0')
    },

    startAdd() {
      this.cancelEdit()
      this.newType = { title: '' }
      this.adding = true
      this.$nextTick(() => this.$refs.newTypeInput?.focus())
    },

    cancelAdd() {
      this.adding = false
    },

    async saveNewType() {
      if (!this.newType.title) return
      this.savingNew = true
      try {
        const res = await this.$store.dispatch('projectType/addProjectType', { title: this.newType.title })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Project type added.')
          this.adding = false
        } else {
          this.toast?.error(res?.response || 'Failed to add project type.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to add project type.'))
      } finally {
        this.savingNew = false
      }
    },

    openEdit(row) {
      this.cancelAdd()
      this.editingId = row.id
      this.editRow = { title: row.title }
    },

    cancelEdit() {
      this.editingId = null
    },

    async saveEdit() {
      if (!this.editRow.title) return
      this.saving = true
      try {
        const res = await this.$store.dispatch('projectType/updateProjectType', { id: this.editingId, title: this.editRow.title })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Project type updated.')
          this.editingId = null
        } else {
          this.toast?.error(res?.response || 'Failed to update project type.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to update project type.'))
      } finally {
        this.saving = false
      }
    },

    confirmDelete(row) {
      this.deleteTarget = row
    },

    async doDelete() {
      this.deleting = true
      try {
        const res = await this.$store.dispatch('projectType/deleteProjectType', this.deleteTarget.id)
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Project type deleted.')
          this.deleteTarget = null
        } else {
          this.toast?.error(res?.response || 'Failed to delete project type.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to delete project type.'))
      } finally {
        this.deleting = false
      }
    },

    isOk(res) { return res?.code === 200 },
  },
}
</script>

<style scoped>
.table-wrap--scroll {
  max-height: max(240px, calc(100vh - 380px));
  overflow-y: auto;
}
.table-wrap--scroll :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
