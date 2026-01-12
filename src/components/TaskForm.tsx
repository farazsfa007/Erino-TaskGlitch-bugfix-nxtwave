import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { Priority, Status, Task } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id'> & { id?: string }) => void;
  existingTitles: string[];
  initial?: Task | null;
}

export default function TaskForm({ open, onClose, onSubmit, existingTitles, initial }: Props) {
  // Define state as 'formData' so the handleSubmit logic works
  const [formData, setFormData] = useState({
    title: '',
    revenue: '',
    timeTaken: '',
    priority: 'Medium' as Priority,
    status: 'Todo' as Status,
    notes: '',
  });

  // Effect to populate form data when opening for Edit vs Add
  useEffect(() => {
    if (initial) {
      setFormData({
        title: initial.title,
        revenue: String(initial.revenue),
        timeTaken: String(initial.timeTaken),
        priority: initial.priority,
        status: initial.status,
        notes: initial.notes || '',
      });
    } else {
      setFormData({
        title: '',
        revenue: '',
        timeTaken: '',
        priority: 'Medium',
        status: 'Todo',
        notes: '',
      });
    }
  }, [initial, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    // [FIX] Construct payload with strict types including createdAt
    const payload: Omit<Task, 'id'> & { id?: string } = {
      id: initial?.id,
      title: formData.title,
      revenue: Number(formData.revenue),
      timeTaken: Number(formData.timeTaken),
      priority: formData.priority,
      status: formData.status,
      notes: formData.notes,
      // IMPORTANT: Pass existing createdAt if editing, or a new date if creating.
      // The useTasks hook will handle the final ID and date logic, 
      // but this satisfies the strict TypeScript interface here.
      createdAt: initial?.createdAt || new Date().toISOString(),
      completedAt: initial?.completedAt,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{initial ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Task Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
              autoFocus
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Revenue ($)"
                type="number"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                fullWidth
              />
              <TextField
                label="Time Taken (hours)"
                type="number"
                value={formData.timeTaken}
                onChange={(e) => setFormData({ ...formData, timeTaken: e.target.value })}
                fullWidth
                inputProps={{ min: "0.1", step: "0.1" }}
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Priority"
                select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                fullWidth
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
              <TextField
                label="Status"
                select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Status })}
                fullWidth
              >
                <MenuItem value="Todo">Todo</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </TextField>
            </Stack>
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {initial ? 'Save Changes' : 'Add Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}