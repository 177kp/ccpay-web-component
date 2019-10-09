import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PaymentLibComponent } from '../../payment-lib.component';
import { PaymentViewService } from '../../services/payment-view/payment-view.service';
import {BulkScaningPaymentService} from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import { IBSPayments } from '../../interfaces/IBSPayments';
import { UnidentifiedPaymentsRequest } from '../../interfaces/UnidentifiedPaymentsRequest';
import { AllocatePaymentRequest } from '../../interfaces/AllocatePaymentRequest';

@Component({
  selector: 'app-mark-unidentified-payment',
  templateUrl: './mark-unidentified-payment.component.html',
  styleUrls: ['./mark-unidentified-payment.component.scss']
})
export class MarkUnidentifiedPaymentComponent implements OnInit {
  markPaymentUnidentifiedForm: FormGroup;
  viewStatus: string;
  ccdCaseNumber: string;
  bspaymentdcn: string;
  investicationDetailHasError: boolean = false;
  investicationDetailMinHasError: boolean = false;
  investicationDetailMaxHasError: boolean = false;
  errorMessage: string;
  unassignedRecord:IBSPayments;
  siteID: string = null;
  investigationComment: string;

  constructor(private formBuilder: FormBuilder,
  private paymentViewService: PaymentViewService,
  private paymentLibComponent: PaymentLibComponent,
  private bulkScaningPaymentService: BulkScaningPaymentService) { }

  ngOnInit() {
    this.viewStatus = 'mainForm';
    this.ccdCaseNumber = this.paymentLibComponent.CCD_CASE_NUMBER;
    this.bspaymentdcn = this.paymentLibComponent.bspaymentdcn;
    this.getUnassignedPayment();

    this.markPaymentUnidentifiedForm = this.formBuilder.group({
      investicationDetail: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(255),
        Validators.pattern('^([a-zA-Z0-9\\s,\\.]*)$')
      ]))
    });
  }
 getUnassignedPayment() {
    this.bulkScaningPaymentService.getBSPaymentsByDCN(this.bspaymentdcn).subscribe(
      unassignedPayments => {
        this.unassignedRecord = unassignedPayments['data'].payments.filter(payment => {
          return payment && payment.dcn_reference == this.bspaymentdcn;
        })[0];
        this.siteID = unassignedPayments['data'].responsible_service_id;
      },
      (error: any) => this.errorMessage = error
    );
  }
 saveAndContinue() {
    this.investicationDetailHasError = false;
    const formerror = this.markPaymentUnidentifiedForm.controls.investicationDetail.errors;
    if (this.markPaymentUnidentifiedForm.dirty && this.markPaymentUnidentifiedForm.valid) {
      this.investigationComment = this.markPaymentUnidentifiedForm.controls.investicationDetail.value;
      this.viewStatus = 'unidentifiedContinueConfirm';
    }else {
      if(this.markPaymentUnidentifiedForm.controls.investicationDetail.invalid ) {
        this.investicationDetailHasError = true;
        this.investicationDetailMinHasError = false;
        this.investicationDetailMaxHasError = false;
      }
      if(formerror.minlength && formerror.minlength.actualLength < 3 ) {
        this.investicationDetailHasError = false;
        this.investicationDetailMinHasError = true;
      }
      if(formerror.maxlength && formerror.maxlength.actualLength > 255 ) {
        this.investicationDetailHasError = false;
        this.investicationDetailMaxHasError = true;
      }
    }
  }
  confirmPayments() {
    const requestBody = new AllocatePaymentRequest
    (this.ccdCaseNumber, this.unassignedRecord, this.siteID),
    reason = this.markPaymentUnidentifiedForm.get('investicationDetail').value;
    this.paymentViewService.postBSPayments(requestBody).subscribe(
      res1 => {
        const reqBody = new UnidentifiedPaymentsRequest
        (res1['data'].payment_group_reference, res1['data'].reference, reason);
        this.paymentViewService.postBSUnidentifiedPayments(reqBody).subscribe(
          res2 => {
            if (res2.success) {
              this.bulkScaningPaymentService.patchBSChangeStatus(this.unassignedRecord.dcn_reference, 'PROCESSED').subscribe(
                res3 => {
                  if (res3.success) {
                    this.paymentLibComponent.viewName = 'case-transactions';
                    this.paymentLibComponent.TAKEPAYMENT = true;
                  }
                },
                (error: any) => this.errorMessage = error
              );
            }
          },
          (error: any) => this.errorMessage = error
        );
      },
      (error: any) => this.errorMessage = error
    );
  }
  cancelMarkUnidentifiedPayments(type?:string){
    if(type && type === 'cancel') {
        if(this.markPaymentUnidentifiedForm.get('investicationDetail').value!==""){
          this.viewStatus = 'unidentifiedCancelConfirm';
        } else {
          this.gotoCasetransationPage();
        }
    } else {
      this.viewStatus = 'mainForm';
    }
  }
  gotoCasetransationPage() {
    this.paymentLibComponent.viewName = 'case-transactions';
    this.paymentLibComponent.TAKEPAYMENT = true;
  }
}
