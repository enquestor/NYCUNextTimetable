import { Name } from "./name";

export type Course = {
  year: number;
  semester: number;
  id: string;
  permanentId: string;
  limit: number;
  link: string | undefined;
  name: Name;
  credits: number;
  hours: number;
  memo: string | undefined;
  teacher: string;
  teacherLink: string | undefined;
  time: string;
  departmentId: string;
  registered: number;
  departmentName: Name;
  type: string;
  // typeInformation: {
  //     categoryoyName: {
  //         'zh-tw':  string
  //         'en-us':  string
  //     }
  //     eligible:     string
  // } | null
  typeInformation: string | undefined;
  language: string;
};
