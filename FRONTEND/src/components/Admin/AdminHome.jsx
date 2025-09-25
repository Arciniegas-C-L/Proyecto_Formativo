import React, { useState, useEffect } from 'react';
import { 
  getALLProductos 
} from '../../api/Producto.api';
import { 
  getAllCategorias 
} from '../../api/Categoria.api';
import { 
  fetchProveedores 
} from '../../api/Proveedor.api';
import { 
  getAllInventario 
} from '../../api/InventarioApi';
import "../../assets/css/Admin/AdminHome.css";

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalProviders: 0,
    lowStock: 0
  });

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadDashboardData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      const [productosResponse, categoriasResponse, proveedoresResponse, inventarioResponse] = await Promise.all([
        getALLProductos(),
        getAllCategorias(),
        fetchProveedores(),
        getAllInventario()
      ]);

      const productos = productosResponse?.data || [];
      const categorias = categoriasResponse || [];
      const proveedores = proveedoresResponse?.data || [];
      const inventario = inventarioResponse || [];

      // Calcular stock bajo
      const productosStockBajo = inventario.filter(item => {
        const stockTotal = calculateTotalStock(item);
        const stockMinimo = item.stock_minimo || 10;
        return stockTotal <= stockMinimo;
      });

      setStats({
        totalProducts: productos.length,
        totalCategories: categorias.length,
        totalProviders: proveedores.length,
        lowStock: productosStockBajo.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStock = (inventarioItem) => {
    if (inventarioItem.tallas && Array.isArray(inventarioItem.tallas)) {
      return inventarioItem.tallas.reduce((total, talla) => total + (talla.stock || 0), 0);
    }
    return inventarioItem.stock || 0;
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + ', ' + date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Panel de Administración</h1>
          <p>Bienvenido al sistema de gestión - Variedad y Estilos ZOE</p>
        </div>
        <div className="header-actions">
          <div className="current-time">
            {formatDateTime(currentTime)}
          </div>
          <button className="btn-refresh" onClick={loadDashboardData} disabled={loading}>
            <i className={`fas fa-sync ${loading ? 'spinning' : ''}`}></i>
            Actualizar
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-card">
          <div className="welcome-icon">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="welcome-content">
            <h2>Bienvenido al Panel de Administración</h2>
            <p>Desde aquí puedes gestionar todos los aspectos de tu tienda:</p>
            <div className="features-list">
              <div className="feature-item">
                <i className="fas fa-box text-primary"></i>
                <span>Administrar productos y su información</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-tags text-success"></i>
                <span>Organizar categorías y subcategorías</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-building text-info"></i>
                <span>Gestionar proveedores y contactos</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-warehouse text-warning"></i>
                <span>Controlar inventario y stock</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-chart-bar text-purple"></i>
                <span>Monitorear estadísticas en tiempo real</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card blue">
          <div className="stat-icon">
            <i className="fas fa-cube"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : stats.totalProducts}</div>
            <div className="stat-label">Total Productos</div>
            <div className="stat-change success">Productos registrados</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-icon">
            <i className="fas fa-tag"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : stats.totalCategories}</div>
            <div className="stat-label">Categorías</div>
            <div className="stat-change success">Organizadas</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <i className="fas fa-building"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : stats.totalProviders}</div>
            <div className="stat-label">Proveedores</div>
            <div className="stat-change success">Activos</div>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '...' : stats.lowStock}</div>
            <div className="stat-label">Stock Bajo</div>
            <div className="stat-change danger">
              {stats.lowStock === 0 ? 'Todo bien' : 'Requiere atención'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Acciones Rápidas</h2>
        <div className="quick-actions-grid">
          <div className="action-card primary">
            <div className="action-icon">
              <i className="fas fa-plus-circle"></i>
            </div>
            <div className="action-content">
              <h3>Crear Producto</h3>
              <p>Agregar nuevos productos al catálogo</p>
            </div>
          </div>

          <div className="action-card success">
            <div className="action-icon">
              <i className="fas fa-boxes"></i>
            </div>
            <div className="action-content">
              <h3>Ver Inventario</h3>
              <p>Gestionar stock y cantidades</p>
            </div>
          </div>

          <div className="action-card info">
            <div className="action-icon">
              <i className="fas fa-tags"></i>
            </div>
            <div className="action-content">
              <h3>Gestionar Categorías</h3>
              <p>Organizar productos por categorías</p>
            </div>
          </div>

          <div className="action-card warning">
            <div className="action-icon">
              <i className="fas fa-building"></i>
            </div>
            <div className="action-content">
              <h3>Proveedores</h3>
              <p>Administrar proveedores y contactos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;