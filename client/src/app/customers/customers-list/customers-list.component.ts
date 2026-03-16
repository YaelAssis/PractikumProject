import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  loadCustomers() {
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

      const nameValue = (customer.FullName ?? customer.Name ?? '')
        .toString()
        .toLowerCase();

      const phoneValue = (customer.Phone ?? '')
        .toString()
        .toLowerCase();

      const emailValue = (customer.Email ?? '')
        .toString()
        .toLowerCase();

      return (
        nameValue.includes(query) ||
        phoneValue.includes(query) ||
        emailValue.includes(query)
      );
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