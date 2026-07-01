import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // El archivo de conexión que creamos antes

export default function App() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    // 1. Cargar los clientes que ya están en la base de datos al abrir la app
    const obtenerClientesIniciales = async () => {
      const { data, error } = await supabase
        .from('leads_clientes')
        .select('*')
        .order('creado_en', { ascending: false }); // Mostrar los más nuevos primero

      if (error) {
        console.error('Error al cargar clientes:', error);
      } else {
        setClientes(data);
      }
    };

    obtenerClientesIniciales();

    // 2. Escuchar la base de datos EN TIEMPO REAL (Realtime)
    // Cada vez que la IA haga un INSERT, este código lo captura al segundo
    const canalRealtime = supabase
      .channel('cambios-leads') // Nombre del canal (puede ser cualquiera)
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Solo nos interesa cuando se CREA un cliente nuevo
          schema: 'public',
          table: 'leads_clientes',
        },
        (payload) => {
          console.log('¡Nueva llamada procesada por la IA!', payload.new);

          // Agregamos el nuevo cliente automáticamente al principio del estado
          setClientes((clientesActuales) => [payload.new, ...clientesActuales]);
        }
      )
      .subscribe();

    // 3. Limpieza: Desconectar el canal cuando el componente se destruya
    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Antigravity - Panel de Control</h1>
      <h2>Llamadas Filtradas por IA</h2>

      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        {clientes.length === 0 ? (
          <p>No hay llamadas registradas todavía...</p>
        ) : (
          clientes.map((cliente) => (
            <div
              key={cliente.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: cliente.estado === 'pendiente' ? '#fff9e6' : '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>👤 {cliente.nombre}</strong>
                <span style={{
                  backgroundColor: '#e6f4ea',
                  color: '#137333',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {cliente.categoria}
                </span>
              </div>
              <p style={{ margin: '8px 0' }}>📞 {cliente.telefono}</p>
              <p style={{ color: '#5f6368', fontSize: '14px' }}>
                <strong>Problema:</strong> {cliente.problema || 'No especificado'}
              </p>
              <button
                onClick={() => window.open(`tel:${cliente.telefono}`)}
                style={{
                  marginTop: '10px',
                  backgroundColor: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Devolver Llamada
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}