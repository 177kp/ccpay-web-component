import { Component, OnInit, Input } from '@angular/core';
import { IPaymentList } from '../../interfaces/IPaymentList';
import {CaseTransactionsService} from '../../services/case-transactions/case-transactions.service';
import { PaymentViewService } from '../../services/payment-view/payment-view.service';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import { PaymentLibComponent } from '../../payment-lib.component';
import { IRemission } from '../../interfaces/IRemission';
import { IFee } from '../../interfaces/IFee';
import { PaymentToPayhubRequest } from '../../interfaces/PaymentToPayhubRequest';
import { SafeHtml } from '@angular/platform-browser';
import {Router} from '@angular/router';
import {Location} from '@angular/common';

const BS_ENABLE_FLAG = 'bulk-scan-enabling-fe';

@Component({
  selector: 'ccpay-fee-summary',
  templateUrl: './fee-summary.component.html',
  styleUrls: ['./fee-summary.component.scss']
})

export class FeeSummaryComponent implements OnInit {
  @Input() paymentGroupRef: string;
  @Input() ccdCaseNumber: string;

  bsPaymentDcnNumber: string;
  paymentGroup: any;
  errorMessage: string;
  viewStatus = 'main';
  currentFee: IFee;
  totalFee: number;
  payhubHtml: SafeHtml;
  service: string = "";
  upPaymentErrorMessage: string;
  selectedOption:string;
  isBackButtonEnable: boolean = true;
  outStandingAmount: number;
  isFeeAmountZero: boolean = false;;
  totalAfterRemission: number = 0;
  isConfirmationBtnDisabled: boolean = false;
  isRemoveBtnDisabled: boolean = false;
  isPaymentExist: boolean = false;

  constructor(
    private router: Router,
    private bulkScaningPaymentService: BulkScaningPaymentService,
    private location: Location,
    private paymentViewService: PaymentViewService,
    private caseTransactionsService: CaseTransactionsService,
    private paymentLibComponent: PaymentLibComponent
  ) {}

  ngOnInit() {
    this.viewStatus = 'main';
    this.bsPaymentDcnNumber = this.paymentLibComponent.bspaymentdcn;
    this.selectedOption = this.paymentLibComponent.SELECTED_OPTION.toLocaleLowerCase();

    this.paymentViewService.getBSfeature().subscribe(
      features => {
        let result = JSON.parse(features).filter(feature => feature.uid === BS_ENABLE_FLAG);
        this.paymentLibComponent.ISBSENABLE = result[0] ? result[0].enable : false;
      },
      err => {
        this.paymentLibComponent.ISBSENABLE = false;
      }
    );
    if (this.bsPaymentDcnNumber) {
      this.getUnassignedPaymentlist();
    }
    this.getPaymentGroup();
  }

    getUnassignedPaymentlist() {
     if (this.selectedOption === 'dcn') {
        this.bulkScaningPaymentService.getBSPaymentsByDCN(this.paymentLibComponent.DCN_NUMBER).subscribe(
        unassignedPayments => {
          if(unassignedPayments['data'].payments) {
            this.service = unassignedPayments['data'].responsible_service_id;
          } else {
            this.upPaymentErrorMessage = 'error';
          }
        },
        (error: any) => this.upPaymentErrorMessage = error
      );
    } else {
        this.bulkScaningPaymentService.getBSPaymentsByCCD(this.ccdCaseNumber).subscribe(
        unassignedPayments => {
          if(unassignedPayments['data'].payments) {
            this.service = unassignedPayments['data'].responsible_service_id;
          } else {
            this.upPaymentErrorMessage = 'error';
          }
        },
        (error: any) => this.upPaymentErrorMessage = error
      );
    }

  }

  getRemissionByFeeCode(feeCode: string): IRemission {
    if (this.paymentGroup && this.paymentGroup.remissions && this.paymentGroup.remissions.length > 0) {
      for (const remission of this.paymentGroup.remissions) {
        if (remission.fee_code === feeCode) {
          return remission;
        }
      }
    }
    return null;
  }

  addRemission(fee: IFee) {
    if (this.service) {
      this.currentFee = fee;
      this.viewStatus = 'add_remission';
    }
  }

