"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { FileText, Plus, Search, Trash2, Edit, Download, Filter, Mail, CheckCircle, AlertCircle, X, RotateCcw, Ban, UploadCloud, BadgeDollarSign, Eye } from 'lucide-react';
import styles from './quotations.module.css';

// Importamos nuestro generador de PDF (El componente fantasma)
import { QuotationPrinter, QuotationPrinterRef } from '../../../components/QuotationPrinter';

export default function QuotationsPage() {
  const { user } = useAuthStore();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Filtro Avanzado
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  
  const [modalFeedback, setModalFeedback] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({
    isOpen: false,
    type: 'success',
    message: ''
  });
  // ESTADO PARA EL MODAL DE SUBIR COMPROBANTE
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    quoteId: string;
    docNumber: string;
    file: File | null;
  }>({ isOpen: false, quoteId: '', docNumber: '', file: null });
  
  // ESTADO PARA EL MODAL DE CONFIRMACIÓN
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {}
  });
  
  // Referencia a nuestro componente impresor fantasma
  const printerRef = useRef<QuotationPrinterRef>(null);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/quotations')
      setQuotations(response);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // --- 1. ELIMINAR ---
  const handleDelete = (id: string, docNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Cotización',
      message: `¿Estás seguro de ELIMINAR la cotización ${docNumber}? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await api.delete<any>(`/quotations/${id}`)
          fetchQuotations();
          setModalFeedback({ isOpen: true, type: 'success', message: `La cotización ${docNumber} ha sido eliminada correctamente.` });
        } catch (error) {
          console.error("Error eliminando cotización", error);
          setModalFeedback({ isOpen: true, type: 'error', message: 'Hubo un error al eliminar la cotización.' });
        }
      }
    });
  };

  // --- 2. ENVIAR POR CORREO ---
 
  const handleSendEmail = (id: string, docNumber: string, status: string) => {
    const isPO = status === 'confirmada'; // Evaluamos si es PO
    
    setConfirmDialog({
      isOpen: true,
      // Cambiamos el título dinámicamente
      title: isPO ? 'Enviar Orden de Compra' : 'Enviar Cotización',
      // Cambiamos el mensaje dinámicamente
      message: `¿Deseas generar el PDF y enviar ${isPO ? 'la orden de compra' : 'la cotización'} ${docNumber} por correo al cliente?`,
      type: 'info',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await printerRef.current?.sendEmail(id);
          setModalFeedback({ isOpen: true, type: 'success', message: `¡El documento ${docNumber} fue enviado con éxito al correo del cliente!` });
          setTimeout(() => { fetchQuotations(); }, 1000);
        } catch (error) {
          console.error("Error al intentar enviar correo desde la tabla", error);
          setModalFeedback({ isOpen: true, type: 'error', message: 'Hubo un error al intentar enviar el correo. Verifica la consola.' });
        }
      }
    });
  };

  // --- 3. CONFIRMAR VENTA (SO a PO) ---
 // --- 3. PASO 1: COMERCIAL SUBE COMPROBANTE ---
  const handleOpenPaymentModal = (id: string, docNumber: string) => {
    setPaymentModal({ isOpen: true, quoteId: id, docNumber: docNumber, file: null });
  };

 const handleSubmitPayment = async () => {
    if (!paymentModal.file) {
      setModalFeedback({ isOpen: true, type: 'error', message: 'Debes seleccionar un archivo (PDF o Imagen).' });
      return;
    }

    try {
      const formData = new FormData();
      // OJO: 'receipt' debe ser exacto al que espera Multer
      formData.append('receipt', paymentModal.file);

      // BYPASS: Usamos fetch nativo crudo. Nada de api.post() aquí.
      // Así garantizamos que el navegador cree el "Boundary" perfectamente.
      const response = await fetch(`http://localhost:4000/api/quotations/${paymentModal.quoteId}/upload-receipt`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Vital: Permite que viajen las cookies para que el Portero te deje pasar
        // MAGIA: ¡NO le pasamos NINGÚN header! Cero Content-Type.
      });

      // Si el servidor (Node.js) rechaza la petición
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error interno al procesar el archivo.');
      }

      // Si todo sale bien
      setPaymentModal({ isOpen: false, quoteId: '', docNumber: '', file: null });
      setModalFeedback({ isOpen: true, type: 'success', message: 'Comprobante enviado a Contabilidad para su revisión.' });
      
      // Refrescamos la tabla
      fetchQuotations();

    } catch (error: any) {
      console.error("Error crítico en bypass de subida:", error);
      setModalFeedback({ isOpen: true, type: 'error', message: error.message || 'Error al subir el comprobante.' });
    }
  };

  // --- 4. PASO 2: CONTABILIDAD APRUEBA Y PASA A BODEGA ---
  const handleApprovePayment = (id: string, docNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Aprobar Pago y Generar PO',
      message: `¿El pago de la orden ${docNumber} es válido? Al confirmar, el documento pasará a estado PO y Logística recibirá la orden de despacho.`,
      type: 'success',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await api.post<any>(`/quotations/${id}/confirm`); // Usamos tu endpoint actual, pero ahora lo dispara contabilidad
          setModalFeedback({ isOpen: true, type: 'success', message: `¡Pago Aprobado! La orden es PO y Bodega ha sido notificada.` });
          fetchQuotations();
        } catch (error: any) {
          console.error("Error aprobando pago", error);
          setModalFeedback({ isOpen: true, type: 'error', message: error.message || 'Hubo un error al aprobar el pago.' });
        }
      }
    });
  };


