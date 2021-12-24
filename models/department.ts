export type Department = {
  name: {
    [key: string]: string;
  };
  id: string;
  typeId: string;
  categoryId: string;
  collegeId: string;
  grades: Array<{
    name: {
      [key: string]: string;
    };
    value: string;
  }>;
};
