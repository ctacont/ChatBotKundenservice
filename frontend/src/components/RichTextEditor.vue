<template>
  <div class="border border-slate-600 rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div class="bg-slate-700 border-b border-slate-600 p-3 flex flex-wrap gap-2 items-center">
      <!-- Text Format -->
      <button
        @click="() => editor?.chain().focus().toggleBold().run()"
        :class="{ 'bg-blue-600': editor?.isActive('bold'), 'bg-slate-600': !editor?.isActive('bold') }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition"
        title="Fett (Strg+B)"
      >
        <strong>B</strong>
      </button>
      <button
        @click="() => editor?.chain().focus().toggleItalic().run()"
        :class="{ 'bg-blue-600': editor?.isActive('italic'), 'bg-slate-600': !editor?.isActive('italic') }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition italic"
        title="Kursiv (Strg+I)"
      >
        I
      </button>
      <button
        @click="() => editor?.chain().focus().toggleStrike().run()"
        :class="{ 'bg-blue-600': editor?.isActive('strike'), 'bg-slate-600': !editor?.isActive('strike') }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition line-through"
        title="Durchgestrichen"
      >
        S
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-600"></div>

      <!-- Headings -->
      <button
        @click="applyHeading(1)"
        :class="{ 'bg-blue-600': editor?.isActive('heading', { level: 1 }), 'bg-slate-600': !editor?.isActive('heading', { level: 1 }) }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition"
        title="Überschrift 1 (Text wird in eigenen Block verschoben)"
      >
        H1
      </button>
      <button
        @click="applyHeading(2)"
        :class="{ 'bg-blue-600': editor?.isActive('heading', { level: 2 }), 'bg-slate-600': !editor?.isActive('heading', { level: 2 }) }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition"
        title="Überschrift 2 (Text wird in eigenen Block verschoben)"
      >
        H2
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-600"></div>

      <!-- Lists -->
      <button
        @click="() => editor?.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-blue-600': editor?.isActive('bulletList'), 'bg-slate-600': !editor?.isActive('bulletList') }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition"
        title="Aufzählung"
      >
        • List
      </button>
      <button
        @click="() => editor?.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-blue-600': editor?.isActive('orderedList'), 'bg-slate-600': !editor?.isActive('orderedList') }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition"
        title="Nummerierte Liste"
      >
        1. List
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-600"></div>

      <!-- Link -->
      <button
        @click="handleLinkClick"
        :class="{ 'bg-blue-600': editor?.isActive('link'), 'bg-slate-600': !editor?.isActive('link') }"
        class="px-3 py-1 hover:bg-slate-500 text-white rounded text-xs font-semibold transition"
        title="Link einfügen/entfernen"
      >
        🔗 Link
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-600"></div>

      <!-- Image Upload -->
      <label class="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-xs font-semibold transition cursor-pointer" title="Bild hochladen">
        🖼️ Bild
        <input
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="hidden"
        />
      </label>

      <!-- Divider -->
      <div class="w-px h-6 bg-slate-600"></div>

      <!-- Emoji Picker -->
      <div class="relative">
        <button
          @click="showEmojiPicker = !showEmojiPicker"
          class="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition"
          title="Emoji einfügen"
        >
          😀 Emoji
        </button>
        <div v-if="showEmojiPicker" class="absolute top-10 left-0 bg-slate-700 border border-slate-600 rounded-lg p-2 z-50 grid grid-cols-8 gap-1 w-80 max-h-64 overflow-y-auto">
          <button
            v-for="emoji in emojis"
            :key="emoji"
            @click="() => { editor?.chain().focus().insertContent(emoji).run(); showEmojiPicker = false }"
            class="text-2xl hover:bg-slate-600 rounded p-1 transition"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>

    <!-- Editor -->
    <editor-content
      :editor="editor"
      :class="minHeight"
      class="prose prose-invert max-w-none text-white p-4 focus:outline-none bg-slate-900"
    />
  </div>
</template>

<script>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { ref, watch, nextTick, onMounted } from 'vue'

