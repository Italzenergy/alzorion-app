"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Lock, Mail, Loader2, ShieldCheck, AlertCircle, X,Eye, EyeOff } from 'lucide-react';
import styles from './page.module.css'; 
import dynamic from 'next/dynamic';
const DarkVeil = dynamic(() => import('../../components/DarkVeil'), { 
  ssr: false 
});

// --- SUBCOMPONENTE PARA LA ALERTA DE SESIÓN EXPIRADA ---
function ExpiredAlert() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setShow(true);
      // Limpiamos la URL para que si recarga la página, no vuelva a salir la alerta
      router.replace('/login'); 
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={24} />
        <div>
          <strong style={{ display: 'block', fontSize: '14px' }}>Tu sesión ha expirado</strong>
          <span style={{ fontSize: '12px' }}>Por tu seguridad, hemos cerrado la sesión. Por favor, ingresa de nuevo.</span>
        </div>
      </div>
      <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
        <X size={20} />
      </button>
    </div>
  );
}
// -------------------------------------------------------

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
     <DarkVeil
        hueShift={120}
        noiseIntensity={0}
        scanlineIntensity={0}
        speed={2.1}
        scanlineFrequency={0}
        warpAmount={0}
      />
      <div className={styles.container}>
        <div className={styles.card}>
          
          <div className={styles.header}>
            <div className={styles.logoContainer}>
              <ShieldCheck color="white" size={32} />
            </div>
            <h2 className={styles.title}>ALZ ORION</h2>
            <p className={styles.subtitle}>Portal de Gestión de Inventario</p>
          </div>

          {/* AQUÍ INSERTAMOS LA ALERTA DE EXPIRACIÓN ENVUELTA EN SUSPENSE  */}
          <Suspense fallback={null}>
            <ExpiredAlert />
          </Suspense>

          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Correo Electrónico</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Tu correo"
                />
              </div>
            </div>

           <div className={styles.inputGroup}>
              <label className={styles.label}>Contraseña</label>
              
              {/* Le agregamos position: 'relative' al wrapper para poder posicionar el ojo */}
              <div className={styles.inputWrapper} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock className={styles.inputIcon} />
                
                <input
                  // MAGIA: Si showPassword es true, es texto. Si es false, son puntitos.
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="••••••••"
                  style={{ width: '100%', paddingRight: '40px' }} // Espacio para que el texto no pise el icono
                />
                
                {/* BOTÓN DEL OJO */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '10px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? (
                <>
                  <Loader2 className={styles.spinner} />
                  Validando...
                </>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}