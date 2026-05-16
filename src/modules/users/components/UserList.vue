<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px">
      <h2>Пользователи системы</h2>
      <button class="btn btn-primary" @click="openAddForm">+ Добавить пользователя</button>
    </div>

    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th @click="sort('id')">
              ID
              <span class="sort-icon" v-if="sortField === 'id'">{{
                sortOrder === 'asc' ? '↑' : '↓'
              }}</span>
            </th>
            <th @click="sort('login')">
              Логин
              <span class="sort-icon" v-if="sortField === 'login'">{{
                sortOrder === 'asc' ? '↑' : '↓'
              }}</span>
            </th>
            <th @click="sort('name')">
              ФИО
              <span class="sort-icon" v-if="sortField === 'name'">{{
                sortOrder === 'asc' ? '↑' : '↓'
              }}</span>
            </th>
            <th @click="sort('role')">
              Роль
              <span class="sort-icon" v-if="sortField === 'role'">{{
                sortOrder === 'asc' ? '↑' : '↓'
              }}</span>
            </th>
            <th @click="sort('createdAt')">
              Дата создания
              <span class="sort-icon" v-if="sortField === 'createdAt'">{{
                sortOrder === 'asc' ? '↑' : '↓'
              }}</span>
            </th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in sortedUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.login }}</td>
            <td>{{ user.name }}</td>
            <td>{{ user.role === 'admin' ? 'Администратор' : 'Оператор' }}</td>
            <td>{{ user.createdAt }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="editUser(user)">✏️</button>
              <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)">🗑️</button>
            </td>
          </tr>
          <tr v-if="sortedUsers.length === 0">
            <td colspan="6">Нет пользователей</td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserForm ref="formRef" @saved="refresh" />
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUsersStore } from '../stores/usersStore'
import UserForm from './UserForm.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const store = useUsersStore()
const formRef = ref()
const confirmDialog = ref()

// ========== Сортировка ==========
const sortField = ref<'id' | 'login' | 'name' | 'role' | 'createdAt'>('id')
const sortOrder = ref<'asc' | 'desc'>('asc')

const sortedUsers = computed(() => {
  let list = [...store.users]

  list.sort((a, b) => {
    let valA: any = a[sortField.value]
    let valB: any = b[sortField.value]

    if (valA === undefined || valA === null) valA = ''
    if (valB === undefined || valB === null) valB = ''

    // Для строк - сравнение без учёта регистра
    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })

  return list
})

function sort(field: 'id' | 'login' | 'name' | 'role' | 'createdAt') {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
}

// ========== Действия ==========
function openAddForm() {
  formRef.value?.open()
}

function editUser(user: any) {
  formRef.value?.open(user)
}

async function deleteUser(id: number) {
  const ok = await confirmDialog.value?.show('Удаление', 'Удалить пользователя?')
  if (ok) {
    store.deleteUser(id)
  }
}

function refresh() {
  // реактивно, данные обновятся автоматически
}
</script>

<style scoped>
.sort-icon {
  margin-left: 5px;
  font-size: 12px;
  color: #2c5f8a;
}
</style>
