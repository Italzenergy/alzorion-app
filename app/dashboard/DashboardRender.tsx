"use client";

import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, PackageX, TrendingUp, ShieldAlert, Activity, TableProperties, Calendar, X, Download } from 'lucide-react';
import styles from './page.module.css';

// --- FUNCIONES AYUDANTES CON TIPADO ESTRICTO ---
// Definimos que el resultado es un objeto cuyas llaves son strings y sus valores arreglos
const agruparPor = (array: any[], keyFn: (item: any) => string): Record<string, any[]> => {
  return array.reduce((result: Record<string, any[]>, item: any) => {
    const key = keyFn(item);
    if (!result[key]) result[key] = [];
    result[key].push(item);
    return result;
  }, {});
};

const sumarCantidades = (array: any[]): number => array.reduce((sum, item) => sum + item.quantity, 0);

interface DashboardRenderProps {
  initialStats: any;
  initialDates: { startDate: string; endDate: string };
}

export default function DashboardRender({ initialStats, initialDates }: DashboardRenderProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  // Asignamos las props directamente a variables locales.
  const stats = initialStats;
  const dates = initialDates;

  // El único estado local necesario en el cliente es el del modal interactivo
  const [modalData, setModalData] = useState<{ isOpen: boolean; title: string; items: any[]; type: string }>({
    isOpen: false, title: '', items: [], type: ''
  });

  // FUNCIÓN PARA MANEJAR EL FILTRADO DIRECTO EN LA URL
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    router.push(`?startDate=${newStartDate}&endDate=${newEndDate}`);
  };

  // FUNCIÓN PARA ABRIR LA VENTANA EMERGENTE
  const openDetails = (type: 'entradas' | 'salidas' | 'cuarentena') => {
    if (!stats || !stats.details) return;
    const titles = {
      entradas: 'Detalle de Entradas en el periodo',
      salidas: 'Detalle de Salidas en el periodo',
      cuarentena: 'Mercancía en Cuarentena / Bajas'
    };
    setModalData({
      isOpen: true,
      title: titles[type],
      items: stats.details[type] || [],
      type
    });
  };

  // --- FUNCIÓN OPTIMIZADA: EXPORTAR A EXCEL (LAZY LOADING) ---
  const exportToExcel = async () => {
    if (!stats || !stats.rawInventory) return;

    // Importación dinámica de la librería pesada solo bajo demanda
    const XLSX = await import('xlsx');

    // 1. Mapeamos los datos para que las columnas de Excel queden en español y limpias
    const excelData = stats.rawInventory.map((item: any) => ({
      'Categoría': item.products?.category?.toUpperCase() || 'N/A',
      'Producto': item.products?.name || 'N/A',
      'SKU / Código': item.products?.internal_code || 'N/A',
      'Proveedor': item.products?.supplier || 'N/A',
      'Dueño (Empresa)': item.owner_company || 'N/A',
      'Cantidad': item.quantity,
      'Número de Serie': item.serial_number || 'A Granel',
      'Ubicación / Pallet': item.pallet_id || 'N/A'
    }));

    // 2. Creamos el archivo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario_Disponible");

    // 3. Descargamos el archivo con la fecha de hoy
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Reporte_Inventario_ALZ_${today}.xlsx`);
  };

  const chartColors = ['#04ec1f', '#eab308'];
  const rawInv = stats?.rawInventory || [];
  
  const estInv = rawInv.filter((i: any) => i.products?.category === 'estructuras');
  const invInv = rawInv.filter((i: any) => i.products?.category === 'inversores');
  const panInv = rawInv.filter((i: any) => i.products?.category === 'paneles');

  const estructurasAgrupadas = agruparPor(estInv, (i: any) => i.products?.supplier || 'Sin Marca');
  const inversoresAgrupados = agruparPor(invInv, (i: any) => i.owner_company || 'Sin Dueño');
  const panelesAgrupados = agruparPor(panInv, (i: any) => i.owner_company || 'Sin Dueño');

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bienvenido, {user?.full_name || 'Super Admin'}</h1>
      <p className={styles.subtitle}>Panel de control principal - ALZ ORION</p>

      {/* TARJETAS RÁPIDAS */}
      <div className={styles.quickLinksGrid}>
        <Link href="/dashboard/products" style={{ textDecoration: 'none' }}>
          <div className={`${styles.card} ${styles.cardGreen}`}>
            <h3 className={styles.cardTitleGreen}><PackageX size={20}/> Catálogo de Productos</h3>
            <p className={styles.cardDesc}>Crea y administra las fichas técnicas.</p>
          </div>
        </Link>
        <Link href="/dashboard/inventory" style={{ textDecoration: 'none' }}>
          <div className={`${styles.card} ${styles.cardDark}`}>
            <h3 className={styles.cardTitleWhite}><Activity size={20} color="#04ec1f"/> Módulo de Inventario</h3>
            <p className={styles.cardDesc}>Gestiona ingresos y salidas físicas.</p>
          </div>
        </Link>
        <Link href="/dashboard/actas" style={{ textDecoration: 'none' }}>
          <div className={`${styles.card} ${styles.cardDark}`}>
            <h3 className={styles.cardTitleWhite}><TrendingUp size={20} color="#3b82f6"/> Actas de Salida</h3>
            <p className={styles.cardDesc}>Genera los documentos de despacho.</p>
          </div>
        </Link>
      </div>

      {/* FILTROS DE CALENDARIO DELEGADOS AL SERVIDOR */}
      <div className={styles.filtersHeader}>
        <h2 className={styles.sectionTitle} style={{ margin: 0 }}><Activity size={24} color="#04ec1f"/> Balance Operativo</h2>
        <div className={styles.dateFilters}>
          <Calendar size={18} color="#04ec1f" />
          <span className={styles.dateLabel}>Desde:</span>
          <input 
            type="date" 
            className={styles.dateInput} 
            value={dates?.startDate || ''} 
            onChange={e => handleDateChange(e.target.value, dates?.endDate || '')} 
          />
          <span className={styles.dateLabel}>Hasta:</span>
          <input 
            type="date" 
            className={styles.dateInput} 
            value={dates?.endDate || ''} 
            onChange={e => handleDateChange(dates?.startDate || '', e.target.value)} 
          />
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        
        {/* GRÁFICA INTERACTIVA */}
        <div className={styles.chartSection}>
          <p style={{ color: '#a3a3a3', fontSize: '0.8rem', marginTop: 0 }}>* Clic en las barras para ver detalles</p>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.chartData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#a3a3a3" />
                <YAxis stroke="#a3a3a3" />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                <Bar 
                  dataKey="cantidad" 
                  radius={[4, 4, 0, 0]} 
                  onClick={(data: any) => {
                    if(data && data.keyId) openDetails(data.keyId as 'entradas' | 'salidas' | 'cuarentena');
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {(stats?.chartData || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % 2]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.kpiColumn}>
          {/* TARJETA CUARENTENA INTERACTIVA */}
          <div 
            className={styles.kpiAlertCard} 
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onClick={() => openDetails('cuarentena')}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div className={styles.kpiIconWrapper}><ShieldAlert size={32} color="#ef4444" /></div>
            <div>
              <p className={styles.kpiAlertLabel}>En Cuarentena / Bajas</p>
              <h3 className={styles.kpiAlertValue}>{stats?.problemStock || 0} <span className={styles.kpiUnit}>unds</span></h3>
              <p style={{ margin: 0, fontSize: '0.7rem', color: '#ef4444', marginTop: '5px' }}>Clic para ver lista ↗</p>
            </div>
          </div>

          <div className={styles.alertsCard}>
            <h2 className={styles.alertsTitle}><AlertTriangle size={20} /> Alertas de Stock Bajo</h2>
            {stats?.lowStockAlerts?.length === 0 ? (
              <p className={styles.alertsEmpty}>Inventario saludable.</p>
            ) : (
              <ul className={styles.alertsList}>
                {stats?.lowStockAlerts?.map((prod: any) => (
                  <li key={prod.id} className={styles.alertItem}>
                    <span className={styles.alertName}>{prod.name}</span>
                    <span className={styles.alertBadge}>{prod.stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <hr className={styles.divider} />
      
      {/* TABLAS DINÁMICAS Y BOTÓN DE EXPORTAR */}
      <div className={styles.exportHeader}>
        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
          <TableProperties size={24} color="#04ec1f"/> Resumen de Existencias
        </h2>
        <button onClick={exportToExcel} className={styles.excelBtn} title="Descargar reporte completo en Excel">
          <Download size={18} /> Exportar a Excel
        </button>
      </div>

      <div className={styles.tablesGrid}>
        
        {/* TABLA 1: ESTRUCTURAS */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>Estructura ALZ</span>
            <span>{sumarCantidades(estInv)}</span>
          </div>
          {Object.entries(estructurasAgrupadas).map(([supplier, items]: [string, any]) => {
            const totalSupplier = sumarCantidades(items);
            const itemsPorNombre = agruparPor(items, (i: any) => i.products?.name);
            
            return (
              <details key={supplier} open>
                <summary className={`${styles.rowLevel1} ${styles.detailsSummary}`}>
                  <span className={styles.flexGap}><span>[-]</span> {supplier.toUpperCase()}</span> 
                  <span>{totalSupplier}</span>
                </summary>
                {Object.entries(itemsPorNombre).map(([name, subItems]: [string, any]) => (
                  <div key={name} className={styles.rowItem}>
                    <span>{name}</span>
                    <span>{sumarCantidades(subItems)}</span>
                  </div>
                ))}
              </details>
            );
          })}
        </div>

        {/* TABLA 2: INVERSORES */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>Inversores y Baterías</span>
            <span>{sumarCantidades(invInv)}</span>
          </div>
          {Object.entries(inversoresAgrupados).map(([owner, items]: [string, any]) => {
            const totalOwner = sumarCantidades(items);
            const itemsPorMarca = agruparPor(items, (i: any) => i.products?.supplier || 'Sin Marca');
            
            return (
              <details key={owner} open>
                <summary className={`${styles.rowLevel1} ${styles.detailsSummary}`}>
                  <span className={styles.flexGap}><span>[-]</span> {owner.toUpperCase()}</span> 
                  <span>{totalOwner}</span>
                </summary>
                {Object.entries(itemsPorMarca).map(([marca, subItems]: [string, any]) => {
                  const totalMarca = sumarCantidades(subItems);
                  const itemsPorNombre = agruparPor(subItems, (i: any) => i.products?.name);
                  
                  return (
                    <details key={marca} open>
                      <summary className={`${styles.rowLevel2} ${styles.detailsSummary}`}>
                        <span className={styles.flexGap}><span>[-]</span> {marca.toUpperCase()}</span> 
                        <span>{totalMarca}</span>
                      </summary>
                      {Object.entries(itemsPorNombre).map(([name, finalItems]: [string, any]) => (
                        <div key={name} className={styles.rowItem}>
                          <span>{name}</span>
                          <span>{sumarCantidades(finalItems)}</span>
                        </div>
                      ))}
                    </details>
                  );
                })}
              </details>
            );
          })}
        </div>

        {/* TABLA 3: PANELES */}
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <span>Paneles Solares</span>
            <span>{sumarCantidades(panInv)}</span>
          </div>
          {Object.entries(panelesAgrupados).map(([owner, items]: [string, any]) => {
            const totalOwner = sumarCantidades(items);
            const itemsPorNombre = agruparPor(items, (i: any) => i.products?.name);
            
            return (
              <details key={owner} open>
                <summary className={`${styles.rowLevel1} ${styles.detailsSummary}`}>
                  <span className={styles.flexGap}><span>[-]</span> {owner.toUpperCase()}</span> 
                  <span>{totalOwner}</span>
                </summary>
                {Object.entries(itemsPorNombre).map(([name, subItems]: [string, any]) => {
                  const totalName = sumarCantidades(subItems);
                  const itemsPorPallet = agruparPor(subItems, (i: any) => i.pallet_id || 'Sin Pallet Asignado');

                  return (
                    <details key={name} open={false}>
                      <summary className={`${styles.rowLevel2} ${styles.detailsSummary}`}>
                        <span className={styles.flexGap}><span>[+]</span> {name}</span> 
                        <span>{totalName}</span>
                      </summary>
                      
                      {Object.entries(itemsPorPallet).map(([pallet, serialItems]: [string, any]) => (
                        <details key={pallet} open={false}>
                          <summary className={`${styles.rowItem} ${styles.detailsSummary}`}>
                            <span className={`${styles.flexGap} ${styles.palletIcon}`}>
                              <span>[+]</span> 📦 Pallet: {pallet}
                            </span> 
                            <span>{sumarCantidades(serialItems)}</span>
                          </summary>
                          {serialItems.map((sItem: any, idx: number) => (
                            <div key={idx} className={styles.rowSerial}>
                              <span>↳ Serial: {sItem.serial_number}</span>
                              <span>1</span>
                            </div>
                          ))}
                        </details>
                      ))}

                    </details>
                  );
                })}
              </details>
            );
          })}
        </div>

      </div>

      {/* --- VENTANA EMERGENTE (MODAL) --- */}
      {modalData.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalData({...modalData, isOpen: false})}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalData.type === 'cuarentena' ? <ShieldAlert color="#ef4444"/> : <Activity color="#04ec1f"/>}
                {modalData.title}
              </h3>
              <button className={styles.closeBtn} onClick={() => setModalData({...modalData, isOpen: false})}><X size={24}/></button>
            </div>
            
            <div className={styles.modalBody}>
              {modalData.items.length === 0 ? (
                <p style={{ color: '#a3a3a3', textAlign: 'center' }}>No hay registros para mostrar en este filtro.</p>
              ) : (
                <table className={styles.detailTable}>
                  <thead>
                    <tr>
                      {modalData.type !== 'cuarentena' && <th>Fecha</th>}
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Cant.</th>
                      {modalData.type === 'cuarentena' && <th>Estado</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {modalData.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        {modalData.type !== 'cuarentena' && (
                          <td style={{ color: '#a3a3a3' }}>{new Date(item.date).toLocaleDateString()}</td>
                        )}
                        <td style={{ fontWeight: '500' }}>{item.name}</td>
                        <td style={{ color: '#a3a3a3', fontSize: '0.8rem' }}>{item.sku}</td>
                        <td style={{ color: modalData.type === 'salidas' ? '#eab308' : '#04ec1f', fontWeight: 'bold' }}>
                          {modalData.type === 'salidas' ? '-' : '+'}{item.quantity}
                        </td>
                        {modalData.type === 'cuarentena' && (
                          <td style={{ textTransform: 'capitalize', color: '#ef4444' }}>{item.status}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}