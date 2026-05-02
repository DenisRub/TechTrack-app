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

const handleLogin = () => {
  if (!login.value || !password.value) {
    error.value = 'Заполните все поля'
    return
  }
  // Простейшая имитация авторизации (в реальности – запрос к бекенду)
  if (login.value === 'admin' && password.value === '123') {
    localStorage.setItem('user', JSON.stringify({ login: 'admin', role: 'admin' }))
    router.push('/')
  } else if (login.value === 'operator' && password.value === '123') {
    localStorage.setItem('user', JSON.stringify({ login: 'operator', role: 'operator' }))
    router.push('/')
  } else if (login.value === 'observer' && password.value === '123') {
    localStorage.setItem('user', JSON.stringify({ login: 'observer', role: 'observer' }))
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
