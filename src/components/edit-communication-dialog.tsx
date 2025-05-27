"use client";

import { updateCommunication } from "@/app/actions/communications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInvalidateCommunications } from "@/hooks/use-clients";
import type { Communication } from "@/types";
import { useState } from "react";

interface EditCommunicationDialogProps {
  communication: Communication;
  clientId: string;
  projects?: { id: string; name: string }[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCommunicationDialog({
  communication,
  clientId,
  projects = [],
  isOpen,
  onOpenChange
}: EditCommunicationDialogProps) {
  const invalidateCommunications = useInvalidateCommunications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateCommunication(clientId, communication.id, formData);
      await invalidateCommunications(clientId); // Wait for cache refresh to complete
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update communication");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Communication</DialogTitle>
            <DialogDescription>
              Update the communication details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right text-sm font-medium">
                Type
              </label>
              <div className="col-span-3">
                <Select name="type" defaultValue={communication.type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="CALL">Call</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="NOTE">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="subject" className="text-right text-sm font-medium">
                Subject
              </label>
              <Input
                id="subject"
                name="subject"
                className="col-span-3"
                placeholder="Communication subject"
                defaultValue={communication.subject}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="content" className="text-right text-sm font-medium">
                Content
              </label>
              <Textarea
                id="content"
                name="content"
                className="col-span-3"
                placeholder="Communication details"
                rows={5}
                defaultValue={communication.content}
                required
              />
            </div>
            {projects.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="projectId" className="text-right text-sm font-medium">
                  Project
                </label>
                <div className="col-span-3">
                  <Select name="projectId" defaultValue={communication.projectId || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 