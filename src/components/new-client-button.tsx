"use client";

import { createClient } from "@/app/actions/clients";
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
import { useInvalidateClients } from "@/hooks/use-clients";
import { cn } from "@/lib/utils";
import { clientFormSchema, type ClientFormData } from "@/lib/validations/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function NewClientButton() {
  const router = useRouter();
  const invalidateClients = useInvalidateClients();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      tags: "",
      notes: "",
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

      const newClient = await createClient(formData);
      invalidateClients(); // Refresh the clients cache
      setIsOpen(false);
      form.reset();

      // Navigate to the newly created client
      router.push(`/clients/${newClient.id}`);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Failed to create client",
      });
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      form.clearErrors();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className={cn("h-3 w-3", isOpen && "rotate-90")} />
          <span className="sr-only md:not-sr-only md:inline-block">Add Client</span>
          <span className="md:hidden">+</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your FreelancerCRM. Click save when you&apos;re done.
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
                {form.formState.isSubmitting ? "Creating..." : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}