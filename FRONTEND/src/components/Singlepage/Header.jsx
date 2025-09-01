import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ZOE from "../../assets/images/home/ZOE.gif";
import { useAuth } from "../../context/AuthContext.jsx";


// Opciones válidas para el avatar (igual que en Perfil.jsx)
const availableOptions = {
  backgroundColor: ["65c9ff","5199e4","25557c","e6e6e6","929598","3c4f5c","b1e2ff","a7ffc4","ffdeb5","ffafb9","ffffb1","ff488e","ff5c5c","ffffff"],
  accessories: ["kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"],
  top: ["hat","hijab","turban","winterHat1","winterHat02","winterHat03","winterHat04","bob","bun","curly","curvy","dreads","frida","fro","froBand","longButNotTooLong","miaWallace","shavedSides","straight02","straight01","straightAndStrand","dreads01","dreads02","frizzle","shaggy","shaggyMullet","shortCurly","shortFlat","shortRound","shortWaved","sides","theCaesar","theCaesarAndSidePart","bigHair"],
  hairColor: ["a55728","2c1b18","b58143","d6b370","724133","4a312c","f59797","ecdcbf","c93305","e8e1e1"],
  clothing: ["blazerAndShirt","blazerAndSweater","collarAndSweater","graphicShirt","hoodie","overall","shirtCrewNeck","shirtScoopNeck","shirtVNeck"],
  clothingColor: ["262e33","65c9ff","5199e4","25557c","e6e6e6","929598","3c4f5c","b1e2ff","a7ffc4","ffafb9","ffffb1","ff488e","ff5c5c","ffffff"],
  eyes: ["closed","cry","default","eyeRoll","happy","hearts","side","squint","surprised","winkWacky","wink","xDizzy"],
  eyebrows: ["angryNatural","defaultNatural","flatNatural","frownNatural","raisedExcitedNatural","sadConcernedNatural","unibrowNatural","upDownNatural","angry","default","raisedExcited","sadConcerned","upDown"],
  mouth: ["concerned","default","disbelief","eating","grimace","sad","screamOpen","serious","smile","tongue","twinkle","vomit"],
  facialHair: ["beardLight","beardMajestic","beardMedium","moustacheFancy","moustacheMagnum"],
  facialHairColor: ["a55728","2c1b18","b58143","d6b370","724133","4a312c","f59797","ecdcbf","c93305","e8e1e1"],
  skinColor: ["614335","d08b5b","ae5d29","edb98a","ffdbb4","fd9841","f8d25c"]
};

function getValidValue(category, value, fallback) {
  const validValues = availableOptions[category] || [];
  return validValues.includes(value) ? value : fallback;
}

function generateAvatarUrl(usuario) {
  if (!usuario?.avatar_seed || !usuario?.avatar_options) return null;
  const options = usuario.avatar_options;
  const params = new URLSearchParams({
    seed: usuario.avatar_seed,
    backgroundColor: getValidValue('backgroundColor', options.backgroundColor, '65c9ff'),
    accessories: getValidValue('accessories', options.accessories, 'kurt'),
    accessoriesProbability: 100,
    top: getValidValue('top', options.top, 'bigHair'),
    hairColor: getValidValue('hairColor', options.hairColor, '2c1b18'),
    clothing: getValidValue('clothing', options.clothing, 'blazerAndShirt'),
    clothesColor: getValidValue('clothingColor', options.clothingColor, '262e33'),
    eyes: getValidValue('eyes', options.eyes, 'default'),
    eyebrows: getValidValue('eyebrows', options.eyebrows, 'default'),
    mouth: getValidValue('mouth', options.mouth, 'smile'),
    facialHair: getValidValue('facialHair', options.facialHair, 'beardLight'),
    facialHairColor: getValidValue('facialHairColor', options.facialHairColor, 'a55728'),
    facialHairProbability: 0,
    skinColor: getValidValue('skinColor', options.skinColor, 'ffdbb4'),
    size: 200
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}

export function Header() {
  const { autenticado, rol, logout, usuario } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [cantidadCarrito, setCantidadCarrito] = useState(0);

  // Simulación: puedes reemplazar esto por la lógica real de cantidad de carrito
  useEffect(() => {
    // Aquí deberías traer la cantidad real del carrito del contexto o API
    setCantidadCarrito(0); // Por defecto 0
  }, []);

  const confirmLogout = () => {
    setShowConfirm(false);
    logout();
  };
  const cancelLogout = () => setShowConfirm(false);



  // const linkCls = ... // Eliminado porque no se usa

  return (
    <>
  {showConfirm && (
        <div className="modal fade show" style={{display: 'block', background: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar cierre de sesión</h5>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro de que deseas cerrar sesión?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cancelLogout}>Cancelar</button>
                <button className="btn btn-danger" onClick={confirmLogout}>Cerrar sesión</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="bg-dark text-white shadow-sm">
        <div className="container-fluid d-flex align-items-center justify-content-between py-2 px-4">
          <div className="d-flex align-items-center">
            <img src={ZOE} alt="Logo de la empresa" style={{ height: 48, marginRight: 16 }} />
            <h3 className="m-0">
              <Link to="/" className="titulo-empresa text-white text-decoration-none fw-bold">
                Variedad y Estilos ZOE
              </Link>
            </h3>
          </div>
          <nav>
            <ul className="nav align-items-center">
              <li className="nav-item">
                <Link to="/" className="nav-link text-white">
                  <i className="bi bi-house-door-fill"></i> Inicio
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/catalogo" className="nav-link text-white">
                  <i className="bi bi-grid-3x3-gap-fill"></i> Catálogo
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/carrito" className="nav-link text-white position-relative">
                  <i className="bi bi-cart3"></i> Carrito
                  {cantidadCarrito > 0 && (
                    <span className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
                      {cantidadCarrito}
                    </span>
                  )}
                </Link>
              </li>
              {autenticado ? (
                <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="nav-link text-white dropdown-toggle d-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {generateAvatarUrl(usuario) ? (
                      <img src={generateAvatarUrl(usuario)} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginRight: 8, background: '#fff', border: '2px solid #1976d2' }} />
                    ) : (
                      <i className="bi bi-person-circle"></i>
                    )}
                    {usuario?.nombre || usuario?.username || 'Usuario'}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <Link to="/perfil" className="dropdown-item">
                        Mi Perfil
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={() => setShowConfirm(true)}>
                        Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </li>
              ) : (
                <li className="nav-item">
                  <Link to="/sesion" className="nav-link text-white">
                    <i className="bi bi-person-circle"></i> Sesión
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