export default {
  name: 'RichTextEditor',
  components: {
    EditorContent
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    minHeight: {
      type: String,
      default: 'min-h-96'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const showEmojiPicker = ref(false)
    const emojis = [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '🥲', '😌', '😔', '😑', '😐', '😒', '🙁', '☹️', '😲', '😞',
      '😖', '😢', '😭', '😤', '😠', '😡', '🤬', '😈', '👿', '💪',
      '👍', '👎', '👊', '✊', '🤚', '🖐️', '✋', '🖖', '👋', '🤜',
      '🤛', '🙏', '💼', '🎯', '🎨', '🎭', '🎪', '🎬', '🎮', '⚡',
      '🔥', '✨', '💫', '🌟', '⭐', '🌈', '☀️', '🌙', '⚙️', '🚀',
      '🎁', '🎉', '🎊', '🎈', '❤️', '🧡', '💛', '💚', '💙', '💜'
    ]

    const editor = useEditor({
      content: props.modelValue || '<p></p>',
      extensions: [
        StarterKit.configure({
          codeBlock: false,
          code: false
        }),
        Link.configure({
          openOnClick: false
        }),
        Image.configure({
          allowBase64: true,
          HTMLAttributes: {
            class: 'max-w-full h-auto rounded'
          }
        })
      ],
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        console.log('📝 RichTextEditor onUpdate - HTML:', html.substring(0, 100))
        emit('update:modelValue', html)
      }
    })

    const handleImageUpload = (event) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Konvertiere Bild zu Base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result
        if (imageUrl && editor?.value) {
          editor.value.chain().focus().setImage({ src: imageUrl }).run()
        }
      }
      reader.readAsDataURL(file)
      
      // Reset file input
      event.target.value = ''
    }

    const handleLinkClick = () => {
      const previousUrl = editor?.getAttributes('link').href
      
      // Dialog für Link-Typ
      const linkType = window.prompt(
        'Wähle Link-Typ:\n1 = Email (mailto:)\n2 = Webseite (https://)\n\nGib 1 oder 2 ein:',
        '2'
      )

      if (linkType === null) return

      let url = ''
      
      if (linkType === '1') {
        // Email
        const email = window.prompt('E-Mail-Adresse eingeben:', previousUrl?.replace('mailto:', '') || '')
        if (email === null) return
        if (email === '') {
          editor?.chain().focus().extendMarkRange('link').unsetLink().run()
          return
        }
        url = `mailto:${email}`
      } else if (linkType === '2') {
        // Webseite
        url = window.prompt('URL eingeben (https://...):', previousUrl || 'https://')
        if (url === null) return
        if (url === '') {
          editor?.chain().focus().extendMarkRange('link').unsetLink().run()
          return
        }
        if (!url.startsWith('http')) {
          url = 'https://' + url
        }
      } else {
        alert('Ungabe ungültig. Bitte 1 oder 2 eingeben.')
        return
      }

      // Link setzen
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    const applyHeading = (level) => {
      if (!editor.value) return

      const { from, to } = editor.value.state.selection
      const selectedText = editor.value.state.doc.textBetween(from, to, '')

      if (selectedText.length === 0) {
        // Keine Selektion - toggle normales Heading Verhalten
        editor.value.chain().focus().toggleHeading({ level }).run()
        return
      }

      // Es gibt eine Text-Selektion
      const currentNode = editor.value.state.selection.$from.parent
      
      // Wenn der gesamte Absatz markiert ist, einfach togglen
      if (selectedText.trim() === currentNode.textContent.trim()) {
        editor.value.chain().focus().toggleHeading({ level }).run()
        return
      }

      // Nur ein Teil des Textes ist markiert
      // Extrahiere den markierten Text, lösche ihn, und füge als H1/H2 ein
      editor.value
        .chain()
        .focus()
        .deleteSelection()
        .insertContent(`<h${level}>${selectedText}</h${level}><p></p>`)
        .run()
    }

    watch(
      () => props.modelValue,
      (newValue) => {
        if (!editor.value) return
        
        const currentContent = editor.value.getHTML()
        const newContent = newValue || '<p></p>'
        
        console.log('🔄 RichTextEditor watch - Current:', currentContent.substring(0, 80))
        console.log('🔄 RichTextEditor watch - New:', newContent.substring(0, 80))
        
        // Nur updaten wenn sich Content wirklich geändert hat
        if (currentContent !== newContent) {
          console.log('✏️ RichTextEditor - Setze neuen Content')
          editor.value.commands.setContent(newContent, false)
        }
      },
      { immediate: false }
    )

    return {
      editor,
      showEmojiPicker,
      emojis,
      handleImageUpload,
      handleLinkClick,
      applyHeading
    }
  }
}
</script>

<style scoped>
:deep(.ProseMirror) {
  outline: none;
}

:deep(.ProseMirror p) {
  margin: 0.5rem 0;
}

:deep(.ProseMirror h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0.5rem 0;
}

:deep(.ProseMirror h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  margin: 0.5rem 0;
  padding-left: 2rem;
}

:deep(.ProseMirror li) {
  margin: 0.25rem 0;
}

:deep(.ProseMirror strong) {
  font-weight: 700;
}

:deep(.ProseMirror em) {
  font-style: italic;
}

:deep(.ProseMirror s) {
  text-decoration: line-through;
}
</style>
