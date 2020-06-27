import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-ccd-search',
  templateUrl: './ccd-search.component.html',
  styleUrls: ['./ccd-search.component.css']
})
export class CcdSearchComponent implements OnInit {
  searchForm: FormGroup;
  hasErrors = false;
  ccdCaseNumber: string;

  constructor(private router: Router,
              private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.searchForm = this.formBuilder.group({
      searchInput: ['']
    });
  }

  showCaseTransactions() {
    this.ccdCaseNumber = this.searchForm.get('searchInput').value;
    console.log('Search ccdCaseNumber: ', this.ccdCaseNumber);
    this.router.navigateByUrl(`/payment-lib-int/${this.ccdCaseNumber}?view=case-transactions&takePayment=true`);
  }
}
