<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 500px">
      <div class="modal-header">
        {{ isEdit ? 'Редактирование подсистемы' : 'Добавление подсистемы' }}
      </div>

      <div class="form-group">
        <label>Наименование*</label>
        <input type="text" v-model="form.name" class="form-control" />
      </div>

      <div class="form-group">
        <label>Родительская подсистема</label>
        <select v-model="form.parentId" class="form-control">
          <option :value="null">-- Корневая --</option>
          <option v-for="sub in availableSubsystems" :key="sub.id" :value="sub.id">
            {{ sub.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Расположение</label>
        <input type="text" v-model="form.location" class="form-control" />
      </div>

      <div class="form-group">
        <label>Описание</label>
        <textarea v-model="form.description" rows="3" class="form-control"></textarea>
      </div>

      <div v-if="error" class="error-text">{{ error }}</div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="save">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useSubsystemsStore } from '../stores/subsystemsStore'

const store = useSubsystemsStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const error = ref('')

const availableSubsystems = computed(() => {
  return store.subsystems.filter((s) => s.id !== editId.value)
})

const form = reactive({
  name: '',
  parentId: null as number | null,
  location: '',
  description: '',
})

function reset() {
  form.name = ''
  form.parentId = null
  form.location = ''
  form.description = ''
  error.value = ''
  isEdit.value = false
  editId.value = null
}

function open(editItem?: any) {
  reset()
  if (editItem) {
    isEdit.value = true
    editId.value = editItem.id
    form.name = editItem.name
    form.parentId = editItem.parentId
    form.location = editItem.location || ''
    form.description = editItem.description || ''
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.name.trim()) {
    error.value = 'Введите наименование'
    return false
  }
  error.value = ''
  return true
}

function save() {
  if (!validate()) return

  const data = {
    name: form.name,
    parentId: form.parentId,
    location: form.location,
    description: form.description,
  }

  if (isEdit.value && editId.value) {
    store.updateSubsystem(editId.value, data)
  } else {
    store.addSubsystem(data)
  }
  close()
  window.dispatchEvent(new Event('subsystem-saved'))
}

defineExpose({ open })
</script>
