<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content" style="width: 450px">
      <div class="modal-header">
        {{ isEdit ? 'Редактирование пользователя' : 'Добавление пользователя' }}
      </div>

      <div class="form-group">
        <label>Логин*</label>
        <input type="text" v-model="form.login" class="form-control" />
      </div>

      <div class="form-group">
        <label>Пароль*</label>
        <input type="password" v-model="form.password" class="form-control" />
      </div>

      <div class="form-group">
        <label>ФИО*</label>
        <input type="text" v-model="form.name" class="form-control" />
      </div>

      <div class="form-group">
        <label>Роль</label>
        <select v-model="form.role" class="form-control">
          <option value="operator">Оператор</option>
          <option value="admin">Администратор</option>
        </select>
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
import { ref, reactive } from 'vue'
import { useUsersStore } from '../stores/usersStore'

const store = useUsersStore()
const visible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)
const error = ref('')

const form = reactive({
  login: '',
  password: '',
  name: '',
  role: 'operator' as 'operator' | 'admin',
})

function reset() {
  form.login = ''
  form.password = ''
  form.name = ''
  form.role = 'operator'
  error.value = ''
  isEdit.value = false
  editId.value = null
}

function open(user?: any) {
  reset()
  if (user) {
    isEdit.value = true
    editId.value = user.id
    form.login = user.login
    form.password = user.password
    form.name = user.name
    form.role = user.role
  }
  visible.value = true
}

function close() {
  visible.value = false
}

function validate(): boolean {
  if (!form.login.trim()) {
    error.value = 'Введите логин'
    return false
  }
  if (!form.password.trim()) {
    error.value = 'Введите пароль'
    return false
  }
  if (!form.name.trim()) {
    error.value = 'Введите ФИО'
    return false
  }

  // Проверка уникальности логина (при добавлении)
  if (!isEdit.value) {
    const existing = store.getUserByLogin(form.login)
    if (existing) {
      error.value = 'Пользователь с таким логином уже существует'
      return false
    }
  }

  error.value = ''
  return true
}

function save() {
  if (!validate()) return

  const data = {
    login: form.login,
    password: form.password,
    name: form.name,
    role: form.role,
  }

  if (isEdit.value && editId.value) {
    store.updateUser(editId.value, data)
  } else {
    store.addUser(data)
  }
  close()
  window.dispatchEvent(new Event('user-saved'))
}

defineExpose({ open })
</script>
