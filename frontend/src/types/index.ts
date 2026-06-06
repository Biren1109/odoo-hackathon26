export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  category: string;
  status: string;
  contacts?: any[];
}

export interface ActivityLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  details: any;
  createdAt: string;
  actor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type Notification = any;
export type RFQ = any;
export type Approval = any;