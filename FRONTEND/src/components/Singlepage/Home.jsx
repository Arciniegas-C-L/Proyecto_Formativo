import React, { useRef, useState, useEffect } from "react";
// Copia de la función de generación de avatar del perfil
const toArrayParam = (value) =>
  Array.isArray(value) ? value.join(",") : value;
const availableOptions = {
  backgroundColor: {
    enum: [
      "65c9ff",
      "5199e4",
      "25557c",
      "e6e6e6",
      "929598",
      "3c4f5c",
      "b1e2ff",
      "a7ffc4",
      "ffdeb5",
      "ffafb9",
      "ffffb1",
      "ff488e",
      "ff5c5c",
      "ffffff",
    ],
  },
  accessories: {
    enum: [
      "kurt",
      "prescription01",
      "prescription02",
      "round",
      "sunglasses",
      "wayfarers",
      "eyepatch",
    ],
  },
  top: {
    enum: [
      "hat",
      "hijab",
      "turban",
      "winterHat1",
      "winterHat02",
      "winterHat03",
      "winterHat04",
      "bob",
      "bun",
      "curly",
      "curvy",
      "dreads",
      "frida",
      "fro",
      "froBand",
      "longButNotTooLong",
      "miaWallace",
      "shavedSides",
      "straight02",
      "straight01",
      "straightAndStrand",
      "dreads01",
      "dreads02",
      "frizzle",
      "shaggy",
      "shaggyMullet",
      "shortCurly",
      "shortFlat",
      "shortRound",
      "shortWaved",
      "sides",
      "theCaesar",
      "theCaesarAndSidePart",
      "bigHair",
    ],
  },
  hairColor: {
    enum: [
      "a55728",
      "2c1b18",
      "b58143",
      "d6b370",
      "724133",
      "4a312c",
      "f59797",
      "ecdcbf",
      "c93305",
      "e8e1e1",
    ],
  },
  clothing: {
    enum: [
      "blazerAndShirt",
      "blazerAndSweater",
      "collarAndSweater",
      "graphicShirt",
      "hoodie",
      "overall",
      "shirtCrewNeck",
      "shirtScoopNeck",
      "shirtVNeck",
    ],
  },
  clothingColor: {
    enum: [
      "262e33",
      "65c9ff",
      "5199e4",
      "25557c",
      "e6e6e6",
      "929598",
      "3c4f5c",
      "b1e2ff",
      "a7ffc4",
      "ffafb9",
      "ffffb1",
      "ff488e",
      "ff5c5c",
      "ffffff",
    ],
  },
  eyes: {
    enum: [
      "closed",
      "cry",
      "default",
      "eyeRoll",
      "happy",
      "hearts",
      "side",
      "squint",
      "surprised",
      "winkWacky",
      "wink",
      "xDizzy",
    ],
  },
  eyebrows: {
    enum: [
      "angryNatural",
      "defaultNatural",
      "flatNatural",
      "frownNatural",
      "raisedExcitedNatural",
      "sadConcernedNatural",
      "unibrowNatural",
      "upDownNatural",
      "angry",
      "default",
      "raisedExcited",
      "sadConcerned",
      "upDown",
    ],
  },
  mouth: {
    enum: [
      "concerned",
      "default",
      "disbelief",
      "eating",
      "grimace",
      "sad",
      "screamOpen",
      "serious",
      "smile",
      "tongue",
      "twinkle",
      "vomit",
    ],
  },
  facialHair: {
    enum: [
      "beardLight",
      "beardMajestic",
      "beardMedium",
      "moustacheFancy",
      "moustacheMagnum",
    ],
  },
  facialHairColor: {
    enum: [
      "a55728",
      "2c1b18",
      "b58143",
      "d6b370",
      "724133",
      "4a312c",
      "f59797",
      "ecdcbf",
      "c93305",
      "e8e1e1",
    ],
  },
  skinColor: {
    enum: [
      "614335",
      "d08b5b",
      "ae5d29",
      "edb98a",
      "ffdbb4",
      "fd9841",
      "f8d25c",
    ],
  },
};

