import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiFetch } from '@/api/client';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null);
  const token = ref(localStorage.getItem('token') || null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function setUserFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        user.value = JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse user from storage', e);
      }
    }
  }

  async function login(login: string, password: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });
      if (data.token) {
        token.value = data.token;
        user.value = data.user;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return true;
      }
      throw new Error(data.error || 'Ошибка входа');
    } catch (err: any) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function checkAuth() {
    setUserFromStorage();
    return !!token.value && !!user.value;
  }

  // Опционально: получить текущего пользователя с бэка (проверить валидность токена)
  async function fetchMe() {
    try {
      const data = await apiFetch('/auth/me');
      user.value = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } catch (err) {
      logout();
      return null;
    }
  }

  return { user, token, isLoading, error, login, logout, checkAuth, fetchMe };
});