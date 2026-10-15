<template>
  <div class="balloon-editor">
    <ckeditor
      :editor="editor"
      v-model="content"
      :config="editorConfig"
      @ready="onReady"
    />
  </div>
</template>

<script>
import { BalloonEditor } from 'ckeditor5'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { Essentials, Bold, Italic, Paragraph, Link, List, BlockQuote,Heading } from 'ckeditor5'

export default {
  name: 'BalloonEditor',

  components: {
    ckeditor: Ckeditor,
  },

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Write here...',
    },
    
  },

  emits: ['update:modelValue'],

  data() {
    return {
      editor: BalloonEditor,
      content: this.modelValue,
      editorConfig: {
        licenseKey: 'GPL',
        placeholder: this.placeholder,
        plugins: [Essentials, Bold, Italic, Paragraph, Link, List, BlockQuote,Heading],
        toolbar: ['heading', '|', 'undo', 'redo', '|', 'bold', 'italic', 'link', '|', 'bulletedList', 'numberedList', '|', 'blockQuote'],
      },
    }
  },

  watch: {
    modelValue(value) {
      if (value !== this.content) {
        this.content = value
      }
    },

    content(value) {
      this.$emit('update:modelValue', value)
    },
  },

  methods: {
    onReady(editor) {
      console.log('Balloon Editor ready', editor)
    },
  },
}
</script>

<style scoped>
.balloon-editor { display: flex; flex-direction: column; width: 100%; }

.balloon-editor :deep(.ck-editor__editable) {
  min-height: 220px;
  max-height: 420px;
  overflow-y: auto;
  padding: 16px 12px !important;
  background: #F9F9F9;
  border: 1px solid #DCDCDC !important;
  border-radius: 8px;
  font-size: 12px;
  color: #272727;
  box-shadow: none !important;
}
.balloon-editor :deep(.ck-editor__editable.ck-focused) {
  border-color: #573FE0 !important;
  background: #fff;
  outline: 2px solid transparent;
  outline-offset: 2px;
}
.balloon-editor :deep(.ck-placeholder::before) {
  color: #A3A3A4;
}

/* Tailwind's Preflight resets `ul, ol { list-style: none }` globally, which
   wins out over ckeditor5-content.css's plain `.ck-content ul/ol` rules for
   list markers — restore them explicitly here, scoped to this editor. */
.balloon-editor :deep(.ck-content ul) { list-style: disc; padding-left: 24px; }
.balloon-editor :deep(.ck-content ol) { list-style: decimal; padding-left: 24px; }
.balloon-editor :deep(.ck-content ul ul) { list-style: circle; }
.balloon-editor :deep(.ck-content ul ul ul) { list-style: square; }
.balloon-editor :deep(.ck-content li) { margin: 0 0 4px; }

.balloon-editor :deep(.ck-balloon-panel) {
  border-radius: 8px;
}
.balloon-editor :deep(.ck-toolbar) {
  border-radius: 8px;
}

/* CKEditor ships no default heading typography (verified against
   ckeditor5-content.css — it styles code/blockquote/pre but never
   h1-h6), and this project's Tailwind Preflight resets h1-h6 to
   font-size/weight: inherit. Without these rules, picking "Heading 1/2/3"
   produces a real h2/h3/h4 tag that looks identical to a paragraph. */
.balloon-editor :deep(.ck-content h2) { font-size: 20px; font-weight: 700; color: #272727; margin: 0.6em 0 0.3em; }
.balloon-editor :deep(.ck-content h3) { font-size: 17px; font-weight: 600; color: #272727; margin: 0.5em 0 0.25em; }
.balloon-editor :deep(.ck-content h4) { font-size: 15px; font-weight: 600; color: #272727; margin: 0.4em 0 0.2em; }
</style>