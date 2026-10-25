import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  obtenerTrabajos, 
  guardarTrabajo, 
  eliminarTrabajo, 
  obtenerResenas,
  subscribeToSync 
} from '../services/dataService';

// CLAVE MAESTRA DE SEGURIDAD PARA ACCEDER AL PANEL
const CLAVE_ACCESO_ADMIN = "sake0702*";

export default function PanelAdmin() {
  // Estado de autenticación
  const [autenticado, setAutenticado] = useState(() => {
    return sessionStorage.getItem('nmelectroclima_admin_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [tabActiva, setTabActiva] = useState('llamadas'); // 'llamadas' | 'trabajos' | 'resenas'
  
  // 1. Estados de Llamadas / Leads
  const [clientes, setClientes] = useState([]);
  
  // 2. Estados de Trabajos Recientes
  const [trabajos, setTrabajos] = useState([]);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Climatización');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaUbicacion, setNuevaUbicacion] = useState('Gran Canaria');
  const [imagenPreview, setImagenPreview] = useState('');
  const [guardandoTrabajo, setGuardandoTrabajo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // 3. Estados de Reseñas Reales
  const [resenas, setResenas] = useState([]);

  // Validar contraseña
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === CLAVE_ACCESO_ADMIN) {
      setAutenticado(true);
      sessionStorage.setItem('nmelectroclima_admin_auth', 'true');
      setErrorPassword('');
      setPasswordInput('');
    } else {
      setErrorPassword('Contraseña incorrecta. Acceso restringido al personal autorizado.');
    }
  };

  const handleLogout = () => {
    setAutenticado(false);
    sessionStorage.removeItem('nmelectroclima_admin_auth');
    setPasswordInput('');
  };

  // Cargar datos y suscripciones en tiempo real
  useEffect(() => {
    if (!autenticado) return;

    // A) Obtener llamadas desde Supabase
    const obtenerClientesIniciales = async () => {
      try {
        const { data, error } = await supabase
          .from('leads_clientes')
          .select('*')
          .order('creado_en', { ascending: false });

        if (!error && data) {
          setClientes(data);
        } else {
          const locales = JSON.parse(localStorage.getItem('nmelectroclima_leads') || '[]');
          if (locales.length > 0) setClientes(locales);
        }
      } catch (e) {
        const locales = JSON.parse(localStorage.getItem('nmelectroclima_leads') || '[]');
        if (locales.length > 0) setClientes(locales);
      }
    };

    obtenerClientesIniciales();

    // B) Cargar trabajos y reseñas
    const cargarTodo = async () => {
      const trabajosData = await obtenerTrabajos();
      setTrabajos(trabajosData);

      const resenasData = await obtenerResenas();
      setResenas(resenasData);
    };
    cargarTodo();

    // C) Suscripción Realtime Supabase a leads_clientes
    const canalRealtime = supabase
      .channel('cambios-leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads_clientes',
        },
        (payload) => {
          setClientes((clientesActuales) => [payload.new, ...clientesActuales]);
        }
      )
      .subscribe();

    // D) Suscripción local entre pestañas
    const unsubscribeSync = subscribeToSync((data) => {
      if (data.type === 'NUEVO_LEAD') {
        setClientes((prev) => [data.payload, ...prev]);
      } else if (data.type === 'NUEVO_TRABAJO') {
        setTrabajos((prev) => [data.payload, ...prev]);
      } else if (data.type === 'ELIMINAR_TRABAJO') {
        setTrabajos((prev) => prev.filter((t) => t.id !== data.payload));
      } else if (data.type === 'NUEVA_RESENA') {
        setResenas((prev) => [data.payload, ...prev]);
      }
    });

    return () => {
      supabase.removeChannel(canalRealtime);
      unsubscribeSync();
    };
  }, [autenticado]);

  // Manejador para cargar foto del ordenador o cámara
  const handleSeleccionarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagenPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Guardar un nuevo trabajo reciente
  const handlePublicarTrabajo = async (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) {
      alert('Por favor, introduce un título para el trabajo');
      return;
    }

    setGuardandoTrabajo(true);
    const resultado = await guardarTrabajo({
      titulo: nuevoTitulo,
      categoria: nuevaCategoria,
      descripcion: nuevaDescripcion,
      imagenUrl: imagenPreview || '/hero-bg.jpeg',
      ubicacion: nuevaUbicacion,
    });

    if (resultado.success) {
      setTrabajos((prev) => [resultado.trabajo, ...prev]);
      setNuevoTitulo('');
      setNuevaDescripcion('');
      setImagenPreview('');
      setMensajeExito('¡Trabajo publicado con éxito! Ya es visible en la web para los clientes.');
      setTimeout(() => setMensajeExito(''), 4000);
    }
    setGuardandoTrabajo(false);
  };

  const handleEliminarTrabajo = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este trabajo del portafolio?')) return;
    await eliminarTrabajo(id);
    setTrabajos((prev) => prev.filter((t) => t.id !== id));
  };

  // =========================================================================
  // 1. PANTALLA DE BLOQUEO CON CLAVE DE ACCESO
  // =========================================================================
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-[#070e1a] text-slate-100 flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-slate-950 font-sans relative overflow-hidden">
        {/* Luces de fondo difusas */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-cyan-400 to-amber-400 p-0.5 shadow-xl">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-black text-cyan-400 text-xl">
                NM
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              NM ELECTROCLIMA
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wider uppercase mt-1">
              Panel de Control Privado
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Introduce la clave autorizada para gestionar llamadas, portafolio y opiniones.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Clave de Seguridad
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Escribe la clave de acceso..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (errorPassword) setErrorPassword('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 pr-12 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                >
                  {mostrarPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>

            {errorPassword && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorPassword}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 hover:from-cyan-300 hover:to-sky-200 transition-all shadow-xl shadow-cyan-500/20 active:scale-95 text-sm"
            >
              🔓 Desbloquear Panel de Control
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>← Volver a la Web Pública de Clientes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PANEL DE CONTROL AUTORIZADO
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-4 sm:p-8 selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* ENCABEZADO DEL PANEL CON BOTÓN CERRAR SESIÓN */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-slate-700/80 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-400 to-amber-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center font-black text-cyan-400 text-lg">
                NM
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Panel de Control · <span className="text-cyan-400">NM Electroclima</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Llamadas IA · Trabajos & Hostelería · Opiniones Reales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/80 text-cyan-400 hover:text-cyan-300 font-semibold text-xs sm:text-sm transition-all shadow-md"
            >
              <span>Ver Web</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs sm:text-sm transition-all"
              title="Cerrar sesión y proteger el panel"
            >
              <span>🔒 Bloquear</span>
            </button>
          </div>
        </header>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/70 shadow-inner">
          <button
            onClick={() => setTabActiva('llamadas')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              tabActiva === 'llamadas'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg font-extrabold'
                : 'text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <span>📞 Llamadas IA</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tabActiva === 'llamadas' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'}`}>
              {clientes.length}
            </span>
          </button>

          <button
            onClick={() => setTabActiva('trabajos')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              tabActiva === 'trabajos'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg font-extrabold'
                : 'text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <span>🛠️ Publicar Trabajos</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tabActiva === 'trabajos' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
              {trabajos.length}
            </span>
          </button>

          <button
            onClick={() => setTabActiva('resenas')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              tabActiva === 'resenas'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg font-extrabold'
                : 'text-slate-300 hover:bg-slate-800/80'
            }`}
          >
            <span>⭐ Opiniones Reales</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${tabActiva === 'resenas' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
              {resenas.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: LLAMADAS ATENDIDAS Y CLASIFICADAS POR IA                      */}
        {/* ========================================================================= */}
        {tabActiva === 'llamadas' && (
          <section className="space-y-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Llamadas Filtradas por Inteligencia Artificial
                </h2>
                <p className="text-xs text-slate-400">
                  Las llamadas de clientes se registran automáticamente aquí con su motivo y nivel de urgencia.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 self-start sm:self-auto">
                Recepción Activa
              </span>
            </div>

            {clientes.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/60 p-8">
                <div className="text-4xl mb-3">📞</div>
                <h3 className="text-lg font-bold text-white mb-1">No hay llamadas registradas todavía</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  En cuanto un cliente llame o deje su aviso en la web, la IA lo procesará y aparecerá aquí inmediatamente en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientes.map((cliente, index) => {
                  const esFamiliar = (() => {
                    const texto = `${cliente.nombre || ''} ${cliente.problema || ''} ${cliente.urgencia || ''}`.toLowerCase();
                    return (
                      texto.includes('familiar') ||
                      texto.includes('personal') ||
                      texto.includes('hijo') ||
                      texto.includes('hija') ||
                      texto.includes('mamá') ||
                      texto.includes('mama') ||
                      texto.includes('papá') ||
                      texto.includes('papa') ||
                      texto.includes('abuel') ||
                      texto.includes('tío') ||
                      texto.includes('tio') ||
                      texto.includes('tía') ||
                      texto.includes('tia') ||
                      texto.includes('herman') ||
                      texto.includes('primo') ||
                      texto.includes('amig') ||
                      (cliente.urgencia || '').toLowerCase() === 'no urgente' ||
                      (cliente.urgencia || '').toLowerCase() === 'baja'
                    );
                  })();

                  return (
                    <div 
                      key={index} 
                      className={`p-6 rounded-2xl shadow-xl border relative transition-all ${
                        esFamiliar 
                          ? 'bg-slate-900/90 border-emerald-500/40 hover:border-emerald-400/70' 
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                        <h3 className="text-lg sm:text-xl font-bold text-cyan-300 flex items-center gap-2">
                          👤 {cliente.nombre || 'Contacto'}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          {esFamiliar ? (
                            <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span>Familiar / No Urgente</span>
                            </span>
                          ) : (
                            <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                              <span>{cliente.urgencia || 'Urgencia Cliente / Alta'}</span>
                            </span>
                          )}

                          {cliente.creado_en && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(cliente.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notificación si es llamada personal/familiar */}
                      {esFamiliar && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2 text-xs text-emerald-300">
                          <span className="flex items-center gap-2">
                            <span>📲</span>
                            <span><strong>Llamada Personal Detectada:</strong> Retransmitir al móvil personal de mamá (+34 623 34 47 80).</span>
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 font-mono">No Urgente</span>
                        </div>
                      )}

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Teléfono Emisor:</span>
                          <a 
                            href={`tel:${cliente.telefono}`}
                            className="text-lg font-extrabold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors font-mono"
                          >
                            📞 {cliente.telefono || 'No indicado'}
                          </a>
                        </div>

                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Motivo detectado por la IA:
                          </p>
                          <p className="text-sm text-slate-200 leading-relaxed font-normal">
                            {cliente.problema || 'Sin detalles especificados.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        {esFamiliar ? (
                          <>
                            <a
                              href="tel:+34623344780"
                              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-5 rounded-xl shadow-lg transition-all active:scale-95 text-xs sm:text-sm"
                            >
                              <span>📲 Retransmitir al Celular de Mamá</span>
                            </a>
                            <a
                              href={`tel:${cliente.telefono}`}
                              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 px-4 rounded-xl border border-slate-600 text-xs sm:text-sm transition-all"
                            >
                              <span>Responder al Familiar</span>
                            </a>
                          </>
                        ) : (
                          <a
                            href={`tel:${cliente.telefono}`}
                            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 text-slate-950 font-extrabold py-2.5 px-6 rounded-xl shadow-lg transition-all active:scale-95 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>Devolver Llamada a Cliente</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: GESTOR DE TRABAJOS RECIENTES (Con fotos y comentarios)         */}
        {/* ========================================================================= */}
        {tabActiva === 'trabajos' && (
          <section className="space-y-8">
            {mensajeExito && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>{mensajeExito}</span>
              </div>
            )}

            {/* FORMULARIO PARA AÑADIR NUEVO TRABAJO */}
            <div className="bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>➕ Publicar Nuevo Trabajo en la Web</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Rellena los datos y añade una foto de la instalación. Aparecerá en directo en la sección "Trabajos Recientes" para los clientes.
              </p>

              <form onSubmit={handlePublicarTrabajo} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Título de la Instalación o Reparación *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Instalación de Paneles Solares 5kW / Reparación Horno Industrial..."
                      value={nuevoTitulo}
                      onChange={(e) => setNuevoTitulo(e.target.value)}
                      required
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Especialidad / Categoría
                    </label>
                    <select
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="Climatización">❄️ Climatización</option>
                      <option value="Electricidad / Paneles Solares">⚡ Electricidad & Paneles Solares</option>
                      <option value="Hostelería & Cocinas">🍽️ Hostelería & Maquinaria Cocina</option>
                      <option value="Refrigeración">🧊 Refrigeración Comercial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Ubicación (Zona / Municipio)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Las Palmas, Telde, Maspalomas, Arucas..."
                      value={nuevaUbicacion}
                      onChange={(e) => setNuevaUbicacion(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Comentario sobre lo realizado (Detalles para los clientes)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej: Montaje de paneles solares monocristalinos con inversor híbrido / Sustitución de termostato y resistencias en horno de hostelería..."
                    value={nuevaDescripcion}
                    onChange={(e) => setNuevaDescripcion(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Foto del Trabajo
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="w-full sm:w-auto cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-semibold text-white transition-all shadow-md">
                      <span>📷 Seleccionar Foto de la Galería o Cámara</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSeleccionarFoto}
                        className="hidden"
                      />
                    </label>

                    <span className="text-xs text-slate-400">o pega enlace web de la foto:</span>
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/foto.jpg"
                      value={imagenPreview && !imagenPreview.startsWith('data:') ? imagenPreview : ''}
                      onChange={(e) => setImagenPreview(e.target.value)}
                      className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {imagenPreview && (
                    <div className="mt-4 relative inline-block rounded-xl overflow-hidden border border-slate-700 max-h-48 shadow-lg">
                      <img src={imagenPreview} alt="Vista previa" className="max-h-48 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setImagenPreview('')}
                        className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow"
                      >
                        Quitar foto ✕
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={guardandoTrabajo}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 text-sm"
                  >
                    <span>{guardandoTrabajo ? 'Publicando...' : '✓ Publicar Trabajo en la Web Oficial'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* LISTA DE TRABAJOS PUBLICADOS */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center justify-between">
                <span>Trabajos Publicados ({trabajos.length})</span>
                <span className="text-xs text-slate-400 font-normal">Sincronizados en directo con la página</span>
              </h3>

              {trabajos.length === 0 ? (
                <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/60 p-6">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-slate-300 font-semibold">No has publicado ningún trabajo todavía</p>
                  <p className="text-xs text-slate-400 mt-1">Usa el formulario de arriba para añadir tu primera instalación real con foto y comentario.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trabajos.map((trabajo) => (
                    <div 
                      key={trabajo.id} 
                      className="bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg flex flex-col justify-between"
                    >
                      <div className="relative h-44 bg-slate-950 overflow-hidden">
                        <img 
                          src={trabajo.imagen_url || '/hero-bg.jpeg'} 
                          alt={trabajo.titulo} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/hero-bg.jpeg'; }}
                        />
                        <div className="absolute top-2 right-2">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-amber-300 border border-amber-400/30">
                            {trabajo.categoria}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="font-bold text-white text-base mb-1">{trabajo.titulo}</h4>
                          <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                            {trabajo.descripcion || 'Sin comentarios adicionales.'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                          <span className="text-slate-400">📍 {trabajo.ubicacion || 'Gran Canaria'}</span>
                          <button
                            onClick={() => handleEliminarTrabajo(trabajo.id)}
                            className="text-rose-400 hover:text-rose-300 font-semibold hover:underline"
                          >
                            Eliminar 🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: RESEÑAS Y OPINIONES REALES ENVIADAS POR CLIENTES              */}
        {/* ========================================================================= */}
        {tabActiva === 'resenas' && (
          <section className="space-y-6">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⭐ Opiniones Reales de Clientes</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Reseñas enviadas directamente por clientes desde el formulario de la web oficial.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 self-start sm:self-auto">
                Total: {resenas.length}
              </span>
            </div>

            {resenas.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-700/60 p-8">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="text-lg font-bold text-white mb-1">Aún no hay opiniones registradas</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  Los clientes pueden dejar sus opiniones reales desde la web pública con puntuación y comentarios.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resenas.map((resena, idx) => (
                  <div key={idx} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-700/80 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        👤 {resena.nombre}
                      </h4>
                      <div className="text-amber-400 text-sm tracking-wider font-bold">
                        {'★'.repeat(resena.calificacion || 5)}
                        {'☆'.repeat(5 - (resena.calificacion || 5))}
                      </div>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                      "{resena.comentario}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                      <span>📍 {resena.ciudad || 'Canarias'}</span>
                      {resena.creado_en && (
                        <span>{new Date(resena.creado_en).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}