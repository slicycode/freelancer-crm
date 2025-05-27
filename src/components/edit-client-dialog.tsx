"use client";

import { updateClient } from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateClientCache } from "@/hooks/use-clients";
import { clientFormSchema, type ClientFormData } from "@/lib/validations/client";
import type { Client } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

interface EditClientDialogProps {
  client: Client;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ client, isOpen, onOpenChange }: EditClientDialogProps) {
  const updateClientCache = useUpdateClientCache();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client.name,
      company: client.company || "",
      email: client.email || "",
      phone: client.phone || "",
      tags: client.tags?.join(", ") || "",
      notes: client.notes || "",
    },
  });

  async function onSubmit(data: ClientFormData) {
    try {
      // Convert form data to FormData for the server action
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.company) formData.append("company", data.company);
      if (data.email) formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.tags) formData.append("tags", data.tags);
      if (data.notes) formData.append("notes", data.notes);

      const updatedClient = await updateClient(client.id, formData);
      updateClientCache(updatedClient);
      onOpenChange(false);
      form.reset();
      // No need to router.refresh() since we're using React Query cache
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Failed to update client",
      });
    }
  }



  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset({
        name: client.name,
        company: client.company || "",
        email: client.email || "",
        phone: client.phone || "",
        tags: client.tags?.join(", ") || "",
        notes: client.notes || "",
      });
      form.clearErrors();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update client information. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Name*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Client name"
                          className="col-span-3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Company</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Company name"
                          className="col-span-3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email address"
                          className="col-span-3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Phone number"
                          className="col-span-3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tags</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Comma-separated tags (e.g. design, retainer)"
                          className="col-span-3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this client"
                          className="col-span-3"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="col-span-3 col-start-2" />
                    </FormItem>
                  )}
                />
              </div>

              {form.formState.errors.root && (
                <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
} 