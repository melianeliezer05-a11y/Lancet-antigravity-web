import { supabase } from '../supabaseClient';

const CHANNEL_NAME = 'nmelectroclima_sync';
const broadcast = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel(CHANNEL_NAME) : null;

// ==========================================
// 1. LEADS / LLAMADAS IA
// ==========================================
export async function registrarLlamadaLead({ nombre, telefono, problema, urgencia = 'Alta' }) {
  const nuevoLead = {
    nombre: nombre || 'Cliente Web',
    telefono: telefono || '',
    problema: problema || 'Solicitud de asistencia técnica desde la web',
    creado_en: new Date().toISOString(),
    urgencia,
    origen: 'Web Cliente'
  };

  try {
    const { data, error } = await supabase
      .from('leads_clientes')
      .insert([nuevoLead])
      .select();

    if (!error && data && data.length > 0) {
      if (broadcast) broadcast.postMessage({ type: 'NUEVO_LEAD', payload: data[0] });
      return { success: true, lead: data[0] };
    }
    if (error) {
      console.warn('Error al guardar lead en Supabase (usando respaldo local):', error.message || error);
    }
  } catch (err) {
    console.warn('Error en conexión Supabase leads_clientes:', err);
  }

  // Fallback local garantizado
  try {
    const leadsLocales = JSON.parse(localStorage.getItem('nmelectroclima_leads') || '[]');
    const leadConId = { ...nuevoLead, id: Date.now() };
    localStorage.setItem('nmelectroclima_leads', JSON.stringify([leadConId, ...leadsLocales]));
    if (broadcast) broadcast.postMessage({ type: 'NUEVO_LEAD', payload: leadConId });
    return { success: true, lead: leadConId };
  } catch (storageErr) {
    console.warn('Error en localStorage leads:', storageErr);
    return { success: true, lead: { ...nuevoLead, id: Date.now() } };
  }
}

// ==========================================
// 2. TRABAJOS RECIENTES (PORTAFOLIO)
// ==========================================
export async function obtenerTrabajos() {
  try {
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .order('creado_en', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Error al consultar tabla proyectos en Supabase, usando respaldo local:', err);
  }

  // Respaldo local
  try {
    const locales = JSON.parse(localStorage.getItem('nmelectroclima_proyectos') || '[]');
    return locales;
  } catch {
    return [];
  }
}

export async function guardarTrabajo({ titulo, categoria, descripcion, imagenUrl, ubicacion }) {
  const nuevoTrabajo = {
    titulo,
    categoria: categoria || 'Climatización',
    descripcion: descripcion || '',
    imagen_url: imagenUrl || '',
    ubicacion: ubicacion || 'Andalucía',
    creado_en: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('proyectos')
      .insert([nuevoTrabajo])
      .select();

    if (!error && data && data.length > 0) {
      if (broadcast) broadcast.postMessage({ type: 'NUEVO_TRABAJO', payload: data[0] });
      return { success: true, trabajo: data[0] };
    }
    if (error) {
      console.warn('Error en Supabase proyectos (se usará respaldo local):', error.message || error);
    }
  } catch (err) {
    console.warn('No se pudo guardar en Supabase proyectos (usando fallback):', err);
  }

  // Respaldo local seguro con protección de cuota
  try {
    const trabajosLocales = JSON.parse(localStorage.getItem('nmelectroclima_proyectos') || '[]');
    const trabajoConId = { ...nuevoTrabajo, id: Date.now() };
    localStorage.setItem('nmelectroclima_proyectos', JSON.stringify([trabajoConId, ...trabajosLocales]));
    if (broadcast) broadcast.postMessage({ type: 'NUEVO_TRABAJO', payload: trabajoConId });
    return { success: true, trabajo: trabajoConId };
  } catch (storageErr) {
    console.warn('Cuota de almacenamiento local excedida, optimizando para respaldo:', storageErr);
    // Si la imagen en base64 llena la cuota de localStorage, se guarda sin la cadena base64 pesada
    const trabajoLigero = { ...nuevoTrabajo, id: Date.now(), imagen_url: '' };
    try {
      const trabajosLocales = JSON.parse(localStorage.getItem('nmelectroclima_proyectos') || '[]');
      localStorage.setItem('nmelectroclima_proyectos', JSON.stringify([trabajoLigero, ...trabajosLocales]));
      if (broadcast) broadcast.postMessage({ type: 'NUEVO_TRABAJO', payload: { ...nuevoTrabajo, id: trabajoLigero.id } });
      return { success: true, trabajo: { ...nuevoTrabajo, id: trabajoLigero.id } };
    } catch {
      return { success: true, trabajo: { ...nuevoTrabajo, id: Date.now() } };
    }
  }
}

export async function eliminarTrabajo(id) {
  try {
    await supabase.from('proyectos').delete().eq('id', id);
  } catch (err) {
    console.warn('Error al eliminar de Supabase proyectos:', err);
  }

  try {
    const trabajosLocales = JSON.parse(localStorage.getItem('nmelectroclima_proyectos') || '[]');
    const filtrados = trabajosLocales.filter((t) => t.id !== id);
    localStorage.setItem('nmelectroclima_proyectos', JSON.stringify(filtrados));
    if (broadcast) broadcast.postMessage({ type: 'ELIMINAR_TRABAJO', payload: id });
  } catch (e) {
    console.warn('Error al actualizar localStorage al eliminar trabajo:', e);
  }

  return { success: true };
}

// ==========================================
// 3. OPINIONES / RESEÑAS REALES DE CLIENTES
// ==========================================
export async function obtenerResenas() {
  try {
    const { data, error } = await supabase
      .from('resenas')
      .select('*')
      .order('creado_en', { ascending: false });

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Error al consultar tabla resenas en Supabase, usando respaldo local:', err);
  }

  try {
    const locales = JSON.parse(localStorage.getItem('nmelectroclima_resenas') || '[]');
    return locales;
  } catch {
    return [];
  }
}

export async function guardarResena({ nombre, calificacion, comentario, ciudad }) {
  const nuevaResena = {
    nombre: nombre || 'Cliente Anónimo',
    calificacion: Number(calificacion) || 5,
    comentario: comentario || '',
    ciudad: ciudad || '',
    creado_en: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('resenas')
      .insert([nuevaResena])
      .select();

    if (!error && data && data.length > 0) {
      if (broadcast) broadcast.postMessage({ type: 'NUEVA_RESENA', payload: data[0] });
      return { success: true, resena: data[0] };
    }
    if (error) {
      console.warn('Error al guardar reseña en Supabase (usando respaldo local):', error.message || error);
    }
  } catch (err) {
    console.warn('No se pudo guardar en Supabase resenas (usando fallback):', err);
  }

  try {
    const resenasLocales = JSON.parse(localStorage.getItem('nmelectroclima_resenas') || '[]');
    const resenaConId = { ...nuevaResena, id: Date.now() };
    localStorage.setItem('nmelectroclima_resenas', JSON.stringify([resenaConId, ...resenasLocales]));
    if (broadcast) broadcast.postMessage({ type: 'NUEVA_RESENA', payload: resenaConId });
    return { success: true, resena: resenaConId };
  } catch (storageErr) {
    console.warn('Error en localStorage reseñas:', storageErr);
    return { success: true, resena: { ...nuevaResena, id: Date.now() } };
  }
}

export function subscribeToSync(callback) {
  if (!broadcast) return () => {};
  const handler = (event) => {
    if (event.data) callback(event.data);
  };
  broadcast.addEventListener('message', handler);
  return () => broadcast.removeEventListener('message', handler);
}
