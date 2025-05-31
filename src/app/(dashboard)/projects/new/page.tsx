"use client";

import { getClients } from "@/app/actions/clients";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projectFormSchema, type ProjectFormData } from "@/lib/validations/project";
import type { Client } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export default function NewProjectPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState<boolean>(true);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      status: "PROPOSAL",
      startDate: "",
      endDate: "",
      budgetType: "FIXED",
      totalBudget: "",
      estimatedHours: "",
      hourlyRate: "",
    },
  });

  // Load clients on component mount
  useEffect(() => {
    async function loadClients() {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error("Error loading clients:", error);
        form.setError("root", {
          message: "Failed to load clients. Please refresh the page.",
        });
      } finally {
        setIsLoadingClients(false);
      }
    }

    loadClients();
  }, [form]);

  async function onSubmit(data: ProjectFormData) {
    try {
      // Convert form data to FormData for the server action
      const formData = new FormData();
      formData.append("name", data.name);
      if (data.description) formData.append("description", data.description);
      formData.append("clientId", data.clientId);
      formData.append("status", data.status || "PROPOSAL");
      if (data.startDate) formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);
      formData.append("budgetType", data.budgetType || "FIXED");
      if (data.totalBudget) formData.append("totalBudget", data.totalBudget);
      if (data.estimatedHours) formData.append("estimatedHours", data.estimatedHours);
      if (data.hourlyRate) formData.append("hourlyRate", data.hourlyRate);

      const newProject = await createProject(formData);

      // Navigate to the newly created project
      router.push(`/projects/${newProject.id}`);
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Failed to create project",
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-headline">Create New Project</h1>
            <p className="text-muted-foreground">
              Set up a new project to organize your work and track progress
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Set up the fundamental details for your project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter project name..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this project entails..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingClients ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                Loading clients...
                              </div>
                            ) : clients.length === 0 ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No clients found. Create a client first.
                              </div>
                            ) : (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.name}
                                  {client.company && ` (${client.company})`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PROPOSAL">Proposal</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="ON_HOLD">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Timeline and Budget */}
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Timeline & Budget</CardTitle>
                  <CardDescription>
                    Set project dates and financial parameters
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budgetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixed Price</SelectItem>
                            <SelectItem value="HOURLY">Hourly Rate</SelectItem>
                            <SelectItem value="RETAINER">Monthly Retainer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="totalBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Budget ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Hours</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="0"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hourly Rate ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Used for hourly projects and time tracking calculations
                        </p>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Error Message */}
              {form.formState.errors.root && (
                <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6">
                <Link href="/projects">
                  <Button
                    variant="outline"
                    disabled={form.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="flex items-center gap-2"
                  disabled={form.formState.isSubmitting}
                >
                  <Save className="h-4 w-4" />
                  {form.formState.isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
} 