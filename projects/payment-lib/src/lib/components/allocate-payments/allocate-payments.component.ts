import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PaymentLibComponent } from '../../payment-lib.component';
import { PaymentViewService } from '../../services/payment-view/payment-view.service';
import {BulkScaningPaymentService} from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import {CaseTransactionsService} from '../../services/case-transactions/case-transactions.service';
import {IPaymentGroup} from '../../interfaces/IPaymentGroup';
import {IBSPayments} from '../../interfaces/IBSPayments';
import {AllocatePaymentRequest} from '../../interfaces/AllocatePaymentRequest';
import {IAllocationPaymentsRequest} from '../../interfaces/IAllocationPaymentsRequest';

@Component({
  selector: 'app-allocate-payments',
  templateUrl: './allocate-payments.component.html',
  styleUrls: ['./allocate-payments.component.scss']
})
export class AllocatePaymentsComponent implements OnInit {
  overUnderPaymentForm: FormGroup;
  viewStatus: string;
  ccdCaseNumber: string;
  bspaymentdcn: string;
  unAllocatedPayment: IBSPayments = {
    amount: 0
  };
  siteID: string = null;
  errorMessage: string;
  paymentGroups: IPaymentGroup[] = [];
  selectedPayment: IPaymentGroup;
  remainingAmount: number;
  isRemainingAmountGtZero: boolean;
  isMoreDetailsBoxHide: boolean  = true;
  isRemainingAmountLtZero: boolean;
  afterFeeAllocateOutstanding: number;
  amountForAllocation: number;
  isConfirmButtondisabled: boolean = false;
  isContinueButtondisabled: boolean = true;
  otherPaymentExplanation: string = null;

  paymentReasonHasError: boolean = false;
  paymentExplanationHasError: boolean = false;
  isPaymentDetailsEmpty: boolean = false;
  isPaymentDetailsInvalid: boolean = false;
  paymentDetailsMinHasError: boolean = false;
  paymentDetailsMaxHasError: boolean = false;
  isUserNameEmpty: boolean = false;
  isUserNameInvalid: boolean = false;

  paymentReason: string = null;
  paymentExplanation: string = null;
  userName: string = null;
  paymentSectionLabel: any;

  reasonList: { [key: string]: { [key: string]: string } }= {
    overPayment: {
      hwfReward: 'HWF awarded. If this is selected, pull through and display HWF Ref number',
      wrongFee: 'Wrong fee received',
      notIssueCase: 'Cannot issue case',
      otherDeduction: 'Other deduction'
    },
    shortFall: {
      helpWithFee: 'Help with Fees (HwF) declined',
      wrongFee: 'Wrong fee received',
      other: 'Other'
    }
  }
  explanationList = {
    overPayment: {
      referRefund: 'I have noted on case and refer for refund',
      noRefund: 'I have noted on case, refund not due',
      noCase: 'here is no case, refer for refund',
      other: 'Other'
    },
    shortFall: {
      holdCase: 'I have put hold on case and written to user requesting the shortfall',
      heldCase: 'I have held case, user needs to be contacted to request shortfall',
      other: 'Other'
    }
  }


  constructor(
  private formBuilder: FormBuilder,
  private caseTransactionsService: CaseTransactionsService,
  private paymentViewService: PaymentViewService,
  private paymentLibComponent: PaymentLibComponent,
  private bulkScaningPaymentService: BulkScaningPaymentService) { }

