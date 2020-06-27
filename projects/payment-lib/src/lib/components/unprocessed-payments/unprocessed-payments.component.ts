import { Component, OnInit, Output,Input, EventEmitter } from '@angular/core';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import { PaymentLibComponent } from '../../payment-lib.component';
import { IBSPayments } from '../../interfaces/IBSPayments';
import {Router} from '@angular/router';

@Component({
  selector: 'ccpay-app-unprocessed-payments',
  templateUrl: './unprocessed-payments.component.html',
  styleUrls: ['./unprocessed-payments.component.scss']
})
export class UnprocessedPaymentsComponent implements OnInit {

  @Input('FEE_RECORDS_EXISTS') FEE_RECORDS_EXISTS: boolean;
  @Input('IS_BUTTON_ENABLE') IS_BUTTON_ENABLE: boolean;
  @Input('IS_OS_AMT_AVAILABLE') IS_OS_AMT_AVAILABLE: boolean;
  @Output() selectedUnprocessedFeeEvent: EventEmitter<string> = new EventEmitter();
  @Output() getUnprocessedFeeCount: EventEmitter<string> = new EventEmitter();

  viewStatus = 'main';
  unassignedRecordList: IBSPayments;
  upPaymentErrorMessage: string = null;
  ccdCaseNumber: string;
  recordId: string = null;
  isRecordExist: boolean = false;
  dcnNumber: string = null;
  selectedOption: string;
  isUnprocessedRecordSelected: boolean = false;
  isAllocateToExistingFeebtnEnabled: boolean = false;
  isMarkAsUnidentifiedbtnEnabled: boolean = false;
  isAllocatedToNewFeebtnEnabled: boolean = false;
  isExceptionCase: boolean = false;
  serviceId: string = null;
  isBulkScanEnable;

  constructor(private router: Router,
    private bulkScaningPaymentService: BulkScaningPaymentService,
    private paymentLibComponent: PaymentLibComponent) { }

  ngOnInit() {
    // Todo ...
    this.ccdCaseNumber = this.paymentLibComponent.CCD_CASE_NUMBER;
    this.selectedOption = this.paymentLibComponent.SELECTED_OPTION.toLocaleLowerCase();
    this.dcnNumber = this.paymentLibComponent.DCN_NUMBER;
    this.isBulkScanEnable = this.paymentLibComponent.ISBSENABLE;
    this.getUnassignedPaymentlist();
     }

  getUnassignedPaymentlist() {
     if (this.selectedOption === 'dcn') {
        this.bulkScaningPaymentService.getBSPaymentsByDCN(this.dcnNumber).subscribe(
        unassignedPayments => {
          if(unassignedPayments['data'] && unassignedPayments['data'].payments) {
            this.setValuesForUnassignedRecord(unassignedPayments['data']);
          } else if(unassignedPayments['payments']) {
            this.setValuesForUnassignedRecord(unassignedPayments);
          } else {
            this.upPaymentErrorMessage = 'error';
            this.getUnprocessedFeeCount.emit('0');
          }
        },
        (error: any) => {
          this.upPaymentErrorMessage = error;
          this.getUnprocessedFeeCount.emit('0');
        }
      );
    } else {
        this.bulkScaningPaymentService.getBSPaymentsByCCD(this.ccdCaseNumber).subscribe(
        unassignedPayments => {
          if(unassignedPayments['data'] && unassignedPayments['data'].payments) {
            this.setValuesForUnassignedRecord(unassignedPayments['data']);
          } else if(unassignedPayments['payments']) {
            this.setValuesForUnassignedRecord(unassignedPayments);
          } else {
            this.upPaymentErrorMessage = 'error';
            this.getUnprocessedFeeCount.emit('0');
          }
        },
        (error: any) => {
          this.upPaymentErrorMessage = error;
          this.getUnprocessedFeeCount.emit('0');
        }
      );
    }

  }
  setValuesForUnassignedRecord(unassignedPayments) {
    this.unassignedRecordList = unassignedPayments.payments;
    this.serviceId = unassignedPayments.responsible_service_id;
    if (unassignedPayments['ccd_reference'] === undefined) {
      this.isExceptionCase = true;
    }
    this.isRecordExist =  this.unassignedRecordList.length === 0;
    this.getUnprocessedFeeCount.emit(<any>this.unassignedRecordList.length);
  }
  formatUnassignedRecordId(ID: Number) {
    return `unassignrecord-${ID}`;
  }
  trimUnderscore(method: string){
    return this.bulkScaningPaymentService.removeUnwantedString(method,' ');
  }
  redirectToFeeSearchPage(event: any) {
    event.preventDefault();
    const url = this.isBulkScanEnable ? '&isBulkScanning=Enable' : '&isBulkScanning=Disable';
    this.router.navigateByUrl(`/fee-search?selectedOption=${this.selectedOption}&ccdCaseNumber=${this.ccdCaseNumber}&dcn=${this.recordId}${url}`);
  }
  loadUnsolicitedPage(viewName: string) {
    this.paymentLibComponent.bspaymentdcn = this.recordId;
    this.paymentLibComponent.viewName = viewName;
  }
  unprocessedPaymentSelectEvent(selectedRecordReference: any) {
   this.isUnprocessedRecordSelected = true;
   this.validateButtons();
   this.selectedUnprocessedFeeEvent.emit(selectedRecordReference);
  }
  goToAllocatePage() {
    this.paymentLibComponent.bspaymentdcn = this.recordId;
    this.paymentLibComponent.paymentGroupReference = null;
    this.paymentLibComponent.unProcessedPaymentServiceId = this.serviceId
    this.paymentLibComponent.viewName = 'allocate-payments';
  }

  validateButtons() {
  if ( this.isUnprocessedRecordSelected  && this.isExceptionCase) {
        this.isMarkAsUnidentifiedbtnEnabled = true;
    } else if ( this.isUnprocessedRecordSelected  && !this.isExceptionCase && !this.FEE_RECORDS_EXISTS) {
      this.isAllocateToExistingFeebtnEnabled = false;
      this.isAllocatedToNewFeebtnEnabled = true;
    } else if( this.isUnprocessedRecordSelected && !this.isExceptionCase && this.FEE_RECORDS_EXISTS ) {
      this.isAllocateToExistingFeebtnEnabled = this.IS_OS_AMT_AVAILABLE;
      this.isAllocatedToNewFeebtnEnabled = true;
    }

  }
  unprocessedPaymentUnSelectEvent(event: any) {
    event.preventDefault();
    this.recordId = null;
    this.isUnprocessedRecordSelected = false;
    this.isAllocateToExistingFeebtnEnabled = false;
    this.isAllocatedToNewFeebtnEnabled = false;
    this.isMarkAsUnidentifiedbtnEnabled = false;
    //this.validateButtons();
    this.selectedUnprocessedFeeEvent.emit('');
  }

}
