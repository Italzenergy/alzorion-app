"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore'; // <-- 1. Saber quién es el usuario actual
import { Shield, UserPlus, Users, Trash2, CheckCircle2, AlertCircle, Edit, KeyRound, Eye, EyeOff } from 'lucide-react';
import styles from './user.module.css';

export default function SecuritySettingsPage() {
  const { user: currentUser } = useAuthStore(); // El Super Admin logueado
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Estados nuevos
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'logistica'
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get<any>('/users');
      setUsers(response);
    } catch (error) {
      console.error("Error cargando usuarios", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para generar contraseña aleatoria segura
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let newPassword = "";
    for (let i = 0; i < 10; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: newPassword });
    setShowPassword(true); // Se la mostramos para que la copie
  };

  const handleEditClick = (u: any) => {
    setEditingUserId(u.id);
    setFormData({
      full_name: u.full_name,
      email: u.email,
      password: '', // Se deja vacía por seguridad. Solo se llena si la quiere cambiar.
      role: u.role
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Subimos la pantalla al formulario
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setFormData({ full_name: '', email: '', password: '', role: 'logistica' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (editingUserId) {
        // MODO EDICIÓN
        await api.put<any>(`/users/${editingUserId}`, formData);
        setMessage({ type: 'success', text: 'Usuario actualizado correctamente.' });
      } else {
        // MODO CREACIÓN
        await api.post<any>('/users', formData);
        setMessage({ type: 'success', text: 'Cuenta creada exitosamente. Ya pueden iniciar sesión.' });
      }
      
      cancelEdit();
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Error en la operación.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // REGLA 2: No permitir auto-eliminación
    if (currentUser?.id === id) {
      setMessage({ type: 'error', text: 'Por seguridad, no puedes eliminar tu propia cuenta.' });
      return;
    }

    if (!window.confirm(`¿Estás seguro de que quieres revocarle el acceso a ${name}?`)) return;
    try {
      await api.delete<any>(`/users/${id}`);
      setMessage({ type: 'success', text: 'Acceso revocado correctamente.' });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'No se pudo eliminar el usuario.' });
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') return <span className={`${styles.badge} ${styles.badgeAdmin}`}>Admin</span>;
    if (role === 'logistica') return <span className={`${styles.badge} ${styles.badgeLogistica}`}>Logística</span>;
    return <span className={`${styles.badge} ${styles.badgeConsultor}`}>Consultor</span>;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}><Shield size={32} /> Seguridad y Accesos</h1>
      <p className={styles.subtitle}>Administra quién puede entrar al sistema y qué permisos tiene.</p>

      {message && (
        <div style={{ backgroundColor: message.type === 'success' ? 'rgba(4, 236, 31, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#04ec1f' : '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <strong>{message.text}</strong>
        </div>
      )}

      <div className={styles.grid}>
        
        {/* FORMULARIO (SIRVE PARA CREAR Y EDITAR) */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>
            <UserPlus size={20} color={editingUserId ? "#3b82f6" : "#04ec1f"}/> 
            {editingUserId ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre Completo *</label>
              <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className={styles.input} placeholder="Ej. Duvan..." />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Correo Electrónico *</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className={styles.input} placeholder="correo@empresa.com" disabled={!!editingUserId} title={editingUserId ? "El correo no se puede cambiar" : ""} style={{ opacity: editingUserId ? 0.6 : 1 }} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                {editingUserId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal *'}
              </label>
              
              {/* INPUT DE CONTRASEÑA CON BOTONES INTEGRADOS */}
              <div className={styles.passwordWrapper}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required={!editingUserId} 
                  value={formData.password} 
                  onChange={handleChange} 
                  className={styles.input} 
                  placeholder={editingUserId ? "Déjalo vacío para no cambiarla" : "Escribe o genera una clave"} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.iconBtn} title="Ver/Ocultar">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button type="button" onClick={generatePassword} className={styles.iconBtn} title="Generar Clave Segura">
                  <KeyRound size={18} />
                </button>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nivel de Acceso (Rol) *</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                className={styles.select}
                disabled={currentUser?.id === editingUserId} // Evita que te quites tu propio rol de Admin
              >
                <option value="logistica">Logística (Bodega, Actas, Ingresos)</option>
                <option value="consultor">Consultor Comercial (Solo Ver y Cotizar)</option>
                <option value="admin">Administrador (Control Total)</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" disabled={loading} className={styles.submitBtn} style={{ flex: 1, backgroundColor: editingUserId ? "#3b82f6" : "#04ec1f" }}>
                {loading ? 'Procesando...' : (editingUserId ? 'Actualizar Datos' : 'Otorgar Acceso')}
              </button>
              
              {editingUserId && (
                <button type="button" onClick={cancelEdit} className={styles.submitBtn} style={{ flex: 0.5, backgroundColor: "#ef4444", color: "#fff" }}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LISTA DE USUARIOS ACTIVOS */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}><Users size={20} color="#04ec1f"/> Equipo Autorizado</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: '500' }}>{u.full_name} {currentUser?.id === u.id && <span style={{ fontSize: '0.7rem', color: '#04ec1f' }}>(Tú)</span>}</td>
                  <td style={{ color: '#a3a3a3', fontSize: '0.875rem' }}>{u.email}</td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {/* BOTÓN EDITAR */}
                    <button onClick={() => handleEditClick(u)} className={styles.editBtn} title="Editar Usuario">
                      <Edit size={18} />
                    </button>
                    {/* BOTÓN ELIMINAR */}
                    <button 
                      onClick={() => handleDelete(u.id, u.full_name)} 
                      className={styles.deleteBtn} 
                      title={currentUser?.id === u.id ? "No puedes eliminarte a ti mismo" : "Eliminar Acceso"}
                      style={{ opacity: currentUser?.id === u.id ? 0.3 : 1, cursor: currentUser?.id === u.id ? 'not-allowed' : 'pointer' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#a3a3a3', padding: '2rem' }}>No hay usuarios registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}