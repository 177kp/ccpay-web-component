import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PaymentLibComponent } from '../../payment-lib.component';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import { IBSPayments } from '../../interfaces/IBSPayments';
import { UnsolicitedPaymentsRequest } from '../../interfaces/UnsolicitedPaymentsRequest';
import { PaymentViewService } from '../../services/payment-view/payment-view.service';
import { AllocatePaymentRequest } from '../../interfaces/AllocatePaymentRequest';
import { stringLiteral } from 'babel-types';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-mark-unsolicited-payment',
  templateUrl: './mark-unsolicited-payment.component.html',
  styleUrls: ['./mark-unsolicited-payment.component.scss']
})
export class MarkUnsolicitedPaymentComponent implements OnInit {
  markPaymentUnsolicitedForm: FormGroup;
  viewStatus: string;
  reasonHasError: boolean = false;
  isReasonEmpty: boolean = false;
  reasonMinHasError: boolean = false;
  reasonMaxHasError: boolean = false;
  responsibleOfficeHasError: boolean = false;
  isResponsibleOfficeEmpty: boolean = false;
  errorMessage = this.getErrorMessage(false);
  ccdCaseNumber: string;
  bspaymentdcn: string;
  unassignedRecord: IBSPayments;
  siteID: string = null;
  reason: string;
  responsiblePerson: string;
  responsibleOffice: string;
  emailId: string;
  isConfirmButtondisabled:Boolean = false;
  ccdReference: string = null;
  exceptionReference: string = null;
  selectedSiteId: string;
  selectedSiteName: string;

  constructor(private formBuilder: FormBuilder,
  private paymentViewService: PaymentViewService,
  private paymentLibComponent: PaymentLibComponent,
  private bulkScaningPaymentService: BulkScaningPaymentService) { }

