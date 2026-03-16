import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, Observable, of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { GenericFormComponent } from '../../shared/generic-form/generic-form.component';

@Component({
  selector: 'app-customers-form',
  standalone: true,
  imports: [CommonModule, GenericFormComponent],
  templateUrl: './customers-form.component.html',
  styleUrls: ['./customers-form.component.css']
})
export class CustomersFormComponent implements OnInit {

  mode: 'new' | 'edit' | 'view' = 'new';
  customer: any = {};

  cityOptions: Array<{ value: any; label: string }> = [];
  statusOptions: Array<{ value: any; label: string }> = [];

  detailFields = [
    { key: 'Id', label: 'מזהה' },
    { key: 'FullName', label: 'שם מלא' },
    { key: 'Phone', label: 'טלפון' },
    { key: 'Email', label: 'אימייל' },
    { key: 'CityName', label: 'עיר' },
    { key: 'StatusName', label: 'סטטוס' }
  ];

  editFields = [
    { key: 'FullName', label: 'שם מלא', required: true },
    { key: 'Phone', label: 'טלפון' },
    { key: 'Email', label: 'אימייל' },
    { key: 'CityId', label: 'עיר', type: 'select', options: this.cityOptions, required: true },
    { key: 'StatusId', label: 'סטטוס', type: 'select', options: this.statusOptions, required: true }
  ];

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.loadLookups();

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.mode = 'new';
      this.customer = { FullName: '', Phone: '', Email: '', CityId: null, StatusId: null };
      return;
    }

    const currentUrl = this.router.url.toLowerCase();

    if (currentUrl.includes('/edit')) {
      this.mode = 'edit';
    } else if (currentUrl.includes('/view')) {
      this.mode = 'view';
    }

    this.loadCustomerById(parseInt(id, 10));
  }

  get formFields() {
    return this.mode === 'view' ? this.detailFields : this.editFields;
  }

  get formProcedureName() {
    return this.mode === 'edit' ? 'Customers_Update' : 'Customers_Create';
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

  private loadLookup(procedureName: string): Observable<any[]> {

    return this.api.execute(procedureName, {}).pipe(
      map((data: any) => this.normalizeResultSet(data)),
      catchError(() => of([]))
    );
  }

  private mapOptions(
    items: any[],
    idCandidates: string[],
    nameCandidates: string[]
  ): Array<{ value: any; label: string }> {

    return items
      .map((item: any) => {

        const valueKey =
          idCandidates.find((key) => item[key] !== undefined && item[key] !== null) || 'Id';

        const labelKey =
          nameCandidates.find((key) => item[key] !== undefined && item[key] !== null) || 'Name';

        return {
          value: item[valueKey],
          label: String(item[labelKey] ?? item[valueKey] ?? '')
        };
      })
      .filter(
        (option) =>
          option.value !== undefined &&
          option.value !== null &&
          option.label !== ''
      );
  }

  private updateEditFieldOptions(): void {

    const cityField = this.editFields.find((field: any) => field.key === 'CityId');

    if (cityField) {
      cityField.options = this.cityOptions;
    }

    const statusField = this.editFields.find((field: any) => field.key === 'StatusId');

    if (statusField) {
      statusField.options = this.statusOptions;
    }
  }

  private loadOptions(procedureName: string, target: 'city' | 'status') {

    this.loadLookup(procedureName).subscribe((items: any[]) => {

      const options = this.mapOptions(
        items,
        ['Id', 'CityId', 'StatusId'],
        ['Name', 'CityName', 'StatusName', 'Title']
      );

      if (target === 'city') {
        this.cityOptions = options;
      }

      if (target === 'status') {
        this.statusOptions = options;
      }

      this.updateEditFieldOptions();
    });
  }

  loadLookups() {

    this.loadOptions('Cities_GetAll', 'city');
    this.loadOptions('CustomerStatuses_GetAll', 'status');

  }

  private loadCustomerById(id: number) {

    this.api.execute('Customers_GetAll', { Search: '' }).subscribe((data: any) => {

      const customers = this.normalizeResultSet(data);

      const found = customers.find(
        (item: any) => item.Id === id || item.CustomerId === id
      );

      if (!found) {
        this.router.navigate(['/customers']);
        return;
      }

      this.customer = found;
    });
  }

  onFormSaved(event: any) {
    this.router.navigate(['/customers']);
  }

  onFormCanceled() {
    this.router.navigate(['/customers']);
  }

  onStartEdit() {

    if (this.customer?.Id) {
      this.router.navigate(['/customers', this.customer.Id, 'edit']);
    }
  }

}