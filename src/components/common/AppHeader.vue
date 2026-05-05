<template>
  <header class="app-header">
    <div class="logo" @click="goToHome">
      <img src="@/assets/logo.png" alt="Логотип НИИАР" class="logo-icon" />
      <span class="logo-text">АО «ГНЦ НИИАР»</span>
    </div>
    <nav class="nav-menu">
      <router-link to="/equipment">Оборудование</router-link>
      <router-link to="/si">СИ</router-link>
      <router-link to="/resources">Ресурсы</router-link>
      <router-link to="/maintenance">Обслуживание</router-link>
      <router-link to="/subsystems">Подсистемы</router-link>
    </nav>
    <div class="user-info">
      <span class="user-name">{{ userLogin }}</span>
      <button class="btn btn-sm btn-secondary" @click="logout">Выйти</button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const userLogin = ref('')

onMounted(() => {
  const user = localStorage.getItem('user')
  if (user) userLogin.value = JSON.parse(user).login
})

const goToHome = () => {
  router.push('/')
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2c5f8a;
  color: white;
  padding: 0 20px;
  min-height: 56px;
  flex-wrap: wrap;
  gap: 10px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.logo:hover {
  opacity: 0.8;
}

.logo-icon {
  height: 32px;
  width: auto;
}

.logo-text {
  font-weight: bold;
  font-size: 18px;
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.nav-menu a {
  color: white;
  text-decoration: none;
  margin: 0 5px;
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.nav-menu a:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-menu a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  font-size: 14px;
  opacity: 0.9;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .app-header {
    flex-direction: column;
    padding: 10px;
  }

  .logo-text {
    font-size: 16px;
  }

  .nav-menu {
    justify-content: center;
  }

  .nav-menu a {
    white-space: normal;
    font-size: 12px;
    padding: 6px 10px;
  }

  .user-info {
    width: 100%;
    justify-content: center;
  }
}
</style>
