"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Save, X, ArrowLeft, Search, UserCheck, CheckCircle, AlertCircle, Trash2, Info } from 'lucide-react';
import styles from '../new/newQuote.module.css'; // Asegúrate de que la ruta al CSS sea correcta
import CustomDropdown from "@/components/CustomDropdown";

export default function EditQuotePage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [documentNumber, setDocumentNumber] = useState('');
  
  // Estado del cliente
  const [client, setClient] = useState({ name: '', nid: '', email: '', phone: '', address: '' });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [clientLocked, setClientLocked] = useState(false);
  
  const [validUntil, setValidUntil] = useState('');
  const [minDate, setMinDate] = useState('');

  // Estado de las Notas Adicionales
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<any[]>([]);

  // Estados para modales
  const [modalFeedback, setModalFeedback] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({ isOpen: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, type: 'danger' | 'info' | 'success', onConfirm: () => void }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });

  const taxOptions = [
    { label: 'IVA 19%', value: 0.19 },
    { label: 'Exento (0%)', value: 0 }
  ];

  const templates = [
    { name: "Kit Estructura Coplanar", items: ["END CLAMP", "MID CLAMP", "GROUNDING LUG", "RIELES A2", "RAIL SPLICE", "L FEET"] },
    { name: "Kit Básico Inversor", items: ["INVERSOR 5KW", "CABLE SOLAR 4MM", "CONECTOR MC4"] }
  ];

  const productOptions = catalog.map(p => ({
    label: `${p.internal_code ? `[${p.internal_code}] ` : ''}${p.name}`,
    value: p.id,
    stock: p.stock
  }));

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const  catData = await api.get<any>('/products');
        setCatalog(catData);

        const  quoteData = await api.get<any>(`/quotations/${id}`);
        setDocumentNumber(quoteData.document_number);
        setValidUntil(quoteData.valid_until);
        
        // Cargar notas
        if (quoteData.notes) {
          setNotes(quoteData.notes);
        }
        
        // Cargar y bloquear cliente
        if (quoteData.clients) {
          setClient({
            name: quoteData.clients.name,
            nid: quoteData.clients.nid,
            email: quoteData.clients.email || '',
            phone: quoteData.clients.phone || '',
            address: quoteData.clients.address || ''
          });
          setClientLocked(true);
        }

        if (quoteData.quotation_items) {
          setItems(quoteData.quotation_items.map((i: any) => {
            const catalogProduct = catData.find((p: any) => p.id === i.product_id);
            const codeDisplay = catalogProduct?.internal_code ? `[${catalogProduct.internal_code}] ` : '';
            const initialSearchQuery = catalogProduct ? `${codeDisplay}${catalogProduct.name}` : i.product_name || '';

            return {
              product_id: i.product_id,
              product_name: i.product_name,
              internal_code: catalogProduct?.internal_code || '',
              accounting_ref: catalogProduct?.accounting_ref || '',
              quantity: i.quantity,
              unit_price: i.unit_price,
              tax_rate: i.tax_rate,
              total_price: i.total_price,
              search_query: initialSearchQuery 
            };
          }));
        }
      } catch (error) {
        console.error(error);
        setModalFeedback({ isOpen: true, type: 'error', message: 'Error cargando datos para editar.' });
        setTimeout(() => router.push('/dashboard/quotes'), 2000);
      }
    };
    
    if (id) fetchInitialData();

    const d = new Date();
    const todayStr = d.toISOString().split('T')[0];
    setMinDate(todayStr);
  }, [id, router]);

  const handleClientSearch = async (val: string) => {
    setClient({ ...client, name: val });
    if (val.length < 3) { setSearchResults([]); return; }
    try {
      const response = await api.get<any>(`/quotations/clients/search?q=${val}`);
      setSearchResults(response);
    } catch (error) { console.error(error); }
  };

  const selectClient = (c: any) => {
    setClient({ name: c.name, nid: c.nid, email: c.email || '', phone: c.phone || '', address: c.address || '' });
    setSearchResults([]);
    setClientLocked(true);
  };

  const clearClient = () => {
    setClient({ name: '', nid: '', email: '', phone: '', address: '' });
    setClientLocked(false);
    setSearchResults([]);
  };

  const loadTemplate = (templateName: string) => {
    const template = templates.find(t => t.name === templateName);
    if (!template) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Cargar Plantilla',
      message: `¿Deseas agregar los productos de la plantilla "${templateName}" a esta cotización?`,
      type: 'info',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));

        const newItemsToLoad = template.items.map(itemName => {
          const foundProduct = catalog.find(p => p.name.toLowerCase().includes(itemName.toLowerCase()));
          if (foundProduct) {
            const codeDisplay = foundProduct.internal_code ? `[${foundProduct.internal_code}] ` : '';
            return {
              product_id: foundProduct.id,
              product_name: foundProduct.name,
              internal_code: foundProduct.internal_code || '',
              accounting_ref: foundProduct.accounting_ref || '',
              search_query: `${codeDisplay}${foundProduct.name}`,
              quantity: 1, unit_price: 0, tax_rate: 0.19, total_price: 0
            };
          }
          return null;
        }).filter(item => item !== null); 

        if (newItemsToLoad.length === 0) {
          setModalFeedback({ isOpen: true, type: 'error', message: `No se encontraron productos para la plantilla.` });
          return;
        }

        if (items.length === 1 && !items[0].product_id) {
          setItems(newItemsToLoad);
        } else {
          setItems([...items, ...newItemsToLoad]);
        }
        setModalFeedback({ isOpen: true, type: 'success', message: `Plantilla agregada correctamente.` });
      }
    });
  };

  const addRow = () => setItems([...items, { product_id: '', product_name: '', internal_code: '', accounting_ref: '', search_query: '', quantity: 1, unit_price: 0, tax_rate: 0.19, total_price: 0 }]);
  const removeRow = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleRowChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (['quantity', 'unit_price', 'tax_rate'].includes(field)) {
      newItems[index].total_price = Number(newItems[index].quantity) * Number(newItems[index].unit_price);
    }
    setItems(newItems);
  };

  const selectProductForRow = (index: number, product: any) => {
    const newItems = [...items];
    newItems[index].product_id = product.id;
    newItems[index].product_name = product.name;
    newItems[index].internal_code = product.internal_code || '';
    newItems[index].accounting_ref = product.accounting_ref || '';
    const codeDisplay = product.internal_code ? `[${product.internal_code}] ` : '';
    newItems[index].search_query = `${codeDisplay}${product.name}`;
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const taxTotal = items.reduce((sum, item) => sum + (item.total_price * Number(item.tax_rate)), 0);
  const grandTotal = subtotal + taxTotal;

  const handleUpdate = async () => {
    if (!client.name || !client.nid) return setModalFeedback({ isOpen: true, type: 'error', message: "Falta el Nombre o NIT del cliente." });
    if (items.length === 0 || items.some(i => !i.product_id || i.unit_price <= 0)) return setModalFeedback({ isOpen: true, type: 'error', message: "Revisa los productos: Faltan datos o precios en algunas filas." });

    setLoading(true);
    try {
      await api.put(`/quotations/${id}`, {
        client, 
        items, 
        subtotal, 
        tax_total: taxTotal, 
        total: grandTotal, 
        valid_until: validUntil, 
        notes: notes // Guardamos las notas editadas
      });
      setModalFeedback({ isOpen: true, type: 'success', message: "Cotización actualizada con éxito" });
      setTimeout(() => router.push('/dashboard/quotes'), 1500);
    } catch (error) {
      console.error(error);
      setModalFeedback({ isOpen: true, type: 'error', message: "Error al actualizar la cotización." });
    } finally { setLoading(false); }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.push('/dashboard/quotes')} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          Editando Cotización: <span style={{ color: '#04ec1f' }}>{documentNumber}</span>
        </h1>
      </div>

      <div className={styles.actionBar}>
        <button className={styles.btnPrimary} onClick={handleUpdate} disabled={loading}>
          <Save size={18} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }}/> 
          {loading ? 'Guardando Cambios...' : 'Guardar Cambios'}
        </button>
        <button className={styles.btnSecondary} onClick={() => router.push('/dashboard/quotes')}>Cancelar</button>
      </div>

      <div className={styles.card}>
        <div className={styles.grid2}>
          <div>
            <div className={styles.formGroup}>
              <label>Cliente (Busca o escribe uno nuevo)</label>
              {clientLocked ? (
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '10px 15px', borderRadius: '8px', border: '1px solid #333' }}>
                  <UserCheck size={20} color="#04ec1f" style={{ marginRight: '10px' }} />
                  <span style={{ flex: 1, color: '#f4f4f4', fontWeight: 'bold' }}>{client.name}</span>
                  <button onClick={clearClient} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <X size={16} style={{ marginRight: '4px' }}/> Cambiar
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <Search size={18} color="#888" style={{ position: 'absolute', left: '10px', top: '12px' }} />
                  <input 
                    type="text" 
                    className={styles.input} 
                    style={{ paddingLeft: '35px' }}
                    placeholder="Escribe para buscar o crear cliente..." 
                    value={client.name} 
                    onChange={(e) => handleClientSearch(e.target.value)} 
                  />
                  {searchResults.length > 0 && (
                    <div className={styles.autocompleteList}>
                      {searchResults.map(c => (
                        <div key={c.id} className={styles.autocompleteItem} onClick={() => selectClient(c)}>
                          <span className={styles.clientName}>{c.name}</span>
                          <span className={styles.clientNid}>NIT/CC {c.nid}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.formGroup}><label>NIT / Cédula</label><input type="text" className={styles.input} value={client.nid} onChange={e => setClient({...client, nid: e.target.value})} disabled={clientLocked} style={{ opacity: clientLocked ? 0.6 : 1 }}/></div>
            <div className={styles.formGroup}><label>Dirección</label><input type="text" className={styles.input} value={client.address} onChange={e => setClient({...client, address: e.target.value})} /></div>
          </div>
          <div>
            <div className={styles.formGroup}>
              <label>Fecha de Vencimiento</label>
              <input type="date" className={styles.input} min={minDate} value={validUntil} onChange={e => setValidUntil(e.target.value)} style={{ colorScheme: 'dark', cursor: 'pointer' }} />
            </div>
            <div className={styles.formGroup}><label>Correo Electrónico</label><input type="email" className={styles.input} value={client.email} onChange={e => setClient({...client, email: e.target.value})} /></div>
            <div className={styles.formGroup}><label>Teléfono</label><input type="text" className={styles.input} value={client.phone} onChange={e => setClient({...client, phone: e.target.value})} /></div>
          </div>
        </div>

        {/* CAMPO DE NOTAS ADICIONALES */}
        <div className={styles.formGroup} style={{ marginTop: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#04ec1f' }}>
            Notas Adicionales del Asesor
          </label>
          <textarea 
            className={styles.input} 
            rows={3} 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Escribe aquí aclaraciones, tiempos de entrega específicos o comentarios para este cliente (Opcional)..."
            style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          {templates.map(template => (
            <button key={template.name} onClick={() => loadTemplate(template.name)} style={{ backgroundColor: '#2a2a2a', color: '#f4f4f4', border: '1px solid #444', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
              + Cargar {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}><span className={styles.tabActive}>Líneas de las Órdenes</span></div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Producto</th><th style={{ width: '10%' }}>Cantidad</th><th style={{ width: '20%' }}>Precio Unit.</th><th style={{ width: '15%' }}>Impuestos</th><th style={{ width: '10%' }}>Subtotal</th><th style={{ width: '5%' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              return (
                <tr key={index}>
                  <td>
                    {/* USANDO EL COMPONENTE ELEGANTE (CustomDropdown) COMO EN LA PÁGINA NUEVA */}
                    <CustomDropdown 
                      options={productOptions} 
                      value={item.product_id} 
                      searchable
                      onChange={(val) => {
                        const product = catalog.find(p => p.id === val);
                        selectProductForRow(index, product);
                      }}
                    />
                  </td>
                  <td><input type="number" min="1" value={item.quantity} className={styles.tableInput} style={{ textAlign: 'center' }} onChange={(e) => handleRowChange(index, 'quantity', e.target.value)} /></td>
                  <td><input type="number" value={item.unit_price} className={styles.tableInput} style={{ textAlign: 'right' }} onChange={(e) => handleRowChange(index, 'unit_price', e.target.value)} /></td>
                  <td>
                    <CustomDropdown options={taxOptions} value={item.tax_rate} onChange={(val) => handleRowChange(index, 'tax_rate', val)}/>
                  </td>
                  <td style={{ paddingTop: '0.8rem', fontWeight: 'bold', textAlign: 'right' }}>{formatMoney(item.total_price)}</td>
                  <td style={{ textAlign: 'center', paddingTop: '0.5rem' }}><button className={styles.removeBtn} onClick={() => removeRow(index)}><X size={18}/></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button className={styles.addLineBtn} onClick={addRow}>Agregar un producto</button>

        <div className={styles.totalsSection}>
          <div className={styles.totalRow}><span>Subtotal:</span><span>{formatMoney(subtotal)}</span></div>
          <div className={styles.totalRow}><span>IVA:</span><span>{formatMoney(taxTotal)}</span></div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}><span>Total:</span><span>{formatMoney(grandTotal)}</span></div>
        </div>
      </div>

      {/* MODALES REUTILIZADOS (FEEDBACK Y CONFIRMACIÓN) */}
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

      {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 9998, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ backgroundColor: '#141414', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.15)', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
              {confirmDialog.type === 'danger' ? <Trash2 size={45} color="#ef4444" /> : confirmDialog.type === 'success' ? <CheckCircle size={45} color="#04ec1f" /> : <Info size={45} color="#00ff1e" />}
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#eceaea', fontSize: '20px', fontWeight: 'bold' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#eceaea', fontSize: '15px', lineHeight: '1.5', margin: '0 0 25px 0' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} style={{ flex: 1, backgroundColor: '#121213', color: '#f4f4f4', border: '1px solid #e9e9e9', padding: '10px 15px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmDialog.onConfirm} style={{ flex: 1, backgroundColor: confirmDialog.type === 'danger' ? '#ef4444' : confirmDialog.type === 'success' ? '#04ec1f' : '#00ff1e', color: confirmDialog.type === 'danger' ? '#000000' : '#080808', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}