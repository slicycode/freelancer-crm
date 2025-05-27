import { getInvoices } from "@/app/actions/invoices";
import { InvoiceListView } from "@/components/invoice-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoices - FreelancerCRM",
  description: "Manage your invoices and track payments",
};

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="flex flex-col h-full">
      <InvoiceListView invoices={invoices} />
    </div>
  );
} 