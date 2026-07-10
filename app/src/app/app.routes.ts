import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'inventory', pathMatch: 'full' },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./features/inventory/feature/inventory-dashboard/inventory-dashboard').then(
        (m) => m.InventoryDashboard,
      ),
  },
  {
    path: 'inventory/:vin',
    loadComponent: () =>
      import('./features/inventory/feature/vehicle-detail/vehicle-detail').then((m) => m.VehicleDetail),
  },
];
