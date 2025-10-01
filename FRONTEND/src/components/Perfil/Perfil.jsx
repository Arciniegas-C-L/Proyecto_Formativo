import React, { useState, useEffect, useRef } from 'react';
import { generateAvatarUrl } from '../../utils/avatar';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import "../../assets/css/Perfil/Perfil.css";
import { updateUsuario } from "../../api/Usuario.api";
import Direcciones from './Direcciones';
import CambiarPassword from './CambiarPassword';
import { toast } from 'react-hot-toast';

export function Perfil() {
  const { usuario: usuarioContext, updateUsuarioContext } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState('datos');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [avatarOptions, setAvatarOptions] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [availableOptions, setAvailableOptions] = useState({});
  const [avatarError, setAvatarError] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const didAutoAvatarRef = useRef(false);

  // Datos personales
  const [usuario, setUsuario] = useState({
    idUsuario: '',
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    direccion: ''
  });

  // Sincroniza usuario al estado local
  useEffect(() => {
    if (usuarioContext) {
      setUsuario(usuarioContext);

      if (usuarioContext.avatar_seed && usuarioContext.avatar_options) {
        setAvatarSeed(usuarioContext.avatar_seed);
        setAvatarOptions(usuarioContext.avatar_options);
      } else {
        // Genera uno temporal (solo UI)
        const newSeed = Math.random().toString(36).substring(2, 10);
        setAvatarSeed(newSeed);
        const accesoriosDisponibles = ["kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"];
        const defaultOptions = {
          seed: newSeed,
          backgroundColor: "65c9ff",
          accessories: accesoriosDisponibles[Math.floor(Math.random() * accesoriosDisponibles.length)],
          clothing: "blazerAndShirt",
          clothingColor: "262e33",
          top: "bigHair",
          hairColor: "2c1b18",
          eyes: "default",
          eyebrows: "default",
          mouth: "smile",
          facialHair: "beardLight",
          facialHairColor: "a55728",
          skinColor: "ffdbb4"
        };
        setAvatarOptions(defaultOptions);
      }
    }

    setAvailableOptions({
      backgroundColor: { enum: ["65c9ff","5199e4","25557c","e6e6e6","929598","3c4f5c","b1e2ff","a7ffc4","ffdeb5","ffafb9","ffffb1","ff488e","ff5c5c","ffffff"] },
      accessories: { enum: ["kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"] },
      top: { enum: ["hat","hijab","turban","winterHat1","winterHat02","winterHat03","winterHat04","bob","bun","curly","curvy","dreads","frida","fro","froBand","longButNotTooLong","miaWallace","shavedSides","straight02","straight01","straightAndStrand","dreads01","dreads02","frizzle","shaggy","shaggyMullet","shortCurly","shortFlat","shortRound","shortWaved","sides","theCaesar","theCaesarAndSidePart","bigHair"] },
      hairColor: { enum: ["a55728","2c1b18","b58143","d6b370","724133","4a312c","f59797","ecdcbf","c93305","e8e1e1"] },
      clothing: { enum: ["blazerAndShirt","blazerAndSweater","collarAndSweater","graphicShirt","hoodie","overall","shirtCrewNeck","shirtScoopNeck","shirtVNeck"] },
      clothingColor: { enum: ["262e33","65c9ff","5199e4","25557c","e6e6e6","929598","3c4f5c","b1e2ff","a7ffc4","ffafb9","ffffb1","ff488e","ff5c5c","ffffff"] },
      eyes: { enum: ["closed","cry","default","eyeRoll","happy","hearts","side","squint","surprised","winkWacky","wink","xDizzy"] },
      eyebrows: { enum: ["angryNatural","defaultNatural","flatNatural","frownNatural","raisedExcitedNatural","sadConcernedNatural","unibrowNatural","upDownNatural","angry","default","raisedExcited","sadConcerned","upDown"] },
      mouth: { enum: ["concerned","default","disbelief","eating","grimace","sad","screamOpen","serious","smile","tongue","twinkle","vomit"] },
      facialHair: { enum: ["beardLight","beardMajestic","beardMedium","moustacheFancy","moustacheMagnum"] },
      facialHairColor: { enum: ["a55728","2c1b18","b58143","d6b370","724133","4a312c","f59797","ecdcbf","c93305","e8e1e1"] },
      skinColor: { enum: ["614335","d08b5b","ae5d29","edb98a","ffdbb4","fd9841","f8d25c"] }
    });
  }, [usuarioContext]);

  // Autogenera y guarda avatar si no existe o tras registro
  useEffect(() => {
    const u = usuarioContext;
    if (!u?.idUsuario) return;
    if (didAutoAvatarRef.current) return;

    const hasAvatar = Boolean(u.avatar_seed && u.avatar_options);
    const alreadyAutosaved = localStorage.getItem(`avatar_autosaved_${u.idUsuario}`) === '1';
    const justRegistered = localStorage.getItem('just_registered') === '1';

    const genDefault = () => {
      const newSeed = Math.random().toString(36).substring(2, 10);
      const accesoriosDisponibles = ["kurt","prescription01","prescription02","round","sunglasses","wayfarers","eyepatch"];
      const defaultOptions = {
        seed: newSeed,
        backgroundColor: "65c9ff",
        accessories: accesoriosDisponibles[Math.floor(Math.random() * accesoriosDisponibles.length)],
        clothing: "blazerAndShirt",
        clothingColor: "262e33",
        top: "bigHair",
        hairColor: "2c1b18",
        eyes: "default",
        eyebrows: "default",
        mouth: "smile",
        facialHair: "beardLight",
        facialHairColor: "a55728",
        skinColor: "ffdbb4"
      };
      return { newSeed, defaultOptions };
    };

    const persist = async (seed, options, msg) => {
      try {
        setAvatarSeed(seed);
        setAvatarOptions(options);
        await updateUsuario(u.idUsuario, { ...u, avatar_seed: seed, avatar_options: options });
        updateUsuarioContext({ ...u, avatar_seed: seed, avatar_options: options });
        localStorage.setItem(`avatar_autosaved_${u.idUsuario}`, '1');
        if (msg) toast.success(msg);
      } catch (err) {
        console.error('No se pudo autoguardar el avatar:', err);
      }
    };

    if (justRegistered) {
      const { newSeed, defaultOptions } = genDefault();
      persist(newSeed, defaultOptions, '¡Actualizamos tu avatar!');
      localStorage.removeItem('just_registered');
      didAutoAvatarRef.current = true;
      return;
    }

    if (!hasAvatar && !alreadyAutosaved) {
      const { newSeed, defaultOptions } = genDefault();
      persist(newSeed, defaultOptions, 'Te creamos un avatar automáticamente. Puedes personalizarlo cuando quieras.');
      didAutoAvatarRef.current = true;
      return;
    }
  }, [usuarioContext]); // 👈 cierre correcto

  // --- Helpers y funciones de UI ---
  const toArrayParam = (value) => Array.isArray(value) ? value.join(",") : value;

  const handleImageError = (e) => {
    console.error('Error loading avatar:', e.target.src);
    const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${avatarSeed}`;
    if (e.target.src !== fallbackUrl) {
      e.target.src = fallbackUrl;
    } else {
      setAvatarError(true);
    }
  };

  const handleOptionChange = (key, value) => {
    const newOptions = { ...avatarOptions, [key]: value };
    setAvatarOptions(newOptions);
    setAvatarError(false);
    localStorage.setItem('avatarOptions', JSON.stringify(newOptions));
  };

  const handleSaveAvatar = async () => {
    try {
      await updateUsuario(usuario.idUsuario, {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        estado: usuario.estado,
        rol: usuario.rol,
        avatar_seed: avatarSeed,
        avatar_options: avatarOptions
      });
      // Refresca el usuario desde la API para asegurar que el contexto y el header tengan el avatar correcto
      const { fetchUsuario } = await import('../../api/Usuario.api');
      const res = await fetchUsuario();
      if (res?.data) {
        updateUsuarioContext(res.data);
      }
      alert('Avatar guardado exitosamente!');
      setActiveSection('datos');
    } catch {
      alert('Error al guardar el avatar');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUsuario(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarDatos = async () => {
    try {
      await updateUsuario(usuario.idUsuario, {
        ...usuario,
        avatar_seed: avatarSeed,
        avatar_options: avatarOptions
      });
      alert('Datos personales actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      alert('Error al actualizar los datos personales');
    }
  };

  const renderOptionGallery = () => {
    if (!activeCategory || !availableOptions[activeCategory]) return null;
    const values = availableOptions[activeCategory].enum || [];

    return (
      <div className="option-gallery">
        {values.map((value, i) => {
          const previewOptions = { ...avatarOptions, [activeCategory]: value };
          return (
            <img
              key={`${activeCategory}-${value}-${i}`}
              src={generateAvatarUrl(previewOptions, avatarSeed)}
              alt={`${activeCategory}: ${value}`}
              className={`option-avatar ${avatarOptions[activeCategory] === value ? 'selected' : ''}`}
              onClick={() => handleOptionChange(activeCategory, value)}
              onError={handleImageError}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="perfil-container m-0 p-0">
      <div className="dashboard-perfil">
        <div className="perfil-info">
          <div className="perfil-avatar">
            {avatarError ? (
              <div className="avatar-placeholder">
                <span>👤</span>
                <p>Error cargando avatar</p>
              </div>
            ) : (
              <img
                src={generateAvatarUrl(avatarOptions, avatarSeed)}
                alt="Avatar"
                className="avatar-image"
                onError={handleImageError}
              />
            )}
            <h2>{usuario.nombre} {usuario.apellido}</h2>
            <button onClick={() => setActiveSection('avatar')} className="edit-avatar-btn">
              Editar Avatar
            </button>
          </div>

          <div className="perfil-opciones">
            <button onClick={() => setActiveSection('datos')}>Datos Personales</button>
            <button onClick={() => setActiveSection('config')}>Configuraciones</button>
            <button onClick={() => navigate('/')}>Salir</button>
          </div>
        </div>

        <div className="mostrar-opciones">
          {activeSection === 'avatar' && (
            <div className="avatar-editor">
              <div className="titulo-opciones">
                <h3>Personalizar Avatar</h3>
              </div>

              <div className="avatar-preview">
                <img
                  src={generateAvatarUrl(avatarOptions, avatarSeed)}
                  alt="Avatar Preview"
                  className="avatar-preview-image"
                  onError={handleImageError}
                />
              </div>

              <div className="avatar-controls">
                <button onClick={() => { setActiveCategory('backgroundColor'); }}>🎨 Fondo</button>
                <button onClick={() => { setActiveCategory('accessories'); }}>🕶️ Accesorios</button>
                <button onClick={() => { setActiveCategory('top'); }}>💇 Cabello</button>
                <button onClick={() => { setActiveCategory('hairColor'); }}>🎨 Color Cabello</button>
                <button onClick={() => { setActiveCategory('clothing'); }}>👕 Ropa</button>
                <button onClick={() => { setActiveCategory('clothingColor'); }}>🎨 Color Ropa</button>
                <button onClick={() => { setActiveCategory('eyes'); }}>👀 Ojos</button>
                <button onClick={() => { setActiveCategory('eyebrows'); }}>👁️ Cejas</button>
                <button onClick={() => { setActiveCategory('mouth'); }}>👄 Boca</button>
                <button onClick={() => { setActiveCategory('skinColor'); }}>🖐️ Piel</button>
              </div>

              {renderOptionGallery()}

              <button onClick={handleSaveAvatar} className="save-btn">
                💾 Guardar Avatar
              </button>
            </div>
          )}

          {activeSection === 'datos' && (
            <div className="datos-section">
              <div className="titulo-opciones">
                <h3>Datos Personales</h3>
              </div>

              <div className="datos-section1">
                <form className="form-datos">
                  <div className="form-group">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      name="nombre"
                      value={usuario.nombre}
                      onChange={handleChange}
                      maxLength={10}
                    />
                  </div>

                  <div className="form-group">
                    <label>Apellido:</label>
                    <input
                      type="text"
                      name="apellido"
                      value={usuario.apellido}
                      onChange={handleChange}
                      maxLength={10}
                    />
                  </div>

                  <div className="form-group">
                    <label>Correo:</label>
                    <input
                      type="email"
                      name="correo"
                      value={usuario.correo}
                      disabled
                    />
                  </div>

                  <div className="form-group">
                    <label>Teléfono:</label>
                    <input
                      type="text"
                      name="telefono"
                      value={usuario.telefono}
                      onChange={handleChange}
                      maxLength={10}
                      minLength={10}
                    />
                  </div>


                  <button type="button" className="btn-guardar" onClick={handleGuardarDatos}>
                    Guardar cambios
                  </button>
                </form>
              </div>
            </div>
          )}


          {activeSection === 'config' && (
            <div className="config-section">
              <div className="titulo-opciones">
                <h3>Configuraciones</h3>
              </div>
              <div className="config-grid">
                  <div className="config-card cambiar-password">
                    <h4>🔒 Cambiar contraseña</h4>
                    <button className="config-btn cambiar" onClick={() => setMostrarPassword(v => !v)}>
                      {mostrarPassword ? 'Ocultar' : 'Cambiar contraseña'}
                    </button>
                    {mostrarPassword && (
                      <div className="config-expand cambiar">
                        <CambiarPassword
                          onSolicitarCodigo={() => {}}
                          onCambiarPassword={() => {}}
                          loading={false}
                          error={''}
                        />
                      </div>
                    )}
                  </div>

                  <div className="config-card">
                  <h4>💳 Métodos de pago</h4>
                  <button className="config-btn" onClick={() => alert('Gestión de métodos de pago próximamente')}>
                    Administrar métodos de pago
                  </button>
                </div>
              </div>
              <div className="boton-eliminar">
                <button className="config-btn danger" style={{marginLeft: 'auto', display: 'block'}} onClick={() => alert('Funcionalidad para eliminar cuenta próximamente')}>
                  Eliminar cuenta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
