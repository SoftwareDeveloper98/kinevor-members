import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Adds the demo trust headers so the standalone host can authenticate requests.
 * The linked member is Maya Thompson, the first seeded profile.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) return next(req);

  return next(
    req.clone({
      setHeaders: {
        'X-Demo-Role': 'Staff',
        'X-Demo-Email': 'staff.demo@kinevor.local',
        'X-Demo-Member': '11111111-1111-1111-1111-111111111111',
      },
    }),
  );
};
