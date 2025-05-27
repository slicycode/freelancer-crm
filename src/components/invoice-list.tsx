"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Invoice, InvoiceStatus } from "@/types";
import { Search, DollarSign, Calendar, User, FolderOpen, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface InvoiceListViewProps {
  invoices: Invoice[];
}

export function InvoiceListView({ invoices }: InvoiceListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  const filteredInvoices = invoices.filter(invoice =>
    invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (invoice.clientName && invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (invoice.projectName && invoice.projectName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      case "SENT":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "PAID":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "OVERDUE":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "CANCELED":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const isOverdue = (invoice: Invoice) => {
    return invoice.status !== "PAID" && invoice.status !== "CANCELED" && new Date(invoice.dueDate) < new Date();
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices}
              getStatusColor={getStatusColor}
              formatCurrency={formatCurrency}
              isOverdue={isOverdue}
              emptyMessage={
                searchQuery
                  ? "No invoices match your search"
                  : "No invoices yet. Create your first invoice to get started."
              }
            />
          </TabsContent>
          <TabsContent value="pending" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices.filter(i => i.status === "SENT")}
              getStatusColor={getStatusColor}
              formatCurrency={formatCurrency}
              isOverdue={isOverdue}
              emptyMessage={
                searchQuery
                  ? "No pending invoices match your search"
                  : "No pending invoices."
              }
            />
          </TabsContent>
          <TabsContent value="paid" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices.filter(i => i.status === "PAID")}
              getStatusColor={getStatusColor}
              formatCurrency={formatCurrency}
              isOverdue={isOverdue}
              emptyMessage={
                searchQuery
                  ? "No paid invoices match your search"
                  : "No paid invoices."
              }
            />
          </TabsContent>
          <TabsContent value="overdue" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices.filter(i => i.status === "OVERDUE" || isOverdue(i))}
              getStatusColor={getStatusColor}
              formatCurrency={formatCurrency}
              isOverdue={isOverdue}
              emptyMessage={
                searchQuery
                  ? "No overdue invoices match your search"
                  : "No overdue invoices."
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface InvoiceGridProps {
  invoices: Invoice[];
  getStatusColor: (status: InvoiceStatus) => string;
  formatCurrency: (amount: number, currency: string) => string;
  isOverdue: (invoice: Invoice) => boolean;
  emptyMessage: string;
}

function InvoiceGrid({ invoices, getStatusColor, formatCurrency, isOverdue, emptyMessage }: InvoiceGridProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="block p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400">{invoice.number}</h2>
                {isOverdue(invoice) && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="font-medium truncate">{invoice.title}</p>
            </div>
            <Badge className={`text-xs ${getStatusColor(invoice.status)}`}>
              {invoice.status}
            </Badge>
          </div>

          <div className="flex items-center text-lg font-bold text-green-600 dark:text-green-400 mb-3">
            <DollarSign className="h-5 w-5 mr-1" />
            <span>{formatCurrency(invoice.amount, invoice.currency)}</span>
          </div>

          {invoice.clientName && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <User className="h-4 w-4 mr-1" />
              <span className="truncate">{invoice.clientName}</span>
            </div>
          )}

          {invoice.projectName && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <FolderOpen className="h-4 w-4 mr-1" />
              <span className="truncate">{invoice.projectName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Due: {formatDate(invoice.dueDate.toString())}</span>
            </div>
            {invoice.paidDate && (
              <span>Paid: {formatDate(invoice.paidDate.toString())}</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
  });
} 