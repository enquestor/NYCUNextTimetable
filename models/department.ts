export type Department = {
  name: string;
  id: string;
  grades: Array<{
    name: {
      [key: string]: string;
    };
    value: string;
  }>;
};
