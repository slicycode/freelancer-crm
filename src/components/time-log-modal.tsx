"use client";

import { logManualTime } from "@/app/actions/time-tracking";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Task } from "@/types";
import { Clock, Loader2, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TimeLogModalProps {
  projectId: string;
  tasks?: Task[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function TimeLogModal({ projectId, tasks = [], trigger, onSuccess }: TimeLogModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [taskId, setTaskId] = useState("");
  const [billable, setBillable] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hours || parseFloat(hours) <= 0) {
      toast.error("Please enter valid hours (greater than 0)");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description of the work done");
      return;
    }

    setLoading(true);

    try {
      await logManualTime(
        projectId,
        parseFloat(hours),
        description.trim(),
        taskId || undefined,
        billable
      );

      toast.success(`Successfully logged ${hours} hours`);
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to log time:", error);
      toast.error("Failed to log time");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHours("");
    setDescription("");
    setTaskId("");
    setBillable(true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Log Time
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Manual Time</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hours */}
          <div className="space-y-2">
            <Label htmlFor="hours">Hours Worked *</Label>
            <Input
              id="hours"
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 2.5"
              disabled={loading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter time in decimal format (e.g., 1.5 for 1 hour 30 minutes)
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you worked on..."
              rows={3}
              disabled={loading}
              required
            />
          </div>

          {/* Task Association */}
          {tasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="task">Associated Task</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General project work</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Billable */}
          <div className="flex items-center space-x-2">
            <Switch
              id="billable"
              checked={billable}
              onCheckedChange={setBillable}
              disabled={loading}
            />
            <Label htmlFor="billable">Billable time</Label>
          </div>

          {/* Time Summary */}
          {hours && parseFloat(hours) > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Time Summary</p>
              <p className="text-xs text-muted-foreground">
                {parseFloat(hours)} hours
                {billable ? " (billable)" : " (non-billable)"}
                {taskId && tasks.find(t => t.id === taskId) &&
                  ` → ${tasks.find(t => t.id === taskId)?.title}`
                }
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Log Time
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 