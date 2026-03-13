import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CustomersListComponent } from './customers/customers-list/customers-list.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'customers', component: CustomersListComponent },
  { path: '**', redirectTo: '' }
];
