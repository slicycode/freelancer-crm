# FreelancerCRM - Project Context

## Project Overview
FreelancerCRM is an MVP SaaS application designed specifically for freelancers to manage client relationships, projects, payments, and overall business operations. This application aims to solve key pain points that freelancers face daily, with features prioritized based on their impact and implementation complexity.

## Tech Stack
- **Framework**: Next.js (v15)
- **Styling**: TailwindCSS (v4) with Shadcn UI
- **Language**: TypeScript
- **Database**: NeonTech DB (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Clerk Auth
- **Email**: Resend

## Feature Priority List (in implementation order)
1. **Client Communication Timeline** - Unified view of all client interactions
2. **Document Templates with Variables** - Customizable templates for proposals, contracts, invoices
3. **Project Status Permalinks** - Shareable links for clients to view project status
4. **Client-specific Payment Terms Tracker** - Track different payment terms for each client
5. **Milestone Payment Reminders** - Automated reminders for upcoming payment milestones
6. **Time-block Scheduling** - Tools for organizing work time efficiently
7. **Quick Expense Categorization** - Simple expense tracking and categorization
8. **Project Profitability Dashboard** - Analytics for project financial performance
9. **Time Value Calculator** - Tool to evaluate the value of time spent on different activities
10. **Capacity Forecasting** - Predictive tools for workload management

## Database Schema Considerations

### Core Entities
- **Users** (managed by Clerk Auth)
- **Clients** (companies or individuals)
- **Projects** (belonging to clients)
- **Communications** (emails, calls, meetings linked to clients/projects)
- **Documents** (proposals, contracts, invoices)
- **Payments** (invoices, milestones)
- **TimeBlocks** (scheduled work periods)
- **Expenses** (categorized business expenses)

### Important Relationships
- Users can have many Clients
- Clients can have many Projects
- Projects can have many Communications, Documents, Payments, TimeBlocks, and Expenses
- All entities should track creation, updates, and deletion timestamps

## Implementation Notes and Potential Pitfalls

### Next.js (v15) Considerations
- Use the App Router for routing (not Pages Router)
- Implement Server Components where possible for improved performance
- Set up proper error boundaries with error.tsx files
- Utilize the new server actions for form submissions
- Be mindful of RSC (React Server Components) vs. Client Components separation

### Database and Prisma
- Set up proper migrations workflow from the beginning
- Use enums for status fields and other categorical data
- Implement soft deletes for important entities (add isDeleted flag)
- Consider performance with pagination for lists that could grow large
- Set up proper indexing on fields that will be frequently queried
- Use transactions for operations that modify multiple related records

### Authentication with Clerk
- Set up proper middleware for protected routes
- Implement organization features if the product might extend to teams
- Define proper permission scopes early on
- Use Clerk webhooks to sync user data with your database when needed

### UI/UX Considerations
- Implement responsive design from the beginning
- Use Shadcn's theming capabilities for dark/light mode
- Consider accessibility from day one (ARIA attributes, keyboard navigation)
- Use appropriate loading states and optimistic updates

### Feature-Specific Implementation Notes

#### 1. Client Communication Timeline
- Design for different types of communications (email, call, meeting, etc.)
- Consider implementing email integration via API or webhooks
- Plan for rich text and attachments in communication records
- Implement proper sorting and filtering capabilities

#### 2. Document Templates
- Use a robust rich text editor (Tiptap, Lexical, or similar)
- Store variable placeholders in a structured format
- Consider PDF generation capabilities
- Plan for versioning of templates

#### 3. Project Status Permalinks
- Implement secure sharing with expiration options
- Consider what data should be visible to clients vs. private
- Implement real-time updates if possible
- Consider caching strategy for performance

#### 4. Payment Terms Tracker
- Support multiple currencies
- Plan for different payment models (hourly, fixed price, retainer)
- Consider tax implications and reporting needs
- Implement proper date handling for international usage

#### 5. Milestone Reminders
- Set up a robust scheduling system for reminders
- Consider time zones when scheduling notifications
- Plan for multiple reminder channels (email, in-app, etc.)
- Implement proper retry mechanisms for failed notifications

### General Code Quality Considerations
- Set up ESLint and Prettier configurations
- Implement a consistent error handling strategy
- Use proper TypeScript types throughout the application
- Consider setting up test infrastructure early (Jest, React Testing Library)
- Use environment variables properly for configuration

## Deployment and Infrastructure
- Set up CI/CD pipeline early
- Consider implementing feature flags for gradual rollout
- Plan for database backups and disaster recovery
- Set up proper monitoring and logging
- Consider implementing rate limiting for API endpoints

## Technical Debt Avoidance
- Document architecture decisions
- Refactor early and often
- Conduct regular code reviews
- Monitor performance metrics
- Keep dependencies updated

## Integration Points to Consider
- Email service (Resend)
- Payment processing (if implementing payments)
- Calendar integrations (for scheduling features)
- Cloud storage for documents and attachments
- Analytics services

This README serves as a living document to guide development decisions and help Cursor provide relevant code generation assistance for the FreelancerCRM project.