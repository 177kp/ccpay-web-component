import { NgModule } from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import { CommonModule } from '@angular/common';

import {PaymentListComponent} from './components/payment-list/payment-list.component';
import {PaymentViewComponent} from './components/payment-view/payment-view.component';
import {CardDetailsComponent} from './components/card-details/card-details.component';
import {PageNotFoundComponent} from './components/page-not-found.component';
import {PaymentLibComponent} from './payment-lib.component';
import { StatusHistoryComponent } from './components/status-history/status-history.component';
import { PbaDetailsComponent } from './components/pba-details/pba-details.component';
import { LoggerService } from './services/shared/logger/logger.service';
import { ConsoleLoggerService } from './services/shared/logger/console-logger.service';
import { WebComponentHttpClient } from './services/shared/httpclient/webcomponent.http.client';
import { CaseTransactionsComponent } from './components/case-transactions/case-transactions.component';
import { FeeSummaryComponent } from './components/fee-summary/fee-summary.component';
import { ErrorBannerComponent } from './components/error-banner/error-banner.component';
import { MarkUnidentifiedPaymentComponent } from './components/mark-unidentified-payment/mark-unidentified-payment.component';
import { MarkUnsolicitedPaymentComponent } from './components/mark-unsolicited-payment/mark-unsolicited-payment.component';
import { UnprocessedPaymentsComponent } from './components/unprocessed-payments/unprocessed-payments.component';
import { ProcessedPaymentsComponent } from './components/processed-payments/processed-payments.component';
import { AllocatePaymentsComponent } from './components/allocate-payments/allocate-payments.component';
import { AddRemissionComponent } from './components/add-remission/add-remission.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CcdHyphensPipe } from './pipes/ccd-hyphens.pipe';
import { keyValuePipe } from './pipes/key-value.pipe';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';
import { ReportsComponent } from './components/reports/reports.component';
import { XlFileService } from './services/xl-file/xl-file.service';


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule
  ],
  declarations: [
    PaymentLibComponent,
    PaymentListComponent,
    PaymentViewComponent,
    CardDetailsComponent,
    PageNotFoundComponent,
    StatusHistoryComponent,
    MarkUnidentifiedPaymentComponent,
    MarkUnsolicitedPaymentComponent,
    UnprocessedPaymentsComponent,
    ProcessedPaymentsComponent,
    AllocatePaymentsComponent,
    PbaDetailsComponent,
    CaseTransactionsComponent,
    FeeSummaryComponent,
    AddRemissionComponent,
    CcdHyphensPipe,
    keyValuePipe,
    SanitizeHtmlPipe,
    ReportsComponent,
    ErrorBannerComponent
  ],
  exports: [ PaymentLibComponent ],
  providers: [ 
    { provide: LoggerService, useClass: ConsoleLoggerService },
    XlFileService,
    WebComponentHttpClient
  ]
})

export class PaymentLibModule { }
