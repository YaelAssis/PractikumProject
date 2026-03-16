import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, map, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { GenericListComponent } from '../../shared/generic-list/generic-list.component';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GenericListComponent],
  templateUrl: './customers-list.component.html',
  styleUrls: ['./customers-list.component.css']
})
export class CustomersListComponent implements OnInit {

  customers: any[] = [];
  searchText: string = '';
  cityOptions: Array<{ value: any; label: string }> = [];
  statusOptions: Array<{ value: any; label: string }> = [];

  columns: Array<{ key: string; label: string }> = [
    { key: 'Id', label: 'מזהה' },
    { key: 'FullName', label: 'שם מלא' },
    { key: 'Phone', label: 'טלפון' },
    { key: 'Email', label: 'אימייל' },
    { key: 'CityName', label: 'עיר' },
    { key: 'StatusName', label: 'סטטוס' }
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadLookups();
    this.loadCustomers();
  }

  private normalizeResultSet(data: any): any[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (data?.resultSets?.length > 0) {
      return data.resultSets[0];
    }

    return [];
  }

  private loadLookupWithFallback(procedureNames: string[]): Observable<any[]> {
    if (!procedureNames.length) {
      return of([]);
    }

    const [currentProcedure, ...restProcedures] = procedureNames;

    return this.api.execute(currentProcedure, {}).pipe(
      map((data: any) => this.normalizeResultSet(data)),
      catchError(() => this.loadLookupWithFallback(restProcedures))
    );
  }

  private mapOptions(items: any[], idCandidates: string[], nameCandidates: string[]): Array<{ value: any; label: string }> {
    return items
      .map((item: any) => {
        const valueKey = idCandidates.find((key) => item[key] !== undefined && item[key] !== null) || 'Id';
        const labelKey = nameCandidates.find((key) => item[key] !== undefined && item[key] !== null) || 'Name';
        return { value: item[valueKey], label: String(item[labelKey] ?? item[valueKey] ?? '') };
      })
      .filter((option) => option.value !== undefined && option.value !== null && option.label !== '');
  }

  loadLookups() {
    this.loadLookupWithFallback(['Cities_GetAll', 'City_GetAll']).subscribe((cities: any[]) => {
      this.cityOptions = this.mapOptions(cities, ['Id', 'CityId'], ['Name', 'CityName', 'Title']);
    });

    this.loadLookupWithFallback(['CustomerStatuses_GetAll', 'CustomerStatus_GetAll']).subscribe((statuses: any[]) => {
      this.statusOptions = this.mapOptions(statuses, ['Id', 'StatusId'], ['Name', 'StatusName', 'Title']);
    });
  }

  loadCustomers() {
    // שלחתי מחרוזת ריקה במקום null כדי שהחיפוש יעבוד תמיד
    this.api.execute('Customers_GetAll', { Search: '' })
      .subscribe((data: any) => {
        this.customers = this.normalizeResultSet(data);
      });
  }

  get filteredCustomers(): any[] {
    const query = this.searchText.trim().toLowerCase();

    if (!query) {
      return this.customers;
    }

    return this.customers.filter((customer: any) => {
      const nameValue = (customer.Name ?? customer.FullName ?? '').toString().toLowerCase();
      const titleValue = (customer.Title ?? '').toString().toLowerCase();

      return nameValue.includes(query) || titleValue.includes(query);
    });
  }

  addCustomer() {
    this.router.navigate(['/customers/new']);
  }

  viewCustomer(customer: any) {
    this.router.navigate(['/customers', customer.Id, 'view']);
  }

  editCustomer(customer: any) {
    this.router.navigate(['/customers', customer.Id, 'edit']);
  }
}

