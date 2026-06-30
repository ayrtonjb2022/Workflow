// @crm/shared — shared types and utilities
// This package is the barrel for types shared across API and Web.
// Populate as domain models are defined in later changes.

export type TenantScoped = {
  tenantId: string;
};

export type Identifiable = {
  id: string;
};

export type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};
