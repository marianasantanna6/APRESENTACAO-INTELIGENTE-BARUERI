import type { AccountStatus, UserAccessLevel } from "./auth";
import type { PresentationFilters } from "./presentation";

export type PresentationSummaryStatus = "presented" | "ready";

export type ApiIntegrationStatus = "active" | "inactive" | "maintenance";

export type OrganizationDirectoryEntry = {
  department: string;
  teams: string[];
};

export type AdminPresentationSummary = {
  id: string;
  ownerUserId: string;
  ownerName: string;
  title: string;
  category: string;
  status: PresentationSummaryStatus;
  date: string;
  department: string;
  team: string;
  filters: PresentationFilters;
};

export type ApiIntegration = {
  id: string;
  name: string;
  status: ApiIntegrationStatus;
  lastUpdated: string;
  tags: string[];
};

export type EmployeeDirectoryEntry = {
  id: string;
  name: string;
  email: string;
  department: string;
  team: string;
  accessLevel: UserAccessLevel;
  status: AccountStatus;
};

export type ActivityLogEntry = {
  id: string;
  timestamp: string;
  source: string;
  type: string;
  userName: string;
  department: string;
  team: string;
};

export type NewEmployeePayload = {
  name: string;
  email: string;
  department: string;
  team: string;
};
