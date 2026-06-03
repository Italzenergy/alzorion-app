"use client";

import { useState, useEffect } from 'react';
import { QuotationTemplate, TemplateConfig } from '../QuotationTemplate'; // Asegúrate de que la ruta sea correcta
import { Save, Image as ImageIcon, Type, Palette, AlignLeft, Square, FileText } from 'lucide-react';

export default function QuoteTemplateEditorPage() {
  const [config, setConfig] = useState<TemplateConfig>({
    primaryColor: '#04ec1f',
    fontFamily: "'Montserrat', sans-serif",
    logoUrl: '',
    logoPosition: 'left',
    title: 'COTIZACIÓN COMERCIAL',
    roundedBorders: true,
    signatureWarehouseUrl: '' // Lo dejamos por compatibilidad con la interfaz
  });

  useEffect(() => {
    // Usamos una llave separada para las cotizaciones
    const saved = localStorage.getItem('alz_quote_template');
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const handleChange = (field: keyof TemplateConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSave = () => {
    localStorage.setItem('alz_quote_template', JSON.stringify(config));
    alert('¡Plantilla de Cotización actualizada correctamente!');
  };

  // Datos de prueba para que veas cómo queda el PDF en tiempo real
  const dummyQuote = {
    document_number: 'SO-0001',
    created_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 15 * 86400000).toISOString(), // +15 días
    subtotal: 1000000,
    tax_total: 190000,
    total: 1190000,
    notes: 'Condiciones de pago: 50% anticipo, 50% contraentrega. Validez de 15 días.',
    clients: {
      name: 'Cliente de Prueba SAS',
      nid: '900.123.456-7',
      phone: '300 123 4567',
      email: 'compras@clienteprueba.com',
      address: 'Calle Falsa 123, Bogotá'
    },
    profiles: {
      full_name: 'Miguel Marulanda',
      email: 'miguel@alzorion.com'
    },
    quotation_items: [
      { product_name: '[PAN-01] Panel Solar 600W Astronergy', quantity: 10, unit_price: 50000, tax_rate: 0.19, total_price: 500000 },
      { product_name: '[INV-02] Inversor Huawei 5kW', quantity: 1, unit_price: 500000, tax_rate: 0.19, total_price: 500000 }
    ]
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#04ec1f', margin: '0' }}>
          Personalizar Formato de Cotización
        </h1>
        <p style={{ color: '#a3a3a3', marginTop: '0.2rem' }}>
          Modifica el diseño, colores y el logo de los PDF que se envían a los clientes.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* PANEL DE CONTROL (Izquierda) */}
        <div style={{ flex: '1 1 30%', backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Palette size={18} color="#04ec1f" /> Color Principal</label>
            <input type="color" value={config.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Type size={18} color="#04ec1f" /> Tipografía</label>
            <select value={config.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }}>
              <option value="'Montserrat', sans-serif">Montserrat (Corporativa)</option>
              <option value="Arial, Helvetica, sans-serif">Arial / Helvetica (Clásica)</option>
              <option value="'Times New Roman', Times, serif">Times New Roman (Formal)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Square size={18} color="#04ec1f" /> Estilo de Bordes</label>
            <select value={config.roundedBorders ? 'yes' : 'no'} onChange={(e) => handleChange('roundedBorders', e.target.value === 'yes')} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }}>
              <option value="yes">Moderno (Bordes redondeados)</option>
              <option value="no">Clásico (Bordes cuadrados)</option>
            </select>
          </div>

          <hr style={{ borderColor: '#1f2937', margin: '2rem 0' }}/>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><ImageIcon size={18} color="#04ec1f" /> URL del Logo</label>
            <input type="text" placeholder="Pega el link de tu logo aquí..." value={config.logoUrl} onChange={(e) => handleChange('logoUrl', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><AlignLeft size={18} color="#04ec1f" /> Posición del Logo</label>
            <select value={config.logoPosition} onChange={(e) => handleChange('logoPosition', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }}>
              <option value="left">Alineado a la Izquierda</option>
              <option value="center">Centrado Superior</option>
              <option value="right">Alineado a la Derecha</option>
            </select>
          </div>

          <hr style={{ borderColor: '#1f2937', margin: '2rem 0' }}/>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><FileText size={18} color="#04ec1f" /> Título Principal</label>
            <input type="text" value={config.title} onChange={(e) => handleChange('title', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #374151', borderRadius: '0.5rem', outline: 'none' }} />
          </div>

          <button onClick={handleSave} style={{ width: '100%', backgroundColor: '#04ec1f', color: '#000', border: 'none', padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <Save size={20} /> Guardar Diseño
          </button>
        </div>

        {/* VISTA PREVIA (Derecha) */}
        <div style={{ flex: '1 1 70%', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', marginBottom: '-150px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <QuotationTemplate quote={dummyQuote} config={config} />
          </div>
        </div>

      </div>
    </div>
  );
}