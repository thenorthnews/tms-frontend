export interface Client {
  _id: string;
  id?: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  description?: string;
  status: number; // 0: Active, 1: Inactive
  createdBy?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientInput {
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  description?: string;
  status?: number;
}

export interface UpdateClientInput {
  name?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  description?: string;
  status?: number;
}
