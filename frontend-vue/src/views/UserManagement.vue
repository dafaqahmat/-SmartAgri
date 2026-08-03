<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { toast } from 'vue3-toastify';
import Swal from 'sweetalert2';

const router = useRouter();
const users = ref([]);
const searchQuery = ref('');

// Pagination
const currentPage = ref(1);
const perPage = 10;

onMounted(() => { fetchUsers(); });

const fetchUsers = async () => {
  try {
    const res = await api.get('/users');
    users.value = res.data.data;
  } catch (err) {
    toast.error('Gagal memuat data petani');
  }
};

// Sort descending by id (newest first)
const filteredUsers = computed(() => {
  let list = [...users.value].sort((a, b) => b.id - a.id);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q));
  }
  return list;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / perPage)));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredUsers.value.slice(start, start + perPage);
});

const pageRange = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  let pages = [];
  for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) pages.push(i);
  return pages;
});

const goToPage = (p) => { if (p >= 1 && p <= totalPages.value) currentPage.value = p; };

const goToCreateUser = () => router.push('/admin/users/create');
const goToEditUser = (id) => router.push(`/admin/users/${id}/edit`);

const deleteUser = async (id) => {
  const result = await Swal.fire({
    title: 'Nonaktifkan Petani?',
    text: "Petani akan dinonaktifkan (soft delete) dan tidak bisa login.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Ya, Nonaktifkan!',
    cancelButtonText: 'Batal',
    background: '#0f172a',
    color: '#fff'
  });
  if (result.isConfirmed) {
    try {
      await api.delete(`/users/${id}`);
      Swal.fire({ title: 'Nonaktif!', text: 'Data petani berhasil dinonaktifkan.', icon: 'success', background: '#0f172a', color: '#fff' });
      fetchUsers();
    } catch (err) { toast.error('Gagal menonaktifkan petani'); }
  }
};

const restoreUser = async (id) => {
  try {
    await api.put(`/users/${id}`, { isActive: true, deletedAt: null });
    toast.success('Petani berhasil diaktifkan kembali!');
    fetchUsers();
  } catch (err) { toast.error('Gagal mengaktifkan petani'); }
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Data Petani & Rekap Sawah</h2>
        <p class="text-muted">Khusus Admin: Kelola daftar warga tani di desa.</p>
      </div>
      <div class="action-buttons">
        <input type="text" v-model="searchQuery" class="form-input" placeholder="🔍 Cari nama petani..." @input="currentPage = 1" />
        <button class="btn btn-secondary" @click="goToCreateUser">+ Tambah Petani</button>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-panel overflow-hidden">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Petani</th>
              <th>Email & Telp</th>
              <th>Status</th>
              <th>Jumlah Sawah</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredUsers.length === 0">
              <td colspan="6" class="text-center py-4">Belum ada data petani.</td>
            </tr>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td>#{{ user.id }}</td>
              <td><strong>{{ user.name }}</strong></td>
              <td>
                <div>{{ user.email }}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">{{ user.phone || '-' }}</div>
              </td>
              <td>
                <span v-if="!user.deletedAt" class="badge-status active">Aktif</span>
                <span v-else class="badge-status inactive">Nonaktif</span>
              </td>
              <td>
                <span v-if="user.fields && user.fields.length > 0" class="text-emerald">{{ user.fields.length }} Petak</span>
                <span v-else class="text-muted">Belum ada</span>
              </td>
              <td>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button class="btn-action" style="background:transparent;border:1px solid var(--primary-color);color:var(--primary-color);" @click="goToEditUser(user.id)">Edit</button>
                  <button v-if="!user.deletedAt" class="btn-action danger" style="background:transparent;" @click="deleteUser(user.id)">Nonaktifkan</button>
                  <button v-else class="btn-action" style="background:transparent;border:1px solid var(--warning-color);color:var(--warning-color);" @click="restoreUser(user.id)">Aktifkan</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <span class="pagination-info">
          Menampilkan {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filteredUsers.length) }} dari {{ filteredUsers.length }} data
        </span>
        <div class="pagination-controls">
          <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">‹</button>
          <button v-if="pageRange[0] > 1" class="page-btn" @click="goToPage(1)">1</button>
          <span v-if="pageRange[0] > 2" class="text-muted" style="padding:0 4px;">…</span>
          <button v-for="p in pageRange" :key="p" class="page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <span v-if="pageRange[pageRange.length-1] < totalPages - 1" class="text-muted" style="padding:0 4px;">…</span>
          <button v-if="pageRange[pageRange.length-1] < totalPages" class="page-btn" @click="goToPage(totalPages)">{{ totalPages }}</button>
          <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-status {
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}
.badge-status.active   { background: rgba(52,211,153,0.15); color: #34d399; }
.badge-status.inactive { background: rgba(239,68,68,0.15); color: #f87171; }
</style>
