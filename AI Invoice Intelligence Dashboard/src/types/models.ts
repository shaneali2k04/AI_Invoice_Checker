export type InvoiceStatus = 'auto-extracted' | 'needs-review' | 'approved';

export interface Invoice {
  id: string;
  documentId?: string;
  pageNo?: number;
  Invoice_Date: string;
  Invoice_No: string;
  Supplier_Name: string;
  Supplier_NTN: string;
  Supplier_GST_No: string;
  Supplier_Registration_No: string;
  Buyer_Name: string;
  Buyer_NTN: string;
  Buyer_GST_No: string;
  Buyer_Registration_No: string;
  Exclusive_Value: number;
  GST_Sales_Tax: number;
  Inclusive_Value: number;
  Advance_Tax: number;
  Net_Amount: number;
  Return: number;
  Discount: number;
  Incentive: number;
  Location: string;
  GRN: string;
  aiConfidence: number;
  status: InvoiceStatus;
  hasIssues: boolean;
  priceVariance?: number;
}

export type ReviewIssueType = 'blurry' | 'missing-fields' | 'low-confidence';
export type ReviewStatus = 'pending' | 'in-review' | 'corrected';

export interface ProblematicInvoice {
  id: string;
  invoiceNo: string;
  supplierName: string;
  date: string;
  amount: number;
  issueType: ReviewIssueType;
  affectedFields: string[];
  aiConfidence: number;
  status: ReviewStatus;
}

export type UserRole = 'Admin' | 'Finance' | 'Viewer' | 'Auditor';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastActive: string;
  createdAt: string;
}

export interface InvoiceField {
  label: string;
  value: string;
  confidence: number;
  isEditable: boolean;
  fieldName: string;
}

