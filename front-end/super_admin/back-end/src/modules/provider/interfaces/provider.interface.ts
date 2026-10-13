export type DocumentStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/** A compliance document an operator submits (licence, permit, GST…). */
export interface ProviderDocument {
  type: string;
  number: string;
  status: DocumentStatus;
  note?: string;
  reviewedAt?: string;
}

export interface Provider {
  providerId: string;
  name: string;
  email: string;
  password: string;
  approved: boolean;
  documents?: ProviderDocument[];
  verificationStatus?: VerificationStatus; // derived from documents
  rejectionReason?: string;
  suspensionReason?: string;
  joinedAt?: string;
}
