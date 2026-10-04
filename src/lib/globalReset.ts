import { runUntracked } from '@/lib/activityTracker'
import { useActivityStore } from '@/store/useActivityStore'
import { useDirectoryStore } from '@/store/useDirectoryStore'
import { useLiveStore } from '@/store/useLiveStore'
import { useScheduleStore } from '@/store/useScheduleStore'
import { useWorkforceStore } from '@/store/useWorkforceStore'
 
/**
 * Reinicia TODOS los datos de demostración a la vez, para que los stores nunca queden desfasados
 * (por ejemplo, un usuario creado en el directorio cuyo agente ya no existe).
 * El historial de actividad se conserva y recibe un único evento de sistema.
 * Es el ÚNICO reinicio que debe exponer la interfaz.
 */
export function resetApplicationState(): void {
  runUntracked(() => {
    // Orden: primero operaciones (agentes), luego lo que depende de ellos
    useWorkforceStore.getState().resetDemoData()
    useDirectoryStore.getState().resetDirectoryDemo()
    useScheduleStore.getState().resetScheduleDemo()
    useLiveStore.getState().resetLiveDemo()
  })
  useActivityStore.getState().record([
    { category: 'system', agentId: null, message: 'Se reiniciaron todos los datos de demostración' },
  ])
}
