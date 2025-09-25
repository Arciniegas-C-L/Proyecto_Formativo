import React, { useState, useEffect } from "react";
import { getALLProductos } from "../../api/Producto.api";
import { getAllCategorias } from "../../api/Categoria.api";
import { fetchProveedores } from "../../api/Proveedor.api";
import { getAllInventario } from "../../api/InventarioApi";
import "../../assets/css/Admin/AdminHome.css";
import { Link } from "react-router-dom";

const AdminHome = () => {
  // ESTADO Y VARIABLES REACTIVAS // 
  
  // Estado para almacenar las estadísticas del dashboard
  const [stats, setStats] = useState({
    totalProducts: 0,     // Total de productos registrados
    totalCategories: 0,   // Total de categorías activas
    totalProviders: 0,    // Total de proveedores registrados
    lowStock: 0,          // Productos con stock bajo
  });

  // Estados para controlar el loading y tiempo actual
  const [loading, setLoading] = useState(true);        // Indica si está cargando datos
  const [currentTime, setCurrentTime] = useState(new Date());  // Tiempo actual para mostrar en header

  //  EFECTOS Y CICLO DE VIDA //
  
  useEffect(() => {
    // Se ejecuta al montar el componente
    loadDashboardData(); // Carga inicial de datos

    // Timer para actualizar la hora cada minuto (60000ms)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Cleanup: limpia el timer cuando el componente se desmonta
    return () => clearInterval(timer);
  }, []); // Array vacío = solo se ejecuta al montar

  //  FUNCIÓN PRINCIPAL DE CARGA DE DATOS //
  
  const loadDashboardData = async () => {
    setLoading(true); // Activa el estado de carga

    try {
      // Ejecuta todas las peticiones API en paralelo para mejor rendimiento
      const [
        productosResponse,
        categoriasResponse,
        proveedoresResponse,
        inventarioResponse,
      ] = await Promise.all([
        getALLProductos(),      // Obtiene todos los productos
        getAllCategorias(),     // Obtiene todas las categorías
        fetchProveedores(),     // Obtiene todos los proveedores
        getAllInventario(),     // Obtiene datos de inventario
      ]);

      // Extrae los datos de las respuestas con valores por defecto
      const productos = productosResponse?.data || [];
      const categorias = categoriasResponse || [];
      const proveedores = proveedoresResponse?.data || [];
      const inventario = inventarioResponse || [];

      // Lógica de negocio: Calcular productos con stock bajo
      const productosStockBajo = inventario.filter((item) => {
        const stockTotal = calculateTotalStock(item);  // Calcula stock total del producto
        const stockMinimo = item.stock_minimo || 10;   // Stock mínimo (default: 10)
        return stockTotal <= stockMinimo;              // Retorna true si está bajo
      });

      // Actualiza el estado con las estadísticas calculadas
      setStats({
        totalProducts: productos.length,
        totalCategories: categorias.length,
        totalProviders: proveedores.length,
        lowStock: productosStockBajo.length,
      });
      
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false); // Siempre desactiva el loading, haya error o no
    }
  };


  // FUNCIONES UTILITARIAS  // 
  
  // Calcula el stock total considerando las tallas
  const calculateTotalStock = (inventarioItem) => {
    // Si tiene tallas, suma el stock de todas las tallas
    if (inventarioItem.tallas && Array.isArray(inventarioItem.tallas)) {
      return inventarioItem.tallas.reduce(
        (total, talla) => total + (talla.stock || 0),
        0
      );
    }
    // Si no tiene tallas, retorna el stock directo
    return inventarioItem.stock || 0;
  };

  // Formatea la fecha y hora para mostrar en el header
  const formatDateTime = (date) => {
    return date.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) + " - " + date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Formato 24 horas
    });
  };

  // BLOQUE 5: CONFIGURACIÓN DE ACCIONES RÁPIDAS //
  
  // Array de objetos que define las tarjetas de acciones rápidas
  const quickActions = [
    {
      title: "Productos",
      description: "Ver y gestionar todos los productos",
      icon: "fas fa-boxes",        // Icono de FontAwesome
      iconClass: "primary",        // Clase CSS para el color del icono
      link: "/admin/productos"     // Ruta de navegación
    },
    {
      title: "Inventario",
      description: "Controlar stock y disponibilidad",
      icon: "fas fa-warehouse",
      iconClass: "success",
      link: "/admin/inventario"
    },
    {
      title: "Categorías",
      description: "Organizar productos por categorías",
      icon: "fas fa-tags",
      iconClass: "warning",
      link: "/admin/categorias"
    },
    {
      title: "Proveedores",
      description: "Gestionar proveedores registrados",
      icon: "fas fa-building",
      iconClass: "purple",
      link: "/admin/proveedores/registrados"
    },
    {
      title: "Pedidos",
      description: "Administrar pedidos de clientes",
      icon: "fas fa-shopping-cart",
      iconClass: "info",
      link: "/admin/pedidos"
    },
    {
      title: "Facturas",
      description: "Historial de facturas y comprobantes",
      icon: "fas fa-file-invoice",
      iconClass: "secondary",
      link: "/admin/facturas"
    },
    {
      title: "Tallas",
      description: "Configurar tallas y grupos",
      icon: "fas fa-ruler",
      iconClass: "success",
      link: "/admin/tallas"
    }
  ];

  //  BLOQUE 6: RENDERIZADO DEL COMPONENTE // 
  
  return (
    <div className="admin-home-container">
      
      {/*  HEADER SECTION  */}
      <div className="admin-header">
        <div className="header-left">
          <h1 className="admin-title">Panel de Administración</h1>
        </div>
        <div className="header-actions">
          {/* Muestra la fecha y hora actual */}
          <div className="current-time">{formatDateTime(currentTime)}</div>
          
          {/* Botón para refrescar datos manualmente */}
          <button
            className="btn-refresh"
            onClick={loadDashboardData}  // Ejecuta la carga de datos
            disabled={loading}          // Se deshabilita durante la carga
            title="Actualizar datos"   
          >
            {/* Icono que gira cuando está cargando */}
            <i className={`fas fa-sync ${loading ? "spinning" : ""}`}></i>
            Actualizar
          </button>
        </div>
      </div>

      {/*  DASHBOARD CONTENT  */}
      <div className="dashboard-content">
        
        {/*  WELCOME SECTION  */}
        {/* Sección de bienvenida con información general */}
        <div className="welcome-section">
          <h2 className="welcome-title">Variedad y Estilos ZOE</h2>
          <p className="welcome-subtitle">
            Gestiona eficientemente todos los aspectos de tu tienda desde este panel centralizado
          </p>
          
          {/* Grid de características principales del sistema */}
          <div className="features-grid">
            <div className="feature-item">
              <i className="fas fa-box feature-icon"></i>
              <span className="feature-text">Gestión completa de productos</span>
            </div>
            <div className="feature-item">
              <i className="fas fa-chart-line feature-icon"></i>
              <span className="feature-text">Control de inventario </span>
            </div>
            <div className="feature-item">
              <i className="fas fa-users feature-icon"></i>
              <span className="feature-text">Administración de información de contacto proveedores</span>
            </div>
          </div>
        </div>

        {/*  CARDS  */}
        {/* Grid de tarjetas que muestran estadísticas importantes */}
        <div className="stats-grid">
          
          {/* Tarjeta: Total de Productos */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon products">
                <i className="fas fa-cube"></i>
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : stats.totalProducts}
            </div>
            <div className="stat-label">Productos</div>
            <div className="stat-change">Registrados</div>
          </div>

          {/* Tarjeta: Total de Categorías */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon categories">
                <i className="fas fa-tag"></i>
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : stats.totalCategories}
            </div>
            <div className="stat-label">Categorías</div>
            <div className="stat-change">Activas</div>
          </div>

          {/* Tarjeta: Total de Proveedores */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon providers">
                <i className="fas fa-building"></i>
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : stats.totalProviders}
            </div>
            <div className="stat-label">Proveedores</div>
            <div className="stat-change">Registrados</div>
          </div>

          {/* Tarjeta: Stock Bajo (con lógica condicional de color) */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon stock">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : stats.lowStock}
            </div>
            <div className="stat-label">Stock Bajo</div>
            {/* Cambia color y texto según el estado del stock */}
            <div className={`stat-change ${stats.lowStock > 0 ? 'danger' : ''}`}>
              {stats.lowStock === 0 ? 'Óptimo' : 'Atención'}
            </div>
          </div>
        </div>

        {/*  QUICK ACTIONS SECTION  */}
        {/* Sección de acciones rápidas generadas dinámicamente */}
        <div className="quick-actions">
          <h2 className="section-title">
            <i className="fas fa-bolt"></i>
            Acciones Rápidas
          </h2>
          
          {/* Grid de tarjetas de acciones generado con map() */}
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <Link 
                key={index}              // Key única para React
                to={action.link}         // Navegación con React Router
                className="action-card"  // Clase CSS
                title={action.description}  
              >
                <div className="action-header">
                  {/* Icono con clase dinámica para colores */}
                  <div className={`action-icon ${action.iconClass}`}>
                    <i className={action.icon}></i>
                  </div>
                  {/* Título de la acción */}
                  <h3 className="action-title">{action.title}</h3>
                </div>
                {/* Descripción de la acción */}
                <p className="action-description">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
        
      </div> 
    </div> 
  );
};

export default AdminHome;