"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import * as XLSX from 'xlsx';
import { Save, PackagePlus, FileSpreadsheet, Box, UploadCloud, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import styles from '../page.module.css';

interface Product {
  id: string;
  internal_code: string;
  name: string;
  category: string;
  is_serialized: boolean;
  supplier: string;
}

interface SerialItem {
  serie: string;
  pallet: string;
}

export default function NewInventoryEntry() {
  const router = useRouter();
  

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bulkQuantity, setBulkQuantity] = useState<number | ''>('');
  const [serialsList, setSerialsList] = useState<SerialItem[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
const [generalData, setGeneralData] = useState({
    // Obtenemos la fecha actual y la cortamos para que quede YYYY-MM-DD
    entry_date: new Date().toISOString().split('T')[0], 
    import_number: '',
    location: '',
    owner: 'ALZ',
  });
  // Cargar catálogo
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await api.get<any>('/products');
        setProducts(response);
      } catch (error) {
        console.error("Error cargando catálogo", error);
      }
    };
    fetchCatalog();
  }, []);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = e.target.value;
    const found = products.find(p => p.id === prodId) || null;
    setSelectedProduct(found);
    setBulkQuantity('');
    setSerialsList([]);
    setMessage(null);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target?.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
      
      const extractedSerials: SerialItem[] = jsonData.map(row => ({
        serie: String(row['Serie'] || row['Lote/Serie'] || row['LOTE/SERIE'] || ''),
        pallet: String(row['Pallet'] || row['PALLET'] || 'N/A')
      })).filter(item => item.serie.trim() !== '' && item.serie !== 'undefined');

      setSerialsList(extractedSerials);
    };
    reader.readAsBinaryString(file);
  };

  // 2. FUNCIÓN DE ENVÍO AL BACKEND (CONEXIÓN REAL)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validaciones previas
    if (!selectedProduct) return;
    if (selectedProduct.is_serialized && serialsList.length === 0) {
      return setMessage({ type: 'error', text: 'Por favor, carga un archivo Excel con los seriales.' });
    }
    if (!selectedProduct.is_serialized && !bulkQuantity) {
      return setMessage({ type: 'error', text: 'Por favor, ingresa la cantidad a granel.' });
    }

    setLoading(true);

    try {
      const payload = {
        ...generalData,
        product_id: selectedProduct.id,
        // Adaptamos la estructura según lo que espera nuestro inventoryService
        items: selectedProduct.is_serialized ? serialsList : { quantity: Number(bulkQuantity) }
      };

      // LLAMADA AL API
      const response = await api.post<any>('/inventory/inbound', payload);

      setMessage({ 
        type: 'success', 
        text: `¡Ingreso exitoso! Se registraron ${response.total_quantity} unidades en bodega.` 
      });

      // Limpiar formulario tras éxito
      setGeneralData({ entry_date: '', import_number: '', location: '', owner: 'ALZ' });
      setBulkQuantity('');
      setSerialsList([]);
      setSelectedProduct(null);

      // Opcional: Redirigir al inventario general después de 3 segundos
      // setTimeout(() => router.push('/dashboard/inventory'), 3000);

    } catch (error: any) {
      console.error("Error en el ingreso:", error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al procesar el ingreso de mercancía.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Registrar Ingreso</h1>
          <p className={styles.subtitle}>Añade mercancía al inventario desde importaciones o compras.</p>
        </div>
        <Link href="/dashboard/inventory" className={styles.backLink}>
          <ArrowLeft size={16} /> Volver al Inventario
        </Link>
      </div>

      {/* ALERTAS DE FEEDBACK */}
      {message && (
        <div className={message.type === 'success' ? styles.alertSuccess : styles.alertError}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {message.type === 'success' ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
            <span style={{ fontWeight: 500 }}>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        {/* SECCIÓN 1: DOCUMENTACIÓN */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><FileSpreadsheet size={20} color="#04ec1f"/> Documentación de Entrada</h2>
          <div className={styles.formGrid}>
           <div className={styles.inputGroup}>
              <label className={styles.label}>Fecha de Ingreso *</label>
              <input 
                type="date" 
                required 
                value={generalData.entry_date} 
                onChange={e => setGeneralData({...generalData, entry_date: e.target.value})} 
                
                // MAGIA UX: Bloqueamos que escriban con el teclado
                onKeyDown={(e) => e.preventDefault()} 
                // MAGIA UX: Forzamos a que se abra el calendario al hacer clic en cualquier parte de la caja
                onClick={(e) => (e.target as HTMLInputElement).showPicker()} 
                
                className={styles.input} 
                style={{ cursor: 'pointer' }} // El cursor de "manito" le dice al usuario que debe hacer clic
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}># de Importación / Factura *</label>
              <input type="text" required placeholder="Ej. IMP-2026-001" value={generalData.import_number} onChange={e => setGeneralData({...generalData, import_number: e.target.value})} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Ubicación (Bodega) *</label>
              <input type="text" required placeholder="Ej. Bodega Principal - Zona A" value={generalData.location} onChange={e => setGeneralData({...generalData, location: e.target.value})} className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Dueño de la Mercancía *</label>
              <select value={generalData.owner} onChange={e => setGeneralData({...generalData, owner: e.target.value})} className={styles.select}>
                <option value="ALZ">ALZ</option>
                <option value="SUNCON">Suncon</option>
                <option value="AMBOS">Ambos (Compartido)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: PRODUCTO */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><Box size={20} color="#04ec1f"/> Producto a Ingresar</h2>
          <div className={styles.inputGroupFull}>
            <label className={styles.label}>Seleccionar del Catálogo *</label>
            <select required value={selectedProduct?.id || ""} onChange={handleProductChange} className={styles.select}>
              <option value="" disabled>-- Seleccione un producto --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.internal_code} - {p.name}</option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div className={styles.productInfoCard}>
              <div><span className={styles.infoLabel}>Categoría:</span><br/><span className={styles.infoValue} style={{textTransform:'capitalize'}}>{selectedProduct.category}</span></div>
              <div><span className={styles.infoLabel}>Proveedor:</span><br/><span className={styles.infoValue}>{selectedProduct.supplier || 'N/A'}</span></div>
              <div><span className={styles.infoLabel}>Control:</span><br/><span className={styles.infoValue} style={{color: selectedProduct.is_serialized ? '#04ec1f' : '#a3a3a3'}}>{selectedProduct.is_serialized ? 'Serializado' : 'A Granel'}</span></div>
            </div>
          )}
        </div>

        {/* SECCIÓN 3: CANTIDAD O EXCEL */}
        {selectedProduct && (
          <div className={styles.card} style={{ borderColor: selectedProduct.is_serialized ? '#04ec1f' : '#1f2937' }}>
            {!selectedProduct.is_serialized ? (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Cantidad a Ingresar (Unidades) *</label>
                <input type="number" min="1" required placeholder="0" value={bulkQuantity} onChange={e => setBulkQuantity(Number(e.target.value))} className={styles.input} style={{ fontSize: '1.5rem', fontWeight: 'bold' }} />
              </div>
            ) : (
              <div>
                <label className={styles.label}>Cargar Seriales masivos desde Excel</label>
                <label className={styles.excelZone}>
                  <UploadCloud size={32} color="#04ec1f" />
                  <div style={{color: '#ffffff', fontWeight: '600'}}>Subir archivo .xlsx / .csv</div>
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} className={styles.excelInput} />
                </label>

                {serialsList.length > 0 && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{color: '#04ec1f', fontWeight: 'bold', marginBottom: '0.8rem'}}>
                      ✓ {serialsList.length} Seriales listos para procesar
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #1f2937', borderRadius: '0.5rem' }}>
                      <table className={styles.serialTable}>
                        <thead>
                          <tr>
                            <th># Pallet</th>
                            <th>Número de Serie / Lote</th>
                          </tr>
                        </thead>
                        <tbody>
                          {serialsList.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.pallet}</td>
                              <td style={{color: '#56ff64'}}>{item.serie}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading || !selectedProduct} className={styles.submitBtn}>
          {loading ? 'Procesando ingreso...' : <><PackagePlus size={20} /> Confirmar Ingreso a Bodega</>}
        </button>
      </form>
    </div>
  );
}