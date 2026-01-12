import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DerivedTask, Metrics, Task } from '@/types';
import {
  computeAverageROI,
  computePerformanceGrade,
  computeRevenuePerHour,
  computeTimeEfficiency,
  computeTotalRevenue,
  withDerived,
  sortTasks as sortDerived,
} from '@/utils/logic';
// Local storage removed per request; keep everything in memory
import { generateSalesTasks } from '@/utils/seed';

interface UseTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  derivedSorted: DerivedTask[];
  metrics: Metrics;
  lastDeleted: Task | null;
  addTask: (task: Omit<Task, 'id'> & { id?: string }) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  clearLastDeleted: () => void; // [BUG 2 FIX] Added capability to clear undo state
}

const INITIAL_METRICS: Metrics = {
  totalRevenue: 0,
  totalTimeTaken: 0,
  timeEfficiencyPct: 0,
  revenuePerHour: 0,
  averageROI: 0,
  performanceGrade: 'Needs Improvement',
};

export function useTasks(): UseTasksState {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);
  
  // [BUG 1 FIX] Ref to track if we have already fetched in this session
  const fetchedRef = useRef(false);

  function normalizeTasks(input: any[]): Task[] {
    const now = Date.now();
    return (Array.isArray(input) ? input : []).map((t, idx) => {
      const created = t.createdAt ? new Date(t.createdAt) : new Date(now - (idx + 1) * 24 * 3600 * 1000);
      const completed = t.completedAt || (t.status === 'Done' ? new Date(created.getTime() + 24 * 3600 * 1000).toISOString() : undefined);
      
      // [BUG 5 FIX] Ensure safe numbers during normalization
      const safeTime = Number(t.timeTaken);
      return {
        id: t.id,
        title: t.title,
        revenue: Number(t.revenue) || 0, // Fallback to 0 if NaN
        timeTaken: safeTime > 0 ? safeTime : 1, // Prevent division by zero
        priority: t.priority,
        status: t.status,
        notes: t.notes,
        createdAt: created.toISOString(),
        completedAt: completed,
      } as Task;
    });
  }

  // Initial load
  useEffect(() => {
    // [BUG 1 FIX] Prevent StrictMode double-invocation
    if (fetchedRef.current) return;

    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/tasks.json');
        if (!res.ok) throw new Error(`Failed to load tasks.json (${res.status})`);
        const data = (await res.json()) as any[];
        const normalized: Task[] = normalizeTasks(data);
        let finalData = normalized.length > 0 ? normalized : generateSalesTasks(50);
        
        // [BUG 5 FIX] REMOVED the "Injected bug" block that added malformed rows/NaN values
        
        if (isMounted) setTasks(finalData);
      } catch (e: any) {
        if (isMounted) setError(e?.message ?? 'Failed to load tasks');
      } finally {
        if (isMounted) {
          setLoading(false);
          fetchedRef.current = true; // Mark as fetched
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // [BUG 1 FIX] REMOVED the second "opportunistic" useEffect entirely.
  // That effect was causing the double fetch and duplicate data appending.

  const derivedSorted = useMemo<DerivedTask[]>(() => {
    const withRoi = tasks.map(withDerived);
    return sortDerived(withRoi);
  }, [tasks]);

  const metrics = useMemo<Metrics>(() => {
    if (tasks.length === 0) return INITIAL_METRICS;
    const totalRevenue = computeTotalRevenue(tasks);
    const totalTimeTaken = tasks.reduce((s, t) => s + t.timeTaken, 0);
    const timeEfficiencyPct = computeTimeEfficiency(tasks);
    const revenuePerHour = computeRevenuePerHour(tasks);
    const averageROI = computeAverageROI(tasks);
    const performanceGrade = computePerformanceGrade(averageROI);
    return { totalRevenue, totalTimeTaken, timeEfficiencyPct, revenuePerHour, averageROI, performanceGrade };
  }, [tasks]);

  const addTask = useCallback((task: Omit<Task, 'id'> & { id?: string }) => {
    setTasks(prev => {
      const id = task.id ?? crypto.randomUUID();
      // [BUG 5 FIX] Validation: Ensure time is at least 1
      const timeTaken = (!task.timeTaken || task.timeTaken <= 0) ? 1 : Number(task.timeTaken);
      const revenue = Number(task.revenue) || 0;
      
      const createdAt = new Date().toISOString();
      const status = task.status;
      const completedAt = status === 'Done' ? createdAt : undefined;
      
      return [...prev, { ...task, id, revenue, timeTaken, createdAt, completedAt }];
    });
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev => {
      return prev.map(t => {
        if (t.id !== id) return t;
        
        const merged = { ...t, ...patch } as Task;
        
        // [BUG 5 FIX] Validate inputs on update to prevent Infinity/NaN
        if (patch.timeTaken !== undefined) {
             merged.timeTaken = Number(patch.timeTaken) > 0 ? Number(patch.timeTaken) : 1;
        }
        if (patch.revenue !== undefined) {
             merged.revenue = Number(patch.revenue) || 0;
        }

        if (t.status !== 'Done' && merged.status === 'Done' && !merged.completedAt) {
          merged.completedAt = new Date().toISOString();
        }
        return merged;
      });
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const target = prev.find(t => t.id === id) || null;
      setLastDeleted(target);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    if (!lastDeleted) return;
    setTasks(prev => [...prev, lastDeleted]);
    setLastDeleted(null);
  }, [lastDeleted]);

  // [BUG 2 FIX] New function to reset the deleted task state.
  // Hook this up to your Snackbar's onClose or auto-hide duration.
  const clearLastDeleted = useCallback(() => {
    setLastDeleted(null);
  }, []);

  return { 
    tasks, 
    loading, 
    error, 
    derivedSorted, 
    metrics, 
    lastDeleted, 
    addTask, 
    updateTask, 
    deleteTask, 
    undoDelete,
    clearLastDeleted // Exporting the new function
  };
}