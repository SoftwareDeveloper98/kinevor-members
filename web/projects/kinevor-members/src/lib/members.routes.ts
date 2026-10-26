import { Routes } from '@angular/router';
import { MemberDetailComponent } from './member-detail.component';
import { MemberDirectoryComponent } from './member-directory.component';
import { MemberProfileComponent } from './member-profile.component';
import { MemberRegisterComponent } from './member-register.component';

/** Routes exposed by the members feature. */
export const MEMBERS_ROUTES: Routes = [
  { path: 'members/new', component: MemberRegisterComponent },
  { path: 'members/:id', component: MemberDetailComponent },
  { path: 'members', component: MemberDirectoryComponent },
  { path: 'me', component: MemberProfileComponent },
];
