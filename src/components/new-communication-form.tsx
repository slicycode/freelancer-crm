"use client";

import { createCommunication } from "@/app/actions/communications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { useState } from "react";

interface NewCommunicationFormProps {
  clientId: string;
  projects?: { id: string; name: string }[];
}

export function NewCommunicationForm({ clientId, projects = [] }: NewCommunicationFormProps) {
  const invalidateCommunications = useInvalidateCommunications();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError(null);

    try {
      await createCommunication(clientId, formData);
      await invalidateCommunications(clientId); // Wait for cache refresh to complete
      setIsOpen(false);
      // Reset form by closing and reopening dialog
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create communication");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4" />
          <span>New Communication</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Communication</DialogTitle>
            <DialogDescription>
              Add a new communication record for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="type" className="text-right text-sm font-medium">
                Type
              </label>
              <div className="col-span-3">
                <Select name="type" defaultValue="EMAIL">
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
                required
              />
            </div>
            {projects.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="projectId" className="text-right text-sm font-medium">
                  Project
                </label>
                <div className="col-span-3">
                  <Select name="projectId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
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
            {/* We'll implement file uploads in a future iteration */}
          </div>
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}