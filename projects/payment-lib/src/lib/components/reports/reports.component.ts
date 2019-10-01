import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { BulkScaningPaymentService } from '../../services/bulk-scaning-payment/bulk-scaning-payment.service';
import {PaymentViewService} from '../../services/payment-view/payment-view.service';

@Component({
  selector: 'ccpay-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  reportsForm: FormGroup;
  startDate: string;
  endDate: string;
  constructor(private formBuilder: FormBuilder,
    private bulkScaningPaymentService: BulkScaningPaymentService,
    private paymentViewService: PaymentViewService) { }

  ngOnInit() {
    this.fromValidation();
   }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
 }

 getSelectedFromDate(): void {
  //this.reportsForm.get('startDate').setValue('');
 }

  fromValidation() {
    this.reportsForm = this.formBuilder.group({
      selectedreport: new FormControl('') ,
      startDate: new FormControl(''),
      endDate: new FormControl('') });
      
}

onSelectionChange(value: string) {
  
}

downloadReport(){
  const selectedReportName = this.reportsForm.get('selectedreport').value,
    selectedStartDate = this.tranformDate(this.reportsForm.get('startDate').value),
    selectedEndDate = this.tranformDate(this.reportsForm.get('endDate').value);
    let serviceObj = null;
  if(this.reportsForm.get('selectedreport').value === 'PROCESSED_UNALLOCATED') {
    serviceObj = this.paymentViewService;
  } else {
    serviceObj = this.bulkScaningPaymentService;
  }
  let solution = serviceObj.downloadSelectedReport(selectedReportName,selectedStartDate,selectedEndDate)
  solution.subscribe(
    (response) => {
    let myBlob = new Blob([response], { type: 'application/vnd.ms-excel' });
    let a = document.createElement('a');
    a.href = URL.createObjectURL(myBlob);
    a.download = 'report.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout( ()=> {
          URL.revokeObjectURL(URL.createObjectURL(myBlob));
      }, 100);
  },
  (error)=>{
    debugger
  }); 
}

tranformDate(strDate: string) {
    let result = '';
    if (strDate) {
      let parts = strDate.split('-');
      result = `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return result;
}
  
}
