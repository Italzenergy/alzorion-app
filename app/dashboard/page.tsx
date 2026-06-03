// app/dashboard/page.tsx
import DashboardRender from "./DashboardRender";
import { apiServer } from "@/lib/apiServer";

// En Next.js, las páginas que corren en el servidor reciben los parámetros 
// de la URL (Query Strings) directamente a través de la propiedad 'searchParams'.
export default async function ConsultaDash({
  searchParams,
}: {
  searchParams: { startDate?: string; endDate?: string };
}) {
  
  // ==========================================================
  // 1. CÁLCULO DE FECHAS POR DEFECTO (JAVASCRIPT PURO)
  // ==========================================================
  // Al ejecutarse en el servidor, este bloque calcula las fechas
  // en tiempo real cada vez que un usuario solicita o recarga la página.
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const currentDate = today.toISOString().split('T')[0];

  // Si el usuario ya filtró y la URL tiene fechas, usamos esas.
  // Si la URL viene limpia, le asignamos el rango por defecto (mes actual).
  const fechaInicio = searchParams.startDate || firstDay;
  const fechaFin = searchParams.endDate || currentDate;

  // ==========================================================
  // 2. CONSULTA ULTRA RÁPIDA AL BACKEND (MUNDO SERVIDOR)
  // ==========================================================
  let statsData = null;

  try {
    // Consumimos nuestra herramienta gemela del servidor (apiServer).
    // Usamos de forma estricta { cache: 'no-store' } para asegurar datos 
    // 100% frescos y consistentes en cada petición de inventario.
    statsData = await apiServer.get<any>(
      `/inventory/dashboard-stats?startDate=${fechaInicio}&endDate=${fechaFin}`,
      { cache: 'no-store' }
    );
  } catch (error) {
    // Si ocurre un error de red o de base de datos, lo capturamos 
    // en los logs del servidor para auditoría sin romper la app.
    console.error("Error consultando estadísticas desde el servidor de Next.js:", error);
  }

  // ==========================================================
  // 3. BALANCEO DE CARGA: INVOCACIÓN Y SERVIDO AL HIJO
  // ==========================================================
  // El Padre termina su ciclo de vida aquí, entregándole las dos 
  // mochilas de datos listas al componente interactivo del Cliente.
  return (
    <DashboardRender
      initialStats={statsData}
      initialDates={{ startDate: fechaInicio, endDate: fechaFin }}
    />
  );
}