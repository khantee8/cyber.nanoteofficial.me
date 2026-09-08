import type { DefaultSession } from 'next-auth';

type Role = 'admin' | 'member';

declare module 'next-auth' {
  interface User {
    role: Role;
    approvedAt: Date | null;
  }
  interface Session {
    user: DefaultSession['user'] & {
      role: Role;
      approvedAt: Date | null;
    };
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role: Role;
    approvedAt: Date | null;
  }
}
