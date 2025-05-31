import { z } from "zod"

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client selection is required"),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetType: z.string().optional(),
  totalBudget: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Total budget must be a valid positive number",
  }),
  estimatedHours: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Estimated hours must be a valid positive number",
  }),
  hourlyRate: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Hourly rate must be a valid positive number",
  }),
})
.refine((data) => {
  // If end date is provided, it should be after start date
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export type ProjectFormData = z.infer<typeof projectFormSchema> 