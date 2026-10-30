import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  obtenerTrabajos,
  obtenerResenas,
  guardarResena,
  registrarLlamadaLead,
  subscribeToSync,
} from '../services/dataService';
import Mark from '../components/Mark';
import { IllSplit, IllCuadro, IllSolar, IllFrio, HeroSchematic } from '../components/Illustrations';

const TELEFONO_LLAMADAS = '+34623344780';
const TELEFONO_FORMATO = '623 34 47 80';
const EMAIL_CONTACTO = 'meliannestor6@gmail.com';

const SERVICIOS = [
  {
    id: 'S-01',
    titulo: 'Climatización',
    texto: 'Instalamos, mantenemos y reparamos aire acondicionado: split, conductos, cassette y multi-split. Para viviendas, locales y empresas.',
    tags: ['Split', 'Conductos', 'Cassette', 'Multi-split'],
    Ill: IllSplit,
  },
  {
    id: 'S-02',
    titulo: 'Sistemas eléctricos',
    texto: 'Instalaciones eléctricas y cuadros bien montados y bien etiquetados. Que la luz llegue donde tiene que llegar y sin sustos.',
    tags: ['Cuadros eléctricos', 'Instalación', 'Reformas', 'Averías'],
    Ill: IllCuadro,
  },
  {
    id: 'S-03',
    titulo: 'Energía solar',
    texto: 'Paneles solares fotovoltaicos para casa y negocio: estudio, instalación y puesta en marcha para que la factura de la luz baje.',
    tags: ['Paneles solares', 'Inversores', 'Autoconsumo'],
    Ill: IllSolar,
  },
  {
    id: 'S-04',
    titulo: 'Refrigeración y hostelería',
    texto: 'Cámaras frigoríficas de media y baja temperatura y mantenimiento de maquinaria de cocina para restaurantes, cafeterías, obradores y hoteles. Si la cocina se para, se para el negocio: por eso vamos rápido.',
    tags: ['Cámaras frigoríficas', 'Maquinaria de cocina', 'Guardia técnica'],
    Ill: IllFrio,
  },
];

const PASOS = [
  { n: '01', t: 'Avisas', d: 'Llamas o dejas tu teléfono en la web. Cuéntanos qué falla, sin tecnicismos.' },
  { n: '02', t: 'Diagnóstico', d: 'Vemos la avería o la instalación y te explicamos qué hace falta y por qué.' },
  { n: '03', t: 'Presupuesto claro', d: 'Antes de empezar sabes qué se hace y cuánto cuesta. Sin sorpresas al final.' },
  { n: '04', t: 'Trabajo hecho', d: 'Instalamos o reparamos, lo probamos contigo delante y lo dejamos funcionando.' },
];

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'clima', label: 'Climatización' },
  { id: 'electricidad', label: 'Electricidad / Solar' },
  { id: 'frio', label: 'Refrigeración' },
  { id: 'hosteleria', label: 'Hostelería' },
];

function categoriaCoincide(categoria, filtro) {
  const c = (categoria || '').toLowerCase();
  if (filtro === 'todos') return true;
  if (filtro === 'clima') return c.includes('clima');
  if (filtro === 'electricidad') return c.includes('electric') || c.includes('solar');
  if (filtro === 'frio') return c.includes('refrig') || c.includes('frio') || c.includes('frío');
  if (filtro === 'hosteleria') return c.includes('hostel') || c.includes('cocina');
  return true;
}

function Estrellas({ valor }) {
  return (
    <span className="stars" role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" className={n <= valor ? 'on' : ''}>
          <path d="M10 1.8l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.8 4.8 17.7 6 11.9 1.6 7.9l5.9-.7z" />
        </svg>
      ))}
    </span>
  );
}

function IconoTel() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
    </svg>
  );
}

