import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <nav className="admin-dashboard">
      <Link to="/categorias">Categorias</Link>
      <Link to="/grupo-talla">Grupos de Tallas</Link>
      <Link to="/tallas">Tallas</Link>
      <Link to="/proveedores">Proveedores</Link>
      <Link to="/usuario">Usuarios</Link>
      <Link to="/producto">Productos</Link>
      <Link to="/inventario">Inventario</Link>
      <Link to="/rol">Roles</Link>
    </nav>
  );
};

export default AdminDashboard;
