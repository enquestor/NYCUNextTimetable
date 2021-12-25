import { Name } from "./name";

export type Department = {
  name: Name;
  id: string;
  typeId: string;
  categoryId: string;
  collegeId: string;
  grades: Array<{
    name: Name;
    value: string;
  }>;
};
