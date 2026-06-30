// @crm/auth — authentication and authorization stub
// This package will provide JWT validation, role-based access control,
// and tenant context extraction. Scaffold placeholder until auth is implemented.

export type AuthContext = {
  userId: string;
  tenantId: string;
  roles: string[];
};
