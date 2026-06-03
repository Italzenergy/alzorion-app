import React, { forwardRef } from 'react';

export interface TemplateConfig {
  primaryColor: string;
  fontFamily: string;
  logoUrl: string;
  logoPosition: 'left' | 'center' | 'right';
  title: string;
  roundedBorders: boolean;
  signatureWarehouseUrl: string;
}

interface ActaTemplateProps {
  acta: any;
  config?: TemplateConfig;
}

export const ActaTemplate = forwardRef<HTMLDivElement, ActaTemplateProps>(({ acta, config }, ref) => {
  if (!acta) return null;

  const currentConfig: TemplateConfig = config || {
    primaryColor: '#04ec1f',
    fontFamily: "'Montserrat', sans-serif",
    logoUrl: '', 
    logoPosition: 'left',
    title: 'FORMATO SALIDA DE INSUMOS Y MERCANCIA',
    roundedBorders: true,
    signatureWarehouseUrl: ''
  };

  const fecha = acta.created_at 
    ? new Date(acta.created_at).toLocaleDateString() + ' ' + new Date(acta.created_at).toLocaleTimeString() 
    : new Date().toLocaleString();

  const isRounded = currentConfig.roundedBorders;
  const isCenter = currentConfig.logoPosition === 'center';
  const isRight = currentConfig.logoPosition === 'right';

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');`}</style>
      
      <div ref={ref} style={{ 
        padding: '1.5cm', 
        fontFamily: currentConfig.fontFamily, 
        color: '#000', 
        backgroundColor: '#fff',
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box'
      }}>
        
        {/* ENCABEZADO */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isCenter ? 'column' : (isRight ? 'row-reverse' : 'row'), 
          justifyContent: isCenter ? 'center' : 'space-between', 
          alignItems: isCenter ? 'center' : 'flex-start', 
          marginBottom: '20px',
          gap: '15px'
        }}>
          {currentConfig.logoUrl ? (
            <img src={currentConfig.logoUrl} alt="Logo" style={{ maxHeight: '70px', maxWidth: '250px' }} />
          ) : (
            <div style={{ width: '150px', height: '50px', backgroundColor: currentConfig.primaryColor, borderRadius: isRounded ? '8px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              LOGO
            </div>
          )}

          <div style={{ textAlign: isCenter ? 'center' : (isRight ? 'left' : 'right') }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700' }}>{currentConfig.title}</h2>
            <h3 style={{ margin: 0, color: currentConfig.primaryColor, fontSize: '16px', fontWeight: '600' }}>{acta.document_number}</h3>
          </div>
        </div>

        {/* --- SECCIÓN 1: DATOS DEL CLIENTE (ARRIBA) --- */}
        <div style={{ marginBottom: '20px', fontSize: '13px' }}>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: `2px solid ${currentConfig.primaryColor}`, paddingBottom: '5px', fontWeight: '700', textTransform: 'uppercase' }}>
            Información del Cliente / Destinatario
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            backgroundColor: isRounded ? '#f9fafb' : 'transparent',
            padding: isRounded ? '12px' : '0',
            borderRadius: isRounded ? '8px' : '0'
          }}>
            <div><strong style={{ fontWeight: '600' }}>Cliente:</strong> {acta.client_name || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>NIT/CC:</strong> {acta.client_nid || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Teléfono:</strong> {acta.client_phone || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Correo:</strong> {acta.client_email || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Ciudad Destino:</strong> {acta.destination_city || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Fecha/Hora:</strong> {fecha}</div>
          </div>
        </div>

        {/* TABLA DE MERCANCÍA */}
        <div style={{ marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontWeight: '700', fontSize: '14px' }}>Descripción de Mercancía</h4>
          <div style={{ 
            borderRadius: isRounded ? '10px' : '0', 
            border: `1px solid ${isRounded ? currentConfig.primaryColor : '#000'}`,
            padding: '1px' 
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: currentConfig.primaryColor, color: '#000' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', width: '15%' }}>CANT.</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>DESCRIPCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {acta?.items_detail?.map((item: any, index: number) => {
                  const serialsArray = item.serials 
                    ? item.serials.split(/[\n, ]+/).filter(Boolean) 
                    : [];

                  return (
                    <tr key={index} style={{ pageBreakInside: 'avoid' }}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', textAlign: 'center', verticalAlign: 'top', fontWeight: 'bold' }}>
                        {item.quantity}
                      </td>
                      
                      <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '13px' }}>
                          {item.product_name || item.description || 'Producto sin nombre'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', marginBottom: '8px' }}>
                           {item.internal_code && <span style={{ marginRight: '10px' }}>Ref: {item.internal_code}</span>}
                           {item.accounting_ref && <span>Ref. Contable: {item.accounting_ref}</span>}
                        </div>
                        {serialsArray.length > 0 && (
                          <div style={{ marginTop: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                              Seriales procesados ({serialsArray.length}):
                            </span>
                            
                            <div style={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(2, 1fr)', 
                              gap: '6px 12px', 
                              marginTop: '8px',
                              fontSize: '11px',
                              color: '#4b5563'
                            }}>
                              {serialsArray.map((serial: string, i: number) => (
                                <div key={i} style={{ borderBottom: '1px dashed #e5e7eb', paddingBottom: '2px' }}>
                                  <span style={{ color: '#9ca3af', marginRight: '4px' }}>{i + 1}.</span> 
                                  {serial}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 👇 NUEVO BLOQUE: NOTAS / COMENTARIOS DE LA SO (SOLO LECTURA) 👇 */}
        {acta.comments && acta.comments.trim() !== '' && (
          <div style={{ marginBottom: '25px', fontSize: '13px', pageBreakInside: 'avoid' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: `2px solid ${currentConfig.primaryColor}`, paddingBottom: '5px', fontWeight: '700', textTransform: 'uppercase' }}>
              Notas / Observaciones del Asesor
            </h4>
            <div style={{ 
              backgroundColor: isRounded ? '#f9fafb' : 'transparent',
              padding: isRounded ? '12px' : '0',
              borderRadius: isRounded ? '8px' : '0',
              color: '#374151',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.5'
            }}>
              {acta.comments}
            </div>
          </div>
        )}

        {/* --- SECCIÓN 2: DATOS DEL TRANSPORTADOR (DEBAJO DE TABLA) --- */}
        <div style={{ marginBottom: '30px', fontSize: '13px', pageBreakInside: 'avoid' }}>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: `2px solid ${currentConfig.primaryColor}`, paddingBottom: '5px', fontWeight: '700', textTransform: 'uppercase' }}>
            Datos del Transportador
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            lineHeight: '1.6' 
          }}>
            <div><strong style={{ fontWeight: '600' }}>Conductor:</strong> {acta.transporter_name || 'Particular'}</div>
            <div><strong style={{ fontWeight: '600' }}>Cédula:</strong> {acta.transporter_nid || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Placa Vehículo:</strong> {acta.vehicle_plate || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Empresa:</strong> {acta.transport_company || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Tel. Transportador:</strong> {acta.transporter_phone || 'N/A'}</div>
            <div><strong style={{ fontWeight: '600' }}>Flete Contraentrega:</strong> {acta.is_cash_on_delivery ? 'SÍ' : 'NO'}</div>
          </div>
        </div>

        {/* FIRMAS */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', fontSize: '13px', pageBreakInside: 'avoid' }}>
          <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '8px', position: 'relative' }}>
            {currentConfig.signatureWarehouseUrl && (
              <img src={currentConfig.signatureWarehouseUrl} alt="Firma" style={{ position: 'absolute', bottom: '100%', left: '10%', maxHeight: '70px' }} />
            )}
            <strong>Firma Despacho (Bodega)</strong><br/>
            {'Responsable Lider/Auxi-bodega'}
           <div style={{gridGap:5}}>
             <strong>Acta generada por:</strong><br/>
            {acta.profiles?.full_name || 'Responsable'}
            </div>
          </div>
          <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '8px' }}>
            <strong>Firma Transportador / Recibido</strong><br/>
            C.C:
          </div>
        </div>

        {/* NOTA LEGAL */}
        <div style={{ marginTop: '40px', fontSize: '9px', color: '#777', textAlign: 'justify', pageBreakInside: 'avoid' }}>
          La firma de este documento confirma que la mercancía descrita ha sido entregada en condiciones óptimas. Cualquier reclamación posterior debe realizarse según los términos de garantía vigentes.
        </div>

      </div>
    </div>
  );
});

ActaTemplate.displayName = 'ActaTemplate';