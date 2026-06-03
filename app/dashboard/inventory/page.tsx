"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { PackagePlus, Search, Box, AlertTriangle, X, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

export default function InventoryPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('todos');

  // --- ESTADOS DEL MODAL DE AJUSTE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustStatus, setAdjustStatus] = useState<string>('cuarentena');
  const [adjusting, setAdjusting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/inventory/stock');
      setStock(response);
    } catch (error) {
      console.error("Error al cargar stock:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const filteredStock = stock.filter(item => {
    const matchesSearch = 
      item.products?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.products?.internal_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'todos' || item.products?.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // --- FUNCIONES DEL MODAL ---
  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setAdjustQty(item.quantity); // Por defecto sugiere mover todo el lote
    setAdjustStatus('cuarentena');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const closeAdjustModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustQty > selectedItem.quantity || adjustQty <= 0) {
      setErrorMsg('Cantidad inválida.');
      return;
    }

    setAdjusting(true);
    setErrorMsg('');

    try {
      await api.put<any>('/inventory/adjust', {
        inventoryId: selectedItem.id,
        quantity: adjustQty,
        newStatus: adjustStatus
      });
      
      closeAdjustModal();
      fetchStock(); // Recargamos la tabla para ver el cambio instantáneo
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || 'Error al procesar el ajuste.');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#04ec1f', margin: '0' }}>Inventario General</h1>
          <p style={{ color: '#a3a3a3', marginTop: '0.2rem' }}>Control total de existencias y trazabilidad de seriales.</p>
        </div>
        
        <Link href="/dashboard/inventory/new" style={{ textDecoration: 'none' }}>
          <button className={styles.btnPrimary}>
            <PackagePlus size={20} /> Registrar Ingreso
          </button>
        </Link>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={18} color="#4b5563" />
          <input 
            type="text" 
            placeholder="Buscar por serial, nombre o SKU..." 
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className={styles.selectFilter}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="todos">Todas las Categorías</option>
          <option value="paneles">Paneles Solares</option>
          <option value="inversores">Inversores</option>
          <option value="estructuras">Estructuras</option>
          <option value="accesorios">Accesorios</option>
        </select>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#04ec1f' }}>Cargando inventario...</div>
        ) : filteredStock.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#a3a3a3' }}>
            <Box size={48} color="#374151" style={{ margin: '0 auto 1rem auto' }} />
            <p>No hay productos en bodega que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto / SKU</th>
                <th>Serial / Lote</th>
                <th>Cantidad</th>
                <th>Pallet</th>
                <th>Dueño</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{item.products?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#04ec1f' }}>{item.products?.internal_code}</div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: '#56ff64' }}>
                    {item.serial_number || <span style={{color: '#4b5563'}}>Sin Serial</span>}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ffffff' }}>{item.quantity}</td>
                  <td>{item.pallet_id || 'N/A'}</td>
                  <td><span className={styles.ownerBadge}>{item.owner_company}</span></td>
                  <td><span className={`${styles.statusBadge} ${styles[item.status]}`}>{item.status}</span></td>
                 <td>
                    <button 
                      onClick={() => openAdjustModal(item)} 
                      className={styles.actionBtn}
                      title="Ajustar o Devolver estado"
                    >
                      <AlertTriangle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* =========================================
          MODAL FLOTANTE PARA GARANTÍAS/AJUSTES
          ========================================= */}
      {isModalOpen && selectedItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <AlertTriangle color="#eab308" /> Ajuste de Inventario
              </h3>
              <button onClick={closeAdjustModal} className={styles.closeBtn}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleAdjustSubmit} className={styles.modalBody}>
              <p>Vas a modificar el estado del producto <strong>{selectedItem.products?.name}</strong> {selectedItem.serial_number ? `(Serial: ${selectedItem.serial_number})` : ''}.</p>
              
              {errorMsg && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <AlertCircle size={16} /> {errorMsg}
                </div>
              )}

              <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>Cantidad a afectar (Máx: {selectedItem.quantity})</label>
                <input 
                  type="number" 
                  min="1" 
                  max={selectedItem.quantity} 
                  required 
                  value={adjustQty} 
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className={styles.input}
                  disabled={selectedItem.serial_number !== null} // Si es un panel, no se deja cambiar la cantidad (siempre 1)
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Nuevo Estado</label>
                <select 
                  className={styles.select} 
                  value={adjustStatus} 
                  onChange={(e) => setAdjustStatus(e.target.value)}
                >
                  <option value="cuarentena">En Cuarentena (Revisión técnica)</option>
                  <option value="baja">Dar de Baja (Dañado / Garantía)</option>
                  <option value="devuelto">Devuelto al proveedor</option>
                  {selectedItem.status !== 'disponible' && <option value="disponible">Restaurar a Disponible</option>}
                </select>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAdjustModal} className={styles.btnCancel}>Cancelar</button>
                <button type="submit" disabled={adjusting} className={styles.btnWarning}>
                  {adjusting ? 'Aplicando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}