<template>
  <div class="subsystem-tree">
    <div class="tree-header">
      <h3>Подсистемы</h3>
      <button class="btn btn-sm btn-primary" @click="openAddForm">+ Добавить</button>
    </div>
    <div class="tree-content">
      <SubsystemTreeNode
        v-for="node in store.tree"
        :key="node.id"
        :node="node"
        @select-subsystem="onSelectSubsystem"
        @select-content="onSelectContent"
      />
      <div v-if="store.tree.length === 0" class="empty-tree">Нет подсистем</div>
    </div>

    <SubsystemForm ref="formRef" @saved="refresh" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSubsystemsStore } from '../stores/subsystemsStore'
import SubsystemTreeNode from './SubsystemTreeNode.vue'
import SubsystemForm from './SubsystemForm.vue'

const store = useSubsystemsStore()
const formRef = ref()

const emit = defineEmits(['select-subsystem', 'select-content'])

// Только передаём событие, НЕ делаем router.push
function onSelectSubsystem(id: number) {
  emit('select-subsystem', id)
}

function onSelectContent(content: { type: string; id: number; name: string }) {
  emit('select-content', content)
}

function openAddForm() {
  formRef.value?.open()
}

function refresh() {
  // реактивно
}
</script>

<style scoped>
.subsystem-tree {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e4e8;
  padding: 12px;
  height: 100%;
}
.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e4e8;
}
.tree-header h3 {
  margin: 0;
  font-size: 16px;
}
.tree-content {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
.empty-tree {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>
