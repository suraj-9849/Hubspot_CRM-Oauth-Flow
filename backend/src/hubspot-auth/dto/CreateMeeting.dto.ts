export class CreateMeetingDto {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  buyerContactId?: string;
  sellerContactId?: string;
  buyerCompanyId?: string;
  sellerCompanyId?: string;
}
