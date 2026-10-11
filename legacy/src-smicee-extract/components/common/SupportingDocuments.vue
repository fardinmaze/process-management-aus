<template>
  <div class="card p-4 flex flex-col req-side-card">
    <h3 class="req-side-card__title">Supporting Documents</h3>
    <div class="req-side-card__divider" />

    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width:48px">#</th>
            <th>Title</th>
            <th>Note</th>
            <th style="width:80px">Format</th>
            <th style="width:80px">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(doc, idx) in documents" :key="doc.id">
            <td>{{ String(idx + 1).padStart(2, '0') }}</td>
            <td>
              <a :href="docUrl(doc)" target="_blank" rel="noopener noreferrer" class="title-link">
                {{ truncate(doc.attach_title, 40) }}
              </a>
            </td>
            <td>{{ doc.note || '—' }}</td>
            <td>{{ docFormat(doc) }}</td>
            <td>
              <div class="action-btns">
                <button type="button" class="icon-btn icon-btn--delete" title="Delete" @click="deleteTarget = doc"></button>
              </div>
            </td>
          </tr>

          <tr v-if="!documents.length && !adding">
            <td colspan="5" class="text-muted text-center py-4">No supporting documents yet.</td>
          </tr>

          <tr v-if="adding">
            <td class="text-muted">—</td>
            <td>
              <input ref="newDocFile" type="file" @change="onFileChange" class="max-w-40" />
            </td>
            <td>
              <input v-model.trim="newDoc.note" type="text" class="form-input min-w-40" placeholder="Note" @keyup.enter="saveNew" @keyup.esc="cancelAdd" />
            </td>
            <td>{{ newDoc.file ? fileExt(newDoc.file.name) : '—' }}</td>
            <td>
              <div class="action-btns">
                <button type="button" class="icon-btn icon-btn--success" title="Save" :disabled="saving || !newDoc.file" @click="saveNew">
                  <i class="ri-check-line text-[15px]" />
                </button>
                <button type="button" class="icon-btn icon-btn--danger" title="Cancel" :disabled="saving" @click="cancelAdd">
                  <i class="ri-close-line text-[15px]" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button v-if="!adding" type="button" class="btn btn--primary w-full justify-center shrink-0" @click="startAdd">
      <i class="ri-add-line" /> Add New
    </button>

    <ConfirmModal
      v-if="deleteTarget"
      title="Delete Document"
      message="Are you sure you want to delete this document? This action cannot be undone."
      confirm-label="Delete"
      confirm-variant="danger"
      :loading="deleting"
      @confirm="doDelete"
      @cancel="deleteTarget = null"
    />
  </div>
</template>

<script>
import { truncate } from '@/utils/helpers'
import { API_HOST } from '@/utils/apiPaths'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

// Self-contained "Supporting Documents" panel — drop it in with an entity
// id and its current attachment list; it owns the inline add-row and
// delete-confirm flow and dispatches the entity's own attachment actions
// itself, matching ReplySidebar's precedent of talking to the store
// directly instead of round-tripping everything through parent
// props/events. Table markup/classes follow this project's own list-table
// convention (see TerritoryList.vue's inline add/edit rows).
//
// Shared across requisition/quotation/invoice/purchase-order details pages,
// whose attachment records differ only in the file field name (`fileKey`,
// e.g. `invoice_attachment`, `po_attachment`), the linking id field name
// (`idKey`, e.g. `invoice_id`, `po_id`) and their Vuex action names
// (`addAction`/`deleteAction`) — everything else about the flow (upload,
// note, delete-confirm) is identical. `linkId` exists only for invoice,
// whose attachment record links via the numeric pk while the top-level
// dispatch/refetch key is the `invoice_id` string route param; it defaults
// to `entityId` when the two coincide (requisition, quotation, purchase order).
export default {
  name: 'SupportingDocuments',
  components: { ConfirmModal },
  inject: ['toast'],

  props: {
    documents: {
      type: Array,
      default: () => [],
    },
    entityId: {
      type: [String, Number],
      required: true,
    },
    linkId: {
      type: [String, Number],
      default: null,
    },
    // Read-side field name — an existing attachment record's own file path,
    // e.g. `doc.invoice_attachment`. Used to build its link URL.
    fileKey: {
      type: String,
      required: true,
    },
    // Write-side field name for the upload payload, when it differs from
    // `fileKey`. Purchase orders are the one case so far where the two
    // diverge: existing records carry `purchase_order_attachment`, but
    // `addPOAttachment` expects the upload keyed as `po_attachment`.
    // Defaults to `fileKey` when unset (every other consumer).
    uploadFileKey: {
      type: String,
      default: null,
    },
    idKey: {
      type: String,
      required: true,
    },
    addAction: {
      type: String,
      required: true,
    },
    deleteAction: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      adding: false,
      newDoc: { file: null, note: '' },
      saving: false,
      deleteTarget: null,
      deleting: false,
    }
  },

  methods: {
    truncate,

    docUrl(doc) {
      const path = doc?.[this.fileKey]
      if (!path) return '#'
      return path.startsWith('http') ? path : API_HOST + path
    },

    fileExt(name) {
      const ext = (name || '').split('.').pop()
      return ext && ext.length <= 5 ? ext.toUpperCase() : '—'
    },

    docFormat(doc) {
      return this.fileExt(doc?.[this.fileKey])
    },

    startAdd() {
      this.newDoc = { file: null, note: '' }
      this.adding = true
      this.$nextTick(() => this.$refs.newDocFile?.focus())
    },

    cancelAdd() {
      this.adding = false
    },

    onFileChange(e) {
      this.newDoc.file = e.target.files[0] || null
    },

    async saveNew() {
      if (!this.newDoc.file) {
        this.toast?.error('Please choose a file to upload.')
        return
      }
      this.saving = true
      try {
        await this.$store.dispatch(this.addAction, {
          attachment: { [this.uploadFileKey ?? this.fileKey]: this.newDoc.file, [this.idKey]: this.linkId ?? this.entityId, note: this.newDoc.note },
          [this.idKey]: this.entityId,
        })
        this.toast?.success('Document added.')
        this.adding = false
      } catch {
        this.toast?.error('Failed to add document.')
      } finally {
        this.saving = false
      }
    },

    async doDelete() {
      this.deleting = true
      try {
        await this.$store.dispatch(this.deleteAction, {
          id: this.deleteTarget.id,
          [this.idKey]: this.entityId,
        })
        this.toast?.success('Document removed.')
        this.deleteTarget = null
      } catch {
        this.toast?.error('Failed to remove document.')
      } finally {
        this.deleting = false
      }
    },
  },
}
</script>

<style scoped>
.req-side-card { display: flex; flex-direction: column; gap: 12px; }
.req-side-card__title { margin: 0; font-size: 18px; font-weight: 500; color: #272727; }
.req-side-card__divider { height: 1px; background: #DCDCDC; width: 100%; }
</style>