function generateAvatarUrlFromSnapshot(seed, options = {}) {
  const getValidValue = (category, value, fallback) => {
    const validValues = availableOptions[category]?.enum || [];
    return validValues.includes(value) ? value : fallback;
  };
  const validOptions = {
    backgroundColor: getValidValue(
      "backgroundColor",
      options.backgroundColor,
      "65c9ff"
    ),
    accessories: getValidValue("accessories", options.accessories, "kurt"),
    top: getValidValue("top", options.top, "bigHair"),
    hairColor: getValidValue("hairColor", options.hairColor, "2c1b18"),
    clothing: getValidValue("clothing", options.clothing, "blazerAndShirt"),
    clothingColor: getValidValue(
      "clothingColor",
      options.clothingColor,
      "262e33"
    ),
    eyes: getValidValue("eyes", options.eyes, "default"),
    eyebrows: getValidValue("eyebrows", options.eyebrows, "default"),
    mouth: getValidValue("mouth", options.mouth, "smile"),
    facialHair: getValidValue("facialHair", options.facialHair, "beardLight"),
    facialHairColor: getValidValue(
      "facialHairColor",
      options.facialHairColor,
      "a55728"
    ),
    skinColor: getValidValue("skinColor", options.skinColor, "ffdbb4"),
  };
  const params = new URLSearchParams({
    seed,
    backgroundColor: toArrayParam([validOptions.backgroundColor]),
    accessories: toArrayParam([validOptions.accessories]),
    accessoriesProbability: 100,
    top: toArrayParam([validOptions.top]),
    hairColor: toArrayParam([validOptions.hairColor]),
    clothing: toArrayParam([validOptions.clothing]),
    clothesColor: toArrayParam([validOptions.clothingColor]),
    eyes: toArrayParam([validOptions.eyes]),
    eyebrows: toArrayParam([validOptions.eyebrows]),
    mouth: toArrayParam([validOptions.mouth]),
    facialHair: toArrayParam([validOptions.facialHair]),
    facialHairColor: toArrayParam([validOptions.facialHairColor]),
    facialHairProbability: 0,
    skinColor: toArrayParam([validOptions.skinColor]),
    size: 200,
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../../assets/css/SinglePage/Home.css";
import gorra from "../../assets/images/home/gorra.jpg";
import pareja from "../../assets/images/home/ropahome.jpg";
import calzado from "../../assets/images/home/calzado.jpg";
import colcha from "../../assets/images/home/colcha2.jpg";
import guayos from "../../assets/images/home/guayos.jpg";
import gafas from "../../assets/images/home/gafas.jpg";
import Radio from "./estrellas";
import { enviarComentario, obtenerComentarios } from "../../api/Comentario.api";

export const Home = () => {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef();
  const [showModal, setShowModal] = useState(false);
  const [comentario, setComentario] = useState("");
  const [valoracion, setValoracion] = useState(5);
  const [loading, setLoading] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [comentariosAleatorios, setComentariosAleatorios] = useState([]);

  // Precargar imagen del hero para carga instantánea
  useEffect(() => {
    const preloadImage = new Image();
    preloadImage.src = "/fondo2.webp";

    preloadImage.onload = () => {
      console.log("Imagen de hero precargada exitosamente");
    };

    return () => {
      preloadImage.onload = null;
    };
  }, []);

  // Obtener comentarios al cargar
  useEffect(() => {
    obtenerComentarios().then((res) => {
      setComentarios(res.data);
    });
  }, []);

  // Elegir 3 aleatorios de comentarios con 4 o 5 estrellas cada vez que cambian los comentarios
  useEffect(() => {
    const destacados = comentarios.filter(c => c.valoracion === 4 || c.valoracion === 5);
    if (destacados.length > 0) {
      const copia = [...destacados];
      const seleccionados = [];
      while (copia.length > 0 && seleccionados.length < 3) {
        const idx = Math.floor(Math.random() * copia.length);
        seleccionados.push(copia.splice(idx, 1)[0]);
      }
      setComentariosAleatorios(seleccionados);
    } else {
      setComentariosAleatorios([]);
    }
  }, [comentarios]);

  // Redirige a login si no está autenticado antes de enviar
  const handleSubmit = async (e) => {
    if (!autenticado) {
      e.preventDefault();
      setShowModal(true);
      return;
    }
    e.preventDefault();
    setLoading(true);
    try {
      await enviarComentario({ texto: comentario, valoracion });
      setComentario("");
      setValoracion(5);
      // Recargar comentarios después de enviar
      const res = await obtenerComentarios();
      setComentarios(res.data);
      // Actualizar los 3 aleatorios después de recargar
      if (res.data.length > 0) {
        const copia = [...res.data];
        const seleccionados = [];
        while (copia.length > 0 && seleccionados.length < 3) {
          const idx = Math.floor(Math.random() * copia.length);
          seleccionados.push(copia.splice(idx, 1)[0]);
        }
        setComentariosAleatorios(seleccionados);
      } else {
        setComentariosAleatorios([]);
      }
      // obtenerComentarios().then(res => ...)
    } catch (err) {
      // Manejo de error (puedes mostrar un toast si quieres)
    }
    setLoading(false);
  };

  const handleFocusComentario = () => {
    if (!autenticado) {
      setShowModal(true);
    }
  };

  const handleValoracion = (v) => setValoracion(v);

  const handleGoToLogin = () => {
    setShowModal(false);
    navigate("/sesion");
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {/* Modal de advertencia para iniciar sesión */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            top: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              color: "#222",
              padding: "2rem 2.5rem",
              borderRadius: "1.5rem 1.5rem 0 0",
              boxShadow: "0 -2px 16px rgba(0,0,0,0.18)",
              minWidth: 320,
              maxWidth: "90vw",
              marginBottom: 0,
              textAlign: "center",
              animation: "slideUp .3s",
            }}
          >
            <div style={{ fontSize: "1.2rem", marginBottom: 12 }}>
              Debes iniciar sesión para dejar un comentario.
            </div>
            <button
              onClick={handleGoToLogin}
              style={{
                background: "#222",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.6rem 1.5rem",
                marginRight: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Ir a iniciar sesión
            </button>
            <button
              onClick={handleCloseModal}
              style={{
                background: "#eee",
                color: "#222",
                border: "none",
                borderRadius: 8,
                padding: "0.6rem 1.5rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-contenido">
          <h2 className="hero-titulo">La moda que se adapta a ti.</h2>
          <p className="hero-texto">
            ZOE une variedad, estilo y libertad en cada prenda. Para quienes
            eligen destacar.
          </p>
          <Link to="/catalogo" className="hero-boton">
            <strong>Ver catálogo</strong>
          </Link>
        </div>
      </section>

      <section className="productos-destacados">
        <div className="Titulo-productos">
          <hr className="izquierda" />
          <h2>Productos Destacados</h2>
          <hr className="derecha" />
        </div>
        <div className="productos">
          <div className="producto-home">
            <img src={pareja} alt="Ropa para mujeres, hombres y niños" />
            <h2>Ropa para Mujer, Hombre y Niño.</h2>
            <p>
              Ropa de alta calidad para toda la familia: Hombres, mujeres, niños
              y niñas.
            </p>
          </div>
          <div className="producto-home">
            <img src={calzado} alt="Calzado familiar cómodo y moderno" />
            <h2>Calzado para toda la Familia</h2>
            <p>
              Ofrecemos una amplia gama de calzado para hombres, mujeres y
              niños, garantizando comodidad y estilo en cada paso.
            </p>
          </div>
          <div className="producto-home">
            <img src={gorra} alt="Accesorios de moda para todos" />
            <h2>Accesorios y Complementos</h2>
            <p>
              Eleva tu estilo con nuestros bolsos, relojes, gafas y gorras.
              Detalles que hacen la diferencia en tu outfit diario.
            </p>
          </div>
          <div className="producto-home">
            <img src={colcha} alt="Decoración y productos para el hogar" />
            <h2>Productos para el Hogar</h2>
            <p>
              Descubre nuestra selección de productos para el hogar de alta
              calidad: decoración, muebles y accesorios que combinan estilo y
              funcionalidad.
            </p>
          </div>
          <div className="producto-home">
            <img src={gafas} alt="gafas como accesorio" />
            <h2>Gafas de Moda</h2>
            <p>
              Completa tu look con nuestras gafas modernas y elegantes,
              perfectas para cualquier ocasión y estilo.
            </p>
          </div>
          <div className="producto-home">
            <img src={guayos} alt="zapatosdeportivos" />
            <h2>Guayos Deportivos</h2>
            <p>
              Encuentra guayos cómodos y resistentes para todo tipo de deportes,
              asegurando rendimiento y estilo en cada partido.
            </p>
          </div>
        </div>
      </section>

      <section className="contenido-clientes">
        <div className="Titulo-productos">
          <hr className="izquierda" />
          <h2>Lo que dicen nuestros clientes</h2>
          <hr className="derecha" />
        </div>
        <div className="comentarios">
          {comentariosAleatorios.length === 0 && (
            <div className="usuario">
              <div className="comentario-usuario">
                <p>No hay comentarios aún. ¡Sé el primero en opinar!</p>
              </div>
            </div>
          )}
          {comentariosAleatorios.map((c) => {
            // Refuerzo: nunca usar avatar del usuario logueado, solo snapshot del comentario
            if (!c.usuario_avatar_seed) {
              console.warn(
                "Comentario sin avatar_seed, id comentario:",
                c.id,
                "usuario:",
                c.usuario_nombre,
                c.usuario_apellido
              );
            }
            return (
              <div className="usuario" key={c.id}>
                <div className="usuario-info">
                  {c.usuario_avatar_seed ? (
                    <img
                      src={generateAvatarUrlFromSnapshot(
                        c.usuario_avatar_seed,
                        c.usuario_avatar_options
                      )}
                      alt={c.usuario_nombre}
                    />
                  ) : (
                    <div
                      className="avatar-placeholder"
                      title="Sin avatar disponible"
                    />
                  )}
                  <div className="usuario-detalles">
                    <h3>
                      {c.usuario_nombre} {c.usuario_apellido}
                    </h3>
                    <div className="estrellas">
                      <Radio valor={c.valoracion} editable={false} />
                    </div>
                  </div>
                </div>
                <div className="comentario-usuario">
                  <p>"{c.texto}"</p>
                  <span className="fecha">
                    {new Date(c.fecha).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="palabras-con-movimiento">
        <div className="palabras">
          <div className="frase">
            <i className="bi bi-star-fill"></i>
            <span>Si te hace sonreír al espejo, es tuyo.</span>
          </div>
          <div className="frase">
            <i className="bi bi-lightning-fill"></i>
            <span>¡Tu energía se nota desde el outfit!</span>
          </div>
          <div className="frase">
            <i className="bi bi-gem"></i>
            <span>Estilo real, sin filtros.</span>
          </div>
        </div>
      </section>

      <section className="formulario-comentarios formulario-comentarios-flex">
        <div className="formulario-comentarios-formbox">
          <h2>¡Queremos saber tu opinión!</h2>
          <form
            className="form-comentario-home"
            autoComplete="off"
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <div className="calificacion">
              <h3>Tu valoración</h3>
              <div className="estrellas-calificacion">
                <Radio
                  valor={valoracion}
                  onChange={handleValoracion}
                  editable={true}
                />
              </div>
            </div>
            <div className="contenido-comentario">
              <h3>Comentario</h3>
              <textarea
                placeholder="Escribe aquí tu experiencia, sugerencia o mensaje..."
                required
                onFocus={handleFocusComentario}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading || !comentario.trim()}>
              {loading ? "Enviando..." : "Enviar comentario"}
            </button>
          </form>
        </div>
        <div className="valoracion-promedio-box">
          {comentarios.length > 0 ? (
            <>
              {/* Número promedio grande */}
              <div className="valoracion-promedio-numero">
                {(
                  Math.round(
                    (comentarios.reduce(
                      (acc, c) => acc + (c.valoracion || 0),
                      0
                    ) /
                      comentarios.length) *
                      10
                  ) / 10
                ).toFixed(1)}
                <span className="valoracion-promedio-numero-total">/5</span>
              </div>
              {/* Barras horizontales para cada valoración */}
              <div className="valoracion-barras-lista">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = comentarios.filter(
                    (c) => c.valoracion === n
                  ).length;
                  const percent =
                    comentarios.length > 0
                      ? (count / comentarios.length) * 100
                      : 0;
                  return (
                    <div key={n} className="valoracion-barra-item">
                      <span className="valoracion-barra-numero">{n}</span>
                      <div className="valoracion-barra-externa">
                        <div
                          className="valoracion-barra-interna"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="valoracion-barra-cantidad">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="valoracion-barra-total">
                {comentarios.length} valoraciones
              </div>
            </>
          ) : (
            <div className="valoracion-barra-sinvalor">
              Aún no hay valoraciones
            </div>
          )}
        </div>
      </section>
    </>
  );
};
