"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Save, AlertCircle, CheckCircle, Trash2, Package, Edit2, X, Image as ImageIcon, Plus, ChevronDown, ChevronUp, Ban } from 'lucide-react'; 
import styles from './page.module.css';

interface Product {
  id: string;
  internal_code: string;
  name: string;
  category: string;
  is_serialized: boolean;
  supplier: string;
  image_url: string | null;
  accounting_ref: string | null;
}

export default function ProductsPage() {
  const [formData, setFormData] = useState({
    name: '', internal_code: '', accounting_ref: '', category: 'paneles', is_serialized: false, supplier: '', image_url: '',
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // UX: Controla si el formulario está abierto o cerrado
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Estados para Modales
  const [modalFeedback, setModalFeedback] = useState<{isOpen: boolean, type: 'success'|'error', message: string}>({ isOpen: false, type: 'success', message: '' });
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await api.get<any>('/products');
      setProducts(response);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name, internal_code: product.internal_code, accounting_ref: product.accounting_ref || '',
      category: product.category, is_serialized: product.is_serialized, supplier: product.supplier || '', image_url: product.image_url || '',
    });
    setIsFormOpen(true); // Abre el formulario automáticamente
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', internal_code: '', accounting_ref: '', category: 'paneles', is_serialized: false, supplier: '', image_url: '' });
    setIsFormOpen(false); // Cierra el formulario
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await api.put<any>(`/products/${editingId}`, formData);
        setModalFeedback({ isOpen: true, type: 'success', message: '¡Producto actualizado exitosamente!' });
      } else {
        await api.post<any>('/products', formData);
        setModalFeedback({ isOpen: true, type: 'success', message: '¡Producto creado en el catálogo!' });
      }
      
      handleCancelEdit(); // Limpia y cierra el form
      fetchProducts();
    } catch (error: any) {  
      setModalFeedback({ isOpen: true, type: 'error', message:error.message || 'Error de conexión al servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Producto',
      message: `¿Estás seguro de eliminar "${name}" del catálogo? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await api.delete<any>(`/products/${id}`);
          setModalFeedback({ isOpen: true, type: 'success', message: 'Producto eliminado correctamente' });
          fetchProducts();
        } catch (error: any) {
          setModalFeedback({ isOpen: true, type: 'error', message: error.menssage || 'No se pudo eliminar el producto' });
        }
      }
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Catálogo de Productos</h1>
          <p className={styles.subtitle}>Gestiona las referencias y fichas técnicas del inventario.</p>
        </div>
        
        {/* BOTÓN DESPLEGABLE */}
        <button onClick={() => setIsFormOpen(!isFormOpen)} className={styles.submitBtn}>
          {isFormOpen ? <><ChevronUp size={20} /> Ocultar Formulario</> : <><Plus size={20} /> Nuevo Producto</>}
        </button>
      </div>

      {/* FORMULARIO CONDICIONAL (Acordeón) */}
      {isFormOpen && (
        <div className={styles.card}>
          <form onSubmit={handleSubmit}>
            <h3 style={{ color: '#04ec1f', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {editingId ? <><Edit2 size={18}/> Editando Referencia</> : <><Package size={18}/> Creando Nueva Referencia</>}
            </h3>

            <div className={styles.formGrid}>
              <div className={styles.inputGroupFull}>
                <label className={styles.label}>Nombre Comercial del Producto *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Ej. Panel Solar Astronergy 620W" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Código Interno (SKU) *</label>
                <input type="text" name="internal_code" required value={formData.internal_code} onChange={handleChange} placeholder="Ej. PNL-620-AST" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Referencia Contable</label>
                <input type="text" name="accounting_ref" value={formData.accounting_ref} onChange={handleChange} placeholder="Ej. 143501 (Inventarios)" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Categoría *</label>
                <select name="category" value={formData.category} onChange={handleChange} className={styles.select}>
                  <option value="paneles">Paneles Solares</option>
                  <option value="estructuras">Estructuras</option>
                  <option value="inversores">Inversores</option>
                  <option value="accesorios">Accesorios Varios</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Proveedor / Marca *</label>
                <input type="text" name="supplier" required value={formData.supplier} onChange={handleChange} placeholder="Ej. Astronergy / Chint" className={styles.input} />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>URL de la Imagen (Opcional)</label>
                <input type="url" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://ejemplo.com/foto.png" className={styles.input} />
              </div>
              <div className={styles.inputGroupFull}>
                <label className={styles.label}>Control de Inventario</label>
                <label className={styles.checkboxContainer}>
                  <input type="checkbox" name="is_serialized" checked={formData.is_serialized} onChange={handleChange} className={styles.checkbox} />
                  <span className={styles.checkboxLabel}>
                  Si este producto requiere seguimiento por <span className={styles.checkboxHighlight}>Número de Serie / Lote único</span>.
                  </span>
                </label>
              </div>
            </div>
            
            <div className={styles.buttonContainer} style={{ gap: '1rem' }}>
              <button type="button" onClick={handleCancelEdit} className={styles.submitBtn} style={{ backgroundColor: '#1f2937', color: 'white' }}>
                <X size={20} /> Cancelar
              </button>
              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Procesando...' : <><Save size={20} /> {editingId ? 'Actualizar Producto' : 'Guardar Producto'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}><Package size={20} style={{ display: 'inline', marginRight: '0.5rem' }} /> Catálogo Actual</h2>
        </div>
        
        {loadingProducts ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: '#04ec1f' }}>Cargando catálogo...</p>
        ) : products.length === 0 ? (
          <p style={{ padding: '3rem', textAlign: 'center', color: '#a3a3a3' }}>Aún no hay productos en el sistema.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Código</th>
                <th className={styles.th}>Ref. Contable</th>
                <th className={styles.th}>Proveedor</th>
                <th className={styles.th}>Categoría</th>
                <th className={styles.th}>Control</th>
                <th className={styles.th} style={{ width: '60px' }}>Img</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className={styles.td} style={{ fontWeight: 'bold' }}>{product.name}</td>
                  <td className={styles.td} style={{ fontWeight: 600, color: '#04ec1f' }}>{product.internal_code}</td>
                  <td className={styles.td} style={{ color: '#9ca3af' }}>{product.accounting_ref || 'N/A'}</td>
                  <td className={styles.td}>{product.supplier || 'N/A'}</td>
                  <td className={styles.td} style={{ textTransform: 'capitalize' }}>{product.category}</td>
                  <td className={styles.td}>
                    {product.is_serialized ? (
                      <span className={`${styles.badge} ${styles.badgeSerial}`}>Serializado</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeBulk}`}>Granel</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #1f2937' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#111827', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #1f2937' }}>
                        <ImageIcon size={20} color="#374151" />
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEditClick(product)} className={styles.deleteBtn} style={{ color: '#3b82f6' }} title="Editar producto">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(product.id, product.name)} className={styles.deleteBtn} title="Eliminar producto">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODALES DE SISTEMA ================= */}
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
              <Ban size={45} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 10px 0', color: '#eceaea', fontSize: '20px', fontWeight: 'bold' }}>{confirmDialog.title}</h3>
            <p style={{ color: '#eceaea', fontSize: '15px', lineHeight: '1.5', margin: '0 0 25px 0' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} style={{ flex: 1, backgroundColor: '#121213', color: '#f4f4f4', border: '1px solid #e9e9e9', padding: '10px 15px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={confirmDialog.onConfirm} style={{ flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}