// Revela cada bloque al entrar en pantalla; sin IntersectionObserver todo queda visible.
function useReveal(dependencias) {
  useEffect(() => {
    const nodos = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      nodos.forEach((n) => n.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    );
    nodos.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);
}

export default function LandingCliente() {
  const [trabajos, setTrabajos] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [menuAbierto, setMenuAbierto] = useState(false);

  const [leadNombre, setLeadNombre] = useState('');
  const [leadTelefono, setLeadTelefono] = useState('');
  const [leadProblema, setLeadProblema] = useState('');
  const [enviandoLead, setEnviandoLead] = useState(false);
  const [leadEstado, setLeadEstado] = useState({ tipo: '', texto: '' });

  const [formResenaAbierto, setFormResenaAbierto] = useState(false);
  const [resenaNombre, setResenaNombre] = useState('');
  const [resenaCiudad, setResenaCiudad] = useState('');
  const [resenaCalificacion, setResenaCalificacion] = useState(5);
  const [resenaComentario, setResenaComentario] = useState('');
  const [enviandoResena, setEnviandoResena] = useState(false);
  const [resenaEstado, setResenaEstado] = useState({ tipo: '', texto: '' });

  const telefonoRef = useRef(null);

  useReveal([trabajos.length, resenas.length, filtro, formResenaAbierto]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [t, r] = await Promise.all([obtenerTrabajos(), obtenerResenas()]);
      if (!vivo) return;
      setTrabajos(t);
      setResenas(r);
    })();
    const baja = subscribeToSync((msg) => {
      if (msg.type === 'NUEVO_TRABAJO') setTrabajos((p) => [msg.payload, ...p]);
      else if (msg.type === 'ELIMINAR_TRABAJO') setTrabajos((p) => p.filter((x) => x.id !== msg.payload));
      else if (msg.type === 'NUEVA_RESENA') setResenas((p) => [msg.payload, ...p]);
    });
    return () => {
      vivo = false;
      baja();
    };
  }, []);

  const trabajosFiltrados = useMemo(
    () => trabajos.filter((t) => categoriaCoincide(t.categoria, filtro)),
    [trabajos, filtro],
  );

  const media = useMemo(() => {
    if (!resenas.length) return null;
    const suma = resenas.reduce((a, r) => a + (Number(r.calificacion) || 0), 0);
    return (suma / resenas.length).toFixed(1).replace('.', ',');
  }, [resenas]);

  async function enviarLead(e) {
    e.preventDefault();
    if (!leadTelefono.trim()) {
      setLeadEstado({ tipo: 'error', texto: 'Escribe tu teléfono para poder devolverte la llamada.' });
      telefonoRef.current?.focus();
      return;
    }
    setEnviandoLead(true);
    setLeadEstado({ tipo: '', texto: '' });
    const res = await registrarLlamadaLead({
      nombre: leadNombre,
      telefono: leadTelefono,
      problema: leadProblema,
      urgencia: 'Urgente / Alta',
    });
    setEnviandoLead(false);
    if (res.success) {
      setLeadEstado({ tipo: 'ok', texto: 'Aviso recibido. Te devolvemos la llamada lo antes posible.' });
      setLeadNombre('');
      setLeadTelefono('');
      setLeadProblema('');
    } else {
      setLeadEstado({ tipo: 'error', texto: `No se pudo enviar. Llámanos al ${TELEFONO_FORMATO}.` });
    }
  }

  async function enviarResena(e) {
    e.preventDefault();
    if (!resenaNombre.trim() || !resenaComentario.trim()) {
      setResenaEstado({ tipo: 'error', texto: 'Falta tu nombre o tu comentario.' });
      return;
    }
    setEnviandoResena(true);
    setResenaEstado({ tipo: '', texto: '' });
    const res = await guardarResena({
      nombre: resenaNombre,
      calificacion: resenaCalificacion,
      comentario: resenaComentario,
      ciudad: resenaCiudad,
    });
    setEnviandoResena(false);
    if (res.success) {
      setResenas((p) => [res.resena, ...p]);
      setResenaNombre('');
      setResenaCiudad('');
      setResenaComentario('');
      setResenaCalificacion(5);
      setResenaEstado({ tipo: 'ok', texto: 'Gracias, tu opinión ya está publicada.' });
    } else {
      setResenaEstado({ tipo: 'error', texto: 'No se pudo publicar. Inténtalo de nuevo.' });
    }
  }

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <div className="site">
      <a className="skip" href="#contenido">Saltar al contenido</a>

      <header className="top">
        <div className="wrap top-in">
          <a className="brand" href="#inicio" aria-label="NM Electroclima, inicio">
            <Mark size={38} />
            <span className="brand-t">
              <strong>NM Electro<em>clima</em></strong>
              <small>Néstor Melián</small>
            </span>
          </a>

          <nav id="nav" className={`nav ${menuAbierto ? 'open' : ''}`} aria-label="Principal">
            <a href="#servicios" onClick={cerrarMenu}>Servicios</a>
            <a href="#metodo" onClick={cerrarMenu}>Cómo trabajamos</a>
            <a href="#trabajos" onClick={cerrarMenu}>Trabajos</a>
            <a href="#opiniones" onClick={cerrarMenu}>Opiniones</a>
            <a href="#contacto" onClick={cerrarMenu}>Contacto</a>
          </nav>

          <a className="btn btn-call top-call" href={`tel:${TELEFONO_LLAMADAS}`}>
            <IconoTel />
            <span>{TELEFONO_FORMATO}</span>
          </a>
          <button
            type="button"
            className="burger"
            aria-expanded={menuAbierto}
            aria-controls="nav"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <span /><span />
          </button>
        </div>
      </header>

      <main id="contenido">
        {/* HOJA 01 · PORTADA */}
        <section id="inicio" className="hero">
          <div className="wrap hero-in">
            <div className="hero-copy">
              <p className="tag">Electricidad · Climatización · Refrigeración · Andalucía</p>
              <h1>Que no se pare la luz, el frío ni el aire.</h1>
              <p className="lead">
                Instalamos y reparamos sistemas eléctricos, placas solares, aire acondicionado,
                cámaras frigoríficas y maquinaria de cocina. En casa, en el bar o en la empresa.
              </p>
              <div className="cta-row">
                <a className="btn btn-call" href={`tel:${TELEFONO_LLAMADAS}`}>
                  <IconoTel />
                  <span>Llamar ahora</span>
                </a>
                <a className="btn btn-line" href="#contacto">Dejar un aviso urgente</a>
              </div>
              <dl className="facts">
                <div><dt>Zona</dt><dd>Toda Andalucía</dd></div>
                <div><dt>Clientes</dt><dd>Hogares, hostelería, empresa</dd></div>
                <div><dt>Presupuesto</dt><dd>Claro y antes de empezar</dd></div>
              </dl>
            </div>
            <div className="hero-art">
              <HeroSchematic />
            </div>
          </div>
          <div className="sheet-foot wrap" aria-hidden="true">
            <span>Hoja 01 / 06</span><span>NM Electroclima</span><span>Esc. 1:1</span>
          </div>
        </section>

        {/* HOJA 02 · SERVICIOS */}
        <section id="servicios" className="sec">
          <div className="wrap">
            <header className="sec-head reveal">
              <p className="sheet">Hoja 02 — Servicios</p>
              <h2>Cuatro oficios, un solo teléfono.</h2>
            </header>
            <ul className="svc-list">
              {SERVICIOS.map(({ id, titulo, texto, tags, Ill }) => (
                <li key={id} className="svc reveal">
                  <span className="svc-id">{id}</span>
                  <div className="svc-body">
                    <h3>{titulo}</h3>
                    <p>{texto}</p>
                    <ul className="chips">
                      {tags.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                  <div className="svc-ill"><Ill /></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOJA 03 · MÉTODO */}
        <section id="metodo" className="sec sec-alt">
          <div className="wrap">
            <header className="sec-head reveal">
              <p className="sheet">Hoja 03 — Cómo trabajamos</p>
              <h2>De la llamada a la obra terminada, en cuatro pasos.</h2>
            </header>
            <ol className="steps">
              {PASOS.map((p) => (
                <li key={p.n} className="step reveal">
                  <span className="step-n">{p.n}</span>
                  <h3>{p.t}</h3>
                  <p>{p.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* HOJA 04 · TRABAJOS */}
        <section id="trabajos" className="sec">
          <div className="wrap">
            <header className="sec-head reveal">
              <p className="sheet">Hoja 04 — Trabajos</p>
              <h2>Instalaciones reales, publicadas por el equipo.</h2>
            </header>

            <div className="filters reveal" role="group" aria-label="Filtrar trabajos por categoría">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`filter ${filtro === f.id ? 'on' : ''}`}
                  aria-pressed={filtro === f.id}
                  onClick={() => setFiltro(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {trabajosFiltrados.length === 0 ? (
              <div className="empty reveal">
                <p className="empty-t">
                  {trabajos.length === 0 ? 'Estamos subiendo nuestras últimas instalaciones.' : 'Todavía no hay trabajos en esta categoría.'}
                </p>
                <p>Si quieres ver algo parecido a lo que necesitas, pregúntanos y te lo enseñamos.</p>
                <a className="btn btn-line" href="#contacto">Pedir presupuesto</a>
              </div>
            ) : (
              <ul className="works">
                {trabajosFiltrados.map((t) => (
                  <li key={t.id} className="work reveal">
                    {t.imagen_url && (
                      <div className="work-img">
                        <img src={t.imagen_url} alt={t.titulo} loading="lazy" />
                      </div>
                    )}
                    <div className="work-body">
                      <p className="work-cat">{t.categoria || 'Instalación'}</p>
                      <h3>{t.titulo}</h3>
                      <p>{t.descripcion || 'Instalación profesional.'}</p>
                      <p className="work-loc">{t.ubicacion || 'Andalucía'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* HOJA 05 · OPINIONES */}
        <section id="opiniones" className="sec sec-alt">
          <div className="wrap">
            <header className="sec-head sec-head-row reveal">
              <div>
                <p className="sheet">Hoja 05 — Opiniones</p>
                <h2>Lo que dicen quienes ya nos han llamado.</h2>
              </div>
              <div className="rating">
                {media ? (
                  <>
                    <strong>{media}</strong>
                    <span>{resenas.length} {resenas.length === 1 ? 'opinión' : 'opiniones'}</span>
                  </>
                ) : (
                  <span>Aún sin opiniones</span>
                )}
              </div>
            </header>

            <button
              type="button"
              className="btn btn-line"
              aria-expanded={formResenaAbierto}
              aria-controls="form-resena"
              onClick={() => setFormResenaAbierto((v) => !v)}
            >
              {formResenaAbierto ? 'Cerrar formulario' : 'Dejar mi opinión'}
            </button>

            {formResenaAbierto && (
              <form id="form-resena" className="card form" onSubmit={enviarResena} noValidate>
                <div className="grid2">
                  <label>
                    <span>Tu nombre</span>
                    <input value={resenaNombre} onChange={(e) => setResenaNombre(e.target.value)} autoComplete="name" required />
                  </label>
                  <label>
                    <span>Tu ciudad</span>
                    <input value={resenaCiudad} onChange={(e) => setResenaCiudad(e.target.value)} autoComplete="address-level2" />
                  </label>
                </div>
                <fieldset className="rate">
                  <legend>Tu valoración</legend>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n} className={n <= resenaCalificacion ? 'on' : ''}>
                      <input type="radio" name="calificacion" value={n} checked={resenaCalificacion === n} onChange={() => setResenaCalificacion(n)} />
                      <svg viewBox="0 0 20 20" width="28" height="28" aria-hidden="true"><path d="M10 1.8l2.5 5.4 5.9.7-4.4 4 1.2 5.8L10 14.8 4.8 17.7 6 11.9 1.6 7.9l5.9-.7z" /></svg>
                      <span className="sr">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
                    </label>
                  ))}
                </fieldset>
                <label>
                  <span>Tu comentario</span>
                  <textarea rows="4" value={resenaComentario} onChange={(e) => setResenaComentario(e.target.value)} placeholder="Qué trabajo hicimos y qué tal fue." required />
                </label>
                <div className="form-foot">
                  <button type="submit" className="btn btn-solid" disabled={enviandoResena}>
                    {enviandoResena ? 'Publicando…' : 'Publicar opinión'}
                  </button>
                  {resenaEstado.texto && <p role="status" className={`msg ${resenaEstado.tipo}`}>{resenaEstado.texto}</p>}
                </div>
              </form>
            )}

            {resenas.length === 0 ? (
              <p className="empty-line reveal">Sé el primero en contarnos cómo te fue.</p>
            ) : (
              <ul className="reviews">
                {resenas.map((r) => (
                  <li key={r.id} className="review reveal">
                    <Estrellas valor={Number(r.calificacion) || 5} />
                    <blockquote>{r.comentario}</blockquote>
                    <p className="review-by"><strong>{r.nombre}</strong>{r.ciudad ? ` · ${r.ciudad}` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* HOJA 06 · CONTACTO */}
        <section id="contacto" className="sec contact">
          <div className="wrap contact-in">
            <div className="contact-copy reveal">
              <p className="sheet">Hoja 06 — Contacto</p>
              <h2>¿Algo no funciona? Llámanos.</h2>
              <a className="big-tel" href={`tel:${TELEFONO_LLAMADAS}`}>{TELEFONO_FORMATO}</a>
              <p className="contact-sub">Si no puedes llamar, deja tu teléfono y el problema. El aviso llega directo al panel del equipo.</p>
              <ul className="contact-list">
                <li><span>Correo</span><a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a></li>
                <li><span>Zona</span><b>Toda Andalucía</b></li>
                <li><span>Responsable técnico</span><b>Néstor Melián</b></li>
              </ul>
            </div>

            <form className="card form form-dark reveal" onSubmit={enviarLead} noValidate>
              <h3>Aviso urgente</h3>
              <label>
                <span>Nombre (opcional)</span>
                <input value={leadNombre} onChange={(e) => setLeadNombre(e.target.value)} autoComplete="name" />
              </label>
              <label>
                <span>Teléfono</span>
                <input
                  ref={telefonoRef}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={leadTelefono}
                  onChange={(e) => setLeadTelefono(e.target.value)}
                  aria-invalid={leadEstado.tipo === 'error' && !leadTelefono.trim()}
                  required
                />
              </label>
              <label>
                <span>¿Qué ocurre?</span>
                <textarea
                  rows="4"
                  value={leadProblema}
                  onChange={(e) => setLeadProblema(e.target.value)}
                  placeholder="Ej.: el aire gotea, la cámara no enfría, no hay luz en el cuadro…"
                />
              </label>
              <div className="form-foot">
                <button type="submit" className="btn btn-orange" disabled={enviandoLead}>
                  {enviandoLead ? 'Enviando…' : 'Enviar aviso'}
                </button>
                {leadEstado.texto && <p role="status" className={`msg ${leadEstado.tipo}`}>{leadEstado.texto}</p>}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap foot-in">
          <div className="foot-brand">
            <Mark size={34} />
            <p><strong>NM Electroclima</strong><br />Sistemas eléctricos, refrigeración y climatización.</p>
          </div>
          <table className="titleblock">
            <tbody>
              <tr><th scope="row">Responsable</th><td>Néstor Melián</td></tr>
              <tr><th scope="row">Zona</th><td>Andalucía</td></tr>
              <tr><th scope="row">Teléfono</th><td><a href={`tel:${TELEFONO_LLAMADAS}`}>{TELEFONO_FORMATO}</a></td></tr>
              <tr><th scope="row">Web</th><td>nmelectroclima.es</td></tr>
            </tbody>
          </table>
          <p className="foot-legal">
            © {new Date().getFullYear()} NM Electroclima · <Link to="/admin">Acceso interno</Link>
          </p>
        </div>
      </footer>

      <div className="dock">
        <a className="btn btn-call" href={`tel:${TELEFONO_LLAMADAS}`}><IconoTel /><span>Llamar</span></a>
        <a className="btn btn-line" href="#contacto">Aviso urgente</a>
      </div>
    </div>
  );
}
