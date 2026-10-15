<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Board Templates</h1>
        <p class="page-subtitle">Reusable task board column presets — stamped onto a project as a one-time copy when it's created</p>
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
              <th>Columns</th>
              <th style="width:120px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in filteredList" :key="row.id">
              <td>{{ rowNumber(idx) }}</td>
              <td>
                <input v-if="editingId === row.id" v-model.trim="editRow.title" type="text" class="form-input" @keyup.esc="cancelEdit" />
                <template v-else>{{ row.title }}</template>
              </td>
              <td>
                <input
                  v-if="editingId === row.id" v-model.trim="editRow.labelsText" type="text" class="form-input"
                  placeholder="Comma-separated columns" @keyup.enter="saveEdit" @keyup.esc="cancelEdit"
                />
                <div v-else class="flex flex-wrap gap-1">
                  <span v-for="l in row.labels" :key="l" class="badge badge--default">{{ l }}</span>
                </div>
              </td>
              <td>
                <div v-if="editingId === row.id" class="action-btns">
                  <button class="icon-btn icon-btn--check" title="Save" :disabled="saving || !editRow.title || !editRow.labelsText" @click="saveEdit"></button>
                  <button class="icon-btn icon-btn--delete" title="Cancel" @click="cancelEdit"></button>
                </div>
                <div v-else class="action-btns">
                  <button class="icon-btn icon-btn--edit" title="Edit" @click="openEdit(row)"></button>
                  <button class="icon-btn icon-btn--delete" title="Delete" @click="confirmDelete(row)"></button>
                </div>
              </td>
            </tr>

            <tr v-if="!filteredList.length && !adding">
              <td colspan="4" class="text-muted text-center py-4">
                {{ search ? 'No board templates match your search.' : 'No board templates yet. Add one below.' }}
              </td>
            </tr>

            <tr v-if="adding">
              <td class="text-muted">—</td>
              <td>
                <input ref="newTitleInput" v-model.trim="newTemplate.title" type="text" class="form-input" placeholder="e.g. Standard Dev Board" @keyup.esc="cancelAdd" />
              </td>
              <td>
                <input v-model.trim="newTemplate.labelsText" type="text" class="form-input" placeholder="e.g. To Do, In Progress, Done" @keyup.enter="saveNewTemplate" @keyup.esc="cancelAdd" />
              </td>
              <td>
                <div class="action-btns">
                  <button class="icon-btn icon-btn--check" title="Save" :disabled="savingNew || !newTemplate.title || !newTemplate.labelsText" @click="saveNewTemplate"></button>
                  <button class="icon-btn icon-btn--delete" title="Cancel" @click="cancelAdd"></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button v-if="!adding && !loading" type="button" class="btn btn--primary w-full justify-center mt-3 shrink-0" @click="startAdd">
        <i class="ri-add-line" /> Add New Board Template
      </button>
    </div>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Board Template"
      message="Are you sure you want to delete this board template? Projects already created from it keep their columns — this only removes the preset."
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

// CRUD for `TaskLabelTemplate` (task.txt Part 1) — a reusable label preset
// (title + ordered list of column names) with no link to any project.
// Stamping one onto a project is a one-time COPY that happens inside
// project/create (see ProjectCreate.vue's `label_template` field), not here.
// Same inline add/edit-row convention as ProjectTypeList.vue, just with a
// second "labels" field serialized to/from a comma-separated string for the
// input, since the backend stores/returns it as an array.
export default {
  name: 'TaskLabelTemplateListView',
  components: { SearchBox, ConfirmModal },
  inject: ['toast'],

  data() {
    return {
      search:        '',
      adding:        false,
      newTemplate:   { title: '', labelsText: '' },
      savingNew:     false,
      editingId:     null,
      editRow:       { title: '', labelsText: '' },
      saving:        false,
      deleteTarget:  null,
      deleting:      false,
    }
  },

  computed: {
    list()    { return this.$store.getters['task/taskLabelTemplates'] || [] },
    loading() { return this.$store.getters['task/templateLoading'] },

    filteredList() {
      const q = this.search.trim().toLowerCase()
      if (!q) return this.list
      return this.list.filter((t) => (t.title || '').toLowerCase().includes(q))
    },
  },

  created() {
    this.$store.dispatch('task/fetchTaskLabelTemplates')
  },

  methods: {
    rowNumber(idx) {
      return String(idx + 1).padStart(2, '0')
    },

    parseLabels(text) {
      return text.split(',').map((l) => l.trim()).filter(Boolean)
    },

    startAdd() {
      this.cancelEdit()
      this.newTemplate = { title: '', labelsText: '' }
      this.adding = true
      this.$nextTick(() => this.$refs.newTitleInput?.focus())
    },

    cancelAdd() {
      this.adding = false
    },

    async saveNewTemplate() {
      const labels = this.parseLabels(this.newTemplate.labelsText)
      if (!this.newTemplate.title || !labels.length) return
      this.savingNew = true
      try {
        const res = await this.$store.dispatch('task/createTaskLabelTemplate', { title: this.newTemplate.title, labels })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Board template added.')
          this.adding = false
        } else {
          this.toast?.error(res?.response || 'Failed to add board template.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to add board template.'))
      } finally {
        this.savingNew = false
      }
    },

    openEdit(row) {
      this.cancelAdd()
      this.editingId = row.id
      this.editRow = { title: row.title, labelsText: (row.labels || []).join(', ') }
    },

    cancelEdit() {
      this.editingId = null
    },

    async saveEdit() {
      const labels = this.parseLabels(this.editRow.labelsText)
      if (!this.editRow.title || !labels.length) return
      this.saving = true
      try {
        const res = await this.$store.dispatch('task/editTaskLabelTemplate', { id: this.editingId, title: this.editRow.title, labels })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Board template updated.')
          this.editingId = null
        } else {
          this.toast?.error(res?.response || 'Failed to update board template.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to update board template.'))
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
        const res = await this.$store.dispatch('task/deleteTaskLabelTemplate', { id: this.deleteTarget.id })
        if (this.isOk(res)) {
          this.toast?.success(res?.response || 'Board template deleted.')
          this.deleteTarget = null
        } else {
          this.toast?.error(res?.response || 'Failed to delete board template.')
        }
      } catch (err) {
        this.toast?.error(apiErrorMessage(err, 'Failed to delete board template.'))
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
