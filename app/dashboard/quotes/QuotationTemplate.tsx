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

interface QuotationTemplateProps {
  quote: any;
  config?: TemplateConfig;
}

export const QuotationTemplate = forwardRef<HTMLDivElement, QuotationTemplateProps>(({ quote, config }, ref) => {
  if (!quote) return null;

  const currentConfig: TemplateConfig = config || {
    primaryColor: '#04ec1f',
    fontFamily: "'Montserrat', sans-serif",
    logoUrl: '', 
    logoPosition: 'left',
    title: 'COTIZACIÓN COMERCIAL',
    roundedBorders: true,
    signatureWarehouseUrl: ''
  };

  const isRounded = currentConfig.roundedBorders;
  const isCenter = currentConfig.logoPosition === 'center';
  const isRight = currentConfig.logoPosition === 'right';

  const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0);
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString('es-CO') : 'N/A';

  return (
    <div>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

  /* Estilos globales para la impresión del PDF */
  @media print {
    @page {
      size: A4;
      margin: 0; /* Lo dejamos en 0 porque el padding del div hace de margen */
    }
    body {
      margin: 0;
      -webkit-print-color-adjust: exact !important; /* Fuerza a imprimir los fondos de color */
      print-color-adjust: exact !important;
    }
  }

  /* ESTA CLASE ES LA MAGIA CONTRA LOS CORTES DE PÁGINA */
  .avoid-break {
    page-break-inside: avoid;
    break-inside: avoid;
  }
`}</style>
      
      {/* EL CONTENEDOR PRINCIPAL: Aquí agregamos el Padding (Márgenes reales) */}
      <div ref={ref} style={{ 
        fontFamily: currentConfig.fontFamily, 
        color: '#000', 
        backgroundColor: '#fff',
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box',
        padding: '40px 50px', // <-- MAGIA: 40px arriba/abajo, 50px a los lados
        margin: '0 auto' // Para que en la vista previa de tu pantalla se vea centrado
      }}>
        
        {/* ENCABEZADO Y LOGO */}
        <div className="avoid-break" style={{ 
          display: 'flex', 
          flexDirection: isCenter ? 'column' : (isRight ? 'row-reverse' : 'row'), 
          justifyContent: isCenter ? 'center' : 'space-between', 
          alignItems: isCenter ? 'center' : 'flex-start', 
          marginBottom: '20px',
          borderBottom: `2px solid ${currentConfig.primaryColor}`,
          paddingBottom: '20px',
          gap: '15px'
        }}>
          {currentConfig.logoUrl ? (
            <img src={currentConfig.logoUrl} alt="Logo" style={{ maxHeight: '70px', maxWidth: '250px', objectFit: 'contain' }} />
          ) : (
            <div style={{ width: '150px', height: '50px', backgroundColor: currentConfig.primaryColor, borderRadius: isRounded ? '8px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              LOGO ALZ ORION
            </div>
          )}

          <div style={{ textAlign: isCenter ? 'center' : (isRight ? 'left' : 'right') }}>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: '700', textTransform: 'uppercase' }}>{currentConfig.title}</h2>
            <h3 style={{ margin: 0, color: currentConfig.primaryColor, fontSize: '18px', fontWeight: '600' }}>{quote.document_number}</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#555' }}>Fecha: {formatDate(quote.created_at)}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>Válido hasta: {formatDate(quote.valid_until)}</p>
          </div>
        </div>

        {/* DATOS DEL CLIENTE Y ASESOR */}
        <div className="avoid-break" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', fontSize: '12px' }}>
          
          {/* CLIENTE */}
          <div style={{ backgroundColor: isRounded ? '#f9fafb' : 'transparent', padding: isRounded ? '15px' : '0', borderRadius: isRounded ? '8px' : '0' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: `1px solid ${currentConfig.primaryColor}`, paddingBottom: '5px', fontWeight: '700', textTransform: 'uppercase' }}>Preparado Para</h4>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{quote.clients?.name}</div>
            <div><strong>NIT/CC:</strong> {quote.clients?.nid}</div>
            <div><strong>Teléfono:</strong> {quote.clients?.phone || 'N/A'}</div>
            <div><strong>Correo:</strong> {quote.clients?.email || 'N/A'}</div>
            {quote.clients?.address && <div><strong>Dirección:</strong> {quote.clients.address}</div>}
          </div>

          {/* ASESOR */}
          <div style={{ backgroundColor: isRounded ? '#f9fafb' : 'transparent', padding: isRounded ? '15px' : '0', borderRadius: isRounded ? '8px' : '0' }}>
            <h4 style={{ margin: '0 0 10px 0', borderBottom: `1px solid ${currentConfig.primaryColor}`, paddingBottom: '5px', fontWeight: '700', textTransform: 'uppercase' }}>Preparado Por</h4>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{quote.profiles?.full_name || 'Asesor Comercial'}</div>
            <div><strong>Correo:</strong> {quote.profiles?.email || 'N/A'}</div>
            <div><strong>Empresa:</strong> ALZ ORION</div>
          </div>
        </div>

        {/* TABLA DE PRODUCTOS */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ borderRadius: isRounded ? '8px' : '0', overflow: 'hidden', border: `1px solid ${isRounded ? currentConfig.primaryColor : '#000'}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr className="avoid-break" style={{ backgroundColor: currentConfig.primaryColor, color: '#000' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #000' }}>Descripción del Producto</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #000', width: '10%' }}>Cant.</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #000', width: '20%' }}>V. Unitario</th>
                  <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #000', width: '20%' }}>V. Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.quotation_items?.map((item: any, idx: number) => (
                  <tr key={idx} className="avoid-break" style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontWeight: '600' }}>{item.product_name}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>
                      {item.internal_code && <span style={{ marginRight: '10px' }}>Ref: {item.internal_code}</span>}
                      {item.accounting_ref && <span>Ref. Contable: {item.accounting_ref}</span>}
                    </div>
                      {Number(item.tax_rate) > 0 && <div style={{ fontSize: '10px', color: '#666' }}>Incluye IVA ({(Number(item.tax_rate)*100).toFixed(0)}%)</div>}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatMoney(item.unit_price)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{formatMoney(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOTALES */}
        <div className="avoid-break" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '250px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>Subtotal:</span>
              <span>{formatMoney(quote.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
              <span>Impuestos:</span>
              <span>{formatMoney(quote.tax_total)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '16px', fontWeight: 'bold', color: currentConfig.primaryColor }}>
              <span>TOTAL:</span>
              <span>{formatMoney(quote.total)}</span>
            </div>
          </div>
        </div>

        {/* ZONA INFERIOR: NOTAS Y TÉRMINOS LEGALES */}
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* NOTAS DEL ASESOR */}
          {quote.notes && quote.notes.trim() !== '' && (
            <div className="avoid-break" style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f6733b' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1f2937', fontWeight: 'bold' }}>Notas Adicionales</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
                {quote.notes}
              </p>
            </div>
          )}

          {/* TÉRMINOS Y CONDICIONES */}
          <div className="avoid-break" style={{ borderLeft: `4px solid ${currentConfig.primaryColor}`, paddingLeft: '15px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#1f2937', fontWeight: 'bold' }}>
              Términos y Condiciones
            </h4>
            <div style={{ margin: 0, fontSize: '10px', color: '#6b7280', lineHeight: '1.6' }}>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Vigencia de la oferta:</strong> {quote.validity_days ?? 5} días calendario. La venta o reserva de equipos se inicia con Orden de Compra, comprobante de pago y/o anticipo del {quote.advance_percentage ?? 30}% del valor total ofertado.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Instalación:</strong> El cliente asume la responsabilidad en la instalación y montaje de los equipos.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Pagos:</strong> Las transferencias o consignaciones se deben efectuar a nombre de {quote.company_name ?? 'ALZ ENERGY SAS'} NIT: {quote.nit ?? '901.105.238-6'} en la cuenta de ahorros No {quote.bank_account ?? '046170483120'} {quote.bank_name ?? 'Davivienda'}.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Flete:</strong> El transporte y envío solo está incluido para inversores, smart meter, smart power y smart dongle hacia {quote.cities ?? 'Medellín, Bogotá, Barranquilla, Cali, Bucaramanga y Cúcuta'}. Estructura de aluminio y módulos solares no incluyen flete de envío y transporte.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Disponibilidad:</strong> Antes de realizar la compra se debe verificar que los artículos cotizados estén disponibles.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Entrega:</strong> {quote.company_name ?? 'ALZ ENERGY'} no es responsable por hechos de fuerza mayor que retrasen la entrega. Tiempo estimado: hasta {quote.delivery_days ?? 6} días hábiles posteriores al envío del comprobante de pago.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Empaque:</strong> Los equipos ofertados están sellados y embalados con el sello de {quote.company_name ?? 'ALZ ENERGY SAS'}.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Retenciones:</strong> Para compras que superen ${quote.retention_base ?? '498.000'} aplicar el {quote.retention_rate ?? '2,5'}%. Para fletes superiores a ${quote.freight_base ?? '100.000'} aplicar el {quote.freight_rate ?? '1'}%.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Importante:</strong> No firmar guías de recibido sin inspección previa. Reportar novedades a logística: {quote.logistics_phone ?? '+57 317 1928395'}. {quote.company_name ?? 'ALZ ENERGY'} no responderá por daños no reportados antes de la recepción.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Soporte técnico:</strong> Atención de lunes a viernes de {quote.support_hours ?? '07:30am a 04:30pm'}, no aplica fines de semana ni festivos.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Puesta en marcha:</strong> Debe programarse con mínimo {quote.startup_notice_days ?? 2} días hábiles de anticipación y disponer de {quote.startup_duration_hours ?? 2} horas. Horario: {quote.startup_schedule ?? '07:30am a 03:00pm'}.</p>
              <p style={{ margin: '0 0 4px 0' }}>• <strong>Contacto soporte:</strong> {quote.support_phone ?? '+57 318 5135015'}.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
});

QuotationTemplate.displayName = 'QuotationTemplate';