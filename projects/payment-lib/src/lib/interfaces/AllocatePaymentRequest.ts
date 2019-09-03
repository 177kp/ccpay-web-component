import { IBSPayments } from "./IBSPayments";

export class AllocatePaymentRequest {
  amount: Number;
  banked_date: String;
  ccd_case_number: String;
  currency: String;
  document_control_number: String;
  external_provider: String;
  giro_slip_no: String;
  payer_name: String;
  payment_channel: Object;
  payment_status: Object;
  payment_method: String;
  requestor: String;
  site_id: String;

  constructor(ccd_case_number : string, unAllocatedPayment: IBSPayments) {
    this.amount = unAllocatedPayment.amount;
    this.banked_date = unAllocatedPayment.date_banked;
    this.ccd_case_number = ccd_case_number;
    this.currency= unAllocatedPayment.currency;
    this.document_control_number = unAllocatedPayment.dcn_reference;
    this.external_provider = 'exela';
    this.giro_slip_no = unAllocatedPayment.bgc_reference;
    this.payer_name = unAllocatedPayment.payer_name;
    this.payment_channel = {
      description: '',
      name: 'bulk scan'
    };
    this.payment_status ={
      description: 'SUCCESS',
      name: 'bulk scan payment completed'
    }
    this.payment_method = unAllocatedPayment.payment_method;
    this.requestor= 'DIVORCE';
    this.site_id= 'AA07';
  }
}
