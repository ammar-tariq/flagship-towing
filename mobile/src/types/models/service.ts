export type ServiceListItem = {
  _id: string;
  image?: string;
  title?: string;
  short_description?: string;
};

export type ServiceDetail = {
  image?: string;
  title?: string;
  description?: string;
};

export type Incident = {
  _id: string;
  service?: {title?: string};
  date?: string;
  createdAt?: string;
  service_id?: string;
};
