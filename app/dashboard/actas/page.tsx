"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, FileDown, PackageMinus, Search, Edit, Ban, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useReactToPrint } from 'react-to-print';
import { ActaTemplate, TemplateConfig } from './ActaTemplate'; // <-- IMPORTANTE: Traemos TemplateConfig

export default function ActasHistoryPage() {
  const [actas, setActas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- LÓGICA DE CONFIGURACIÓN VISUAL ---
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | undefined>();
  const { user } = useAuthStore();

  const [modalFeedback, setModalFeedback] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({ isOpen: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const handleVoidActa = (id: string, docNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Anular Acta',
      message: `¿Estás seguro de anular el acta ${docNumber}? Si la mercancía ya fue descontada, el sistema devolverá los equipos al stock disponible de la bodega.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await api.post<any>(`/actas/${id}/void`);
          setModalFeedback({ isOpen: true, type: 'success', message: res.message || 'Acta anulada correctamente.' });
          fetchActas(); // Recargamos la tabla
        } catch (error: any) {
          setModalFeedback({ isOpen: true, type: 'error', message: error?.message|| 'Error al anular el acta.' });
        }
      }
    });
  };
 
 
 
  // Cargar configuración de colores/logo guardada
  useEffect(() => {
    const saved = localStorage.getItem('alz_acta_template');
    if (saved) setTemplateConfig(JSON.parse(saved));
  }, []);

  // --- LÓGICA DE IMPRESIÓN ---
  const [actaToPrint, setActaToPrint] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef, 
    documentTitle: actaToPrint ? `${actaToPrint.document_number}_${actaToPrint.client_name}` : 'Acta_Salida',
    onAfterPrint: () => setActaToPrint(null) 
  });

useEffect(() => {
    // Si actaToPrint tiene datos (ya no es null), entonces disparamos la impresión
    if (actaToPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 300); // 300ms aseguran que React actualizó el DOM y el título del documento
      
      return () => clearTimeout(timer); // Limpiamos el cronómetro por seguridad
    }
  }, [actaToPrint]); // Este efecto solo se ejecuta cuando seleccionas un acta nueva

  // 3. El botón de la tabla ahora es súper simple: solo actualiza el estado
  const triggerPrint = (acta: any) => {
    setActaToPrint(acta);
  };

  const fetchActas = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/actas');
      setActas(response);
    } catch (error) {
      console.error("Error al cargar actas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActas();
  }, []);

  const filteredActas = actas.filter(acta => 
    acta.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acta.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      
      {/* COMPONENTE OCULTO (El Molde de Word) */}
      <div style={{ display: 'none' }}>
        {/* AQUÍ LE PASAMOS LA CONFIGURACIÓN (config={templateConfig}) */}
        <ActaTemplate ref={printRef} acta={actaToPrint} config={templateConfig} />
      </div>

      {/* HEADER Y BARRA DE BÚSQUEDA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#04ec1f', margin: '0' }}>Historial de Actas</h1>
          <p style={{ color: '#a3a3a3', marginTop: '0.2rem' }}>Consulta documentos generados, imprime PDFs y procesa salidas de inventario.</p>
        </div>
        <Link href="/dashboard/actas/new" style={{ textDecoration: 'none' }}>
          <button style={{ backgroundColor: '#04ec1f', color: '#000', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={20} /> Nueva Acta Libre
          </button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} color="#4b5563" />
          <input 
            type="text" 
            placeholder="Buscar por número de acta o cliente..." 
            style={{ background: 'none', border: 'none', color: '#fff', padding: '0.75rem 0', width: '100%', outline: 'none' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA DE HISTORIAL */}
     {/* TABLA DE HISTORIAL */}
<div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', overflowX: 'auto' }}>
  {loading ? (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#04ec1f' }}>Cargando historial...</div>
  ) : filteredActas.length === 0 ? (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#a3a3a3' }}>No hay actas registradas.</div>
  ) : (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Documento</th>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Fecha</th>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Cliente</th>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Transportador</th>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Operación</th>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Estado</th>
          <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937' }}>Acciones</th>
        </tr>
      </thead>
      
      <tbody>
        {filteredActas.map((acta) => (
          <tr key={acta.id}>
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', fontWeight: 'bold', color: '#04ec1f' }}>{acta.document_number}</td>
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>{new Date(acta.created_at).toLocaleDateString()}</td>
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>{acta.client_name}</td>
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
              <div style={{ fontWeight: '500' }}>{acta.transporter_name}</div>
              <div style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>Placa: {acta.vehicle_plate}</div>
            </td>
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', color: '#e5e7eb' }}>
              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>{acta.operation_type}</span>
            </td>

           {/* COLUMNA BODEGA (ESTADO) */}
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937' }}>
              <span style={{ 
                fontSize: '0.7rem', 
                padding: '4px 8px', 
                borderRadius: '4px',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                // Colores dinámicos para los 3 estados
                backgroundColor: acta.inventory_status === 'anulada' ? 'rgba(239, 68, 68, 0.15)' : (acta.inventory_status === 'procesado' ? 'rgba(4, 236, 31, 0.15)' : 'rgba(234, 179, 8, 0.15)'),
                color: acta.inventory_status === 'anulada' ? '#ef4444' : (acta.inventory_status === 'procesado' ? '#04ec1f' : '#eab308'),
                border: `1px solid ${acta.inventory_status === 'anulada' ? '#ef4444' : (acta.inventory_status === 'procesado' ? '#04ec1f' : '#eab308')}`
              }}>
                {acta.inventory_status || 'pendiente'}
              </span>
            </td>

            {/* COLUMNA ACCIONES */}
            <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                
                {/* 1. IMPRIMIR (Siempre visible) */}
                <button onClick={() => triggerPrint(acta)} title="Imprimir PDF" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.25rem' }}>
                  <FileDown size={20} />
                </button>

                {/* Si NO está anulada, mostramos las demás opciones */}
                {acta.inventory_status !== 'anulada' ? (
                  <>
                    {/* EDITAR */}
                    <Link href={`/dashboard/actas/edit/${acta.id}`}>
                      <button title="Editar Acta" style={{ background: 'none', border: 'none', color: '#04ec1f', cursor: 'pointer', padding: '0.25rem' }}>
                        <Edit size={20} />
                      </button>
                    </Link>

                    {/* PROCESAR / DESCONTAR */}
                    {acta.inventory_status === 'procesado' ? (
                      <button disabled title="Inventario ya descontado" style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'not-allowed', padding: '0.25rem', opacity: 0.5 }}>
                        <PackageMinus size={20} />
                      </button>
                    ) : (
                      <Link href={`/dashboard/actas/process/${acta.id}`}>
                        <button title="Procesar Salida de Bodega" style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer', padding: '0.25rem' }}>
                          <PackageMinus size={20} />
                        </button>
                      </Link>
                    )}

                    {/* ANULAR (Solo Admin) */}
                    {user?.role === 'admin' && (
                      <button onClick={() => handleVoidActa(acta.id, acta.document_number)} title="Anular Acta" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                        <Ban size={20} />
                      </button>
                    )}
                  </>
                ) : (
                  // Si está anulada, mostramos un aviso sutil
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>Documento Anulado</span>
                )}

              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
{/* MODAL DE FEEDBACK (ÉXITO / ERROR) */}
      {modalFeedback.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: '#141414', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative', animation: 'fadeIn 0.2s ease-out' }}>
            <button onClick={() => setModalFeedback({ ...modalFeedback, isOpen: false })} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              {modalFeedback.type === 'success' ? <CheckCircle size={50} color="#04ec1f" /> : <AlertCircle size={50} color="#ef4444" />}
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#e4dfdf', fontSize: '20px', fontWeight: 'bold' }}>
              {modalFeedback.type === 'success' ? '¡Excelente!' : '¡Ups! Algo salió mal'}
            </h3>
            <p style={{ color: '#e9e9e9', fontSize: '14px', lineHeight: '1.5', margin: '0 0 25px 0' }}>{modalFeedback.message}</p>
            <button onClick={() => setModalFeedback({ ...modalFeedback, isOpen: false })} style={{ backgroundColor: modalFeedback.type === 'success' ? '#04ec1f' : '#ef4444', color: modalFeedback.type === 'success' ? '#000' : '#fff', border: 'none', padding: '10px 25px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#141414', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              <Ban size={45} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#eceaea', fontSize: '20px', fontWeight: 'bold' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#eceaea', fontSize: '15px', lineHeight: '1.5', margin: '0 0 25px 0' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} style={{ flex: 1, backgroundColor: '#121213', color: '#f4f4f4', border: '1px solid #e9e9e9', padding: '10px 15px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmDialog.onConfirm} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Confirmar Anulación</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}