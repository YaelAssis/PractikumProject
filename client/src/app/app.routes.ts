import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CustomersListComponent } from './customers/customers-list/customers-list.component';
import { CustomersFormComponent } from './customers/customers-form/customers-form.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'customers', component: CustomersListComponent },
  { path: 'customers/new', component: CustomersFormComponent },
  { path: 'customers/:id/view', component: CustomersFormComponent },
  { path: 'customers/:id/edit', component: CustomersFormComponent },
  { path: '**', redirectTo: '' }
];
