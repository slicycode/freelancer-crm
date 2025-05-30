import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultTemplates = [
  {
    name: "Web Development Proposal",
    description: "Professional proposal template for web development projects",
    type: "PROPOSAL" as const,
    content: `{{time_greeting}} {{client_name}},

Thank you for considering {{business_name}} for your {{project_name}} project.

## Project Overview
{{project_description}}

## Scope of Work
- Custom website design and development
- Responsive design for mobile and desktop
- Content management system integration
- Search engine optimization (SEO) basics
- Cross-browser compatibility testing

## Timeline
- Project Start: {{project_start_date}}
- Estimated Completion: {{project_end_date}}
- Total Duration: {{project_duration}}

## Investment
- Total Project Cost: {{project_cost}}
- Payment Terms: {{payment_terms}}

## Next Steps
Upon your approval, we'll send over the contract and can begin work immediately.

Looking forward to working with you!

Best regards,
{{my_name}}
{{business_name}}
{{my_email}}`,
    variables: [
      { key: "time_greeting", label: "Time Greeting", type: "text", source: "system", required: false },
      { key: "client_name", label: "Client Name", type: "text", source: "client", required: true },
      { key: "business_name", label: "Business Name", type: "text", source: "user", required: true },
      { key: "project_name", label: "Project Name", type: "text", source: "project", required: true },
      { key: "project_description", label: "Project Description", type: "textarea", source: "project", required: true },
      { key: "project_start_date", label: "Project Start Date", type: "date", source: "project", required: false },
      { key: "project_end_date", label: "Project End Date", type: "date", source: "project", required: false },
      { key: "project_duration", label: "Project Duration", type: "text", source: "project", required: false },
      { key: "project_cost", label: "Project Cost", type: "currency", source: "manual", required: true },
      { key: "payment_terms", label: "Payment Terms", type: "select", source: "manual", required: true, options: ["50% upfront, 50% on completion", "1/3 upfront, 1/3 midway, 1/3 completion", "100% upfront", "Net 30", "Net 15"] },
      { key: "my_name", label: "Your Name", type: "text", source: "user", required: true },
      { key: "my_email", label: "Your Email", type: "text", source: "user", required: true }
    ],
    isDefault: true
  },
  {
    name: "Freelance Development Contract",
    description: "Professional contract template for freelance development work",
    type: "CONTRACT" as const,
    content: `FREELANCE DEVELOPMENT AGREEMENT

This Agreement is made between {{my_name}} ("Developer") and {{client_name}} ("Client") on {{current_date}}.

## 1. PROJECT DESCRIPTION
Project: {{project_name}}
Description: {{project_description}}

## 2. TIMELINE
- Start Date: {{project_start_date}}
- Completion Date: {{project_end_date}}
- Estimated Duration: {{project_duration}}

## 3. COMPENSATION
- Total Project Fee: {{project_cost}}
- Payment Schedule: {{payment_terms}}
- Late Payment Fee: {{late_fee}}

## 4. SCOPE OF WORK
The Developer agrees to provide the following services:
{{scope_of_work}}

## 5. INTELLECTUAL PROPERTY
Upon full payment, all intellectual property rights will transfer to the Client.

## 6. TERMINATION
Either party may terminate this agreement with written notice.

## 7. LIMITATION OF LIABILITY
Developer's liability is limited to the amount paid for services.

By signing below, both parties agree to the terms of this contract.

Developer: {{my_name}}
Date: _____________

Client: {{client_name}}
Date: _____________`,
    variables: [
      { key: "my_name", label: "Your Name", type: "text", source: "user", required: true },
      { key: "client_name", label: "Client Name", type: "text", source: "client", required: true },
      { key: "current_date", label: "Current Date", type: "date", source: "system", required: true },
      { key: "project_name", label: "Project Name", type: "text", source: "project", required: true },
      { key: "project_description", label: "Project Description", type: "textarea", source: "project", required: true },
      { key: "project_start_date", label: "Start Date", type: "date", source: "project", required: true },
      { key: "project_end_date", label: "End Date", type: "date", source: "project", required: true },
      { key: "project_duration", label: "Duration", type: "text", source: "project", required: false },
      { key: "project_cost", label: "Total Cost", type: "currency", source: "manual", required: true },
      { key: "payment_terms", label: "Payment Terms", type: "text", source: "manual", required: true, defaultValue: "50% upfront, 50% on completion" },
      { key: "late_fee", label: "Late Fee", type: "text", source: "manual", required: false, defaultValue: "1.5% per month" },
      { key: "scope_of_work", label: "Scope of Work", type: "textarea", source: "manual", required: true }
    ],
    isDefault: true
  },
  {
    name: "Monthly Retainer Invoice",
    description: "Invoice template for monthly retainer clients",
    type: "INVOICE" as const,
    content: `INVOICE

{{business_name}}
{{my_email}}

Bill To:
{{client_name}}
{{client_company}}
{{client_email}}

Invoice Details:
- Invoice Date: {{current_date}}
- Due Date: {{due_date_30}}
- Invoice #: INV-{{current_year}}-{{invoice_number}}

Services:
{{service_description}}

Period: {{service_period}}
Hours Worked: {{hours_worked}}
Hourly Rate: {{hourly_rate}}

Subtotal: {{subtotal}}
Tax ({{tax_rate}}): {{tax_amount}}
Total: {{total_amount}}

Payment Terms: {{payment_terms}}

Thank you for your business!

{{my_name}}
{{business_name}}`,
    variables: [
      { key: "business_name", label: "Business Name", type: "text", source: "user", required: true },
      { key: "my_email", label: "Your Email", type: "text", source: "user", required: true },
      { key: "my_name", label: "Your Name", type: "text", source: "user", required: true },
      { key: "client_name", label: "Client Name", type: "text", source: "client", required: true },
      { key: "client_company", label: "Client Company", type: "text", source: "client", required: false },
      { key: "client_email", label: "Client Email", type: "text", source: "client", required: false },
      { key: "current_date", label: "Current Date", type: "date", source: "system", required: true },
      { key: "due_date_30", label: "Due Date", type: "date", source: "system", required: true },
      { key: "current_year", label: "Current Year", type: "text", source: "system", required: true },
      { key: "invoice_number", label: "Invoice Number", type: "text", source: "manual", required: true },
      { key: "service_description", label: "Service Description", type: "textarea", source: "manual", required: true },
      { key: "service_period", label: "Service Period", type: "text", source: "manual", required: true },
      { key: "hours_worked", label: "Hours Worked", type: "number", source: "manual", required: true },
      { key: "hourly_rate", label: "Hourly Rate", type: "currency", source: "manual", required: true },
      { key: "subtotal", label: "Subtotal", type: "currency", source: "manual", required: true },
      { key: "tax_rate", label: "Tax Rate", type: "text", source: "manual", required: false, defaultValue: "0%" },
      { key: "tax_amount", label: "Tax Amount", type: "currency", source: "manual", required: false, defaultValue: "$0.00" },
      { key: "total_amount", label: "Total Amount", type: "currency", source: "manual", required: true },
      { key: "payment_terms", label: "Payment Terms", type: "text", source: "manual", required: false, defaultValue: "Net 30" }
    ],
    isDefault: true
  },
  {
    name: "Project Completion Report",
    description: "Report template for completed projects",
    type: "REPORT" as const,
    content: `PROJECT COMPLETION REPORT

Project: {{project_name}}
Client: {{client_name}}
Completion Date: {{current_date}}

## Project Summary
{{project_description}}

## Deliverables Completed
{{deliverables_list}}

## Timeline
- Start Date: {{project_start_date}}
- End Date: {{project_end_date}}
- Total Duration: {{project_duration}}

## Key Achievements
{{key_achievements}}

## Challenges & Solutions
{{challenges_solutions}}

## Final Outcomes
{{final_outcomes}}

## Recommendations
{{recommendations}}

## Next Steps
{{next_steps}}

Thank you for the opportunity to work on this project!

{{my_name}}
{{business_name}}
{{current_date}}`,
    variables: [
      { key: "project_name", label: "Project Name", type: "text", source: "project", required: true },
      { key: "client_name", label: "Client Name", type: "text", source: "client", required: true },
      { key: "current_date", label: "Current Date", type: "date", source: "system", required: true },
      { key: "project_description", label: "Project Description", type: "textarea", source: "project", required: true },
      { key: "deliverables_list", label: "Deliverables Completed", type: "textarea", source: "manual", required: true },
      { key: "project_start_date", label: "Start Date", type: "date", source: "project", required: false },
      { key: "project_end_date", label: "End Date", type: "date", source: "project", required: false },
      { key: "project_duration", label: "Duration", type: "text", source: "project", required: false },
      { key: "key_achievements", label: "Key Achievements", type: "textarea", source: "manual", required: true },
      { key: "challenges_solutions", label: "Challenges & Solutions", type: "textarea", source: "manual", required: true },
      { key: "final_outcomes", label: "Final Outcomes", type: "textarea", source: "manual", required: true },
      { key: "recommendations", label: "Recommendations", type: "textarea", source: "manual", required: false },
      { key: "next_steps", label: "Next Steps", type: "textarea", source: "manual", required: false },
      { key: "my_name", label: "Your Name", type: "text", source: "user", required: true },
      { key: "business_name", label: "Business Name", type: "text", source: "user", required: true }
    ],
    isDefault: true
  }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // Check if global templates already exist
  const existingGlobalTemplates = await prisma.documentTemplate.count({
    where: {
      isGlobal: true
    }
  });

  if (existingGlobalTemplates > 0) {
    console.log(`⏭️  Global templates already exist (${existingGlobalTemplates} found), skipping...`);
    console.log('✅ Seeding completed - no changes needed');
    return;
  }

  console.log('🚀 Creating global default templates...');

  let totalCreated = 0;

  // Create global default templates (not bound to any user)
  for (const templateData of defaultTemplates) {
    try {
      await prisma.documentTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          type: templateData.type,
          content: templateData.content,
          variables: templateData.variables as any,
          isDefault: templateData.isDefault,
          isGlobal: true, // Global template visible to all users
          userId: null, // Not bound to any specific user
        },
      });
      totalCreated++;
      console.log(`  ✅ Created global template: ${templateData.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to create ${templateData.name}:`, error);
    }
  }

  console.log(`\n🎉 Seeding completed!`);
  console.log(`📈 Global templates created: ${totalCreated}`);
  console.log(`🌍 These templates are now available to all users`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });