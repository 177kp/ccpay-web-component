import { Component, OnInit } from '@angular/core';
import {PaymentLibComponent} from '../../payment-lib.component';
import {IPaymentGroup} from '../../interfaces/IPaymentGroup';
import {CaseTransactionsService} from '../../services/case-transactions/case-transactions.service';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import {IFee} from '../../interfaces/IFee';
import {IPayment} from '../../interfaces/IPayment';
import {IRemission} from '../../interfaces/IRemission';
import {Router} from '@angular/router';

@Component({
  selector: 'ccpay-case-transactions',
  templateUrl: './case-transactions.component.html',
  styleUrls: ['./case-transactions.component.css']
})
export class CaseTransactionsComponent implements OnInit {
  takePayment: boolean;
  ccdCaseNumber: string;
  paymentGroups: IPaymentGroup[] = [];
  payments: IPayment[] = [];
  remissions: IRemission[] = [];
  fees: IFee[] = [];
  errorMessage: string;
  totalFees: number;
  totalPayments: number;
  totalRemissions: number;
  selectedOption: string;
  dcnNumber: string;
  isAddFeeBtnEnabled: boolean = true;
  isUnprocessedRecordSelected: boolean = false;
  exceptionRecordReference: string;
  isFeeRecordsExist: boolean = false;
  isGrpOutstandingAmtPositive: boolean = false;
  totalRefundAmount:Number;

    constructor(private router: Router,
    private bulkScaningPaymentService: BulkScaningPaymentService,
    private caseTransactionsService: CaseTransactionsService,
    private paymentLibComponent: PaymentLibComponent) { }

  ngOnInit() {
    this.isGrpOutstandingAmtPositive = false;
    this.ccdCaseNumber = this.paymentLibComponent.CCD_CASE_NUMBER;
    this.takePayment = this.paymentLibComponent.TAKEPAYMENT;
    this.caseTransactionsService.getPaymentGroups(this.ccdCaseNumber).subscribe(
      paymentGroups => {
        this.paymentGroups = paymentGroups['payment_groups'];
        this.calculateAmounts();
        this.totalRefundAmount = this.calculateRefundAmount();
      },
      (error: any) => {
        this.errorMessage = <any>error;
        this.setDefaults();
      }
    );

    this.dcnNumber = this.paymentLibComponent.DCN_NUMBER;
    this.selectedOption = this.paymentLibComponent.SELECTED_OPTION.toLocaleLowerCase();
  }

  setDefaults(): void {
    this.totalPayments = 0.00;
    this.totalRemissions = 0.00;
    this.totalFees = 0.00;
}

  calculateAmounts(): void {
    let feesTotal = 0.00,
     paymentsTotal = 0.00,
     remissionsTotal = 0.00;

    this.paymentGroups.forEach(paymentGroup => {
      if (paymentGroup.fees) {
        paymentGroup.fees.forEach(fee => {
          feesTotal = feesTotal + fee.calculated_amount;
          this.fees.push(fee);
        });
      }
      this.totalFees = feesTotal;

      if (paymentGroup.payments) {
        paymentGroup.payments.forEach(payment => {
          if (payment.status.toUpperCase() === 'SUCCESS') {
            paymentsTotal = paymentsTotal + payment.amount;
            this.payments.push(payment);
          }
        });
      }
      this.totalPayments = paymentsTotal;

      if (paymentGroup.remissions) {
        paymentGroup.remissions.forEach(remisison => {
          remissionsTotal = remissionsTotal + remisison.hwf_amount;
          this.remissions.push(remisison);
        });
      }
      this.totalRemissions = remissionsTotal;
    });

  }
  calculateRefundAmount() {
    let totalRefundAmount = 0;
    this.paymentGroups.forEach(paymentGroup => {
      let grpOutstandingAmount = 0.00,
        feesTotal = 0.00,
        paymentsTotal = 0.00,
        remissionsTotal = 0.00;
      if (paymentGroup.fees) {
        this.isFeeRecordsExist = true;
        paymentGroup.fees.forEach(fee => {
          feesTotal = feesTotal + fee.calculated_amount;
        });
      }

      if (paymentGroup.payments) {
        paymentGroup.payments.forEach(payment => {
          if (payment.status.toUpperCase() === 'SUCCESS') {
            paymentsTotal = paymentsTotal + payment.amount;
          }
        });
      }

      if (paymentGroup.remissions) {
        paymentGroup.remissions.forEach(remission => {
          remissionsTotal = remissionsTotal + remission.hwf_amount;
        });
      }  
        grpOutstandingAmount = (feesTotal - remissionsTotal) - paymentsTotal;
        if (grpOutstandingAmount < 0) {
          if(totalRefundAmount === 0) {
            totalRefundAmount = grpOutstandingAmount;
          } else {
            totalRefundAmount = (totalRefundAmount + grpOutstandingAmount);
          }
        } else if(grpOutstandingAmount > 0) {
          this.isGrpOutstandingAmtPositive = true;
        }
    });
    return totalRefundAmount * -1;
  }
  getGroupOutstandingAmount(paymentGroup: IPaymentGroup): number {
    return this.bulkScaningPaymentService.calculateOutStandingAmount(paymentGroup);;
  }

  redirectToFeeSearchPage(event: any) {
    event.preventDefault();
    this.router.navigateByUrl(`/fee-search?selectedOption=${this.selectedOption}&ccdCaseNumber=${this.ccdCaseNumber}`);
  }

  loadFeeSummaryPage(paymentGroup: IPaymentGroup) {
    this.paymentLibComponent.bspaymentdcn = null;
    this.paymentLibComponent.paymentGroupReference = paymentGroup.payment_group_reference;
    this.paymentLibComponent.viewName = 'fee-summary';
  }

  goToPaymentViewComponent(paymentGroupReference: string, paymentReference: string, paymentMethod: string) {
    this.paymentLibComponent.paymentMethod = paymentMethod;
    this.paymentLibComponent.paymentGroupReference = paymentGroupReference;
    this.paymentLibComponent.paymentReference = paymentReference;
    this.paymentLibComponent.viewName = 'payment-view';
  }

  selectedUnprocessedFeeEvent(unprocessedRecordId: string) {
    if ( unprocessedRecordId ) {
      this.isAddFeeBtnEnabled = false
      this.isUnprocessedRecordSelected = true;
    } else {
      this.isAddFeeBtnEnabled = true;
      this.isUnprocessedRecordSelected = false;
    }
  }
}
