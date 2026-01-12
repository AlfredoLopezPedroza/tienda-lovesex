const express = require('express');
const app = express();
const path = require('path');

// 🔹 Middleware
app.use(express.static('public'));

// 🔹 Rutas
const productosRoutes = require('./routes/productos');
const packsRoutes = require('./routes/packs');
const experienciasRoutes = require('./routes/experiencias');

app.use('/api/productos', productosRoutes);
app.use('/api/packs', packsRoutes);
app.use('/api/experiencias', experienciasRoutes);

// 🔹 Servir index.html en la raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔹 Puerto y servidor
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.listen(PORT, () => {
  console.log(`\n🚀 ¡Tienda Love&Sex lista!`);
  console.log(`✅ Servidor activo en: http://${HOST}:${PORT}`);
  console.log(`📊 API Productos: http://${HOST}:${PORT}/api/productos\n`);
});
