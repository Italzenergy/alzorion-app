"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { 
  FileText, Truck, User, Package, Plus, Trash2, ArrowLeft, CheckCircle2, AlertCircle, Zap
} from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

interface ActaItem {
  id: number;
  quantity: number;
  description: string;
  serials: string; // <-- NUEVO: Para guardar los seriales separados por coma
}

export default function NewActaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- MEMORIA PARA AUTOCOMPLETADO ---
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    // Cargamos las actas viejas para extraer los nombres y placas frecuentes
    const fetchHistory = async () => {
      try {
        const response = await api.get<any>('/actas');
        setHistory(response);
      } catch (error) {
        console.error("Error cargando historial para autocompletar", error);
      }
    };
    fetchHistory();
  }, []);

  // Extraemos listas únicas (sin repetidos) para sugerir
  const uniqueClients = Array.from(new Set(history.map(h => h.client_name))).filter(Boolean);
  const uniqueClientNids = Array.from(new Set(history.map(h => h.client_nid))).filter(Boolean);
  const uniqueTransporters = Array.from(new Set(history.map(h => h.transporter_name))).filter(Boolean);
  const uniquePlates = Array.from(new Set(history.map(h => h.vehicle_plate))).filter(Boolean);
  const uniqueCities = Array.from(new Set(history.map(h => h.destination_city))).filter(Boolean);

  // 1. DATOS GENERALES DEL ACTA
  const [actaData, setActaData] = useState({
    invoice_number: '',
    operation_type: 'Salida / Venta',
    client_name: '',
    client_nid: '',
    client_phone: '',
    client_email: '',
    transporter_name: '',
    transporter_nid: '',
    transporter_phone: '',
    vehicle_plate: '',
    transport_company: '',
    destination_city: '',
  });

  // 2. LISTA DINÁMICA DE MERCANCÍA
  const [items, setItems] = useState<ActaItem[]>([
    { id: Date.now(), quantity: 1, description: '', serials: '' }
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setActaData({ ...actaData, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), quantity: 1, description: '', serials: '' }]);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: number, field: keyof ActaItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      
      const updatedItem = { ...item, [field]: value };
      
      // MAGIA: Si el usuario escribe/escanea seriales, calculamos la cantidad automáticamente
      if (field === 'serials' && value.trim() !== '') {
        // Separa por comas o saltos de línea y cuenta cuántos hay
        const serialCount = value.split(/,|\n/).filter((s: string) => s.trim() !== '').length;
        updatedItem.quantity = serialCount > 0 ? serialCount : 1;
      }
      
      return updatedItem;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const validItems = items.filter(item => item.description.trim() !== '');
      if (validItems.length === 0) throw new Error("Debes agregar al menos un producto al acta.");

      const payload = {
        ...actaData,
        // Guardamos todo, incluyendo los seriales en el JSON
        items_detail: validItems 
      };
      const res = await api.post<any>('/actas', payload);
      const numeroActa =res?.document_number || res?.data?.document_number|| 'generada';
      setMessage({ type: 'success', text: `¡Acta ${numeroActa} generada con éxito!` });
      
      setTimeout(() => { router.push('/dashboard/actas'); }, 2000);

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'error al procesar acta ' });
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ maxWidth: '1200px' }}>
      
      {/* DATALISTS OCULTOS PARA EL AUTOCOMPLETADO */}
      <datalist id="clients-list">{uniqueClients.map((c: any) => <option key={c} value={c} />)}</datalist>
      <datalist id="nids-list">{uniqueClientNids.map((n: any) => <option key={n} value={n} />)}</datalist>
      <datalist id="transporters-list">{uniqueTransporters.map((t: any) => <option key={t} value={t} />)}</datalist>
      <datalist id="plates-list">{uniquePlates.map((p: any) => <option key={p} value={p} />)}</datalist>
      <datalist id="cities-list">{uniqueCities.map((c: any) => <option key={c} value={c} />)}</datalist>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generar Acta Libre</h1>
          <p className={styles.subtitle}><Zap size={14} style={{display:'inline'}}/> Modo Rápido Activado: Autocompletado y Lector de Seriales.</p>
        </div>
        <Link href="/dashboard/actas" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver a Historial
        </Link>
      </div>

      {message && (
        <div style={{ backgroundColor: message.type === 'success' ? 'rgba(4, 236, 31, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#04ec1f' : '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <strong>{message.text}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* SECCIÓN 1: DATOS OPERATIVOS */}
        <div className={`${styles.card} ${styles.cardPrimary}`}>
          <h2 className={styles.sectionTitle}><FileText size={20} color="#04ec1f"/> Datos de la Operación</h2>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Tipo de Operación *</label>
              <select name="operation_type" value={actaData.operation_type} onChange={handleInputChange} className={styles.select}>
                <option value="Salida / Venta">Salida / Venta</option>
                <option value="Garantía / Cambio">Garantía / Cambio</option>
                <option value="Traslado a Obra">Traslado a Obra</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Número de Factura / SO</label>
              <input type="text" name="invoice_number" value={actaData.invoice_number} onChange={handleInputChange} className={styles.input} />
            </div>
          </div>
        </div>

       {/* SECCIÓN 2: CLIENTE (CON AUTOCOMPLETADO) */}
<div className={styles.card}>
  <h2 className={styles.sectionTitle}><User size={20} color="#04ec1f"/> Datos del Cliente</h2>
  <div className={styles.formGrid}>
    <div className={styles.inputGroup}>
      <label className={styles.label}>Nombre de Cliente *</label>
      <input type="text" list="clients-list" name="client_name" required value={actaData.client_name} onChange={handleInputChange} className={styles.input} autoComplete="off" />
    </div>
    <div className={styles.inputGroup}>
      <label className={styles.label}>NIT / Cédula *</label>
      <input type="text" list="nids-list" name="client_nid" required value={actaData.client_nid} onChange={handleInputChange} className={styles.input} autoComplete="off" />
    </div>
    {/* 👇 NUEVOS CAMPOS AQUÍ 👇 */}
    <div className={styles.inputGroup}>
      <label className={styles.label}>Teléfono Cliente</label>
      <input type="text" name="client_phone" value={actaData.client_phone} onChange={handleInputChange} className={styles.input} placeholder="Ej. 310..." />
    </div>
    <div className={styles.inputGroup}>
      <label className={styles.label}>Correo Electrónico</label>
      <input type="email" name="client_email" value={actaData.client_email} onChange={handleInputChange} className={styles.input} placeholder="cliente@ejemplo.com" />
    </div>
  </div>
</div>
        {/* SECCIÓN 3: TRANSPORTADOR (CON AUTOCOMPLETADO) */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><Truck size={20} color="#04ec1f"/> Transportador</h2>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nombre Conductor o Empresa *</label>
              <input type="text" list="transporters-list" name="transporter_name" required value={actaData.transporter_name} onChange={handleInputChange} className={styles.input} autoComplete="off"/>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Placa del Vehículo *</label>
              <input type="text" list="plates-list" name="vehicle_plate" required value={actaData.vehicle_plate} onChange={handleInputChange} className={styles.input} autoComplete="off" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Ciudad Destino *</label>
              <input type="text" list="cities-list" name="destination_city" required value={actaData.destination_city} onChange={handleInputChange} className={styles.input} autoComplete="off"/>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Cédula Conductor / NIT *</label>
              <input type="text" name="transporter_nid" required value={actaData.transporter_nid} onChange={handleInputChange} className={styles.input} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: MERCANCÍA CON SERIALES */}
        <div className={`${styles.card} ${styles.cardPrimary}`}>
          <h2 className={styles.sectionTitle}><Package size={20} color="#04ec1f"/> Descripción de Mercancía</h2>
          
          <table className={styles.itemsTable} style={{ display: 'block', overflowX: 'auto', width: '100%' }}>
            <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <tr>
                <th style={{ width: '10%' }}>CANT.</th>
                <th style={{ width: '40%' }}>PRODUCTO / DESCRIPCIÓN</th>
                <th style={{ width: '45%' }}>SERIALES (Separados por coma o Enter)</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input 
                      type="number" min="1" required 
                      className={styles.input} 
                      value={item.quantity} 
                      onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                      style={{ fontWeight: 'bold', textAlign: 'center' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" required placeholder="Ej. Panel Solar 615W" 
                      className={styles.input} 
                      value={item.description} 
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    {/* TEXTAREA PARA ESCANEAR SERIALES RÁPIDO */}
                    <textarea 
                      placeholder="Escanea o escribe seriales aquí..." 
                      className={styles.input} 
                      value={item.serials} 
                      onChange={(e) => handleItemChange(item.id, 'serials', e.target.value)}
                      rows={2}
                      style={{ resize: 'vertical', fontSize: '0.75rem', fontFamily: 'monospace' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button type="button" onClick={() => handleRemoveItem(item.id)} className={styles.btnRemove} disabled={items.length === 1}>
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button type="button" onClick={handleAddItem} className={styles.btnDynamicAdd} style={{ marginTop: '1rem' }}>
            <Plus size={18} /> Añadir otra fila
          </button>
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Generando Acta...' : <><FileText size={24} /> Emitir Acta Oficial</>}
        </button>
      </form>
    </div>
  );
}