// --- 4. REVERTIR VENTA (Solo Admin) ---
  const handleRevertSale = (id: string, docNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revertir a Borrador',
      message: `¡ATENCIÓN ADMIN! ¿Deseas revertir la orden ${docNumber} a SO? Esto eliminará el acta pendiente en la pantalla de bodega.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await api.post(`/quotations/${id}/revert`);
          setModalFeedback({ 
            isOpen: true, 
            type: 'success', 
            message: `La orden ha sido revertida a SO y el despacho en bodega fue cancelado.` 
          });
          fetchQuotations();
        } catch (error: any) {
          console.error("Error revirtiendo venta", error);
          setModalFeedback({ 
            isOpen: true, 
            type: 'error', 
            message: error.message || 'Hubo un error al revertir la venta.' 
          });
        }
      }
    });
  };
// --- 5. CANCELAR DOCUMENTO ---
  const handleCancelSale = (id: string, docNumber: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancelar Documento',
      message: `¿Estás seguro de cancelar definitivamente el documento ${docNumber}? Si es una PO pendiente, se anulará la orden en bodega.`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await api.post<any>(`/quotations/${id}/cancel`);
          setModalFeedback({ 
            isOpen: true, 
            type: 'success', 
            message: res.message || 'Documento cancelado con éxito.' 
          });
          fetchQuotations();
        } catch (error: any) {
          console.error("Error cancelando", error);
          setModalFeedback({ 
            isOpen: true, 
            type: 'error', 
            message: error.message || 'Hubo un error al cancelar el documento.' 
          });
        }
      }
    });
  };
  // Formateadores
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  };

// --- NUEVA LÍNEA DE TIEMPO VISUAL (Reemplaza a getStatusBadge) ---
 // --- NUEVA LÍNEA DE TIEMPO VISUAL CON CONTABILIDAD ---
  const renderStatusTimeline = (status: string) => {
    const s = status?.toLowerCase() || 'borrador';
    
    if (s === 'cancelada') {
      return <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>❌ CANCELADA</span>;
    }

    const steps = ['borrador', 'enviada', 'pago_en_revision', 'confirmada'];
    const currentIndex = steps.indexOf(s);

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 'bold' }}>
        <div style={{ display: 'flex', alignItems: 'center', color: currentIndex >= 0 ? '#3b82f6' : '#4b5563' }} title="Borrador">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentIndex >= 0 ? '#3b82f6' : '#374151', display: 'inline-block', marginRight: '2px' }}></span> SO
        </div>
        <span style={{ color: '#374151' }}>-</span>
        <div style={{ display: 'flex', alignItems: 'center', color: currentIndex >= 1 ? '#eab308' : '#4b5563' }} title="Enviada">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentIndex >= 1 ? '#eab308' : '#374151', display: 'inline-block', marginRight: '2px' }}></span> MAIL
        </div>
        <span style={{ color: '#374151' }}>-</span>
        <div style={{ display: 'flex', alignItems: 'center', color: currentIndex >= 2 ? '#a855f7' : '#4b5563' }} title="Revisión Contable">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentIndex >= 2 ? '#a855f7' : '#374151', display: 'inline-block', marginRight: '2px' }}></span> CAJA
        </div>
        <span style={{ color: '#374151' }}>-</span>
        <div style={{ display: 'flex', alignItems: 'center', color: currentIndex >= 3 ? '#04ec1f' : '#4b5563' }} title="Confirmada">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentIndex >= 3 ? '#04ec1f' : '#374151', display: 'inline-block', marginRight: '2px' }}></span> PO
        </div>
      </div>
    );
  };

  // Lógica del Filtro Súper Avanzado
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (q.clients?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      
      {/* COMPONENTE FANTASMA GENERADOR DE PDF */}
      <QuotationPrinter ref={printerRef} />

      {/* CABECERA */}
      <div className={styles.header}>
        <h1 className={styles.title}><FileText size={32} /> Cotizaciones & Órdenes</h1>
        <Link href="/dashboard/quotes/new" className={styles.createBtn}>
          <Plus size={20} /> Crear Cotización
        </Link>
      </div>

      {/* FILTRO AVANZADO */}
      <div className={styles.filterCard}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por SO-0000, PO-0000 o cliente..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={20} color="#a3a3a3" />
          <select 
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos los Estados</option>
            <option value="borrador">Borrador</option>
            <option value="enviada">Enviada</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Documento</th>
              <th>Cliente</th>
              <th>Asesor</th>
              <th>Fechas</th>
              <th>Total (COP)</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>Cargando datos comerciales...</td></tr>
            ) : filteredQuotations.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#a3a3a3' }}>No hay documentos que coincidan con la búsqueda.</td></tr>
            ) : (
              filteredQuotations.map((q) => (
                <tr key={q.id}>
                  <td>
                    <Link href={`/dashboard/quotes/${q.id}`} className={styles.documentRef}>
                      {q.document_number}
                    </Link>
                  </td>
                  
                  <td>
                    <span style={{ fontWeight: '500' }}>{q.clients?.name || 'Cliente Eliminado'}</span>
                    <span className={styles.subtext}>NIT: {q.clients?.nid || 'N/A'}</span>
                  </td>

                  <td style={{ color: '#a3a3a3' }}>{q.profiles?.full_name || 'Desconocido'}</td>

                  <td>
                    <span style={{ display: 'block' }}>C: {formatDate(q.created_at)}</span>
                    <span className={styles.subtext}>V: {formatDate(q.valid_until)}</span>
                    <span className={styles.subtext}>M: {formatDate(q.updated_at)}</span>
                  </td>

                  <td style={{ fontWeight: 'bold' }}>{formatCurrency(q.total)}</td>

                 <td>{renderStatusTimeline(q.status)}</td>

                  <td>
                    <div className={styles.actions}>
                      {/* BOTÓN PARA VER COMPROBANTE (Solo si existe receipt_url) */}
                      {q.receipt_url && (
                        <a 
                          href={`http://localhost:4000${q.receipt_url}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.actionBtn}
                          style={{ color: '#a855f7', borderColor: '#a855f7' }}
                          title="Ver Comprobante de Pago"
                        >
                          <Eye size={18} />
                        </a>
                      )}
                     <button  onClick={() => handleSendEmail(q.id, q.document_number, q.status)} 
                      className={`${styles.actionBtn} ${styles.btnMail}`} 
                       title="Enviar por Correo">
                        <Mail size={18} />
                 </button>
                      
                     {/* BOTÓN COMERCIAL: Subir Comprobante (Si está enviada) */}
                      {q.status === 'enviada' && (
                        <button onClick={() => handleOpenPaymentModal(q.id, q.document_number)} className={`${styles.actionBtn} ${styles.btnConfirm}`} title="Subir Comprobante de Pago">
                          <UploadCloud size={18} />
                        </button>
                      )}

                      {/* BOTÓN CONTABILIDAD: Aprobar Pago (Si está en revisión) */}
                      {q.status === 'pago_en_revision' && (user?.role === 'admin' || user?.role === 'contabilidad') && (
                        <button onClick={() => handleApprovePayment(q.id, q.document_number)} className={styles.actionBtn} style={{ color: '#a855f7', borderColor: '#a855f7' }} title="Validar Pago y Crear PO">
                          <BadgeDollarSign size={18} />
                        </button>
                      )}

                      {/* BOTÓN REVERTIR: Solo visible si está confirmada y el usuario es ADMIN */}
                      {q.status === 'confirmada' && user?.role === 'admin' && (
                        <button onClick={() => handleRevertSale(q.id, q.document_number)} className={styles.actionBtn} style={{ color: '#ef4444' }} title="Revertir Orden a Borrador">
                          <RotateCcw size={18} />
                        </button>
                      )}

                      <button onClick={() => printerRef.current?.print(q.id)} className={`${styles.actionBtn} ${styles.btnDownload}`} title="Descargar PDF">
                        <Download size={18} />
                      </button>
                      {/* BOTÓN CANCELAR (Anular Venta Completa) */}
                          <button onClick={() => handleCancelSale (q.id, q.document_number)} className={styles.actionBtn} style={{ color: '#ef4444' }} title="Cancelar Documento">
                            <Ban size={18} />
                          </button>
                      {/* Deshabilitar edición si ya es PO (opcional, pero buena práctica) */}
                      {q.status !== 'confirmada' && (
                        <Link href={`/dashboard/quotes/${q.id}`} className={`${styles.actionBtn} ${styles.btnEdit}`} title="Editar Cotización">
                          <Edit size={18} />
                        </Link>
                      )}
                      
                      {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(q.id, q.document_number)} className={`${styles.actionBtn} ${styles.btnDelete}`} title="Eliminar permanentemente">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODALES DE FEEDBACK Y CONFIRMACIÓN SE MANTIENEN IGUAL... */}
      {/* MODAL DE FEEDBACK (ÉXITO / ERROR)          */}
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

      {/* MODAL DE CONFIRMACIÓN (Reemplaza confirm)  */}
      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#141414', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              {confirmDialog.type === 'danger' ? <Trash2 size={45} color="#ef4444" /> : confirmDialog.type === 'success' ? <CheckCircle size={45} color="#04ec1f" /> : <Mail size={45} color="#04ec1f" />}
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#eceaea', fontSize: '20px', fontWeight: 'bold' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#eceaea', fontSize: '15px', lineHeight: '1.5', margin: '0 0 25px 0' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} style={{ flex: 1, backgroundColor: '#121213', color: '#f4f4f4', border: '1px solid #e9e9e9', padding: '10px 15px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmDialog.onConfirm} style={{ flex: 1, backgroundColor: confirmDialog.type === 'danger' ? '#ef4444' : '#04ec1f', color: confirmDialog.type === 'danger' ? '#fff' : '#000', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL PARA SUBIR COMPROBANTE DE PAGO */}
      {paymentModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#141414', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#04ec1f', fontSize: '20px', fontWeight: 'bold' }}>Subir Comprobante</h3>
            <p style={{ color: '#a3a3a3', fontSize: '14px', marginBottom: '20px' }}>Adjunta el soporte de pago para la orden <strong>{paymentModal.docNumber}</strong>.</p>
            
            <input 
              type="file" 
              accept=".pdf, image/*"
              onChange={(e) => setPaymentModal({...paymentModal, file: e.target.files?.[0] || null})}
              style={{ width: '100%', padding: '10px', backgroundColor: '#0a0a0a', color: '#fff', border: '1px dashed #374151', borderRadius: '8px', marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} style={{ flex: 1, backgroundColor: 'transparent', color: '#a3a3a3', border: '1px solid #374151', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSubmitPayment} style={{ flex: 1, backgroundColor: '#04ec1f', color: '#000', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar a Revisión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}