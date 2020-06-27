import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import {IPayment} from '../../interfaces/IPayment';
import {Router} from '@angular/router';

@Component({
  selector: 'ccpay-app-processed-payments',
  templateUrl: './processed-payments.component.html',
  styleUrls: ['./processed-payments.component.scss']
})
export class ProcessedPaymentsComponent implements OnInit {

  @Input('NONPAYMENTS') NONPAYMENTS: IPayment[];
  @Output() goToPaymentViewComponent: EventEmitter<any> = new EventEmitter();

  constructor(
    private router: Router,
    private bulkScaningPaymentService: BulkScaningPaymentService
    ) { }
    ngOnInit() {
    }

    trimUnderscore(method: string){
      return this.bulkScaningPaymentService.removeUnwantedString(method,' ');
    }
    redirectToPaymentViewPage(paymentGroupReference: string, paymentReference: string, paymentMethod: string) {
      this.goToPaymentViewComponent.emit({paymentGroupReference, paymentReference, paymentMethod});
    }
}
