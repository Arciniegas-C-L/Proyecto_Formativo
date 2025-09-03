import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/Perfil.css';
import { fetchUsuario, updateUsuario } from "../../api/Usuario.api";
import Direcciones from './Direcciones';
import * as direccionApi from '../../api/direccion.api';
import CambiarPassword from './CambiarPassword';

export function Perfil() {
    const { updateUsuarioContext } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('datos'); 
    const [avatarSeed, setAvatarSeed] = useState('');
    const [avatarOptions, setAvatarOptions] = useState({});
    const [activeCategory, setActiveCategory] = useState(null);
    const [availableOptions, setAvailableOptions] = useState({});
    const [avatarError, setAvatarError] = useState(false);
    const [mostrarDirecciones, setMostrarDirecciones] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    // Estado para datos personales
    const [usuario, setUsuario] = useState({
        idUsuario: '',
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        direccion: ''
    });

    // Cargar datos del usuario al montar
    useEffect(() => {
        async function cargarUsuario() {
            try {
                const res = await fetchUsuario();
                const usuarioActual = res.data[0];
                setUsuario(usuarioActual);

                // Avatar: si el usuario ya tiene avatar_seed y avatar_options, usarlos
                if (usuarioActual.avatar_seed && usuarioActual.avatar_options) {
                    setAvatarSeed(usuarioActual.avatar_seed);
                    setAvatarOptions(usuarioActual.avatar_options);
                } else {
                    // Si no tiene, generar uno nuevo y dejarlo en memoria (no guardar hasta que el usuario lo guarde)
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
            } catch (error) {
                console.error("Error al cargar usuario:", error);
            }
        }
        cargarUsuario();
    }, []);

    const toArrayParam = (value) => Array.isArray(value) ? value.join(",") : value;

    const generateAvatarUrl = (options = avatarOptions) => {
        const getValidValue = (category, value, fallback) => {
            const validValues = availableOptions[category]?.enum || [];
            return validValues.includes(value) ? value : fallback;
        };

        const validOptions = {
            backgroundColor: getValidValue('backgroundColor', options.backgroundColor, '65c9ff'),
            accessories: getValidValue('accessories', options.accessories, 'kurt'),
            top: getValidValue('top', options.top, 'bigHair'),
            hairColor: getValidValue('hairColor', options.hairColor, '2c1b18'),
            clothing: getValidValue('clothing', options.clothing, 'blazerAndShirt'),
            clothingColor: getValidValue('clothingColor', options.clothingColor, '262e33'),
            eyes: getValidValue('eyes', options.eyes, 'default'),
            eyebrows: getValidValue('eyebrows', options.eyebrows, 'default'),
            mouth: getValidValue('mouth', options.mouth, 'smile'),
            facialHair: getValidValue('facialHair', options.facialHair, 'beardLight'),
            facialHairColor: getValidValue('facialHairColor', options.facialHairColor, 'a55728'),
            skinColor: getValidValue('skinColor', options.skinColor, 'ffdbb4')
        };

        const params = new URLSearchParams({
            seed: avatarSeed,
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
            size: 200
        });

        return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
    };

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
            // Enviar todos los datos requeridos junto con el avatar
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
            // Actualizar el usuario en el contexto global para refrescar el header
            updateUsuarioContext({
                ...usuario,
                avatar_seed: avatarSeed,
                avatar_options: avatarOptions
            });
            alert('Avatar guardado exitosamente!');
            setActiveSection('datos');
        } catch {
            alert('Error al guardar el avatar');
        }
    };

    // Manejar cambios inputs datos personales
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUsuario(prev => ({ ...prev, [name]: value }));
    };

    // Guardar datos personales
    const handleGuardarDatos = async () => {
        try {
            await updateUsuario(usuario.idUsuario, usuario);
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
                            src={generateAvatarUrl(previewOptions)}
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

        // API real para direcciones
        const apiDirecciones = {
            getDirecciones: direccionApi.getDirecciones,
            createDireccion: direccionApi.createDireccion,
            updateDireccion: direccionApi.updateDireccion,
            deleteDireccion: direccionApi.deleteDireccion,
            setPrincipalDireccion: direccionApi.setPrincipalDireccion,
        };

    return (
        <div className="perfil-container">
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
                                src={generateAvatarUrl()}
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
                        <button onClick={() => setActiveSection('pedidos')}>Pedidos</button>
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
                                    src={generateAvatarUrl()}
                                    alt="Avatar Preview"
                                    className="avatar-preview-image"
                                    onError={handleImageError}
                                />
                            </div>

                            <div className="avatar-buttons">
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
                                <label>Nombre:</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={usuario.nombre}
                                    onChange={handleChange}
                                />

                                <label>Apellido:</label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={usuario.apellido}
                                    onChange={handleChange}
                                />

                                <label>Correo:</label>
                                <input
                                    type="email"
                                    name="correo"
                                    value={usuario.correo}
                                    disabled
                                />

                                <label>Teléfono:</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={usuario.telefono}
                                    onChange={handleChange}
                                />

                                <label>Dirección:</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={usuario.direccion || ''}
                                    onChange={handleChange}
                                />

                                <button type="button" onClick={handleGuardarDatos}>
                                    Guardar cambios
                                </button>
                            </form>
                            </div>
                            
                        </div>
                    )}

                    {activeSection === 'pedidos' && (
                        <div className="pedidos-section">
                            <div className="titulo-opciones">
                                <h3>Pedidos</h3>
                            </div>
                        </div>
                    )}

                    {activeSection === 'config' && (
                        <div className="config-section">
                            <div className="titulo-opciones">
                                <h3>Configuraciones</h3>
                            </div>
                            <div className="config-list">
                                <div className="config-item">
                                    <h4>Cambiar contraseña</h4>
                                    <button onClick={() => setMostrarPassword(v => !v)}>
                                        {mostrarPassword ? 'Ocultar' : 'Cambiar contraseña'}
                                    </button>
                                    {mostrarPassword && (
                                        <CambiarPassword
                                            onSolicitarCodigo={() => {}}
                                            onCambiarPassword={() => {}}
                                            loading={false}
                                            error={''}
                                        />
                                    )}
                                </div>
                                <div className="config-item">
                                    <h4>Gestión de direcciones</h4>
                                    <button onClick={() => setMostrarDirecciones(v => !v)}>
                                        {mostrarDirecciones ? 'Ocultar' : 'Administrar direcciones'}
                                    </button>
                                    {mostrarDirecciones && (
                                        <Direcciones api={apiDirecciones} direccionPersonal={usuario.direccion} />
                                    )}
                                </div>
                                <div className="config-item">
                                    <h4>Métodos de pago</h4>
                                    <button onClick={() => alert('Gestión de métodos de pago próximamente')}>Administrar métodos de pago</button>
                                </div>
                                <div className="config-item">
                                    <h4>Eliminar cuenta</h4>
                                    <button style={{color: 'red'}} onClick={() => alert('Funcionalidad para eliminar cuenta próximamente')}>Eliminar cuenta</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
