import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserRole } from '../types/usersTypes'

function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Мок-данные пользователей
const mockUsers: User[] = [
  {
    id: 1,
    login: 'operator',
    password: '123',
    name: 'Иванов Иван',
    role: 'operator',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
  {
    id: 2,
    login: 'admin',
    password: '123',
    name: 'Петров Петр',
    role: 'admin',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    isDeleted: false,
  },
]

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([...mockUsers])

  const activeUsers = computed(() => users.value.filter((u) => !u.isDeleted))

  function getUser(id: number): User | undefined {
    return users.value.find((u) => u.id === id)
  }

  function getUserByLogin(login: string): User | undefined {
    return users.value.find((u) => u.login === login)
  }

  function addUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>) {
    const newId = Math.max(...users.value.map((u) => u.id), 0) + 1
    const now = getCurrentDate()
    users.value.push({
      ...data,
      id: newId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    })
    // Обновляем localStorage для авторизации
    saveToLocalStorage()
    return newId
  }

  function updateUser(id: number, data: Partial<User>) {
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx === -1) return
    const existing = users.value[idx]
    if (!existing) return
    users.value[idx] = {
      id: existing.id,
      login: data.login !== undefined ? data.login : existing.login,
      password: data.password !== undefined ? data.password : existing.password,
      name: data.name !== undefined ? data.name : existing.name,
      role: data.role !== undefined ? data.role : existing.role,
      createdAt: existing.createdAt,
      updatedAt: getCurrentDate(),
      isDeleted: data.isDeleted !== undefined ? data.isDeleted : existing.isDeleted,
    }
    saveToLocalStorage()
  }

  function deleteUser(id: number) {
    const idx = users.value.findIndex((u) => u.id === id)
    if (idx !== -1 && users.value[idx]) {
      users.value[idx].isDeleted = true
      saveToLocalStorage()
    }
  }

  // Синхронизация с localStorage для авторизации
  function saveToLocalStorage() {
    const authUsers = activeUsers.value.map((u) => ({
      id: u.id,
      login: u.login,
      password: u.password,
      role: u.role,
      name: u.name,
    }))
    localStorage.setItem('system_users', JSON.stringify(authUsers))
  }

  return {
    users: activeUsers,
    getAllUsers: users,
    getUser,
    getUserByLogin,
    addUser,
    updateUser,
    deleteUser,
  }
})
