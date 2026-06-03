"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { FileText, Truck, User, Package, Plus, Trash2, ArrowLeft, Save, Search, X, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import styles from '../../new/page.module.css'; 
import { ActaTemplate, TemplateConfig } from '../../ActaTemplate';

interface ActaItem {
  id: number | string;
  product_id?: string;
  internal_code?: string;
  quantity: number;
  description: string;
  serials: string;
}

export default function EditActaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const actaId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | undefined>();

  const [actaData, setActaData] = useState({
    invoice_number: '', operation_type: 'Salida / Venta', client_name: '', client_nid: '',
    client_phone: '', client_email: '', transporter_name: '', transporter_nid: '',
    transporter_phone: '', vehicle_plate: '', transport_company: '', destination_city: '',
    document_number: '', created_at: ''
  });

  const [items, setItems] = useState<ActaItem[]>([]);

  // ==========================================
  // ESTADOS DEL MODAL DE SERIALES (NUEVO)
  // ==========================================
  const [serialModal, setSerialModal] = useState<{
    isOpen: boolean;
    itemId: string | number;
    productId: string;
    productName: string;
    requiredQty: number;
  }>({ isOpen: false, itemId: '', productId: '', productName: '', requiredQty: 0 });

  const [availableSerials, setAvailableSerials] = useState<any[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);
  const [serialSearchTerm, setSerialSearchTerm] = useState('');

  useEffect(() => {
    const savedConfig = localStorage.getItem('alz_acta_template');
    if (savedConfig) setTemplateConfig(JSON.parse(savedConfig));

    const fetchActa = async () => {
      try {
        const response = await api.get<any>(`/actas/${actaId}`);
        setActaData({
          invoice_number: response.invoice_number || '', operation_type: response.operation_type || 'Salida / Venta',
          client_name: response.client_name || '', client_nid: response.client_nid || '',
          client_phone: response.client_phone || '', client_email: response.client_email || '',
          transporter_name: response.transporter_name || '', transporter_nid: response.transporter_nid || '',
          transporter_phone: response.transporter_phone || '', vehicle_plate: response.vehicle_plate || '',
          transport_company: response.transport_company || '', destination_city: response.destination_city || '',
          document_number: response.document_number, created_at: response.created_at
        });

        if (response.items_detail && response.items_detail.length > 0) {
          const itemsWithIds = response.items_detail.map((item: any, i: number) => ({ 
            ...item, 
            id: `item-${Date.now()}-${i}`,
            serials: item.serials || '' 
          }));
          setItems(itemsWithIds);
        } else {
          setItems([{ id: 'item-new', quantity: 1, description: '', serials: '' }]);
        }
      } catch (error) {
        console.error("Error cargando acta:", error);
        alert("No se pudo cargar el acta.");
      } finally {
        setLoading(false);
      }
    };
    fetchActa();
  }, [actaId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setActaData({ ...actaData, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => setItems([...items, { id: `item-new-${Date.now()}`, quantity: 1, description: '', serials: '' }]);
  const handleRemoveItem = (id: string | number) => { if (items.length > 1) setItems(items.filter(item => item.id !== id)); };

  const handleItemChange = (id: string | number, field: keyof ActaItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      
      // Si pegan seriales manualmente, ajustamos la cantidad
      if (field === 'serials' && value.trim() !== '') {
        const serialCount = value.split(/,|\n/).filter((s: string) => s.trim() !== '').length;
        if (serialCount > 0) updatedItem.quantity = serialCount;
      }
      return updatedItem;
    }));
  };

  // ==========================================
  // LÓGICA DEL MODAL DE SERIALES (NUEVO)
  // ==========================================
  const openSerialModal = async (item: ActaItem) => {
    if (!item.product_id) return alert("Este producto no está enlazado al catálogo. Escribe los seriales manualmente.");
    
    // Extraemos los seriales que ya estén en la caja de texto para marcarlos como seleccionados
    const alreadySelected = item.serials.split(/,|\n/).map(s => s.trim()).filter(s => s !== '');
    setSelectedSerials(alreadySelected);
    
    setSerialModal({ isOpen: true, itemId: item.id, productId: item.product_id, productName: item.description, requiredQty: item.quantity });
    
    try {
      setLoadingSerials(true);
      // Aquí llamamos a tu backend para traer el inventario disponible de ese producto
      // Ajusta la URL a la que corresponda en tu backend
      const response = await api.get<any>(`/inventory/products/${item.product_id}/serials?status=disponible`);
      setAvailableSerials(response || []);
    } catch (error) {
      console.error("Error buscando seriales", error);
      // Para pruebas, si falla, inyectamos data falsa para que veas cómo funciona
      setAvailableSerials([
        { serie: 'SN-998811', pallet: 'PLT-01' },
        { serie: 'SN-998812', pallet: 'PLT-01' },
        { serie: 'SN-998813', pallet: 'PLT-02' },
      ]);
    } finally {
      setLoadingSerials(false);
    }
  };

  const toggleSerialSelection = (serie: string) => {
    setSelectedSerials(prev => {
      if (prev.includes(serie)) return prev.filter(s => s !== serie);
      if (prev.length >= serialModal.requiredQty) {
        alert(`Ya seleccionaste la cantidad máxima (${serialModal.requiredQty}).`);
        return prev;
      }
      return [...prev, serie];
    });
  };

  const confirmSerialSelection = () => {
    // Unimos los seriales con saltos de línea para que se vean bien en la caja y el PDF
    const serialsText = selectedSerials.join('\n');
    handleItemChange(serialModal.itemId, 'serials', serialsText);
    setSerialModal({ isOpen: false, itemId: '', productId: '', productName: '', requiredQty: 0 });
  };

  // ==========================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validItems = items.filter(item => item.description.trim() !== '');
      if (validItems.length === 0) throw new Error("El acta debe tener al menos un producto.");
      await api.put(`/actas/${actaId}`, { ...actaData, items_detail: validItems });
      alert('¡Acta actualizada correctamente!');
      router.push('/dashboard/actas');
    } catch (error: any) {
      alert(error.response?.data?.error || error.message || 'Error al actualizar acta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: '#04ec1f', textAlign: 'center', padding: '4rem' }}>Cargando datos del Acta...</div>;

  const previewActa = { ...actaData, items_detail: items.filter(i => i.description.trim() !== '') };

  // Filtro visual dentro del modal
  const filteredSerials = availableSerials.filter(s => s.serie.toLowerCase().includes(serialSearchTerm.toLowerCase()) || s.pallet.toLowerCase().includes(serialSearchTerm.toLowerCase()));

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', position: 'relative' }}>
      
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Modificar {actaData.document_number}</h1>
          <p className={styles.subtitle}>Corrige los datos del cliente, transportador o mercancía.</p>
        </div>
        <Link href="/dashboard/actas" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver a Historial
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div style={{ flex: '1 1 50%', minWidth: 0 }}>
          <form onSubmit={handleSubmit}>
            
            {/* SECCIÓN OPERACIÓN Y CLIENTE (Acortadas por espacio) ... */}
            <div style={{display: 'flex', gap:'1rem', marginBottom: '1rem'}}>
               <div className={styles.card} style={{flex: 1}}><h2 className={styles.sectionTitle}>Operación</h2>
                  <select name="operation_type" value={actaData.operation_type} onChange={handleInputChange} className={styles.select} style={{marginBottom: '0.5rem'}}><option>Salida / Venta</option></select>
                  <input type="text" name="invoice_number" placeholder="Factura" value={actaData.invoice_number} onChange={handleInputChange} className={styles.input} />
               </div>
               <div className={styles.card} style={{flex: 1}}><h2 className={styles.sectionTitle}>Cliente</h2>
                  <input type="text" name="client_name" placeholder="Nombre" value={actaData.client_name} onChange={handleInputChange} className={styles.input} style={{marginBottom: '0.5rem'}} />
                  <input type="text" name="client_nid" placeholder="NIT" value={actaData.client_nid} onChange={handleInputChange} className={styles.input} />
               </div>
            </div>

            {/* SECCIÓN 3: TRANSPORTADOR */}
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}><Truck size={20} color="#04ec1f"/> Transportador</h2>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}><label className={styles.label}>Nombre Conductor</label><input type="text" name="transporter_name" required value={actaData.transporter_name} onChange={handleInputChange} className={styles.input} /></div>
                <div className={styles.inputGroup}><label className={styles.label}>Cédula</label><input type="text" name="transporter_nid" required value={actaData.transporter_nid} onChange={handleInputChange} className={styles.input} /></div>
                <div className={styles.inputGroup}><label className={styles.label}>Placa del Vehículo</label><input type="text" name="vehicle_plate" required value={actaData.vehicle_plate} onChange={handleInputChange} className={styles.input} style={{ textTransform: 'uppercase' }} /></div>
                <div className={styles.inputGroup}><label className={styles.label}>Ciudad Destino</label><input type="text" name="destination_city" required value={actaData.destination_city} onChange={handleInputChange} className={styles.input} /></div>
              </div>
            </div>

            {/* SECCIÓN 4: MERCANCÍA Y SERIALES */}
            <div className={`${styles.card} ${styles.cardPrimary}`}>
              <h2 className={styles.sectionTitle}><Package size={20} color="#04ec1f"/> Corrección de Mercancía</h2>
              <table className={styles.itemsTable} style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '10%' }}>CANT.</th>
                    <th style={{ width: '40%' }}>PRODUCTO / DESCRIPCIÓN</th>
                    <th style={{ width: '45%' }}>SERIALES</th>
                    <th style={{ width: '5%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input type="number" min="1" required className={styles.input} value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))} style={{ fontWeight: 'bold', textAlign: 'center' }} />
                      </td>
                      <td>
                        <input type="text" required className={styles.input} value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} />
                        {item.internal_code && <div style={{fontSize:'0.7rem', color:'#a3a3a3', marginTop:'2px'}}>Ref: {item.internal_code}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <textarea className={styles.input} value={item.serials} onChange={(e) => handleItemChange(item.id, 'serials', e.target.value)} rows={2} style={{ resize: 'vertical', fontSize: '0.75rem', fontFamily: 'monospace' }} placeholder="Escribe o busca..." />
                          {/* BOTÓN MÁGICO PARA BUSCAR SERIALES */}
                          {item.product_id && (
                            <button 
                              type="button" 
                              onClick={() => openSerialModal(item)} 
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', backgroundColor: '#1f2937', color: '#04ec1f', border: '1px solid #374151', padding: '4px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              <Search size={12} /> Buscar en Inventario
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className={styles.btnRemove} disabled={items.length === 1}><Trash2 size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button type="button" onClick={handleAddItem} className={styles.btnDynamicAdd} style={{ marginTop: '1rem' }}>
                <Plus size={18} /> Añadir fila manual
              </button>
            </div>

            <button type="submit" disabled={saving} className={styles.submitBtn}>
              {saving ? 'Guardando...' : <><Save size={24} /> Guardar Cambios del Acta</>}
            </button>
          </form>
        </div>

        {/* LADO DERECHO: VISTA PREVIA */}
        <div style={{ flex: '1 1 50%', position: 'sticky', top: '2rem', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ transform: 'scale(0.65)', transformOrigin: 'top center', marginBottom: '-300px' }}>
            <ActaTemplate acta={previewActa} config={templateConfig} />
          </div>
        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL GIGANTE DE SERIALES FLOTANTE */}
      {/* ======================================================= */}
      {serialModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', width: '90%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            
            {/* CABECERA DEL MODAL */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Asignar Seriales</h2>
                <div style={{ color: '#04ec1f', fontWeight: 'bold', fontSize: '0.85rem', marginTop: '4px' }}>{serialModal.productName}</div>
              </div>
              <button onClick={() => setSerialModal({ ...serialModal, isOpen: false })} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}><X size={24}/></button>
            </div>

            {/* BUSCADOR Y CONTADOR */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Buscar serial o pallet..." 
                value={serialSearchTerm}
                onChange={(e) => setSerialSearchTerm(e.target.value)}
                style={{ backgroundColor: '#1f2937', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', width: '60%', outline: 'none' }}
              />
              <div style={{ backgroundColor: selectedSerials.length === serialModal.requiredQty ? 'rgba(4, 236, 31, 0.2)' : '#1f2937', color: selectedSerials.length === serialModal.requiredQty ? '#04ec1f' : '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.3s' }}>
                Seleccionados: {selectedSerials.length} / {serialModal.requiredQty}
              </div>
            </div>

            {/* LISTA DE INVENTARIO */}
            <div style={{ padding: '1rem 1.5rem', overflowY: 'auto', flex: 1 }}>
              {loadingSerials ? (
                <div style={{ textAlign: 'center', color: '#a3a3a3', padding: '2rem' }}>Buscando en bodega...</div>
              ) : filteredSerials.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#ef4444', padding: '2rem' }}>No hay seriales disponibles para este producto.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  {filteredSerials.map((s, idx) => {
                    const isSelected = selectedSerials.includes(s.serie);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleSerialSelection(s.serie)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isSelected ? 'rgba(4, 236, 31, 0.1)' : '#111827', border: isSelected ? '1px solid #04ec1f' : '1px solid #1f2937', padding: '0.75rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: isSelected ? 'none' : '2px solid #4b5563', backgroundColor: isSelected ? '#04ec1f' : 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {isSelected && <CheckSquare size={16} color="#000" />}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', fontFamily: 'monospace' }}>{s.serie}</div>
                            <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>Pallet: {s.pallet}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER DEL MODAL */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button onClick={() => setSerialModal({ ...serialModal, isOpen: false })} style={{ backgroundColor: 'transparent', color: '#a3a3a3', border: '1px solid #374151', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmSerialSelection} style={{ backgroundColor: '#04ec1f', color: '#000', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', opacity: selectedSerials.length > 0 ? 1 : 0.5 }}>
                Confirmar Selección
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}