import type { Invoice, InvoiceField, ProblematicInvoice, User } from '@/types/models';
import { mockInvoices, mockProblematicInvoices, mockUsers } from '@/data/mock-data';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function listInvoices(): Promise<Invoice[]> {
  await delay(150);
  return mockInvoices;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  await delay(100);
  return mockInvoices.find((i) => i.id === id) ?? null;
}

export async function listProblematicInvoices(): Promise<ProblematicInvoice[]> {
  await delay(150);
  return mockProblematicInvoices;
}

export async function listUsers(): Promise<User[]> {
  await delay(150);
  return mockUsers;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function confidenceFromInvoice(invoice: Invoice): number {
  // Use invoice-level confidence as a baseline and slightly vary per-field.
  return clamp(invoice.aiConfidence, 50, 99);
}

export async function getInvoiceFieldsForEdit(invoiceId: string): Promise<InvoiceField[]> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return [];

  const base = confidenceFromInvoice(invoice);
  const conf = (delta: number) => clamp(base + delta, 50, 99);

  return [
    { label: 'Invoice Date', value: invoice.Invoice_Date, confidence: conf(+1), isEditable: true, fieldName: 'Invoice_Date' },
    { label: 'Invoice No', value: invoice.Invoice_No, confidence: conf(0), isEditable: true, fieldName: 'Invoice_No' },
    { label: 'Supplier Name', value: invoice.Supplier_Name, confidence: conf(-1), isEditable: true, fieldName: 'Supplier_Name' },
    { label: 'Supplier NTN', value: invoice.Supplier_NTN, confidence: conf(-3), isEditable: true, fieldName: 'Supplier_NTN' },
    { label: 'Supplier GST No', value: invoice.Supplier_GST_No, confidence: conf(-5), isEditable: true, fieldName: 'Supplier_GST_No' },
    { label: 'Supplier Registration No', value: invoice.Supplier_Registration_No, confidence: conf(-7), isEditable: true, fieldName: 'Supplier_Registration_No' },
    { label: 'Buyer Name', value: invoice.Buyer_Name, confidence: conf(+1), isEditable: true, fieldName: 'Buyer_Name' },
    { label: 'Buyer NTN', value: invoice.Buyer_NTN, confidence: conf(-2), isEditable: true, fieldName: 'Buyer_NTN' },
    { label: 'Buyer GST No', value: invoice.Buyer_GST_No, confidence: conf(-4), isEditable: true, fieldName: 'Buyer_GST_No' },
    { label: 'Buyer Registration No', value: invoice.Buyer_Registration_No, confidence: conf(-6), isEditable: true, fieldName: 'Buyer_Registration_No' },
    { label: 'Exclusive Value (PKR)', value: String(invoice.Exclusive_Value), confidence: conf(-1), isEditable: true, fieldName: 'Exclusive_Value' },
    { label: 'GST/Sales Tax (PKR)', value: String(invoice.GST_Sales_Tax), confidence: conf(-1), isEditable: true, fieldName: 'GST_Sales_Tax' },
    { label: 'Inclusive Value (PKR)', value: String(invoice.Inclusive_Value), confidence: conf(+0), isEditable: true, fieldName: 'Inclusive_Value' },
    { label: 'Advance Tax (PKR)', value: String(invoice.Advance_Tax), confidence: conf(-2), isEditable: true, fieldName: 'Advance_Tax' },
    { label: 'Net Amount (PKR)', value: String(invoice.Net_Amount), confidence: conf(+1), isEditable: true, fieldName: 'Net_Amount' },
    { label: 'Return (PKR)', value: String(invoice.Return), confidence: conf(-2), isEditable: true, fieldName: 'Return' },
    { label: 'Discount (PKR)', value: String(invoice.Discount), confidence: conf(-8), isEditable: true, fieldName: 'Discount' },
    { label: 'Incentive (PKR)', value: String(invoice.Incentive), confidence: conf(-10), isEditable: true, fieldName: 'Incentive' },
    { label: 'Location', value: invoice.Location, confidence: conf(-1), isEditable: true, fieldName: 'Location' },
    { label: 'GRN', value: invoice.GRN, confidence: conf(-4), isEditable: true, fieldName: 'GRN' },
  ];
}

