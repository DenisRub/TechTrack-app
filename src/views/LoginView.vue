<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Вход в систему</h2>
      <div class="form-group">
        <label>Логин</label>
        <input type="text" v-model="login" class="form-control" placeholder="Введите логин" />
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input
          type="password"
          v-model="password"
          class="form-control"
          placeholder="Введите пароль"
        />
      </div>
      <div v-if="error" class="error-text" style="margin-bottom: 15px">{{ error }}</div>
      <button class="btn btn-primary" style="width: 100%" @click="handleLogin">Войти</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const login = ref('')
const password = ref('')
const error = ref('')

// Мок-данные пользователей
const users = [
  { id: 1, login: 'operator', password: '123', role: 'operator', name: 'Иванов Иван' },
  { id: 2, login: 'admin', password: '123', role: 'admin', name: 'Петров Петр' },
]

const handleLogin = () => {
  if (!login.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }

  const user = users.find((u) => u.login === login.value && u.password === password.value)

  if (user) {
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: user.id,
        login: user.login,
        role: user.role,
        name: user.name,
      }),
    )
    router.push('/')
  } else {
    error.value = 'Неверный логин или пароль'
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #e9ecef;
}
.login-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 32px;
  width: 360px;
}
.login-card h2 {
  margin-bottom: 24px;
  text-align: center;
  color: #2c5f8a;
}
</style>
