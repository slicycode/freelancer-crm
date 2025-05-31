"use client";

import { createTask, updateTask } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Milestone, Task, TaskPriority, TaskStatus } from "@/types";
import { CalendarIcon, Loader2, Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TaskModalProps {
  projectId: string;
  task?: Task;
  milestones?: Milestone[];
  availableTasks?: Task[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function TaskModal({ projectId, task, milestones = [], availableTasks = [], trigger, onSuccess }: TaskModalProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Form state
  const [title, setTitle] = useState<string>(task?.title || "");
  const [description, setDescription] = useState<string>(task?.description || "");
  const [status, setStatus] = useState<TaskStatus>(task?.status || "TODO");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "MEDIUM");
  const [estimatedHours, setEstimatedHours] = useState<string>(
    task?.estimatedHours ? task.estimatedHours.toString() : ""
  );
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""
  );
  const [milestoneId, setMilestoneId] = useState<string>(task?.milestoneId || "");
  const [dependencies, setDependencies] = useState<string>(
    task?.dependencies ? task.dependencies.join(', ') : ""
  );

  const isEditing = Boolean(task);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (!isEditing) formData.append("projectId", projectId);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      if (isEditing) formData.append("status", status);
      formData.append("priority", priority);
      if (estimatedHours) formData.append("estimatedHours", estimatedHours);
      if (dueDate) formData.append("dueDate", dueDate);
      if (milestoneId) formData.append("milestoneId", milestoneId);
      formData.append("dependencies", dependencies);

      if (isEditing && task) {
        await updateTask(task.id, formData);
        toast.success("Task updated successfully");
      } else {
        await createTask(formData);
        toast.success("Task created successfully");
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error("Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (!isEditing) {
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setEstimatedHours("");
      setDueDate("");
      setMilestoneId("");
      setDependencies("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !isEditing) {
      resetForm();
    }
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW": return "Low";
      case "MEDIUM": return "Medium";
      case "HIGH": return "High";
      case "URGENT": return "Urgent";
      default: return priority;
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "TODO": return "To Do";
      case "IN_PROGRESS": return "In Progress";
      case "REVIEW": return "In Review";
      case "COMPLETED": return "Completed";
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Task" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              disabled={loading}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Status (only show when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">In Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Hours */}
          <div className="space-y-2">
            <Label htmlFor="estimatedHours">Estimated Hours</Label>
            <Input
              id="estimatedHours"
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="0"
              disabled={loading}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Milestone */}
          {milestones.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select value={milestoneId || "none"} onValueChange={(value) => setMilestoneId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No milestone</SelectItem>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dependencies */}
          {availableTasks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="dependencies">Dependencies</Label>
              <Input
                id="dependencies"
                value={dependencies}
                onChange={(e) => setDependencies(e.target.value)}
                placeholder="Enter task IDs separated by commas..."
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Enter task IDs that must be completed before this task can start
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
              {isEditing ? "Update" : "Create"} Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 