  getPaymentGroup() {
    this.caseTransactionsService.getPaymentGroups(this.ccdCaseNumber).subscribe(
      paymentGroups => {
        console.log(paymentGroups['payment_groups'])
        if(paymentGroups['payment_groups'] && paymentGroups['payment_groups'].length > 0) {
          paymentGroups.forEach(paymentGroup => {
            if (paymentGroup.fees) {
              paymentGroup.fees.forEach(fee => {
                this.totalAfterRemission  = this.totalAfterRemission  + fee.net_amount;
                if(fee.calculated_amount === 0) {
                  this.isFeeAmountZero = true;
                }
              });
            }
            this.outStandingAmount = this.bulkScaningPaymentService.calculateOutStandingAmount(paymentGroup);
            paymentGroup.fees['outStandingAmount'] = this.outStandingAmount;
            paymentGroup.fees['isFeeAmountZero'] = this.isFeeAmountZero;
            paymentGroup.fees['totalAfterRemission'] = this.totalAfterRemission;
             paymentGroup.fees['isPaymentExist'] = paymentGroup.payments ? paymentGroup.payments.length > 0 : false;
            this.paymentGroup.push(paymentGroup.fees);

          });
        }
        console.log(this.paymentGroup)
    },
      (error: any) => this.errorMessage = error
    );
  }

  confirmRemoveFee(fee: IFee){
    this.isRemoveBtnDisabled = false;
    this.currentFee = fee;
    this.viewStatus = 'feeRemovalConfirmation';
  }

  removeFee(fee: any){
    this.isRemoveBtnDisabled = true;
    this.paymentViewService.deleteFeeFromPaymentGroup(fee).subscribe(
      (success: any) => {
          if (this.paymentGroup.fees && this.paymentGroup.fees.length > 1){
          this.totalAfterRemission = 0;
          this.getPaymentGroup();
          this.viewStatus = 'main';
          return;
          }
          this.loadCaseTransactionPage();
      },
      (error: any) => {
          this.errorMessage = error;
          this.isRemoveBtnDisabled = false;
      }
    );
  }

 loadCaseTransactionPage() {
    this.paymentLibComponent.TAKEPAYMENT = true;
    this.paymentLibComponent.viewName = 'case-transactions';
    this.paymentViewService.getBSfeature().subscribe(
      features => {
        let result = JSON.parse(features).filter(feature => feature.uid === BS_ENABLE_FLAG);
        this.paymentLibComponent.ISBSENABLE = result[0] ? result[0].enable : false;
      },
      err => {
        this.paymentLibComponent.ISBSENABLE = false;
      }
    );
  }
  cancelRemission() {
    this.viewStatus = 'main';
  }
  redirectToFeeSearchPage(event: any, page?: string) {
    event.preventDefault();
    let dcn = this.bsPaymentDcnNumber ? `&dcn=${this.bsPaymentDcnNumber}` : '';
    const ISBSenable = this.paymentLibComponent.ISBSENABLE ? '&isBulkScanning=Enable' : '&isBulkScanning=Disable';
    if(this.viewStatus === 'feeRemovalConfirmation' || this.viewStatus === 'add_remission') {
      this.viewStatus = 'main';
      return;
    }
    let url = `/fee-search?ccdCaseNumber=${this.ccdCaseNumber}&selectedOption=${this.paymentLibComponent.SELECTED_OPTION}&paymentGroupRef=${this.paymentGroupRef}${dcn}${ISBSenable}`;
    this.router.navigateByUrl(url);
  }
  takePayment() {
    this.isConfirmationBtnDisabled = true;
    const seriveName = this.service ==='AA07' ? 'DIVORCE': this.service ==='AA08' ? 'PROBATE' : 'FPL',

      requestBody = new PaymentToPayhubRequest(this.ccdCaseNumber, this.outStandingAmount, this.service, seriveName),
      res = new IPaymentList([]);
    this.paymentViewService.postPaymentToPayHub(requestBody, this.paymentGroupRef).subscribe(
      response => {
        this.location.go(`payment-history?view=fee-summary`);
        this.payhubHtml = response;
        this.viewStatus = 'payhub_view';
        this.isBackButtonEnable=false;
      },
      (error: any) => {
        this.errorMessage = error;
        this.isConfirmationBtnDisabled = false;
        this.router.navigateByUrl('/pci-pal-failure');
      }
    );
  }
  goToAllocatePage(outStandingAmount: number, isFeeAmountZero: Boolean) {
    if (outStandingAmount > 0 || (outStandingAmount === 0 && isFeeAmountZero)) {
      this.paymentLibComponent.paymentGroupReference = this.paymentGroupRef;
      this.paymentLibComponent.viewName = 'allocate-payments';
    } else {
      this.loadCaseTransactionPage();
    }
  }
}
