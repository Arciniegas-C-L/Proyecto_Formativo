// src/components/Perfil/AutoAvatarInitializer.jsx
import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext'
import { updateUsuario } from '../../api/Usuario.api';
import { toast } from 'react-hot-toast';

export default function AutoAvatarInitializer() {
  const { usuario: usuarioContext, updateUsuarioContext } = useAuth();
  const didRunRef = useRef(false);

  useEffect(() => {
    const u = usuarioContext;
    if (!u?.idUsuario) return;

    // evita doble ejecución en dev (StrictMode) y re-renders
    if (didRunRef.current) return;

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
        await updateUsuario(u.idUsuario, { ...u, avatar_seed: seed, avatar_options: options });
        updateUsuarioContext({ ...u, avatar_seed: seed, avatar_options: options });
        localStorage.setItem(`avatar_autosaved_${u.idUsuario}`, '1');
        if (msg) toast.success(msg);
      } catch (err) {
        console.error('No se pudo autoguardar el avatar:', err);
      }
    };

    (async () => {
      if (justRegistered) {
        const { newSeed, defaultOptions } = genDefault();
        await persist(newSeed, defaultOptions, '¡Actualizamos tu avatar!');
        localStorage.removeItem('just_registered');
        didRunRef.current = true;
        return;
      }

      if (!hasAvatar && !alreadyAutosaved) {
        const { newSeed, defaultOptions } = genDefault();
        await persist(newSeed, defaultOptions, 'Te creamos un avatar automáticamente. Puedes personalizarlo cuando quieras.');
        didRunRef.current = true;
        return;
      }

      didRunRef.current = true;
    })();
  }, [usuarioContext, updateUsuarioContext]);

  return null; // no renderiza UI
}
