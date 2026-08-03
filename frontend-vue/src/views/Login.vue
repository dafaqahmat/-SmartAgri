<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
import { toast } from 'vue3-toastify';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const router = useRouter();
const email = ref('');
const password = ref('');
const isLoading = ref(false);

let map = null;

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const handleLogin = async () => {
  isLoading.value = true;
  try {
    const response = await api.post('/auth/login', {
      email: email.value,
      password: password.value
    });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    router.push('/dashboard');
    toast.success('Login berhasil! Selamat datang.');
  } catch (error) {
    if (error.response && error.response.data.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Terjadi kesalahan pada server.');
    }
  } finally {
    isLoading.value = false;
  }
};

const initMap = async () => {
  const centerLat = -7.6745678;
  const centerLng = 112.1714602;

  map = L.map('public-map', {
    maxBounds: [[-7.6850, 112.1600], [-7.6600, 112.1850]],
    maxBoundsViscosity: 1.0,
    minZoom: 14
  }).setView([centerLat, centerLng], 15);
  
  L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '© Google Maps',
    maxZoom: 20
  }).addTo(map);

  try {
    const res = await api.get('/public/map-status');
    const fields = res.data.data;
    if (fields.length > 0) {
      const bounds = [];
      fields.forEach(f => {
        const marker = L.marker([f.lat, f.lng], { icon: f.isFlowing ? blueIcon : greenIcon }).addTo(map);
        const statusHtml = f.isFlowing 
          ? `<span style="color:#3b82f6;font-weight:bold;">💦 Sedang Diairi</span>` 
          : `<span style="color:#10b981;">Kering / Menunggu Giliran</span>`;
        marker.bindPopup(`
          <div style="font-family:'Outfit',sans-serif;">
            <b style="font-size:1.1rem">${f.blockName}</b><br/>
            Pemilik: ${f.ownerName}<br/>
            Status: ${statusHtml}
          </div>
        `);
        bounds.push([f.lat, f.lng]);
      });
      map.fitBounds(bounds);
    }
  } catch (err) {
    console.error('Gagal memuat data peta publik', err);
  }
};

onMounted(() => {
  initMap();
});
</script>

<template>
  <div class="login-page">

    <!-- Panel Kiri: Peta -->
    <div class="map-panel">
      <div id="public-map" class="map-container"></div>
      <div class="map-legend glass-panel">
        <h4>Status Irigasi Desa (Live)</h4>
        <div class="legend-item">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" alt="Blue" width="14">
          <span>Sedang Mengalir</span>
        </div>
        <div class="legend-item">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="Green" width="14">
          <span>Kosong / Menunggu</span>
        </div>
      </div>
    </div>

    <!-- Panel Kanan: Form Login -->
    <div class="login-panel">
      <!-- Decorative blobs -->
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>

      <div class="login-card glass-panel animate-fade-in">
        <div class="login-header">
          <div class="brand-icon">🌾</div>
          <h1>Smart Agri Desa</h1>
          <p>Masuk untuk mengelola pertanian dan irigasi desa Anda</p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              type="email"
              v-model="email"
              class="form-input"
              placeholder="nama@email.com"
              required
              autocomplete="email"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              type="password"
              v-model="password"
              class="form-input"
              placeholder="Masukkan password"
              required
              autocomplete="current-password"
            />
          </div>

          <button type="submit" class="btn btn-primary login-btn" :disabled="isLoading">
            <span v-if="isLoading" class="spinner"></span>
            <span>{{ isLoading ? 'Memproses...' : 'Masuk ke Dashboard →' }}</span>
          </button>
        </form>
      </div>
    </div>

  </div>
</template>

<style scoped>
:deep(.leaflet-pane) { z-index: 1; }
:deep(.leaflet-top), :deep(.leaflet-bottom) { z-index: 10; }

/* ===== PAGE WRAPPER ===== */
.login-page {
  display: flex;
  flex-direction: row;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #0f172a;
}

/* ===== LOGIN PANEL (KIRI) ===== */
.login-panel {
  width: 460px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
  background: radial-gradient(circle at 70% 50%, rgba(16,185,129,0.08) 0%, transparent 70%), #0f172a;
  border-left: 1px solid rgba(255,255,255,0.08);
  position: relative;
  z-index: 2;
  overflow: hidden;
}

/* Blobs decoratif */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.blob-1 {
  width: 350px; height: 350px;
  background: rgba(16,185,129,0.13);
  top: -100px; left: -100px;
  animation: float 9s ease-in-out infinite alternate;
}
.blob-2 {
  width: 300px; height: 300px;
  background: rgba(59,130,246,0.1);
  bottom: -80px; right: -80px;
  animation: float 13s ease-in-out infinite alternate-reverse;
}

@keyframes float {
  from { transform: translateY(0) scale(1); }
  to   { transform: translateY(25px) scale(1.07); }
}

/* ===== LOGIN CARD ===== */
.login-card {
  width: 100%;
  max-width: 380px;
  padding: 2.5rem 2rem;
  position: relative;
  z-index: 10;
  box-shadow: 0 25px 60px rgba(0,0,0,0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.brand-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
  filter: drop-shadow(0 0 18px rgba(16,185,129,0.45));
}

.login-header h1 {
  font-size: 1.7rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #fff 30%, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-header p {
  color: var(--text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.login-btn {
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ===== MAP PANEL (KANAN) ===== */
.map-panel {
  flex: 1;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-legend {
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 20;
  padding: 0.85rem 1.2rem;
}

.map-legend h4 {
  font-size: 0.85rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: white;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-color);
}
.legend-item:last-child { margin-bottom: 0; }

/* ===== RESPONSIVE MOBILE ===== */
@media (max-width: 768px) {
  /* Peta di atas, login di bawah (urutan HTML sudah benar: map-panel dulu, login-panel kedua) */
  .login-page {
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  /* Peta: 40% layar */
  .map-panel {
    flex: 0 0 40%;
    height: 40vh;
  }

  /* Login: mengisi sisa layar 60% */
  .login-panel {
    flex: 1;
    width: 100%;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding: 1.5rem 1.25rem;
    overflow: hidden;
    min-height: 0;
  }

  .login-card {
    max-width: 100%;
    padding: 1.5rem 1.25rem;
  }

  /* Perkecil elemen agar muat di sisa layar */
  .brand-icon { font-size: 2rem; margin-bottom: 0.4rem; }
  .login-header { margin-bottom: 1.25rem; }
  .login-header h1 { font-size: 1.4rem; }
  .login-header p { font-size: 0.82rem; }
  .form-group { margin-bottom: 1rem; }
  .login-btn { margin-top: 1rem; padding: 0.75rem; }
}

@media (min-width: 769px) and (max-width: 1100px) {
  .login-panel { width: 380px; }
}
</style>
