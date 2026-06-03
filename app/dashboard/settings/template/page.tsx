"use client";

import { useState, useEffect } from 'react';
import { ActaTemplate, TemplateConfig } from '../../actas/ActaTemplate';
import { Save, Image as ImageIcon, Type, Palette, AlignLeft, Square, PenTool } from 'lucide-react';

export default function TemplateEditorPage() {
  const [config, setConfig] = useState<TemplateConfig>({
    primaryColor: '#04ec1f',
    fontFamily: "'Montserrat', sans-serif",
    logoUrl: '',
    logoPosition: 'left',
    title: 'FORMATO SALIDA DE INSUMOS Y MERCANCIA',
    roundedBorders: true,
    signatureWarehouseUrl: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('alz_acta_template');
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const handleChange = (field: keyof TemplateConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handleSave = () => {
    localStorage.setItem('alz_acta_template', JSON.stringify(config));
    alert('¡Plantilla actualizada correctamente! Todas las actas nuevas usarán este diseño.');
  };

  const dummyActa = {
    document_number: 'ACT-0000',
    created_at: new Date().toISOString(),
    client_name: 'Cliente de Prueba SAS',
    destination_city: 'Bogotá',
    transporter_name: 'Juan Pérez',
    transporter_nid: '12345678',
    vehicle_plate: 'XYZ-123',
    operation_type: 'Salida de Bodega',
    items_detail: [
      { quantity: 10, description: 'Panel Solar 600W Astronergy' },
      { quantity: 50, description: 'Estructura Aluminio SOEN' }
    ]
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#04ec1f', margin: '0' }}>Personalizar Plantilla PDF</h1>
        <p style={{ color: '#a3a3a3', marginTop: '0.2rem' }}>Modifica diseño, alineación, bordes y firmas.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* PANEL DE CONTROL (Izquierda) */}
        <div style={{ flex: '1 1 30%', backgroundColor: '#0a0a0a', border: '1px solid #1f2937', borderRadius: '1rem', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }}>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Palette size={18} color="#04ec1f" /> Color Principal</label>
           <input type="color" value={config.primaryColor || '#04ec1f'} onChange={(e) => handleChange('primaryColor', e.target.value)} style={{ width: '100%', height: '40px', cursor: 'pointer', border: 'none', background: 'none' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Type size={18} color="#04ec1f" /> Tipografía</label>
            <select value={config.fontFamily} onChange={(e) => handleChange('fontFamily', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #1f2937', borderRadius: '0.5rem' }}>
              <option value="'Montserrat', sans-serif">Montserrat (Corporativa ALZ)</option>
              <option value="Arial, Helvetica, sans-serif">Arial / Helvetica (Clásica)</option>
              <option value="'Times New Roman', Times, serif">Times New Roman (Formal)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Square size={18} color="#04ec1f" /> Estilo de Diseño</label>
            <select value={config.roundedBorders ? 'yes' : 'no'} onChange={(e) => handleChange('roundedBorders', e.target.value === 'yes')} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #1f2937', borderRadius: '0.5rem' }}>
              <option value="yes">Moderno (Bordes redondeados + Cajas)</option>
              <option value="no">Clásico (Bordes cuadrados simples)</option>
            </select>
          </div>

          <hr style={{ borderColor: '#1f2937', margin: '2rem 0' }}/>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><ImageIcon size={18} color="#04ec1f" /> URL del Logo</label>
            <input type="text" placeholder="URL Base64 o link de imagen" value={config.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #1f2937', borderRadius: '0.5rem' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><AlignLeft size={18} color="#04ec1f" /> Posición del Logo</label>
            <select value={config.logoPosition} onChange={(e) => handleChange('logoPosition', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #1f2937', borderRadius: '0.5rem' }}>
              <option value="left">Alineado a la Izquierda</option>
              <option value="center">Centrado Superior</option>
              <option value="right">Alineado a la Derecha</option>
            </select>
          </div>

          <hr style={{ borderColor: '#1f2937', margin: '2rem 0' }}/>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><PenTool size={18} color="#04ec1f" /> Firma Bodega (URL / Base64)</label>
            <input type="text" placeholder="Firma digitalizada (opcional)" value={config.signatureWarehouseUrl || ''} onChange={(e) => handleChange('signatureWarehouseUrl', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #1f2937', borderRadius: '0.5rem' }} />            <span style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '0.2rem', display: 'block' }}>Aparecerá pre-impresa en la zona de firma de bodega.</span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', marginBottom: '0.5rem' }}><Type size={18} color="#04ec1f" /> Título del Documento</label>
            <input type="text" value={config.title || ''} onChange={(e) => handleChange('title', e.target.value)} style={{ width: '100%', padding: '0.75rem', backgroundColor: '#000', color: '#fff', border: '1px solid #1f2937', borderRadius: '0.5rem' }} />
          </div>

          <button onClick={handleSave} style={{ width: '100%', backgroundColor: '#04ec1f', color: '#000', border: 'none', padding: '1rem', borderRadius: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <Save size={20} /> Guardar Diseño
          </button>
        </div>

        {/* VISTA PREVIA (Derecha) */}
        <div style={{ flex: '1 1 70%', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '1rem', padding: '1rem', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
          <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', marginBottom: '-100px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <ActaTemplate acta={dummyActa} config={config} />
          </div>
        </div>

      </div>
    </div>
  );
}