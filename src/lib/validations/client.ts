import { z } from "zod"

export const clientFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  company: z.string().max(100, "Company name must be less than 100 characters").optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
  tags: z.string().optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
})

export type ClientFormData = z.infer<typeof clientFormSchema> 