  ngOnInit() {
    this.viewStatus = 'mainForm';
    this.ccdCaseNumber = this.paymentLibComponent.CCD_CASE_NUMBER;
    this.bspaymentdcn = this.paymentLibComponent.bspaymentdcn;
    this.overUnderPaymentForm = this.formBuilder.group({
      moreDetails: new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(255),
        Validators.pattern('^([a-zA-Z0-9\\s,\\.]*)$')
      ])),
      userName: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^([a-zA-Z0-9\\s]*)$')
      ])),
    });
    this.getUnassignedPayment();
    this.getPaymentGroupDetails(this.paymentLibComponent.paymentGroupReference)
  }
  getGroupOutstandingAmount(paymentGroup: IPaymentGroup): number {
    return this.bulkScaningPaymentService.calculateOutStandingAmount(paymentGroup);
  }

  getPaymentGroupDetails(paymentGroupRef: string){

    this.caseTransactionsService.getPaymentGroups(this.ccdCaseNumber).subscribe(
      paymentGroups => {
      this.paymentGroups = paymentGroups['payment_groups'].filter(paymentGroup => {
        
          return paymentGroupRef ? this.getGroupOutstandingAmount(<IPaymentGroup>paymentGroup) > 0 && paymentGroup.payment_group_reference === paymentGroupRef : this.getGroupOutstandingAmount(<IPaymentGroup>paymentGroup) > 0;
      });
      },
      (error: any) => this.errorMessage = error
    );
  }

  gotoCasetransationPage() {
    this.paymentLibComponent.viewName = 'case-transactions';
    this.paymentLibComponent.TAKEPAYMENT = true;
  }
  selectedPaymentGroup(paymentGroup: IPaymentGroup) {
    this.isContinueButtondisabled = false;
    this.selectedPayment = paymentGroup;
  }
  cancelAllocatePayment(){
    this.resetForm([false, false, false, false, false, false, false, false], 'all');
    this.viewStatus = 'mainForm';
  }
  confirmAllocatePayement(){
    const paymentDetailsField = this.overUnderPaymentForm.controls.moreDetails,
      paymentFormError = this.overUnderPaymentForm.controls.moreDetails.errors,
      userNameField = this.overUnderPaymentForm.controls.userName,
      isEmptyCondtion = this.paymentReason && this.paymentExplanation,
      isOtherOptionSelected = this.paymentExplanation === 'Other';

    this.resetForm([false, false, false, false, false, false, false, false], 'all');
    if ( isEmptyCondtion && (!isOtherOptionSelected && userNameField.valid || isOtherOptionSelected && userNameField.valid && paymentDetailsField.valid)) {
      this.isConfirmButtondisabled = true;
      this.otherPaymentExplanation = this.paymentExplanation === 'Other' ? paymentDetailsField.value : this.paymentExplanation;
      this.userName = userNameField.value;
      this.finalServiceCall();
    }else {
      if(!this.paymentReason) {
        this.resetForm([true, false, false, false, false, false, false, false], 'reason');
      }
      if(!this.paymentExplanation) {
        this.resetForm([false, true, false, false, false, false, false, false], 'explanation');
      }
      if(this.paymentExplanation && isOtherOptionSelected) {
        if(paymentDetailsField.value == '' ) {
          this.resetForm([false, false, true, false, false, false, false, false], 'other');
        }
        if(paymentDetailsField.value != '' && paymentDetailsField.invalid ) {
          this.resetForm([false, false, false, true, false, false, false, false], 'other');
        }
        if(paymentFormError && paymentFormError.minlength && paymentFormError.minlength.actualLength < 3 ) {
          this.resetForm([false, false, false, false, true, false, false, false], 'other');
        }
        if(paymentFormError && paymentFormError.maxlength && paymentFormError.maxlength.actualLength > 255 ) {
          this.resetForm([false, false, false, false, false, true, false, false], 'other');
        }
      }
      if(userNameField.value === "") {
        this.resetForm([false, false, false, false, false, false, true, false], 'username');
      }
      if(userNameField.value !== "" &&  userNameField.invalid) {
        this.resetForm([false, false, false, false, false, false, false, true], 'username');
      }
    }
  }
  resetForm(vals, field) {
    if(field==='reason' || field==='all') {
      this.paymentReasonHasError = vals[0];
    }
    if(field==='explanation' || field==='all') {
      this.paymentExplanationHasError = vals[1];
    }
    if(field==='other' || field==='all') {
      this.isPaymentDetailsEmpty = vals[2];
      this.isPaymentDetailsInvalid = vals[3];
      this.paymentDetailsMinHasError = vals[4];
      this.paymentDetailsMaxHasError = vals[5];
    }
    if(field==='username' || field==='all') {
      this.isUserNameEmpty = vals[6];
      this.isUserNameInvalid = vals[7];
    }
  }
  finalServiceCall() {
    this.bulkScaningPaymentService.patchBSChangeStatus(this.unAllocatedPayment.dcn_reference, 'PROCESSED').subscribe(
      res1 => {
        let response1 = JSON.parse(res1);
        if (response1.success) {
          const requestBody = new AllocatePaymentRequest
          (this.ccdCaseNumber, this.unAllocatedPayment, this.siteID, '');
          this.bulkScaningPaymentService.postBSAllocatePayment(requestBody, this.selectedPayment.payment_group_reference).subscribe(
            res2 => {
              let response2 = JSON.parse(res2);
              const reqBody = new IAllocationPaymentsRequest
              (response2['data'].payment_group_reference, response2['data'].reference, this.paymentReason, this.otherPaymentExplanation, this.userName);
              if (response2.success) {
                this.paymentViewService.postBSAllocationPayments(reqBody).subscribe(
  
                res3 => {
                  let response3 = JSON.parse(res3);
                  if (response3.success) {
                    this.paymentLibComponent.viewName = 'case-transactions';
                    this.paymentLibComponent.TAKEPAYMENT = true;
                  }
                },
                (error: any) => {
                  this.bulkScaningPaymentService.patchBSChangeStatus(this.unAllocatedPayment.dcn_reference, 'COMPLETE').subscribe(
                    success => {
                      if (JSON.parse(success).success) {
                        this.paymentLibComponent.viewName = 'case-transactions';
                        this.paymentLibComponent.TAKEPAYMENT = true;
                      }
                    }
                  );
                  this.errorMessage = error;
                  this.isConfirmButtondisabled = false;
                }
                );
              }
            },
            (error: any) => {
              this.bulkScaningPaymentService.patchBSChangeStatus(this.unAllocatedPayment.dcn_reference, 'COMPLETE').subscribe(
                success => {
                  if (JSON.parse(success).success) {
                    this.paymentLibComponent.viewName = 'case-transactions';
                    this.paymentLibComponent.TAKEPAYMENT = true;
                  }
                }
              );
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
  }

  saveAndContinue(){
    if(this.selectedPayment) {
      this.isMoreDetailsBoxHide = true;
      this.overUnderPaymentForm.get('moreDetails').reset();
      this.overUnderPaymentForm.get('moreDetails').setValue('');
      this.overUnderPaymentForm.get('userName').reset();
      this.overUnderPaymentForm.get('userName').setValue('');
      this.paymentReason = '';
      this.paymentExplanation = '';
      let GroupOutstandingAmount = this.getGroupOutstandingAmount(this.selectedPayment);
      const remainingToBeAssigned = this.unAllocatedPayment.amount - GroupOutstandingAmount;
      this.isRemainingAmountGtZero = remainingToBeAssigned > 0;
      this.isRemainingAmountLtZero = remainingToBeAssigned < 0;
      this.paymentSectionLabel = this.isRemainingAmountGtZero ? { 
          title: 'There is a surplus of',
          reason: 'Provide a reason. This will be used in the Refund process.',
        }: this.isRemainingAmountLtZero ? { 
          title: 'There is a shortfall of',
          reason: 'Provide a reason',
        }: { 
          title:'',
          reason:'',
        };
      this.remainingAmount =  this.isRemainingAmountGtZero ? remainingToBeAssigned : this.isRemainingAmountLtZero ? remainingToBeAssigned * -1 : 0;
      this.afterFeeAllocateOutstanding = remainingToBeAssigned >= 0 ? 0 : (remainingToBeAssigned * -1);
      this.amountForAllocation = GroupOutstandingAmount >= this.unAllocatedPayment.amount ? this.unAllocatedPayment.amount : GroupOutstandingAmount;

      this.viewStatus = 'allocatePaymentConfirmation';
    }
  }
   getUnassignedPayment() {
    this.bulkScaningPaymentService.getBSPaymentsByDCN(this.bspaymentdcn).subscribe(
      unassignedPayments => {
        this.unAllocatedPayment = unassignedPayments['data'].payments.filter(payment => {
          return payment && payment.dcn_reference == this.bspaymentdcn;
        })[0];
        this.siteID = unassignedPayments['data'].responsible_service_id;
      },
      (error: any) => this.errorMessage = error
    );
  }
  selectRadioButton(key, type) {
    this.isMoreDetailsBoxHide = true;
    if( type === 'explanation' && key === 'other' ){
      this.isPaymentDetailsEmpty = false;
      this.isPaymentDetailsInvalid = false;
      this.paymentDetailsMinHasError = false;
      this.paymentDetailsMaxHasError = false;
      this.isMoreDetailsBoxHide = false;
    }
  }
}
