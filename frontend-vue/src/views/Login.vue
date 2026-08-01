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

// Map refs
let map = null;

// Custom Icons
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
  // Koordinat Watuduwur Wangkal
  const centerLat = -7.6745678;
  const centerLng = 112.1714602;

  const bounds = [
    [-7.6850, 112.1600], // South-West
    [-7.6600, 112.1850]  // North-East
  ];

  map = L.map('public-map', {
    maxBounds: bounds,
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
        const marker = L.marker([f.lat, f.lng], { 
          icon: f.isFlowing ? blueIcon : greenIcon 
        }).addTo(map);
        
        let statusHtml = f.isFlowing 
          ? `<span style="color: #3b82f6; font-weight: bold;">💦 Sedang Diairi</span>` 
          : `<span style="color: #10b981;">Kering / Menunggu Giliran</span>`;
          
        marker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
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
  <div class="split-layout">
    <!-- Kolom Kiri: Peta -->
    <div class="map-section">
      <div id="public-map" class="map-container"></div>
      
      <!-- Legenda Peta yang mengambang -->
      <div class="map-legend glass-panel">
        <h4>Status Irigasi Desa (Live)</h4>
        <div class="legend-item">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" alt="Blue" width="16">
          <span>Sedang Mengalir</span>
        </div>
        <div class="legend-item">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" alt="Green" width="16">
          <span>Kosong / Menunggu</span>
        </div>
      </div>
    </div>

    <!-- Kolom Kanan: Form Login -->
    <div class="login-section">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      
      <div class="login-container glass-panel animate-fade-in">
        <div class="login-header">
          <h1>Smart Agri Desa 🌾</h1>
          <p>Masuk untuk mengelola pertanian dan irigasi</p>
        </div>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input 
              type="email" 
              v-model="email" 
              class="form-input" 
              placeholder="Masukkan email Anda" 
              required 
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
            />
          </div>
          
          <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
            <span v-if="isLoading">Memproses...</span>
            <span v-else>Masuk ke Dashboard</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-pane) { z-index: 1; }
:deep(.leaflet-top), :deep(.leaflet-bottom) { z-index: 10; }

.split-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.map-section {
  flex: 1; /* Tumbuh mengambil semua sisa ruang */
  position: relative;
  background-color: #0f172a;
}

.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-legend {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  z-index: 20;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-md);
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
}

.map-legend h4 {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: white;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color);
}
.legend-item:last-child { margin-bottom: 0; }

.login-section {
  width: 450px; /* Lebar tetap untuk panel login */
  min-width: 400px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(circle at bottom right, #0f172a, #020617);
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
  z-index: 2;
}

/* Background Decorations for login side */
.circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}

.circle-1 {
  width: 300px;
  height: 300px;
  background-color: rgba(16, 185, 129, 0.15); /* Emerald */
  top: -50px;
  left: -50px;
  animation: float 8s ease-in-out infinite alternate;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background-color: rgba(59, 130, 246, 0.1); /* Blue */
  bottom: -100px;
  right: -50px;
  animation: float 12s ease-in-out infinite alternate-reverse;
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(20px) scale(1.05); }
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  position: relative;
  z-index: 10;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.w-full {
  width: 100%;
  margin-top: 1rem;
  padding: 0.85rem;
}
</style>
