import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class PaymentLibService {
  API_ROOT: string;
  BULKSCAN_API_ROOT: string;

  constructor() { }

  setApiRootUrl(apiRoot: string): void {
    this.API_ROOT = apiRoot;
  }

  getApiRootUrl(): string {
    return this.API_ROOT;
  }

  setBulkScanApiRootUrl(bulkscanapiRoot: string): void {
    this.BULKSCAN_API_ROOT = bulkscanapiRoot;
  }

  getBulkScanApiRootUrl(): string {
    return this.BULKSCAN_API_ROOT;
  }
}
