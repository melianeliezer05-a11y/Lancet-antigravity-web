import './admin.css';
import Mark from '../components/Mark';
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
  const [nuevaUbicacion, setNuevaUbicacion] = useState('Andalucía');
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
      } catch {
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
      imagenUrl: imagenPreview,
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

  const fecha = (iso) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
  };

  if (!autenticado) {
    return (
      <div className="adm adm-login">
        <form className="adm-card login-card" onSubmit={handleLogin}>
          <Mark size={52} />
          <h1>Acceso interno</h1>
          <p className="adm-sub">Avisos, trabajos y opiniones de NM Electroclima.</p>
          <label>
            <span>Clave de acceso</span>
            <div className="pw">
              <input
                type={mostrarPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoComplete="current-password"
                aria-invalid={Boolean(errorPassword)}
                aria-describedby={errorPassword ? 'err-pw' : undefined}
                required
              />
              <button type="button" className="pw-toggle" onClick={() => setMostrarPassword((v) => !v)} aria-pressed={mostrarPassword}>
                {mostrarPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </label>
          {errorPassword && <p id="err-pw" role="alert" className="adm-err">{errorPassword}</p>}
          <button type="submit" className="adm-btn adm-btn-solid">Entrar</button>
          <Link to="/" className="adm-link">Volver a la web</Link>
        </form>
      </div>
    );
  }

  const TABS = [
    { id: 'llamadas', label: 'Avisos', n: clientes.length },
    { id: 'trabajos', label: 'Trabajos', n: trabajos.length },
    { id: 'resenas', label: 'Opiniones', n: resenas.length },
  ];

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-wrap adm-top-in">
          <div className="adm-brand">
            <Mark size={40} />
            <div>
              <h1>Panel · NM Electroclima</h1>
              <p>Avisos, trabajos y opiniones</p>
            </div>
          </div>
          <div className="adm-actions">
            <Link to="/" target="_blank" rel="noopener" className="adm-btn">Ver web</Link>
            <button type="button" className="adm-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="adm-wrap adm-main">
        <div className="adm-tabs" role="tablist" aria-label="Secciones del panel">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tabActiva === t.id}
              aria-controls={`panel-${t.id}`}
              className={`adm-tab ${tabActiva === t.id ? 'on' : ''}`}
              onClick={() => setTabActiva(t.id)}
            >
              {t.label} <span className="count">{t.n}</span>
            </button>
          ))}
        </div>

        {tabActiva === 'llamadas' && (
          <section role="tabpanel" id="panel-llamadas" aria-labelledby="tab-llamadas">
            {clientes.length === 0 ? (
              <p className="adm-empty">Aún no hay avisos. Cuando alguien rellene el formulario de la web, aparecerá aquí al instante.</p>
            ) : (
              <ul className="adm-list">
                {clientes.map((c) => (
                  <li key={c.id} className="adm-card lead">
                    <div className="lead-main">
                      <p className="lead-name">{c.nombre || 'Cliente web'}</p>
                      <a className="lead-tel" href={`tel:${c.telefono}`}>{c.telefono}</a>
                      <p className="lead-txt">{c.problema}</p>
                    </div>
                    <div className="lead-meta">
                      <span className="badge">{c.urgencia || 'Normal'}</span>
                      <time dateTime={c.creado_en}>{fecha(c.creado_en)}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tabActiva === 'trabajos' && (
          <section role="tabpanel" id="panel-trabajos" aria-labelledby="tab-trabajos" className="adm-split">
            <form className="adm-card adm-form" onSubmit={handlePublicarTrabajo}>
              <h2>Publicar un trabajo</h2>
              <label>
                <span>Título</span>
                <input value={nuevoTitulo} onChange={(e) => setNuevoTitulo(e.target.value)} placeholder="Ej.: Cámara de frío en restaurante" required />
              </label>
              <div className="adm-grid2">
                <label>
                  <span>Categoría</span>
                  <select value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)}>
                    <option>Climatización</option>
                    <option>Electricidad</option>
                    <option>Energía solar</option>
                    <option>Refrigeración</option>
                    <option>Hostelería y cocinas</option>
                  </select>
                </label>
                <label>
                  <span>Ubicación</span>
                  <input value={nuevaUbicacion} onChange={(e) => setNuevaUbicacion(e.target.value)} />
                </label>
              </div>
              <label>
                <span>Descripción</span>
                <textarea rows="3" value={nuevaDescripcion} onChange={(e) => setNuevaDescripcion(e.target.value)} placeholder="Qué se hizo, en una o dos frases." />
              </label>
              <label>
                <span>Foto (cámara o galería)</span>
                <input type="file" accept="image/*" onChange={handleSeleccionarFoto} />
              </label>
              {imagenPreview && <img className="preview" src={imagenPreview} alt="Vista previa de la foto seleccionada" />}
              <button type="submit" className="adm-btn adm-btn-solid" disabled={guardandoTrabajo}>
                {guardandoTrabajo ? 'Publicando…' : 'Publicar en la web'}
              </button>
              {mensajeExito && <p role="status" className="adm-ok">{mensajeExito}</p>}
            </form>

            <div>
              {trabajos.length === 0 ? (
                <p className="adm-empty">Todavía no hay trabajos publicados.</p>
              ) : (
                <ul className="adm-list">
                  {trabajos.map((t) => (
                    <li key={t.id} className="adm-card job">
                      {t.imagen_url && <img src={t.imagen_url} alt="" loading="lazy" />}
                      <div>
                        <p className="job-cat">{t.categoria}</p>
                        <p className="job-title">{t.titulo}</p>
                        <p className="job-loc">{t.ubicacion}</p>
                      </div>
                      <button type="button" className="adm-btn adm-btn-danger" onClick={() => handleEliminarTrabajo(t.id)} aria-label={`Eliminar ${t.titulo}`}>
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tabActiva === 'resenas' && (
          <section role="tabpanel" id="panel-resenas" aria-labelledby="tab-resenas">
            {resenas.length === 0 ? (
              <p className="adm-empty">Todavía no hay opiniones publicadas.</p>
            ) : (
              <ul className="adm-list">
                {resenas.map((r) => (
                  <li key={r.id} className="adm-card">
                    <p className="lead-name">{r.nombre}{r.ciudad ? ` · ${r.ciudad}` : ''}</p>
                    <p className="stars-txt" aria-label={`${r.calificacion} de 5`}>{'★'.repeat(Number(r.calificacion) || 0)}{'☆'.repeat(5 - (Number(r.calificacion) || 0))}</p>
                    <p className="lead-txt">{r.comentario}</p>
                    <time className="adm-time" dateTime={r.creado_en}>{fecha(r.creado_en)}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
