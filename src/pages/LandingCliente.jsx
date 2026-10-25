import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  obtenerTrabajos, 
  obtenerResenas, 
  guardarResena, 
  registrarLlamadaLead, 
  subscribeToSync 
} from '../services/dataService';

// =========================================================================
// CONFIGURACIÓN DE CONTACTO DIRECTO & TELÉFONO PERSONAL (MADRE / ASISTENTE)
// =========================================================================
const TELEFONO_MADRE_LLAMADAS = "+34623344780";
const TELEFONO_MADRE_FORMATO = "+34 623 34 47 80";
const EMAIL_CONTACTO = "meliannestor6@gmail.com";

export default function LandingCliente() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');

  // Datos dinámicos conectados al Panel
  const [trabajos, setTrabajos] = useState([]);
  const [resenas, setResenas] = useState([]);

  // Modal para solicitar llamada urgente con la IA / Panel
  const [modalLlamadaAbierto, setModalLlamadaAbierto] = useState(false);
  const [leadNombre, setLeadNombre] = useState('');
  const [leadTelefono, setLeadTelefono] = useState('');
  const [leadProblema, setLeadProblema] = useState('');
  const [enviandoLead, setEnviandoLead] = useState(false);
  const [leadEnviadoExito, setLeadEnviadoExito] = useState(false);

  // Formulario interactivo para que los clientes dejen su reseña real
  const [mostrarFormResena, setMostrarFormResena] = useState(false);
  const [resenaNombre, setResenaNombre] = useState('');
  const [resenaCalificacion, setResenaCalificacion] = useState(5);
  const [resenaComentario, setResenaComentario] = useState('');
  const [resenaCiudad, setResenaCiudad] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [resenaEnviadaExito, setResenaEnviadaExito] = useState(false);

  // Transición suave de la pantalla de bienvenida (Splash Screen)
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 2200);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // Carga de trabajos y reseñas reales desde el servicio conectado al Panel
  useEffect(() => {
    const cargarDatos = async () => {
      const trabajosData = await obtenerTrabajos();
      setTrabajos(trabajosData);

      const resenasData = await obtenerResenas();
      setResenas(resenasData);
    };

    cargarDatos();

    // Sincronización en tiempo real
    const unsubscribe = subscribeToSync((data) => {
      if (data.type === 'NUEVO_TRABAJO') {
        setTrabajos((prev) => [data.payload, ...prev]);
      } else if (data.type === 'ELIMINAR_TRABAJO') {
        setTrabajos((prev) => prev.filter((t) => t.id !== data.payload));
      } else if (data.type === 'NUEVA_RESENA') {
        setResenas((prev) => [data.payload, ...prev]);
      }
    });

    return () => unsubscribe();
  }, []);

  const dismissSplash = () => {
    setSplashFading(true);
    setTimeout(() => setShowSplash(false), 600);
  };

  // Enviar llamada urgente al panel del administrador
  const handleSolicitarLlamada = async (e) => {
    e.preventDefault();
    if (!leadTelefono.trim()) {
      alert('Por favor, indica tu número de teléfono.');
      return;
    }

    setEnviandoLead(true);
    const res = await registrarLlamadaLead({
      nombre: leadNombre,
      telefono: leadTelefono,
      problema: leadProblema,
      urgencia: 'Urgente / Alta'
    });

    setEnviandoLead(false);
    if (res.success) {
      setLeadEnviadoExito(true);
      setTimeout(() => {
        setLeadEnviadoExito(false);
        setModalLlamadaAbierto(false);
        setLeadNombre('');
        setLeadTelefono('');
        setLeadProblema('');
      }, 3500);
    }
  };

  // Enviar opinión real de cliente
  const handleEnviarResena = async (e) => {
    e.preventDefault();
    if (!resenaNombre.trim() || !resenaComentario.trim()) {
      alert('Por favor, rellena tu nombre y tu comentario.');
      return;
    }

    setEnviandoResena(true);
    const res = await guardarResena({
      nombre: resenaNombre,
      calificacion: resenaCalificacion,
      comentario: resenaComentario,
      ciudad: resenaCiudad || 'Gran Canaria'
    });

    setEnviandoResena(false);
    if (res.success) {
      setResenaEnviadaExito(true);
      setResenas((prev) => [res.resena, ...prev]);
      setTimeout(() => {
        setResenaEnviadaExito(false);
        setMostrarFormResena(false);
        setResenaNombre('');
        setResenaComentario('');
        setResenaCiudad('');
        setResenaCalificacion(5);
      }, 3000);
    }
  };

  // Filtrado de trabajos dinámicos
  const trabajosFiltrados = trabajos.filter((t) => {
    if (activeTab === 'todos') return true;
    if (activeTab === 'clima') return (t.categoria || '').toLowerCase().includes('clima');
    if (activeTab === 'electricidad') return (t.categoria || '').toLowerCase().includes('electric') || (t.categoria || '').toLowerCase().includes('solar');
    if (activeTab === 'frio') return (t.categoria || '').toLowerCase().includes('refrig') || (t.categoria || '').toLowerCase().includes('frio');
    if (activeTab === 'hosteleria') return (t.categoria || '').toLowerCase().includes('hostel') || (t.categoria || '').toLowerCase().includes('cocina');
    return true;
  });

  return (
    <div className="relative min-h-screen text-slate-100 overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ========================================================================= */}
      {/* 1. INTRO SPLASH SCREEN CINEMATOGRÁFICO                                   */}
      {/* ========================================================================= */}
      {showSplash && (
        <div 
          onClick={dismissSplash}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050b14] cursor-pointer transition-all duration-1000 ease-out px-4 ${
            splashFading 
              ? 'opacity-0 scale-105 pointer-events-none filter blur-sm' 
              : 'opacity-100 scale-100'
          }`}
          style={{ willChange: 'opacity, transform, filter' }}
        >
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-cyan-500/15 blur-3xl -top-12 -left-12 pointer-events-none animate-pulse"></div>
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-amber-500/15 blur-3xl -bottom-12 -right-12 pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="relative flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-cyan-500 via-sky-400 to-amber-500 blur-xl opacity-60 animate-aura-pulse"></div>
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl p-1 bg-gradient-to-tr from-cyan-400/40 via-white/10 to-amber-400/40 backdrop-blur-md shadow-2xl flex items-center justify-center border border-white/20">
                <img 
                  src="/hero-bg.jpeg" 
                  alt="NM Electroclima" 
                  className="w-full h-full object-contain rounded-xl p-1 shadow-inner"
                  onError={(e) => {
                    e.currentTarget.src = "/WhatsApp%20Image%202026-10-25%20at%2019.59.19.jpeg";
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-wider text-white">
                NM <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]">ELECTROCLIMA</span>
              </h1>
              <p className="text-sm sm:text-base font-medium tracking-widest text-cyan-300/90 uppercase pt-1">
                Néstor Melián
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mt-3 max-w-xs sm:max-w-md font-light tracking-wide">
              Sistemas Eléctricos · Paneles Solares · Hostelería · Climatización
            </p>

            <div className="w-48 sm:w-64 h-1 bg-slate-800/80 rounded-full mt-8 overflow-hidden relative border border-white/10">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 rounded-full animate-[shimmerText_2s_ease-in-out_infinite] w-full"></div>
            </div>

            <span className="text-[11px] text-slate-500 mt-4 tracking-wider uppercase font-medium">
              Pulsa para entrar directo
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FONDO "VIVO" Y FIJO (LOGO CON MÁS PRESENCIA Y VITALIDAD)               */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none">
        {/* Imagen del Logo con mayor opacidad (45%) y animación suave */}
        <img 
          src="/hero-bg.jpeg" 
          alt="Fondo NM Electroclima" 
          className="w-full h-full object-cover object-center animate-ambient-breathe opacity-45 scale-100"
          onError={(e) => {
            e.currentTarget.src = "/WhatsApp%20Image%202026-10-25%20at%2019.59.19.jpeg";
          }}
        />
        
        {/* Gradiente equilibrado para resaltar el logo sin perder contraste de texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/78 via-[#071322]/70 to-[#040810]/85 backdrop-blur-[0.5px]"></div>
        
        {/* Luces volumétricas en esquinas */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[110px] animate-aura-pulse"></div>
        <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] bg-amber-500/15 rounded-full blur-[130px] animate-aura-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE NAVEGACIÓN SUPERIOR (Sticky & Glassmorphism)                  */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#060e1a]/75 border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-0.5 bg-gradient-to-tr from-cyan-400 via-sky-300 to-amber-400 shadow-md group-hover:scale-105 transition-transform duration-300">
              <img 
                src="/hero-bg.jpeg" 
                alt="Logo" 
                className="w-full h-full object-contain rounded-[10px] bg-[#071220]" 
                onError={(e) => {
                  e.currentTarget.src = "/WhatsApp%20Image%202026-10-25%20at%2019.59.19.jpeg";
                }}
              />
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                <span>NM</span>
                <span className="text-amber-400">ELECTROCLIMA</span>
              </div>
              <p className="text-[10px] sm:text-xs text-cyan-400 font-medium tracking-wider uppercase">
                Electricidad · Hostelería · Clima
              </p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#servicios" className="hover:text-cyan-400 transition-colors">Servicios</a>
            <a href="#proyectos" className="hover:text-cyan-400 transition-colors">Trabajos Recientes</a>
            <a href="#opiniones" className="hover:text-cyan-400 transition-colors">Opiniones Reales</a>
            <a href="#contacto" className="hover:text-cyan-400 transition-colors">Contacto</a>
            <Link to="/admin" className="text-xs text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-400/40 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
              <span>🔒 Panel Admin</span>
            </Link>
          </nav>

          {/* Botones de Urgencia */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalLlamadaAbierto(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Aviso IA</span>
            </button>

            <a 
              href={`tel:${TELEFONO_MADRE_LLAMADAS}`}
              className="relative group overflow-hidden rounded-full p-[1px] font-semibold text-xs sm:text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 rounded-full animate-shimmer"></span>
              <span className="relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#081324] group-hover:bg-opacity-80 transition-all text-white font-bold">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Llamar {TELEFONO_MADRE_FORMATO}</span>
              </span>
            </a>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* MODAL PARA SOLICITAR LLAMADA CON IA / REGISTRO AL PANEL                   */}
      {/* ========================================================================= */}
      {modalLlamadaAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0b1626] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={() => setModalLlamadaAbierto(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold p-2"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold">
                ⚡
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Solicitud de Asistencia Inmediata</h3>
                <p className="text-xs text-cyan-400">Atención conectada con la Asistente IA y el Panel</p>
              </div>
            </div>

            {leadEnviadoExito ? (
              <div className="py-8 text-center space-y-3">
                <div className="text-4xl text-emerald-400">✓</div>
                <h4 className="text-lg font-bold text-white">¡Aviso Recibido en el Panel!</h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
                  Tu llamada ha entrado al panel de control de urgencias. La asistente o nuestro equipo técnico te devolverán la llamada en breves instantes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSolicitarLlamada} className="space-y-4">
                <p className="text-xs text-slate-300">
                  Déjanos tu teléfono y problema. El aviso se transmitirá instantáneamente al panel de administración para priorizar tu urgencia.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tu Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carlos Santana"
                    value={leadNombre}
                    onChange={(e) => setLeadNombre(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono de Contacto *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej: +34 600 00 00 00"
                    value={leadTelefono}
                    onChange={(e) => setLeadTelefono(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">¿Qué avería o necesidad tienes?</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: El horno del restaurante no enciende / Aire acondicionado gotea / Cuadro eléctrico sin luz..."
                    value={leadProblema}
                    onChange={(e) => setLeadProblema(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={enviandoLead}
                    className="flex-1 py-3 px-6 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 hover:to-sky-200 transition-all text-sm shadow-lg shadow-cyan-500/20"
                  >
                    {enviandoLead ? 'Enviando aviso...' : 'Enviar Aviso al Panel de Urgencias'}
                  </button>
                  <a
                    href={`tel:${TELEFONO_MADRE_LLAMADAS}`}
                    className="py-3 px-5 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 text-center text-sm transition-all"
                  >
                    Llamar {TELEFONO_MADRE_FORMATO}
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HERO SECTION                                                          */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Servicio Técnico Autorizado · Respuesta Inmediata
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Climatización, Electricidad, Solar y <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400">
                Maquinaria de Hostelería
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Soluciones técnicas de alto rendimiento en Gran Canaria. Desde energía solar fotovoltaica y climatización de bajo consumo hasta mantenimiento de maquinaria hostelera y cámaras frigoríficas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button 
                onClick={() => setModalLlamadaAbierto(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 hover:from-cyan-300 hover:to-sky-200 transition-all shadow-xl shadow-cyan-500/20 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Solicitar Asistencia Inmediata</span>
              </button>

              <a 
                href={`tel:${TELEFONO_MADRE_LLAMADAS}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all backdrop-blur-md active:scale-95"
              >
                <span>Llamar {TELEFONO_MADRE_FORMATO}</span>
              </a>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-3 text-center sm:text-left border-t border-white/10 max-w-xl mx-auto lg:mx-0">
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-slate-400">Garantía Certificada</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-amber-400">24/7</p>
                <p className="text-xs text-slate-400">Atención Urgente</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-cyan-400">+10 Años</p>
                <p className="text-xs text-slate-400">Experiencia Técnica</p>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-sky-400/20 to-amber-500/20 rounded-3xl blur-2xl transform rotate-1 scale-105"></div>
              
              <div className="relative rounded-3xl p-6 sm:p-8 glass-panel border border-white/15 overflow-hidden">
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                      ⚡
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Servicio Oficial</h2>
                      <p className="text-xs text-cyan-400 font-medium">Instalador Homologado</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Operativo Hoy
                  </span>
                </div>

                <div className="py-6 flex flex-col items-center justify-center">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-center justify-center">
                    <img 
                      src="/hero-bg.jpeg" 
                      alt="NM Electroclima Branding" 
                      className="w-full h-full object-contain filter drop-shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "/WhatsApp%20Image%202026-10-25%20at%2019.59.19.jpeg";
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Paneles Solares & Electricidad
                    </span>
                    <span className="text-slate-400 font-mono">Autoconsumo</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Hostelería & Cocinas
                    </span>
                    <span className="text-slate-400 font-mono">Maquinaria</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      Climatización & Frío
                    </span>
                    <span className="text-slate-400 font-mono">Inverter / VRV</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SERVICIOS PRINCIPALES (Con Paneles Solares y Hostelería)               */}
      {/* ========================================================================= */}
      <section id="servicios" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs sm:text-sm font-bold tracking-widest text-cyan-400 uppercase">Especialidades Técnicas</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Nuestros Servicios Principales
          </h2>
          <p className="text-slate-400 mt-3 text-sm sm:text-base">
            Equipos de primera calidad, diagnosis avanzada y repuestos originales para el máximo rendimiento energético.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tarjeta 1: Climatización */}
          <div className="group rounded-2xl p-7 glass-panel-glow hover:border-cyan-400/50 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              ❄️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Climatización Integral</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Instalación, mantenimiento y reparación de aire acondicionado tipo Split, conductos, cassette y sistemas multi-split de máxima eficiencia A+++ para hogares y empresas.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 border-t border-white/10 pt-4">
              <li className="flex items-center gap-2">✓ Cargas de gas refrigerante ecológico (R32 / R410A)</li>
              <li className="flex items-center gap-2">✓ Limpieza y desinfección antibacteriana de conductos</li>
              <li className="flex items-center gap-2">✓ Diagnóstico electrónico de averías y sustitución de placas</li>
            </ul>
          </div>

          {/* Tarjeta 2: Sistemas Eléctricos & Paneles Solares */}
          <div className="group rounded-2xl p-7 glass-panel-orange hover:border-amber-400/50 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sistemas Eléctricos & Energía Solar</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Montaje de cuadros eléctricos, cableados, boletines oficiales y <strong className="text-amber-300 font-semibold">proyectos integrales de paneles solares fotovoltaicos</strong> para autoconsumo, maximizando el ahorro en tu factura eléctrica.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 border-t border-white/10 pt-4">
              <li className="flex items-center gap-2">✓ <strong className="text-slate-200">Instalación y legalización de paneles solares</strong> fotovoltaicos</li>
              <li className="flex items-center gap-2">✓ Inversores solares híbridos, baterías y balance de potencia</li>
              <li className="flex items-center gap-2">✓ Cuadros de protección, diferenciales superinmunizados y boletines</li>
            </ul>
          </div>

          {/* Tarjeta 3: Refrigeración Industrial */}
          <div className="group rounded-2xl p-7 glass-panel hover:border-sky-400/50 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              🧊
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Refrigeración Industrial & Comercial</h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Montaje y conservación de cámaras frigoríficas de media y baja temperatura para hostelería, supermercados e industrias alimentarias con servicio de guardia técnica.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 border-t border-white/10 pt-4">
              <li className="flex items-center gap-2">✓ Cámaras de frío positivo (conservación) y negativo (congelación)</li>
              <li className="flex items-center gap-2">✓ Centrales de frío, compresores y sustitución de evaporadores</li>
              <li className="flex items-center gap-2">✓ Control de temperatura digital y termostatos programables</li>
            </ul>
          </div>

          {/* Tarjeta 4: MANTENIMIENTO DE HOSTELERÍA & MAQUINARIA DE COCINA */}
          <div className="group rounded-2xl p-7 glass-panel-glow border-emerald-500/30 hover:border-emerald-400/60 transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
              🍽️
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-white">Mantenimiento de Hostelería</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Cocina & Frío
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              Servicio técnico prioritario para restaurantes, cafeterías, obradores y hoteles. Cuidamos cada eslabón térmico y mecánico para que el servicio de tu cocina opere con máxima fluidez y cero interrupciones.
            </p>
            <ul className="text-xs text-slate-400 space-y-2 border-t border-white/10 pt-4">
              <li className="flex items-center gap-2">✓ <strong className="text-slate-200">Reparación de hornos eléctricos</strong>, resistencias y convección</li>
              <li className="flex items-center gap-2">✓ <strong className="text-slate-200">Máquinas de hielo y neveras</strong>: sondas, termostatos y compresores</li>
              <li className="flex items-center gap-2">✓ <strong className="text-slate-200">Lavavajillas industriales</strong> (dosificadores y bombas) y <strong className="text-slate-200">tostadoras</strong></li>
              <li className="flex items-center gap-2">✓ <strong className="text-slate-200">Freidoras de alta producción</strong> y termostatos de seguridad</li>
              <li className="flex items-center gap-2">✓ <strong className="text-slate-200">Cocina (todo sobre cocina)</strong> y puesta a punto con <strong className="text-slate-200">limpieza técnica de cocina</strong></li>
            </ul>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRABAJOS RECIENTES (Conectado dinámicamente con el Panel Admin)        */}
      {/* ========================================================================= */}
      <section id="proyectos" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-white/10 pb-6 gap-4">
          <div>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-cyan-400 uppercase">Portafolio Real</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Trabajos Recientes</h2>
            <p className="text-slate-400 text-sm mt-1">
              Instalaciones reales ejecutadas y publicadas directamente por nuestro equipo.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            {['todos', 'clima', 'electricidad', 'frio', 'hosteleria'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab === 'todos' ? 'Todos' : tab === 'clima' ? 'Climatización' : tab === 'electricidad' ? 'Electricidad / Solar' : tab === 'frio' ? 'Refrigeración' : 'Hostelería'}
              </button>
            ))}
          </div>
        </div>

        {/* Estado Dinámico */}
        {trabajosFiltrados.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 sm:p-16 text-center max-w-2xl mx-auto border border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl">
              📷
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Próximamente: Galería de Trabajos</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Estamos actualizando nuestras últimas instalaciones de climatización, cuadros eléctricos, paneles solares y maquinaria hostelera en Gran Canaria.
            </p>
            <button
              onClick={() => setModalLlamadaAbierto(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:from-cyan-300 text-xs sm:text-sm shadow-lg transition-all"
            >
              <span>Consultar Presupuesto para tu Instalación</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trabajosFiltrados.map((trabajo) => (
              <div 
                key={trabajo.id}
                className="group rounded-2xl overflow-hidden glass-panel border border-white/10 hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="h-56 bg-slate-950 relative overflow-hidden">
                  <img 
                    src={trabajo.imagen_url || '/hero-bg.jpeg'} 
                    alt={trabajo.titulo} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = '/hero-bg.jpeg'; }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                      {trabajo.categoria}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                      {trabajo.titulo}
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                      {trabajo.descripcion || 'Instalación profesional certificada.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
                    <span>📍 {trabajo.ubicacion || 'Gran Canaria'}</span>
                    <span className="text-cyan-400 font-semibold">Realizado ✓</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. OPINIONES DE CLIENTES REALES                                          */}
      {/* ========================================================================= */}
      <section id="opiniones" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-white/10 pb-6 gap-4">
          <div>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase">Opiniones Reales</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              Valoraciones de Clientes
            </h2>
            <p className="text-slate-400 text-sm mt-1">Experiencias y comentarios directos de quienes han confiado en nosotros.</p>
          </div>

          <button
            onClick={() => setMostrarFormResena(!mostrarFormResena)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-md hover:from-amber-300 transition-all self-start sm:self-auto"
          >
            <span>✍️ {mostrarFormResena ? 'Cerrar Formulario' : 'Dejar mi Opinión'}</span>
          </button>
        </div>

        {/* Formulario de Reseña */}
        {mostrarFormResena && (
          <div className="mb-12 glass-panel p-6 sm:p-8 rounded-3xl border border-amber-400/30 shadow-2xl max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">Comparte tu experiencia con NM Electroclima</h3>
            <p className="text-xs text-slate-400 mb-6">Tu reseña aparecerá directamente publicada aquí en la página oficial.</p>

            {resenaEnviadaExito ? (
              <div className="p-6 text-center text-emerald-400 font-bold bg-emerald-500/10 rounded-2xl border border-emerald-500/30">
                ✓ ¡Muchas gracias! Tu opinión se ha publicado exitosamente.
              </div>
            ) : (
              <form onSubmit={handleEnviarResena} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tu Nombre o Empresa *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Laura Ramírez (Cafetería Puerto)"
                      value={resenaNombre}
                      onChange={(e) => setResenaNombre(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Localidad o Zona</label>
                    <input
                      type="text"
                      placeholder="Ej: Telde, Las Palmas, Arucas..."
                      value={resenaCiudad}
                      onChange={(e) => setResenaCiudad(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Puntuación</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((estrella) => (
                      <button
                        type="button"
                        key={estrella}
                        onClick={() => setResenaCalificacion(estrella)}
                        className={`text-2xl transition-transform hover:scale-125 ${
                          estrella <= resenaCalificacion ? 'text-amber-400' : 'text-slate-600'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs text-amber-300 font-bold ml-2">({resenaCalificacion} de 5 estrellas)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tu Comentario *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Cuéntanos qué trabajo te realizamos (aire, cuadro, paneles solares, horno, etc.) y qué tal fue el servicio..."
                    value={resenaComentario}
                    onChange={(e) => setResenaComentario(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={enviandoResena}
                    className="px-7 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 text-sm shadow-lg shadow-amber-500/20"
                  >
                    {enviandoResena ? 'Publicando...' : 'Publicar mi Opinión'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Listado de Reseñas */}
        {resenas.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto border border-white/10">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-lg font-bold text-white mb-2">Aún no hay opiniones publicadas</h3>
            <p className="text-sm text-slate-300 mb-6">
              ¿Has contado con nosotros para tu climatización, cuadro, paneles solares o maquinaria de cocina? Sé el primero en compartir tu experiencia.
            </p>
            <button
              onClick={() => setMostrarFormResena(true)}
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md transition-all"
            >
              Escribir Primera Reseña
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resenas.map((resena, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 text-base mb-3 tracking-wider">
                    {'★'.repeat(resena.calificacion || 5)}
                    {'☆'.repeat(5 - (resena.calificacion || 5))}
                  </div>
                  <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                    "{resena.comentario}"
                  </p>
                </div>

                <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 flex items-center justify-center font-bold text-cyan-400 text-xs">
                    {(resena.nombre || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{resena.nombre}</p>
                    <p className="text-xs text-slate-400">{resena.ciudad || 'Cliente Verificado'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER PROFESIONAL (Con Teléfono Directo y Correo Oficial)            */}
      {/* ========================================================================= */}
      <footer id="contacto" className="border-t border-white/10 bg-[#040912]/80 backdrop-blur-md pt-16 pb-24 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
            
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl p-0.5 bg-gradient-to-tr from-cyan-400 to-amber-400">
                  <img src="/hero-bg.jpeg" alt="Logo" className="w-full h-full object-contain rounded-[10px] bg-[#071220]" />
                </div>
                <span className="text-xl font-extrabold text-white">
                  NM <span className="text-amber-400">ELECTROCLIMA</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm max-w-sm">
                Especialistas en sistemas eléctricos, energía solar fotovoltaica, refrigeración industrial, climatización y mantenimiento integral de hostelería.
              </p>
              
              {/* Correo y Web */}
              <div className="space-y-1.5 pt-1">
                <a 
                  href={`mailto:${EMAIL_CONTACTO}`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-2 transition-colors"
                >
                  <span>✉</span>
                  <span className="underline">{EMAIL_CONTACTO}</span>
                </a>
                <p className="text-xs text-slate-400 font-mono">
                  🌐 www.nmelectroclima.es
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Servicios</h4>
              <ul className="text-xs text-slate-400 space-y-2.5">
                <li>• Climatización Residencial & Inverter</li>
                <li>• Sistemas Eléctricos & Paneles Solares</li>
                <li>• Mantenimiento de Hostelería & Cocinas</li>
                <li>• Cámaras de Frío & Refrigeración</li>
                <li>• Urgencias 24 Horas</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto Directo</h4>
              <div className="space-y-3">
                <a 
                  href={`tel:${TELEFONO_MADRE_LLAMADAS}`}
                  className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  📞 Llamar: {TELEFONO_MADRE_FORMATO}
                </a>
                <p className="text-xs text-slate-400">
                  Responsable Técnico: <strong>Néstor Melián</strong>
                </p>
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                  ● Atención Telefónica Activa
                </div>
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} NM Electroclima. Todos los derechos reservados.</p>
            <div className="flex items-center gap-4">
              <span>Sistemas de Alta Eficiencia</span>
              <Link to="/admin" className="text-slate-400 hover:text-cyan-400 transition-colors underline flex items-center gap-1">
                <span>🔒 Acceso Panel Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. BOTÓN FLOTANTE MÓVIL (Sticky Call Button)                             */}
      {/* ========================================================================= */}
      <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden flex gap-2">
        <button
          onClick={() => setModalLlamadaAbierto(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-cyan-300 font-bold text-xs backdrop-blur-md active:scale-95 transition-all shadow-xl"
        >
          <span>⚡ Aviso IA</span>
        </button>

        <a 
          href={`tel:${TELEFONO_MADRE_LLAMADAS}`}
          className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 text-slate-950 font-extrabold shadow-2xl shadow-cyan-500/40 active:scale-95 transition-all text-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
          <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>Llamar {TELEFONO_MADRE_FORMATO}</span>
        </a>
      </div>

    </div>
  );
}