import { Name } from "./name";

export type Course = {
  year: number;
  semester: number;
  id: string;
  permanentId: string;
  limit: number;
  link: string;
  name: Name;
  credits: number;
  hours: number;
  memo: string;
  teacher: string;
  teacherLink: string;
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
  typeInformation: string;
  language: string;
};
