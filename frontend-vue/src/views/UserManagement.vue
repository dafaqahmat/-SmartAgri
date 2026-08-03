<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { toast } from 'vue3-toastify';
import Swal from 'sweetalert2';

const router = useRouter();
const users = ref([]);
const searchQuery = ref('');

onMounted(() => {
  fetchUsers();
});

const fetchUsers = async () => {
  try {
    const res = await api.get('/users');
    users.value = res.data.data;
  } catch (err) {
    toast.error('Gagal memuat data petani');
  }
};

const goToCreateUser = () => {
  router.push('/admin/users/create');
};

const goToEditUser = (id) => {
  router.push(`/admin/users/${id}/edit`);
};

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
      Swal.fire({
        title: 'Nonaktif!',
        text: 'Data petani berhasil dinonaktifkan.',
        icon: 'success',
        background: '#0f172a',
        color: '#fff'
      });
      fetchUsers();
    } catch (err) {
      toast.error('Gagal menonaktifkan petani');
    }
  }
};

const restoreUser = async (id) => {
  try {
    // Kita gunakan endpoint update user untuk memulihkan
    await api.put(`/users/${id}`, { isActive: true, deletedAt: null });
    toast.success('Petani berhasil diaktifkan kembali!');
    fetchUsers();
  } catch (err) {
    toast.error('Gagal mengaktifkan petani');
  }
};
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Data Petani & Rekap Sawah</h2>
        <p class="text-muted">Khusus Admin: Kelola daftar warga tani di desa.</p>
      </div>
      <div class="action-buttons" style="display: flex; gap: 1rem; align-items: center;">
        <input type="text" v-model="searchQuery" class="form-input" style="width: 250px; margin-bottom: 0;" placeholder="🔍 Cari nama petani..." />
        <button class="btn btn-secondary" @click="goToCreateUser">+ Tambah Petani</button>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-panel overflow-hidden">
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
          <tr v-if="users.length === 0">
            <td colspan="6" class="text-center py-4">Belum ada data petani.</td>
          </tr>
          <tr v-for="user in users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))" :key="user.id">
            <td>#{{ user.id }}</td>
            <td><strong>{{ user.name }}</strong></td>
            <td>
              <div>{{ user.email }}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">{{ user.phone || '-' }}</div>
            </td>
            <td>
              <span v-if="!user.deletedAt" style="background: rgba(52, 211, 153, 0.2); color: #34d399; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">Aktif</span>
              <span v-else style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">Nonaktif</span>
            </td>
            <td>
              <span v-if="user.fields && user.fields.length > 0" class="text-emerald">{{ user.fields.length }} Petak Sawah</span>
              <span v-else class="text-muted">Belum ada sawah</span>
            </td>
            <td>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-secondary-outline" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border: 1px solid var(--primary-color); color: var(--primary-color); background: transparent;" @click="goToEditUser(user.id)">Edit Data</button>
                
                <button v-if="!user.deletedAt" class="btn btn-secondary-outline" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border: 1px solid var(--danger-color); color: var(--danger-color); background: transparent;" @click="deleteUser(user.id)">Nonaktifkan (Hapus)</button>
                <button v-else class="btn btn-secondary-outline" style="padding: 0.4rem 0.6rem; font-size: 0.8rem; border: 1px solid var(--warning-color); color: var(--warning-color); background: transparent;" @click="restoreUser(user.id)">Aktifkan Kembali</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.text-muted { color: var(--text-muted); }
.py-4 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.text-emerald { color: #34d399; font-weight: 600; }

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.data-table th {
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: var(--text-muted);
}

.data-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