  ngOnInit() {
    this.resetForm([false,false,false,false,false,false], 'all');
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
  trimUnderscore(method: string){
    return this.bulkScaningPaymentService.removeUnwantedString(method,' ');
  }
  confirmPayments() {
    this.isConfirmButtondisabled = true;
    const controls = this.markPaymentUnsolicitedForm.controls;
    // controls.responsibleOffice.setValue('P219');
    this.bulkScaningPaymentService.patchBSChangeStatus(this.unassignedRecord.dcn_reference, 'PROCESSED').subscribe(
      res1 => {
        this.errorMessage = this.getErrorMessage(false);
        const response1 = JSON.parse(res1),
         requestBody = new AllocatePaymentRequest
         (this.ccdReference, this.unassignedRecord, this.siteID, this.exceptionReference)
        this.paymentViewService.postBSPayments(requestBody).subscribe(
          res2 => {
            this.errorMessage = this.getErrorMessage(false);
            const response2 = JSON.parse(res2),
            reqBody = new UnsolicitedPaymentsRequest
            (response2['data'].payment_group_reference, response2['data'].reference, controls.reason.value, this.selectedSiteId, controls.responsiblePerson.value, controls.emailId.value);
             if (response2.success) {
              this.paymentViewService.postBSUnsolicitedPayments(reqBody).subscribe(
                res3 => {
                  this.errorMessage = this.getErrorMessage(false);
                  const response3 = JSON.parse(res3);
                  if (response3.success) {
                    this.gotoCasetransationPage();
                  }
                },
                (error: any) => {
                  this.bulkScaningPaymentService.patchBSChangeStatus(this.unassignedRecord.dcn_reference, 'COMPLETE').subscribe();
                  this.errorMessage = this.getErrorMessage(true);
                  this.isConfirmButtondisabled = false;
                }
              );
            }
          },
          (error: any) => {
            this.bulkScaningPaymentService.patchBSChangeStatus(this.unassignedRecord.dcn_reference, 'COMPLETE').subscribe();
            this.errorMessage = this.getErrorMessage(true);
            this.isConfirmButtondisabled = false;
          }
        );
      },
      (error: any) => {
        this.errorMessage = this.getErrorMessage(true);
        this.isConfirmButtondisabled = false;
      }
    );
  }
 saveAndContinue() {
    this.resetForm([false,false,false,false,false,false], 'all');
        const formerror = this.markPaymentUnsolicitedForm.controls.reason.errors;
        const reasonField = this.markPaymentUnsolicitedForm.controls.reason;
        // this.markPaymentUnsolicitedForm.controls.responsibleOffice.setValue('P219');
        const officeIdField = this.selectedSiteId;
    if (this.markPaymentUnsolicitedForm.dirty && this.markPaymentUnsolicitedForm.valid) {
      const controls = this.markPaymentUnsolicitedForm.controls;
      this.emailId = controls.emailId.value;
      this.responsibleOffice = officeIdField;
      this.responsiblePerson = controls.responsiblePerson.value;
      this.reason = controls.reason.value;
      this.viewStatus = 'unsolicitedContinueConfirm';
    }else {
      if( reasonField.value == '' ) {
        this.resetForm([true,false,false,false,false,false], 'reason');
      }
      if(reasonField.value != '' && this.markPaymentUnsolicitedForm.controls.reason.invalid ) {
        this.resetForm([false,true,false,false,false,false], 'reason');
      }
      if(formerror && formerror.minlength && formerror.minlength.actualLength < 3 ) {
        this.resetForm([false,false,true,false,false,false], 'reason');
      }
      if(formerror && formerror.maxlength && formerror.maxlength.actualLength > 255 ) {
        this.resetForm([false,false,false,true,false,false], 'reason');
      }
      // if(officeIdField.value == '') {
      //   this.resetForm([false,false,false,false,true,false], 'responsibleOffice');
      // }
      // if(officeIdField.value != '' && officeIdField.invalid) {
      //   this.resetForm([false,false,false,false,false,true],'responsibleOffice');
      // }
    }
  }
  resetForm(val, field) {
    if(field==='reason' || field==='all') {
      this.isReasonEmpty = val[0];
      this.reasonHasError = val[1];
      this.reasonMinHasError = val[2];
      this.reasonMaxHasError = val[3];
    }
    if(field==='responsibleOffice' || field==='all') {
      this.isResponsibleOfficeEmpty = val[4];
      this.responsibleOfficeHasError = val[5];
    }
  }

cancelMarkUnsolicitedPayments(type?:string){
    if(type && type === 'cancel') {
      if(this.checkingFormValue()){
        this.viewStatus = 'unsolicitedCancelConfirm';
      } else {
        this.gotoCasetransationPage();
      }
    } else {
      this.markPaymentUnsolicitedForm.controls.responsibleOffice.setValue('');
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
    this.paymentLibComponent.ISBSENABLE = true;
  }
   getUnassignedPayment() {
    this.bulkScaningPaymentService.getBSPaymentsByDCN(this.bspaymentdcn).subscribe(
      unassignedPayments => {
        
      this.unassignedRecord = unassignedPayments['data'].payments.filter(payment => {
        return payment && payment.dcn_reference == this.bspaymentdcn;
      })[0];
       this.siteID = unassignedPayments['data'].responsible_service_id;
        const beCcdNumber = unassignedPayments['data'].ccd_reference,
         beExceptionNumber = unassignedPayments['data'].exception_record_reference,
         exceptionReference = beCcdNumber ? beCcdNumber === this.ccdCaseNumber ? null : this.ccdCaseNumber : this.ccdCaseNumber;
        this.ccdReference = beCcdNumber ? beCcdNumber : null;
        this.exceptionReference = beExceptionNumber ? beExceptionNumber : exceptionReference;
    },
      (error: any) => {
        this.errorMessage = this.getErrorMessage(true);
      }
    );
  }

  getErrorMessage(isErrorExist) {
    return {
      title: "There is a problem with the service",
      body: "Try again later",
      showError: isErrorExist
    };
  }

  selectchange(args){ 
    this.selectedSiteId = args.target.value; 
    this.selectedSiteName = args.target.options[args.target.selectedIndex].text; 
  } 

}
