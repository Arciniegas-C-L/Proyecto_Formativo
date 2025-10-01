import React, { useState } from 'react';
import '../../assets/css/Perfil/PedidosHistorial.css';

const pedidosEjemplo = [
  {
    id: 'PED-001',
    fecha: '2025-09-01',
    productos: [
      {
        nombre: 'iPhone 14 Pro',
        cantidad: 1,
        precio: 1099.99,
        imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      },
      {
        nombre: 'Samsung Galaxy S23',
        cantidad: 2,
        precio: 899.99,
        imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      },
      {
        nombre: 'MacBook Air M2',
        cantidad: 1,
        precio: 1299.99,
        imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      },
      {
        nombre: 'Dell XPS 13',
        cantidad: 1,
        precio: 1199.99,
        imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      },
    ],
    total: 4399.95,
    estado: 'Entregado',
  },
  {
    id: 'PED-002',
    fecha: '2025-08-20',
    productos: [
      {
        nombre: 'Xiaomi Redmi Note 12',
        cantidad: 1,
        precio: 299.99,
        imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      },
      {
        nombre: 'HP Pavilion 15',
        cantidad: 1,
        precio: 849.99,
        imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      },
    ],
    total: 50.98,
    estado: 'En camino',
  },
  {
    id: 'PED-003',
    fecha: '2025-08-10',
    productos: [
      {
        nombre: 'Motorola Edge 40',
        cantidad: 1,
        precio: 499.99,
        imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      },
      {
        nombre: 'Lenovo ThinkPad X1',
        cantidad: 1,
        precio: 1399.99,
        imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      },
    ],
    total: 42.97,
    estado: 'Cancelado',
  },
  {
    id: 'PED-004',
    fecha: '2025-07-30',
    productos: [
      {
        nombre: 'Asus ZenBook 14',
        cantidad: 1,
        precio: 1099.99,
        imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      },
    ],
    total: 59.99,
    estado: 'Entregado',
  },
  {
    id: 'PED-005',
    fecha: '2025-07-15',
    productos: [
      {
        nombre: 'Realme 11 Pro',
        cantidad: 1,
        precio: 399.99,
        imagen: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
      },
      {
        nombre: 'Acer Aspire 5',
        cantidad: 1,
        precio: 699.99,
        imagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80',
      },
    ],
    total: 22.98,
    estado: 'Entregado',
  },
];

const estadoColor = {
  'Entregado': '#4caf50',
  'En camino': '#ff9800',
  'Cancelado': '#f44336',
};

export default function PedidosHistorial() {
  // Estado para expandir solo el primer pedido
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="pedidos-historial-container">
      <div className="pedidos-lista">
        {pedidosEjemplo.map((pedido, idxPedido) => {
          // Solo aplicar la lógica de ver más al primer pedido
          const mostrarVerMas = idxPedido === 0 && pedido.productos.length > 3 && !expandido;
          const productosAMostrar = mostrarVerMas
            ? pedido.productos.slice(0, 3)
            : pedido.productos;

          return (
            <div className="pedido-card" key={pedido.id}>
              <div className="pedido-header">
                <span className="pedido-id">#{pedido.id}</span>
                <span className="pedido-fecha">{pedido.fecha}</span>
                <span className="pedido-estado" style={{background: estadoColor[pedido.estado]}}>{pedido.estado}</span>
              </div>
              <div className="pedido-productos">
                {productosAMostrar.map((prod, idx) => (
                  <div className="producto-item" key={idx}>
                    <img src={prod.imagen} alt={prod.nombre} className="producto-img" loading="lazy" />
                    <div className="producto-info">
                      <span className="producto-nombre">{prod.nombre}</span>
                      <span className="producto-cantidad">Cantidad: {prod.cantidad}</span>
                      <span className="producto-precio">${prod.precio.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {mostrarVerMas && (
                  <button
                    className="ver-mas-btn"
                    onClick={() => setExpandido(true)}
                    style={{border: 'none', background: 'transparent', cursor: 'pointer', marginLeft: 8, fontSize: 22, color: '#1976d2'}}
                    title="Ver más productos"
                  >
                    ...
                  </button>
                )}
              </div>
              <div className="pedido-total">
                <span>Total:</span>
                <span className="total-monto">${pedido.total.toFixed(2)}</span>
              </div>
              {/* Si está expandido, mostrar botón para volver atrás solo en el primer pedido */}
              {idxPedido === 0 && expandido && (
                <div style={{textAlign: 'right', marginTop: 6}}>
                  <button
                    className="ver-menos-btn"
                    onClick={() => setExpandido(false)}
                    style={{border: 'none', background: 'transparent', color: '#1976d2', cursor: 'pointer', fontSize: 15}}
                  >
                    Ver menos
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
