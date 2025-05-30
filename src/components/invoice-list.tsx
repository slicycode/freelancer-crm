"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Invoice, InvoiceStatus } from "@/types";
import { AlertCircle, Calendar, DollarSign, Search, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface InvoiceListViewProps {
  invoices: Invoice[];
}

export function InvoiceListView({ invoices }: InvoiceListViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  const filteredInvoices = invoices.filter(invoice =>
    invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (invoice.clientName && invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-secondary text-secondary-foreground";
      case "SENT":
        return "status-bg-warning text-chart-3";
      case "PAID":
        return "status-bg-success text-chart-2";
      case "OVERDUE":
        return "status-bg-danger text-destructive";
      case "CANCELED":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getStatusLabel = (status: InvoiceStatus) => {
    switch (status) {
      case "DRAFT":
        return "Draft";
      case "SENT":
        return "Sent";
      case "PAID":
        return "Paid";
      case "OVERDUE":
        return "Overdue";
      case "CANCELED":
        return "Canceled";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isOverdue = (invoice: Invoice) => {
    return invoice.status === "OVERDUE" || (invoice.status === "SENT" && new Date(invoice.dueDate) < new Date());
  };

  // Calculate summary statistics
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices
    .filter(invoice => invoice.status === "PAID")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const sentAmount = invoices
    .filter(invoice => invoice.status === "SENT")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueAmount = invoices
    .filter(invoice => isOverdue(invoice))
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex flex-col space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass shine">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalAmount, "USD")}</div>
              <p className="text-xs text-muted-foreground">
                Across {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <Card className="status-bg-success shine">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-2">Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-2">{formatCurrency(paidAmount, "USD")}</div>
              <p className="text-xs text-chart-2/80">
                {invoices.filter(i => i.status === "PAID").length} paid invoice{invoices.filter(i => i.status === "PAID").length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <Card className="status-bg-warning shine">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-chart-3">Sent</CardTitle>
              <DollarSign className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-3">{formatCurrency(sentAmount, "USD")}</div>
              <p className="text-xs text-chart-3/80">
                {invoices.filter(i => i.status === "SENT").length} sent invoice{invoices.filter(i => i.status === "SENT").length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <Card className={`shine ${overdueAmount > 0 ? 'status-bg-danger' : 'glass'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${overdueAmount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                Overdue
              </CardTitle>
              <AlertCircle className={`h-4 w-4 ${overdueAmount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overdueAmount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {formatCurrency(overdueAmount, "USD")}
              </div>
              <p className={`text-xs ${overdueAmount > 0 ? 'text-destructive/80' : 'text-muted-foreground'}`}>
                {invoices.filter(i => isOverdue(i)).length} overdue invoice{invoices.filter(i => isOverdue(i)).length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              emptyMessage={
                searchQuery
                  ? "No invoices match your search"
                  : "No invoices yet. Create your first invoice to get started."
              }
            />
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices.filter(i => i.status === "SENT")}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              emptyMessage={
                searchQuery
                  ? "No sent invoices match your search"
                  : "No sent invoices."
              }
            />
          </TabsContent>
          <TabsContent value="overdue" className="mt-4">
            <InvoiceGrid
              invoices={filteredInvoices.filter(i => isOverdue(i))}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
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
  getStatusLabel: (status: InvoiceStatus) => string;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: Date) => string;
  emptyMessage: string;
}

function InvoiceGrid({
  invoices,
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  formatDate,
  emptyMessage
}: InvoiceGridProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {invoices.map((invoice) => (
        <Link
          key={invoice.id}
          href={`/invoices/${invoice.id}`}
          className="block p-6 rounded-lg card-elevated hover-lift"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col">
              <h2 className="font-semibold truncate text-headline">{invoice.number}</h2>
              <p className="text-sm text-body">{formatCurrency(invoice.amount, invoice.currency)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`text-xs ${getStatusColor(invoice.status)}`}>
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <User className="h-4 w-4 mr-1" />
            <span className="truncate">
              {invoice.clientName || "No client"}
              {invoice.projectName && ` • ${invoice.projectName}`}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>Due {formatDate(invoice.dueDate)}</span>
            </div>
            <span>
              Created {formatDate(invoice.createdAt)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
} 