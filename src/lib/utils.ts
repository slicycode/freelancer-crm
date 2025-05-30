import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    });
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Template variable processor
export function processTemplateVariables(content: string, variables: Record<string, any>): string {
  let processedContent = content;
  
  // Replace template variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, String(value || ''));
  });
  
  // Clean up any remaining unreplaced variables (for preview purposes)
  processedContent = processedContent.replace(/{{[^}]+}}/g, '[Missing Variable]');
  
  return processedContent;
}

// Helper function to generate sample variables for previews
export function getSampleVariables(): Record<string, any> {
  return {
    // Client variables
    client_name: "Jane Doe",
    client_company: "Tech Innovations Inc.",
    client_email: "jane.doe@techinnovations.com",
    client_phone: "(555) 123-4567",
    
    // Project variables
    project_name: "E-commerce Website Redesign",
    project_description: "Complete redesign of the company website with modern UI/UX, mobile responsiveness, and enhanced e-commerce functionality.",
    project_start_date: "June 1, 2025",
    project_end_date: "July 30, 2025", 
    project_duration: "8 weeks",
    
    // Financial variables
    project_cost: "$15,000",
    payment_terms: "50% upfront, 50% on completion",
    late_fee: "1.5% per month",
    
    // Your business variables
    my_name: "John Smith",
    my_company: "Smith Digital Solutions",
    my_email: "john@smithdigital.com",
    my_phone: "(555) 987-6543",
    
    // Date variables
    current_date: new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    }),
    current_year: new Date().getFullYear(),
    
    // Scope variables
    scope_of_work: "The Developer agrees to provide the following services:\n- Complete website redesign\n- Mobile-responsive development\n- E-commerce integration\n- SEO optimization\n- Content management system setup",
    
    // Additional sample variables
    hourly_rate: "$125/hour",
    estimated_hours: "120 hours",
    revision_rounds: "3 rounds of revisions included",
    delivery_format: "Production-ready website files and documentation"
  };
}