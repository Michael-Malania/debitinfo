export interface RsTaxpayerPublicInfo {
  identCode: string;
  status: string; // e.g. "აქტიური", "არამეწარმე ფ/პ"
  registeredSubject: string; // e.g. "შეზღუდული პასუხისმგებლობის საზოგადოება", "ფიზიკური პირი"
  fullName: string;
  vatPayer: boolean;
  mortgage: boolean;
  sequestration: boolean;
  additionalStatus?: string;
  rawPayload: Record<string, any>;
  isMock: boolean;
}

export interface RsOAuthVerifyResult {
  authenticated: boolean;
  fullName: string;
  persNo: string;
  payerType: string;
  address: string;
  rawXml?: string;
  isMock: boolean;
}
