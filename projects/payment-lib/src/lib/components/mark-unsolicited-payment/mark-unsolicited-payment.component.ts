import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PaymentLibComponent } from '../../payment-lib.component';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import { IBSPayments } from '../../interfaces/IBSPayments';
import { UnsolicitedPaymentsRequest } from '../../interfaces/UnsolicitedPaymentsRequest';
import { PaymentViewService } from '../../services/payment-view/payment-view.service';
import { AllocatePaymentRequest } from '../../interfaces/AllocatePaymentRequest';
import { stringLiteral } from 'babel-types';

@Component({
  selector: 'app-mark-unsolicited-payment',
  templateUrl: './mark-unsolicited-payment.component.html',
  styleUrls: ['./mark-unsolicited-payment.component.scss']
})
export class MarkUnsolicitedPaymentComponent implements OnInit {
  markPaymentUnsolicitedForm: FormGroup;
  viewStatus: string;
  reasonHasError: boolean = false;
  reasonMinHasError: boolean = false;
  reasonMaxHasError: boolean = false;
  responsibleOfficeHasError: boolean = false;
  responsiblePersonHasError: boolean = false;
  errorMessage: string;
  emailIdHasError: boolean = false;
  ccdCaseNumber: string;
  bspaymentdcn: string;
  unassignedRecord: IBSPayments;
  siteID: string = null;
  reason: string;
  responsiblePerson: string;
  responsibleOffice: string;
  emailId: string;
  isConfirmButtondisabled:Boolean = false;

  constructor(private formBuilder: FormBuilder,
  private paymentViewService: PaymentViewService,
  private paymentLibComponent: PaymentLibComponent,
  private bulkScaningPaymentService: BulkScaningPaymentService) { }

  ngOnInit() {
    this.resetForm();
    this.viewStatus = 'mainForm';
    this.ccdCaseNumber = this.paymentLibComponent.CCD_CASE_NUMBER;
    this.bspaymentdcn = this.paymentLibComponent.bspaymentdcn;
    this.getUnassignedPayment();

    const emailPattern = '^[a-z0-9](\\.?[a-z0-9_-]){0,}@[a-z0-9-]+\\.([a-z]{1,6}\\.)?[a-z]{2,6}$';
    
    this.markPaymentUnsolicitedForm = this.formBuilder.group({
      reason: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(255),
        Validators.pattern('^([a-zA-Z0-9\\s,\\.]*)$')
      ])),
      responsibleOffice: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^([a-zA-Z0-9\\s\\n,\\.-:]*)$')
      ])),
      responsiblePerson: new FormControl(''),
      emailId: new FormControl('')
    });
  }
  confirmPayments() {
    this.isConfirmButtondisabled = true;
    const controls = this.markPaymentUnsolicitedForm.controls;
    const requestBody = new AllocatePaymentRequest
    (this.ccdCaseNumber, this.unassignedRecord, this.siteID);
    this.paymentViewService.postBSPayments(requestBody).subscribe(
      res1 => {
        const reqBody = new UnsolicitedPaymentsRequest
        (res1['data'].payment_group_reference, res1['data'].reference, controls.reason.value, controls.responsibleOffice.value, controls.responsiblePerson.value, controls.emailId.value);

        this.paymentViewService.postBSUnsolicitedPayments(reqBody).subscribe(
          res2 => {
             if (res2.success) {
              this.bulkScaningPaymentService.patchBSChangeStatus(this.unassignedRecord.dcn_reference, 'PROCESSED').subscribe(
                res3 => {
                  if (res3.success) {
                    this.paymentLibComponent.viewName = 'case-transactions';
                    this.paymentLibComponent.TAKEPAYMENT = true;
                  }
                },
                (error: any) => {
                  this.errorMessage = error;
                  this.isConfirmButtondisabled = false;
                }
              );
            }
          },
          (error: any) => {
            this.errorMessage = error;
            this.isConfirmButtondisabled = false;
          }
        );
      },
      (error: any) => {
        this.errorMessage = error;
        this.isConfirmButtondisabled = false;
      }
    );
  }
 saveAndContinue() {
    this.resetForm();
        const formerror = this.markPaymentUnsolicitedForm.controls.reason.errors;
    if (this.markPaymentUnsolicitedForm.dirty && this.markPaymentUnsolicitedForm.valid) {
      const controls = this.markPaymentUnsolicitedForm.controls;
      this.emailId = controls.emailId.value;
      this.responsibleOffice = controls.responsibleOffice.value;
      this.responsiblePerson = controls.responsiblePerson.value;
      this.reason = controls.reason.value;
      this.viewStatus = 'unsolicitedContinueConfirm';
    }else {
      if(this.markPaymentUnsolicitedForm.controls.reason.invalid ) {
        this.reasonHasError = true;
        this.reasonMinHasError = false;
        this.reasonMaxHasError = false;
      }
      if(formerror.minlength && formerror.minlength.actualLength < 3 ) {
        this.reasonHasError = false;
        this.reasonMinHasError = true;
      }
      if(formerror.maxlength && formerror.maxlength.actualLength > 255 ) {
        this.reasonHasError = false;
        this.reasonMaxHasError = true;
      }
      if(this.markPaymentUnsolicitedForm.controls.responsibleOffice.invalid) {
        this.responsibleOfficeHasError = true;
      }
      if(this.markPaymentUnsolicitedForm.controls.responsiblePerson.invalid) {
        this.responsiblePersonHasError = true;
      }
      if(this.markPaymentUnsolicitedForm.controls.emailId.invalid) {
        this.emailIdHasError = true;
      }
    }
  }
  resetForm() {
    this.reasonHasError = false;
    this.reasonMinHasError = false;
    this.reasonMaxHasError = false;
    this.responsibleOfficeHasError = false;
    this.responsiblePersonHasError = false;
    this.emailIdHasError = false;
  }

cancelMarkUnsolicitedPayments(type?:string){
    if(type && type === 'cancel') {
      if(this.checkingFormValue()){
        this.viewStatus = 'unsolicitedCancelConfirm';
      } else {
        this.gotoCasetransationPage();
      }
    } else {
      this.viewStatus = 'mainForm';
    }
  }
  checkingFormValue(){
    const formFields = this.markPaymentUnsolicitedForm.value;
    let valueExists = false;

    for (var field in formFields) {
      if (formFields.hasOwnProperty(field) && formFields[field] !=="") {
        valueExists = true;
        break;
      }
    }
    return valueExists;
  }
  gotoCasetransationPage() {
    this.paymentLibComponent.viewName = 'case-transactions';
    this.paymentLibComponent.TAKEPAYMENT = true;
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

}
