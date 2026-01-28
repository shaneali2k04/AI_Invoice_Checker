from typing import Any, Optional
from pydantic import BaseModel


class JobStatus(BaseModel):
    id: str
    document_id: str
    filename: Optional[str] = None
    status: str  # queued | running | completed | failed
    total_pages: Optional[int] = None
    processed_pages: int = 0
    message: Optional[str] = None
    error: Optional[str] = None
    invoice_ids: list[str] = []
    has_low_readability: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class Party(BaseModel):
    id: str
    type: str  # supplier | buyer
    name: Optional[str] = None
    ntn: Optional[str] = None
    gst_no: Optional[str] = None
    registration_no: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class InvoiceListItem(BaseModel):
    id: str
    document_id: str
    page_no: int
    supplier_party_id: Optional[str] = None
    buyer_party_id: Optional[str] = None
    status: str
    needs_rescan: bool
    unreadable_fields: list[str]
    reasons: list[str]
    extracted: dict[str, Any]
    current: dict[str, Any]
    model_avg_confidence: Optional[float] = None
    system_confidence: Optional[float] = None
    system_reasons: list[str] = []
    field_diagnostics: dict[str, Any] = {}


class InvoiceDetail(BaseModel):
    id: str
    document_id: str
    page_no: int
    supplier_party_id: Optional[str] = None
    buyer_party_id: Optional[str] = None
    status: str
    needs_rescan: bool
    unreadable_fields: list[str]
    reasons: list[str]
    extracted: dict[str, Any]
    edited: dict[str, Any]
    current: dict[str, Any]
    model_avg_confidence: Optional[float] = None
    system_confidence: Optional[float] = None
    system_reasons: list[str] = []
    field_diagnostics: dict[str, Any] = {}
    document_url: str


class UpdateInvoiceRequest(BaseModel):
    status: Optional[str] = None
    edited: Optional[dict[str, Any]] = None


class RequestRescanRequest(BaseModel):
    reasons: list[str] = []
    unreadable_fields: list[str] = []


class UploadResponse(BaseModel):
    document_id: str
    invoices: list[InvoiceListItem]


class UploadJobResponse(BaseModel):
    job_id: str
    document_id: str

