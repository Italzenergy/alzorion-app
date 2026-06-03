"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import * as XLSX from 'xlsx'; // Importamos la librería de Excel
import { TrendingUp, FileText, FileSignature, XCircle, DollarSign, ListFilter, X, Trophy, Users, Award, Medal, Calendar, BarChart, Download } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // 1. Estados para el tiempo
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [customDates, setCustomDates] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // 2. Función de cálculo de límites actualizada
  const getDateLimits = () => {
    const end = new Date();
    const start = new Date();

    if (timeRange === 'week') start.setDate(end.getDate() - 7);
    else if (timeRange === 'month') start.setDate(end.getDate() - 30);
    else if (timeRange === 'year') start.setFullYear(end.getFullYear(), 0, 1);
    else if (timeRange === 'custom') {
      return { startDate: customDates.start, endDate: customDates.end };
    }
    else return { startDate: null, endDate: null };

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  // 3. Efecto de carga (ahora escucha también a customDates)
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { startDate, endDate } = getDateLimits();
        
        let url = '/quotations/analytics/dashboard';
        if (startDate && endDate) {
          url += `?startDate=${startDate}&endDate=${endDate} 23:59:59`;
        }

        const response = await api.get<any>(url); 
        setDashboardData(response);
      } catch (error) {
        console.error("Error cargando analíticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, customDates]); // Se dispara al cambiar el modo o las fechas manuales
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO');
  };

  if (loading && !dashboardData) return <div style={{ padding: '3rem', color: '#04ec1f', textAlign: 'center' }}>Calculando inteligencia de negocios...</div>;
  if (!dashboardData) return null;

  const { kpis, top_consultants, top_clients, top_products, raw_data } = dashboardData;
  const filteredData = activeFilter ? raw_data.filter((q: any) => q.status === activeFilter) : [];
  const toggleFilter = (status: string) => setActiveFilter(prev => prev === status ? null : status);

  // Variable para calcular el % de ancho en la gráfica de productos
  const maxProductQuantity = top_products.length > 0 ? Math.max(...top_products.map((p:any) => p.quantity)) : 1;
 const handleExportExcel = () => {
    if (!dashboardData || !dashboardData.raw_data) return;

    const excelData: any[] = [];

    // Recorremos cada cotización/orden
    dashboardData.raw_data.forEach((q: any) => {
      // Si la cotización tiene ítems, creamos una fila por cada producto
      if (q.quotation_items && q.quotation_items.length > 0) {
        q.quotation_items.forEach((item: any) => {
          excelData.push({
            'Documento': q.document_number,
            'Fecha Emisión': formatDate(q.created_at),
            'Estado': q.status.toUpperCase(),
            'Cliente': q.clients?.name || 'N/A',
            'Consultor': q.profiles?.full_name || 'N/A',
            // --- DETALLE DEL PRODUCTO ---
            'Producto': item.product_name,
            'Cantidad': item.quantity,
            'V. Total Ítem (COP)': item.total_price,
            // ----------------------------
            'Monto Total Doc': q.total
          });
        });
      } else {
        // Si por alguna razón no tiene ítems, creamos la fila básica
        excelData.push({
          'Documento': q.document_number,
          'Fecha Emisión': formatDate(q.created_at),
          'Estado': q.status.toUpperCase(),
          'Cliente': q.clients?.name || 'N/A',
          'Consultor': q.profiles?.full_name || 'N/A',
          'Producto': 'Sin productos registrados',
          'Cantidad': 0,
          'V. Total Ítem (COP)': 0,
          'Monto Total Doc': q.total
        });
      }
    });

    // Creamos la hoja y el libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Ajuste opcional: Ancho de columnas para que se vea bien al abrirlo
    const wscols = [
      {wch: 15}, {wch: 15}, {wch: 12}, {wch: 30}, {wch: 25}, 
      {wch: 40}, {wch: 10}, {wch: 20}, {wch: 20}
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Detalle_Ventas_ALZ");

    // Descargamos
    const fileName = `ALZ_Reporte_Detallado_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
    
       
{/* HEADER PRINCIPAL */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          
          {/* IZQUIERDA: Títulos */}
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#04ec1f', margin: '0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={32} /> Analítica Comercial
            </h1>
            <p style={{ color: '#a3a3a3', marginTop: '0.5rem', margin: 0 }}>Análisis de rendimiento y KPIs de ALZ ORION.</p>
          </div>

          {/* DERECHA: Controles (Exportar + Filtros) */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
            
            {/* BOTÓN EXCEL */}
            <button 
              onClick={handleExportExcel}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#323233', color: '#04ec1f', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', height: 'fit-content' }}
            >
              <Download size={18} /> Exportar
            </button>

            {/* COLUMNA DE FILTROS (Para que las fechas caigan debajo ordenadamente) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              
              {/* SELECTOR DE RANGO DINÁMICO */}
              <div style={{ display: 'flex', gap: '0.2rem', backgroundColor: '#0a0a0a', padding: '0.4rem', borderRadius: '0.5rem', border: '1px solid #1f2937' }}>
                {(['all', 'year', 'month', 'week', 'custom'] as const).map(range => (
                  <button 
                    key={range}
                    onClick={() => setTimeRange(range)}
                    style={{
                      backgroundColor: timeRange === range ? '#04ec1f' : 'transparent',
                      color: timeRange === range ? '#000' : '#a3a3a3',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {range === 'all' ? 'Histórico' : range === 'year' ? 'Este Año' : range === 'month' ? 'Mes' : range === 'week' ? 'Semana' : 'Personalizado'}
                  </button>
                ))}
              </div>

              {/* INPUTS DE FECHA (Se posicionan debajo del menú sin romper el título) */}
              {timeRange === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0a0a0a', padding: '0.4rem 1rem', borderRadius: '0.5rem', border: '1px solid #04ec1f', animation: 'fadeIn 0.3s ease' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', color: '#04ec1f', fontWeight: 'bold', marginBottom: '2px' }}>DESDE</span>
                    <input 
                      type="date" 
                      value={customDates.start} 
                      onChange={(e) => setCustomDates({...customDates, start: e.target.value})}
                      // MAGIA UX: Click para abrir el calendario nativo
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      // MAGIA UX: Prevenir escritura manual
                      onKeyDown={(e) => e.preventDefault()}
                      style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                  
                  <div style={{ width: '1px', height: '25px', backgroundColor: '#1f2937', margin: '0 5px' }}></div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.6rem', color: '#04ec1f', fontWeight: 'bold', marginBottom: '2px' }}>HASTA</span>
                    <input 
                      type="date" 
                      value={customDates.end} 
                      onChange={(e) => setCustomDates({...customDates, end: e.target.value})}
                      // MAGIA UX: Click para abrir el calendario nativo
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      // MAGIA UX: Prevenir escritura manual
                      onKeyDown={(e) => e.preventDefault()}
                      style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

        <p style={{ color: '#a3a3a3', margin: '0' }}>Haz clic en las tarjetas para ver el detalle exacto de las operaciones.</p>
      </div>

      {/* NIVEL 1: TARJETAS DE INDICADORES (KPIs) - AHORA SON CLICKEABLES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* TARJETA 1: VENTAS TOTALES (PO) -> status: confirmada */}
        <div 
          onClick={() => toggleFilter('confirmada')}
          style={{ backgroundColor: activeFilter === 'confirmada' ? '#1f2937' : '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', borderBottom: '4px solid #04ec1f', cursor: 'pointer', transition: 'all 0.2s', transform: activeFilter === 'confirmada' ? 'translateY(-5px)' : 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#a3a3a3', fontSize: '0.875rem', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>Ingresos (PO)</h3>
            <DollarSign size={20} color="#04ec1f" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff' }}>{formatMoney(kpis.total_sales_money)}</div>
          <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.5rem' }}>{kpis.total_po_quantity} ventas confirmadas</div>
        </div>

        {/* TARJETA 2: COTIZACIONES ENVIADAS (SO) -> status: enviada */}
        <div 
          onClick={() => toggleFilter('enviada')}
          style={{ backgroundColor: activeFilter === 'enviada' ? '#1f2937' : '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', borderBottom: '4px solid #3b82f6', cursor: 'pointer', transition: 'all 0.2s', transform: activeFilter === 'enviada' ? 'translateY(-5px)' : 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#a3a3a3', fontSize: '0.875rem', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>Cotizaciones (SO)</h3>
            <FileText size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff' }}>{kpis.total_so_quantity}</div>
          <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.5rem' }}>Esperando cierre</div>
        </div>

        {/* TARJETA 3: BORRADORES -> status: borrador */}
        <div 
          onClick={() => toggleFilter('borrador')}
          style={{ backgroundColor: activeFilter === 'borrador' ? '#1f2937' : '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', borderBottom: '4px solid #9ca3af', cursor: 'pointer', transition: 'all 0.2s', transform: activeFilter === 'borrador' ? 'translateY(-5px)' : 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#a3a3a3', fontSize: '0.875rem', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>Borradores</h3>
            <FileSignature size={20} color="#9ca3af" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff' }}>{kpis.total_drafts_quantity}</div>
          <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.5rem' }}>En edición</div>
        </div>

        {/* TARJETA 4: CANCELADAS -> status: cancelada */}
        <div 
          onClick={() => toggleFilter('cancelada')}
          style={{ backgroundColor: activeFilter === 'cancelada' ? '#1f2937' : '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', borderBottom: '4px solid #ef4444', cursor: 'pointer', transition: 'all 0.2s', transform: activeFilter === 'cancelada' ? 'translateY(-5px)' : 'none' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: '#a3a3a3', fontSize: '0.875rem', fontWeight: '600', margin: 0, textTransform: 'uppercase' }}>Canceladas</h3>
            <XCircle size={20} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#fff' }}>{kpis.total_canceled_quantity}</div>
          <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.5rem' }}>Negocios perdidos</div>
        </div>
      </div>

      {/* ZONA DE DRILL-DOWN (LISTA DE DOCUMENTOS) */}
      {activeFilter && (
        <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', marginBottom: '3rem', animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ListFilter size={20} color="#04ec1f"/> 
              Desglose de Documentos: <span style={{ textTransform: 'capitalize', color: '#04ec1f' }}>{activeFilter}</span>
            </h3>
            <button onClick={() => setActiveFilter(null)} style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ color: '#a3a3a3', borderBottom: '1px solid #374151', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Documento</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Cliente</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Consultor</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Monto (COP)</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>No hay registros para este estado.</td></tr>
                ) : (
                  filteredData.map((doc: any) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #1f2937' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <Link href={`/dashboard/quotes/${doc.id}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 'bold' }}>
                          {doc.document_number}
                        </Link>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#e5e7eb' }}>{doc.clients?.name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9ca3af' }}>{doc.profiles?.full_name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9ca3af' }}>{formatDate(doc.created_at)}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 'bold', color: '#04ec1f' }}>{formatMoney(doc.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

     {/* NIVEL 3: EL DUELO DE TITANES (RANKINGS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        
        {/* COLUMNA IZQUIERDA: TOP CLIENTES */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #1f2937', paddingBottom: '1rem' }}>
            <Users size={24} color="#3b82f6" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Top Clientes (Mayor Inversión)</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {dashboardData.top_clients.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>No hay datos suficientes.</p>
            ) : (
              dashboardData.top_clients.map((client: any, index: number) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', padding: '1rem', borderRadius: '0.75rem', border: index === 0 ? '1px solid #3b82f6' : '1px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Medalla para los 3 primeros, número para el resto */}
                    <div style={{ width: '30px', textAlign: 'center', color: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : '#4b5563', fontWeight: 'bold' }}>
                      {index < 3 ? <Medal size={24} /> : `#${index + 1}`}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#e5e7eb' }}>{client.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{client.po_count} compras (PO)</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#04ec1f' }}>
                    {formatMoney(client.total_money)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: RANKING DE CONSULTORES */}
        <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #1f2937', paddingBottom: '1rem' }}>
            <Trophy size={24} color="#fbbf24" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Hall of Fame: Consultores</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {dashboardData.top_consultants.length === 0 ? (
              <p style={{ color: '#6b7280', textAlign: 'center' }}>No hay datos suficientes.</p>
            ) : (
              dashboardData.top_consultants.map((consultant: any, index: number) => (
                <div key={index} style={{ backgroundColor: '#111827', padding: '1rem', borderRadius: '0.75rem', border: index === 0 ? '1px solid #fbbf24' : '1px solid transparent', position: 'relative', overflow: 'hidden' }}>
                  
                  {/* Brillo de fondo para el #1 */}
                  {index === 0 && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at top right, rgba(251, 191, 36, 0.1), transparent 50%)', pointerEvents: 'none' }}></div>}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {index === 0 ? <Award size={28} color="#fbbf24" /> : <div style={{ width: '28px', textAlign: 'center', color: '#6b7280', fontWeight: 'bold' }}>#{index + 1}</div>}
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem' }}>{consultant.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#a3a3a3' }}>Ingresos generados:</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#04ec1f', fontSize: '1.2rem' }}>
                      {formatMoney(consultant.total_money)}
                    </div>
                  </div>

                  {/* MINISTATÍSTICAS DEL CONSULTOR (SO, PO, Borradores, etc) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', backgroundColor: '#000', padding: '0.5rem', borderRadius: '0.5rem', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', borderRight: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '0.65rem', color: '#a3a3a3', textTransform: 'uppercase' }}>Ventas (PO)</div>
                      <div style={{ fontWeight: 'bold', color: '#04ec1f' }}>{consultant.po_count}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderRight: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '0.65rem', color: '#a3a3a3', textTransform: 'uppercase' }}>Coti (SO)</div>
                      <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{consultant.so_count}</div>
                    </div>
                    <div style={{ textAlign: 'center', borderRight: '1px solid #1f2937' }}>
                      <div style={{ fontSize: '0.65rem', color: '#a3a3a3', textTransform: 'uppercase' }}>Borrador</div>
                      <div style={{ fontWeight: 'bold', color: '#9ca3af' }}>{consultant.drafts_count}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: '#a3a3a3', textTransform: 'uppercase' }}>Perdidas</div>
                      <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{consultant.canceled_count}</div>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
      {/* NIVEL 4: TOP 10 PRODUCTOS (Gráfica de Barras CSS) */}
      <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #1f2937', paddingBottom: '1rem' }}>
          <BarChart size={24} color="#04ec1f" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>Top 10 Productos Más Vendidos</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {top_products.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center' }}>No hay ventas confirmadas en este periodo.</p>
          ) : (
            top_products.map((product: any, index: number) => {
              // Calculamos el ancho de la barra (El producto más vendido tendrá 100% de ancho)
              const widthPercentage = Math.max((product.quantity / maxProductQuantity) * 100, 5); // Mínimo 5% para que siempre se vea

              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {/* Nombre y datos */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                    <span style={{ color: '#e5e7eb', fontWeight: 'bold' }}>{index + 1}. {product.name}</span>
                    <span style={{ color: '#a3a3a3' }}>{product.quantity} unidades <span style={{ color: '#04ec1f', marginLeft: '0.5rem' }}>{formatMoney(product.revenue)}</span></span>
                  </div>
                  {/* Barra visual */}
                  <div style={{ width: '100%', height: '12px', backgroundColor: '#111827', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${widthPercentage}%`, 
                      height: '100%', 
                      backgroundColor: '#04ec1f', 
                      backgroundImage: 'linear-gradient(90deg, #00b218, #04ec1f)',
                      borderRadius: '6px',
                      transition: 'width 1s ease-out'
                    }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}