<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { toast } from 'vue3-toastify';
import Swal from 'sweetalert2';
import TablePagination from '../components/TablePagination.vue';

const router = useRouter();
const users = ref([]);
const searchQuery = ref('');

// Pagination
const currentPage = ref(1);
const perPage = ref(10);

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

const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / perPage.value)));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredUsers.value.slice(start, start + perPage.value);
});

watch(totalPages, (t) => { if (currentPage.value > t) currentPage.value = t; });

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
      <TablePagination
        v-if="filteredUsers.length > 0"
        v-model:current-page="currentPage"
        v-model:per-page="perPage"
        :total-items="filteredUsers.length"
      />
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
