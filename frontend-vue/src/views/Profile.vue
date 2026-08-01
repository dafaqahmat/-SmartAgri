<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import { toast } from 'vue3-toastify';

const user = ref(null);
const isLoading = ref(false);

const form = ref({
  name: '',
  phone: '',
  password: '',
  confirmPassword: ''
});

onMounted(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    const parsedUser = JSON.parse(userData);
    user.value = parsedUser;
    form.value.name = parsedUser.name;
    form.value.phone = parsedUser.phone || '';
  }
});

const handleUpdateProfile = async () => {
  if (form.value.password && form.value.password !== form.value.confirmPassword) {
    toast.error('Password baru dan konfirmasi password tidak cocok!');
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      name: form.value.name,
      phone: form.value.phone
    };
    
    if (form.value.password) {
      payload.password = form.value.password;
    }

    const res = await api.put('/users/profile/me', payload);
    
    // Update local storage
    localStorage.setItem('user', JSON.stringify(res.data.data));
    user.value = res.data.data;
    
    // Reset password fields
    form.value.password = '';
    form.value.confirmPassword = '';
    
    toast.success('Profil berhasil diperbarui!');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <h2>Pengaturan Profil ⚙️</h2>
      <p class="text-muted">Perbarui data diri dan ubah kata sandi Anda di sini.</p>
    </div>

    <div class="profile-container">
      <div class="glass-panel profile-card">
        <div class="profile-avatar">
          <div class="avatar-circle">
            {{ user?.name ? user.name.charAt(0).toUpperCase() : 'U' }}
          </div>
          <div class="avatar-info">
            <h3>{{ user?.name }}</h3>
            <p>{{ user?.email }}</p>
            <span class="role-badge">{{ user?.role }}</span>
          </div>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <div class="form-section-title">Informasi Dasar</div>
          
          <div class="form-group">
            <label class="form-label">Nama Lengkap</label>
            <input type="text" v-model="form.name" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Nomor HP</label>
            <input type="text" v-model="form.phone" class="form-input" placeholder="08123456789" />
          </div>

          <div class="form-section-title" style="margin-top: 2rem;">Ubah Password</div>
          <p class="text-muted" style="margin-bottom: 1rem; font-size: 0.85rem;">
            Biarkan kosong jika Anda tidak ingin mengubah password.
          </p>
          
          <div class="form-group">
            <label class="form-label">Password Baru</label>
            <input type="password" v-model="form.password" class="form-input" placeholder="Masukkan password baru" />
          </div>
          
          <div class="form-group">
            <label class="form-label">Konfirmasi Password Baru</label>
            <input type="password" v-model="form.confirmPassword" class="form-input" placeholder="Ketik ulang password baru" />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              <span v-if="isLoading">Menyimpan...</span>
              <span v-else>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 2rem;
}

.text-muted {
  color: var(--text-muted);
}

.profile-container {
  max-width: 600px;
}

.profile-card {
  padding: 2.5rem;
}

.profile-avatar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.avatar-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
}

.avatar-info h3 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.avatar-info p {
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.role-badge {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.form-section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
  border-left: 3px solid var(--primary-color);
}

.form-actions {
  margin-top: 2.5rem;
  display: flex;
  justify-content: flex-end;
}
</style>
