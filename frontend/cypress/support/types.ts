export type SeedUser = {
  id: string;
  email: string;
  password: string;
};

export type SeedScenario = {
  marker: string;
  admin: SeedUser;
  teacher: SeedUser;
  courseSectionId: string;
  laboratoryId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  locationId: string;
};

export type PendingReturnScenario = SeedScenario & {
  requestId: string;
  loanId: string;
  returnId: string;
};
