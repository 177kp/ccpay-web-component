import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { IFee } from '../../interfaces/IFee';
import { AddRemissionRequest } from '../../interfaces/AddRemissionRequest';
import { PaymentViewService } from '../../services/payment-view/payment-view.service';
import { PaymentLibComponent } from '../../payment-lib.component';

@Component({
  selector: 'ccpay-add-remission',
  templateUrl: './add-remission.component.html',
  styleUrls: ['./add-remission.component.scss']
})
export class AddRemissionComponent implements OnInit {
  @Input() fee: IFee;
  @Input() ccdCaseNumber: string;
  @Input() service: string;
  @Input() paymentGroupRef: string;
  @Output() cancelRemission: EventEmitter<void> = new EventEmitter();

  remissionForm: FormGroup;
  hasErrors = false;
  viewStatus = 'main';
  errorMessage = null;

  remissionCodeHasError = false;
  amountHasError = false;

  constructor(private formBuilder: FormBuilder,
    private paymentViewService: PaymentViewService,
    private paymentLibComponent: PaymentLibComponent) { }

  ngOnInit() {
    this.remissionForm = this.formBuilder.group({
      remissionCode: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^([a-zA-Z0-9]{3})-([a-zA-Z0-9]{3})-([a-zA-Z0-9]{3})$')
      ])),
      amount: new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[0-9]+(\\.[0-9]{2})?$')
      ]))
    });
    this.viewStatus = 'main';
  }

  addRemission() {
    this.resetRemissionForm();
    if (this.remissionForm.dirty && this.remissionForm.valid) {
      this.viewStatus = 'confirmation';
    }else {
      if(this.remissionForm.controls.remissionCode.invalid ) {
        this.remissionCodeHasError = true;
      }
      if(this.remissionForm.controls.amount.invalid){
        this.amountHasError = true;
      }
    }
  }

  resetRemissionForm(){
    this.remissionCodeHasError = false;
    this.amountHasError = false;
  }

  confirmRemission() {
    const newNetAmount = this.remissionForm.controls.amount.value;
    const remissionAmount = this.fee.net_amount - newNetAmount;
    const requestBody = new AddRemissionRequest
    (this.ccdCaseNumber, this.fee, remissionAmount, this.remissionForm.controls.remissionCode.value, this.service);
    this.paymentViewService.postPaymentGroupWithRemissions(this.paymentGroupRef, this.fee.id, requestBody).subscribe(
      response => {
        if (response.success) {
          this.paymentLibComponent.viewName = 'case-transactions';
          this.paymentLibComponent.TAKEPAYMENT = true;
        }
      },
      (error: any) => {
        this.errorMessage = error;
      }
    );
  }
}
