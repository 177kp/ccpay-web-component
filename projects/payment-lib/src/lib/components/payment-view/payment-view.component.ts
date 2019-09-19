import {Component, OnInit} from '@angular/core';

import {PaymentViewService} from '../../services/payment-view/payment-view.service';
import {PaymentLibComponent} from '../../payment-lib.component';
import {IPaymentGroup} from '../../interfaces/IPaymentGroup';

@Component({
  selector: 'ccpay-payment-view',
  templateUrl: './payment-view.component.html',
  styleUrls: ['./payment-view.component.css']
})
export class PaymentViewComponent implements OnInit {
  paymentGroup: IPaymentGroup;
  errorMessage: string;
  ccdCaseNumber: string;
  selectedOption: string;
  dcnNumber: string;
  isStatusAllocated: boolean;

  constructor(private paymentViewService: PaymentViewService,
              private paymentLibComponent: PaymentLibComponent) {
  }

  ngOnInit() {
    this.ccdCaseNumber = this.paymentLibComponent.CCD_CASE_NUMBER;
    this.selectedOption = this.paymentLibComponent.SELECTED_OPTION;
    this.dcnNumber = this.paymentLibComponent.DCN_NUMBER;


    this.paymentViewService.getPaymentGroupDetails(this.paymentLibComponent.paymentGroupReference,
      this.paymentLibComponent.paymentMethod).subscribe(
      paymentGroup => {
        this.paymentGroup = paymentGroup;
        this.paymentGroup.payments = this.paymentGroup.payments.filter
        (paymentGroupObj => paymentGroupObj['reference'].includes(this.paymentLibComponent.paymentReference));
        const paymentAllocation = this.paymentGroup.payments[0].payment_allocation,
        paymentAllocationStatus = paymentAllocation.length > 0 ? paymentAllocation[0].payment_allocation_status : null;
        this.isStatusAllocated = paymentAllocationStatus && paymentAllocationStatus.name === 'Allocated' || paymentAllocationStatus;
      },  
      (error: any) => this.errorMessage = error
    );
   
  }

  get isCardPayment(): boolean {
    return this.paymentGroup.payments[0].method === 'card';
  }

  get isTelephonyPayment(): boolean {
    return this.paymentGroup.payments[0].channel === 'telephony';
  }

  public goToPaymentList(): void {
    this.paymentLibComponent.viewName = 'payment-list';
  }

  goToCaseTransationPage(event: any) {
    event.preventDefault()
    this.paymentLibComponent.viewName = 'case-transactions';
  }

}
