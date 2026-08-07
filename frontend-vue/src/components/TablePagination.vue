<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: { type: Number, required: true },
  perPage: { type: Number, required: true },
  totalItems: { type: Number, required: true },
  perPageOptions: { type: Array, default: () => [10, 20, 50, 100] }
});

const emit = defineEmits(['update:currentPage', 'update:perPage']);

const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / props.perPage)));

const pageRange = computed(() => {
  const total = totalPages.value;
  const cur = props.currentPage;
  let pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
  return pages;
});

const startItem = computed(() => (props.totalItems === 0 ? 0 : (props.currentPage - 1) * props.perPage + 1));
const endItem = computed(() => Math.min(props.currentPage * props.perPage, props.totalItems));

const goToPage = (p) => {
  if (p >= 1 && p <= totalPages.value && p !== props.currentPage) {
    emit('update:currentPage', p);
  }
};

const changePerPage = (val) => {
  emit('update:perPage', Number(val));
  emit('update:currentPage', 1);
};
</script>

<template>
  <div class="pagination">
    <div class="pagination-left">
      <span class="pagination-info">
        Menampilkan {{ startItem }}–{{ endItem }} dari {{ totalItems }} data
      </span>
      <div class="per-page-select">
        <label for="">Tampilkan:</label>
        <select :value="perPage" @change="changePerPage($event.target.value)">
          <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </div>
    </div>
    <div class="pagination-controls">
      <button class="page-btn nav-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹ Previous</button>
      <button v-if="pageRange[0] > 1" class="page-btn" @click="goToPage(1)">1</button>
      <span v-if="pageRange[0] > 2" class="text-muted ellipsis">…</span>
      <button v-for="p in pageRange" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
      <span v-if="pageRange[pageRange.length - 1] < totalPages - 1" class="text-muted ellipsis">…</span>
      <button v-if="pageRange[pageRange.length - 1] < totalPages" class="page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
      <button class="page-btn nav-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next ›</button>
    </div>
  </div>
</template>

<style scoped>
.pagination-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.per-page-select {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.per-page-select select {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: white;
  border-radius: 8px;
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  font-family: 'Outfit', sans-serif;
  cursor: pointer;
  outline: none;
  transition: var(--transition);
}

.per-page-select select:hover,
.per-page-select select:focus {
  border-color: var(--primary-color);
}

.per-page-select select option {
  background: #0f172a;
  color: white;
}

.nav-btn {
  padding: 0 0.9rem;
  font-weight: 600;
}

.ellipsis {
  padding: 0 4px;
}
</style>
