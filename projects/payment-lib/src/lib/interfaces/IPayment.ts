import {IFee} from './IFee';
import {IStatusHistory} from './IStatusHistory';
import {IPaymentStatus} from './IPaymentStatus';

export interface IPayment {
  amount: number;
  description: string;
  reference: string;
  currency: string;
  date_created: string;
  banked_date: string;
  document_control_number: string;
  payer_name: string;
  date_updated: string;
  ccd_case_number: string;
  case_reference: string;
  channel: string;
  method: string;
  external_provider: string;
  status: string;
  payment_allocation: IPaymentStatus[];
  external_reference: string;
  site_id: string;
  service_name: string;
  account_number: string;
  customer_reference: string;
  organisation_name: string;
  fees: IFee[];
  status_histories: IStatusHistory[];
  payment_group_reference: string;
  paymentGroupReference?: string
}
