// src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App"; // o "default" según cómo exportes App
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/css/Index/index.css"; // ajusta la ruta si corresponde

import { guest } from "../src/api/AuthApi";
import { auth } from "../src/auth/authService";

async function bootstrap() {
  try {
    const sesion = auth.obtenerSesion?.();
    if (!sesion?.access) {
      await guest(); // obtiene y guarda el token de invitado
    }
  } catch (e) {
    console.error("Error bootstrap invitado:", e);
  }
}

(async () => {
  await bootstrap();

  const rootEl = document.getElementById("root");
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
})();
