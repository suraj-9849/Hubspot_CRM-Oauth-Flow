export class CreateDealDto {
    // Deal properties as defined by HubSpot:
    dealName: string;           // Maps to the deal's name (dealname)
    amount: number;             // The deal amount (in your currency)
    dealStage: string;          // The stage of the deal (e.g., "appointmentscheduled")
    pipeline: string;           // The pipeline ID where this deal belongs
    closeDate: string;          // The expected close date (ISO string or Unix timestamp)
    
    // Optionally, include association IDs if you want to associate this deal with a contact or a company.
    contactId?: string;
    companyId?: string;
  }
  