import { Routes } from '@angular/router';
import { MEMBERS_ROUTES } from '@softwaredeveloper98/kinevor-members-web';

/** Demo routes: staff directory, registration and member self-service. */
export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'members' },
  { path: '', children: MEMBERS_ROUTES },
  { path: '**', redirectTo: 'members' },
];
