<template>
  <div class="modal-overlay" v-if="visible">
    <div class="modal-content">
      <div class="modal-header">Экспорт данных</div>
      <div class="form-group">
        <label>Формат файла</label>
        <select v-model="format" class="form-control">
          <option value="excel">Microsoft Excel (.xlsx)</option>
          <option value="word">Microsoft Word (.docx)</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Отмена</button>
        <button class="btn btn-primary" @click="exportData">Экспортировать</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { exportToExcel, exportToWord } from '@/utils/exportUtils'
import type { MeasuringInstrument } from '../types/siTypes'

const visible = ref(false)
const format = ref<'excel' | 'word'>('excel')
let currentData: MeasuringInstrument[] = []
const columns = [
  'tabulNumber',
  'name',
  'type',
  'location',
  'lastVerificationDate',
  'nextVerificationDate',
  'status',
  'verifier',
]

function open(data: MeasuringInstrument[]) {
  currentData = data
  visible.value = true
}

function close() {
  visible.value = false
}

function exportData() {
  const filename = `СИ_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`
  if (format.value === 'excel') {
    exportToExcel(currentData, filename)
  } else {
    exportToWord(currentData, columns, filename)
  }
  close()
}

defineExpose({ open })
</script>
