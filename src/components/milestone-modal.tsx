"use client";

import { createMilestone, updateMilestone } from "@/app/actions/milestones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Milestone, MilestoneStatus } from "@/types";
import { CalendarIcon, Loader2, Plus, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MilestoneModalProps {
  projectId: string;
  milestone?: Milestone;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function MilestoneModal({ projectId, milestone, trigger, onSuccess }: MilestoneModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState(milestone?.name || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [dueDate, setDueDate] = useState(
    milestone?.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : ""
  );
  const [status, setStatus] = useState<MilestoneStatus>(milestone?.status || "PENDING");
  const [paymentAmount, setPaymentAmount] = useState(
    milestone?.paymentAmount ? milestone.paymentAmount.toString() : ""
  );
  const [clientApprovalRequired, setClientApprovalRequired] = useState(
    milestone?.clientApprovalRequired || false
  );
  const [deliverables, setDeliverables] = useState(
    milestone?.deliverables ? milestone.deliverables.join('\n') : ""
  );

  const isEditing = Boolean(milestone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Milestone name is required");
      return;
    }

    if (!dueDate) {
      toast.error("Due date is required");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (!isEditing) formData.append("projectId", projectId);
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("dueDate", dueDate);
      if (isEditing) formData.append("status", status);
      if (paymentAmount) formData.append("paymentAmount", paymentAmount);
      formData.append("clientApprovalRequired", clientApprovalRequired.toString());
      formData.append("deliverables", deliverables);

      if (isEditing && milestone) {
        await updateMilestone(milestone.id, formData);
        toast.success("Milestone updated successfully");
      } else {
        await createMilestone(formData);
        toast.success("Milestone created successfully");
      }

      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save milestone:", error);
      toast.error("Failed to save milestone");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (!isEditing) {
      setName("");
      setDescription("");
      setDueDate("");
      setStatus("PENDING");
      setPaymentAmount("");
      setClientApprovalRequired(false);
      setDeliverables("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !isEditing) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Milestone" : "Create New Milestone"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Milestone name..."
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
              placeholder="Describe what this milestone entails..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date *</Label>
            <div className="relative">
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                required
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Status (only show when editing) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as MilestoneStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">In Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount ($)</Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          {/* Client Approval Required */}
          <div className="flex items-center space-x-2">
            <Switch
              id="clientApprovalRequired"
              checked={clientApprovalRequired}
              onCheckedChange={setClientApprovalRequired}
              disabled={loading}
            />
            <Label htmlFor="clientApprovalRequired">Requires client approval</Label>
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <Label htmlFor="deliverables">Deliverables</Label>
            <Textarea
              id="deliverables"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="List deliverables (one per line)..."
              rows={4}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Enter each deliverable on a new line
            </p>
          </div>

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
              {isEditing ? "Update" : "Create"} Milestone
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 