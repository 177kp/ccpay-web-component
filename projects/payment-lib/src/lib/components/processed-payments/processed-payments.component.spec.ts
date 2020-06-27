import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProcessedPaymentsComponent } from './processed-payments.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('Processed Payments Component', () => {
  let component: ProcessedPaymentsComponent,
  fixture: ComponentFixture<ProcessedPaymentsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProcessedPaymentsComponent],
      providers: [ { provide: Router, useClass: class { navigate = jasmine.createSpy('navigate'); } }],
      imports: [
        CommonModule,
        HttpClientModule,
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ProcessedPaymentsComponent);
    component = fixture.componentInstance;
  });

  it('Should create', () => {
    expect(component).toBeTruthy();
  });
});
