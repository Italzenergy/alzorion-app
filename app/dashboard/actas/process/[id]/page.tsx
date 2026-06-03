"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { PackageMinus, ArrowLeft, CheckCircle2, AlertTriangle, Save, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProcessActaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const actaId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [acta, setActa] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  
  const [mappings, setMappings] = useState<Record<string, string>>({});

useEffect(() => {
    const fetchData = async () => {
      try {
        const resActa = await api.get<any>(`/actas/${actaId}`);
        setActa(resActa);
        
        const resProducts = await api.get<any>('/products'); 
        setCatalog(resProducts);

        const initialMappings: Record<string, string> = {};
        
        // CORRECCIÓN AQUÍ: Quitamos el ".data" porque resActa ya es el objeto puro.
        // Y usamos "|| []" para que si viene vacío, no explote el forEach.
        const itemsList = resActa.items_detail || [];
        
        itemsList.forEach((item: any, idx: number) => {
          initialMappings[`row-${idx}`] = ''; 
        });
        
        setMappings(initialMappings);

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [actaId]);

  const handleMappingChange = (rowId: string, productId: string) => {
    setMappings(prev => ({ ...prev, [rowId]: productId }));
  };

  const handleProcessInventory = async () => {
    // Validar si hay errores antes de procesar
    if (hasErrors) {
      alert("Corrige los errores en rojo antes de continuar. No puedes descontar mercancía sin stock.");
      return;
    }

    const unmappedRows = Object.values(mappings).filter(val => val === '');
    if (unmappedRows.length > 0) {
      const confirmIgnore = window.confirm("Hay filas sin emparejar con el catálogo. ¿Deseas continuar procesando solo las emparejadas?");
      if (!confirmIgnore) return;
    }

    setProcessing(true);
    try {
      const dispatchData = acta.items_detail.map((item: any, idx: number) => ({
        original_description: item.description,
        quantity: item.quantity,
        serials: item.serials,
        db_product_id: mappings[`row-${idx}`] || null 
      })).filter((item: any) => item.db_product_id !== null);

      if (dispatchData.length === 0) {
        alert("No has emparejado ningún producto para descontar.");
        setProcessing(false);
        return;
      }

      await api.post<any>(`/actas/${actaId}/process`, {
        movements: dispatchData
      });

      alert("¡Inventario descontado con éxito!");
      router.push('/dashboard/actas');

    } catch (error: any) {
      alert(error.response?.data?.error || "Error procesando salida");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div style={{ color: '#04ec1f', textAlign: 'center', padding: '4rem' }}>Cargando datos de conciliación...</div>;

  // Lógica para verificar si hay algún error de stock en toda la tabla
  let hasErrors = false;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#eab308', margin: '0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PackageMinus size={28} /> Procesar Salida de Inventario
          </h1>
          <p style={{ color: '#a3a3a3', marginTop: '0.2rem' }}>
            Documento: <strong style={{color:'#fff'}}>{acta?.document_number}</strong> | Cliente: <strong style={{color:'#fff'}}>{acta?.client_name}</strong>
          </p>
        </div>
        <Link href="/dashboard/actas" style={{ color: '#a3a3a3', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Volver
        </Link>
      </div>

      <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <AlertTriangle size={24} color="#eab308" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, color: '#eab308', fontSize: '0.9rem', lineHeight: '1.5' }}>
          <strong>Instrucciones:</strong> El acta fue creada con texto libre. Para afectar el inventario digital, selecciona a qué producto de tu catálogo corresponde cada fila. Si una fila es un servicio o algo que no descuenta stock, déjala en "No descontar de inventario".
        </p>
      </div>

      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', overflow: 'hidden', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937', width: '10%' }}>Cant.</th>
              <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#a3a3a3', borderBottom: '2px solid #1f2937', width: '40%' }}>Lo que dice el Acta (Papel)</th>
              <th style={{ textAlign: 'left', padding: '1rem', backgroundColor: '#000', color: '#eab308', borderBottom: '2px solid #1f2937', width: '50%' }}>Producto Real (Base de Datos)</th>
            </tr>
          </thead>
          <tbody>
            {acta?.items_detail?.map((item: any, idx: number) => {
              const rowId = `row-${idx}`;
              const isMapped = mappings[rowId] !== '';
              const selectedProduct = catalog.find(p => p.id === mappings[rowId]);
              
              // Verificamos si hay error de stock
              const hasStockError = isMapped && selectedProduct && selectedProduct.stock < item.quantity;
              
              if (hasStockError) hasErrors = true;

              return (
                <tr key={idx} style={{ 
                  backgroundColor: hasStockError ? 'rgba(239, 68, 68, 0.1)' : (isMapped ? 'rgba(4, 236, 31, 0.05)' : 'transparent'),
                  borderLeft: hasStockError ? '4px solid #ef4444' : 'none'
                }}>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', textAlign: 'center', fontWeight: 'bold', color: hasStockError ? '#ef4444' : '#fff', verticalAlign: 'top' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', verticalAlign: 'top' }}>
                    <div style={{ color: '#fff', fontWeight: '500', marginBottom: '0.5rem' }}>{item.description}</div>
                    {item.serials && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        Seriales: {item.serials}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', borderBottom: '1px solid #1f2937', verticalAlign: 'top' }}>
                    
                    <select 
                      value={mappings[rowId]} 
                      onChange={(e) => handleMappingChange(rowId, e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        backgroundColor: '#000', 
                        color: hasStockError ? '#ef4444' : (isMapped ? '#04ec1f' : '#fff'), 
                        border: `1px solid ${hasStockError ? '#ef4444' : (isMapped ? '#04ec1f' : '#374151')}`, 
                        borderRadius: '0.5rem',
                        outline: 'none'
                      }}
                    >
                      <option value="">-- No descontar de inventario / Seleccionar Producto --</option>
                      {catalog.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.sku ? `[${product.sku}] ` : ''}{product.name} (Stock actual: {product.stock || 0})
                        </option>
                      ))}
                    </select>

                    {/* Mensajes de validación visual */}
                    {isMapped && !hasStockError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#04ec1f', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <CheckCircle2 size={14} /> Listo para descontar
                      </div>
                    )}
                    {hasStockError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        <XCircle size={14} /> Error: Stock insuficiente (Intentas sacar {item.quantity}, pero hay {selectedProduct.stock || 0})
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleProcessInventory}
          disabled={processing || hasErrors}
          style={{ 
            backgroundColor: (processing || hasErrors) ? '#4b5563' : '#eab308', 
            color: (processing || hasErrors) ? '#9ca3af' : '#000', 
            border: 'none', 
            padding: '1rem 2rem', 
            borderRadius: '0.5rem', 
            fontWeight: 'bold', 
            fontSize: '1.1rem', 
            cursor: (processing || hasErrors) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {processing ? 'Procesando...' : <><Save size={20} /> Confirmar Descuento de Inventario</>}
        </button>
      </div>
    </div>
  );
}