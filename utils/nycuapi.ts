import axios from "axios";
import { encode } from "querystring";
import { Course } from "../models/course";
import { Department } from "../models/department";
import { now, parseCourses, separateAcysem, slowPost } from "./helpers";

export type GetCoursesParameters = {
  acysem: string;
  option: string;
  query: string;
};

export type GetCoursesResponse = {
  courses: Course[];
  time: string;
};

export type GetCoursesResponseData = {
  [key: string]: {
    1: {
      [key: string]: {
        acy: string;
        sem: string;
        cos_id: string;
        cos_code: string;
        num_limit: string;
        dep_limit: string;
        URL: string | null;
        cos_cname: string;
        cos_credit: string;
        cos_hours: string;
        TURL: string;
        teacher: string;
        cos_time: string;
        memo: string;
        cos_ename: string;
        brief: string;
        degree: string;
        dep_id: string;
        dep_primary: string;
        dep_cname: string;
        dep_ename: string;
        cos_type: string;
        cos_type_e: string;
        crsoutline_type: string | null;
        reg_num: string;
        depType: string;
      };
    } | null;
    2: {
      [key: string]: {
        acy: string;
        sem: string;
        cos_id: string;
        cos_code: string;
        num_limit: string;
        dep_limit: string;
        URL: string | null;
        cos_cname: string;
        cos_credit: string;
        cos_hours: string;
        TURL: string;
        teacher: string;
        cos_time: string;
        memo: string;
        cos_ename: string;
        brief: string;
        degree: string;
        dep_id: string;
        dep_primary: string;
        dep_cname: string;
        dep_ename: string;
        cos_type: string;
        cos_type_e: string;
        crsoutline_type: string | null;
        reg_num: string;
        depType: string;
      };
    } | null;
    dep_id: string;
    dep_cname: string;
    dep_ename: string;
    costype: {
      [key: string]: {
        [key: string]: {
          course_category_cname: string;
          course_category_ename: string;
          course_category_type: string;
          GECIName: string;
          GECIEngName: string;
        };
      };
    };
    brief: {
      [key: string]: {
        [key: string]: {
          brief_code: string;
          brief: string;
        };
      };
    };
    language: {
      [key: string]: {
        授課語言代碼: string;
      };
    };
  };
};

export async function getCourses(
  params: GetCoursesParameters
): Promise<GetCoursesResponse | undefined> {
  console.info("[NYCUAPI] getCourses");
  const { acy, sem } = separateAcysem(params.acysem);
  try {
    const response = await axios.post(
      process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT + "get_cos_list",
      encode({
        m_acy: acy,
        m_sem: sem,
        m_acyend: acy,
        m_semend: sem,
        m_dep_uid: params.option === "dep" ? params.query : "**",
        m_group: "**",
        m_grade: "**",
        m_class: "**",
        m_option: params.option === "dep" ? "**" : params.option,
        m_crsname: params.option === "crsname" ? params.query : "**",
        m_teaname: params.option === "teaname" ? params.query : "**",
        m_cos_id: params.option === "cos_id" ? params.query : "**",
        m_cos_code: params.option === "cos_code" ? params.query : "**",
        m_crstime: "**",
        m_crsoutline: "**",
        m_costype: "**",
        m_selcampus: "**",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    );
    return {
      courses: parseCourses(response.data),
      time: now(),
    };
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

export type GetDepartmentsParameters = {
  acysem: string;
};

export type GetDepartmentsResponse = {
  departments: Department[];
};

export async function getDepartments(
  params: GetDepartmentsParameters
): Promise<GetDepartmentsResponse | undefined> {
  console.info("[NYCUAPI] getDepartments");
  const types = await slowPost(
    "get_type",
    encode({
      flang: "zh-tw",
      acysem: params.acysem,
      acysemend: params.acysem,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  const departments: Array<Department> = [];
  for (const type of types) {
    departments.push(...(await getCategory(type.uid, params.acysem)));
  }
  return { departments };
}

async function getCategory(
  typeId: string,
  acysem: string
): Promise<Array<Department>> {
  const zhCategories = await slowPost(
    "get_category",
    encode({
      ftype: typeId,
      flang: "zh-tw",
      acysem: acysem,
      acysemend: acysem,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  const enCategories = await slowPost(
    "get_category",
    encode({
      ftype: typeId,
      flang: "en-us",
      acysem: acysem,
      acysemend: acysem,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  const departments: Array<Department> = [];
  for (const categoryId in zhCategories) {
    if (categoryId.length === 0) {
      departments.push(
        ...(await getDepartment(typeId, categoryId, "*", acysem))
      );
    } else if (categoryId.length === 36) {
      // this is already a department
      departments.push({
        name: {
          "zh-tw": zhCategories[categoryId],
          "en-us": enCategories[categoryId],
        },
        id: categoryId,
        grades: [],
        typeId: typeId,
        categoryId: categoryId,
        collegeId: "*",
      });
    } else {
      // this is a category
      departments.push(...(await getCollege(typeId, categoryId, acysem)));
    }
  }
  return departments;
}

async function getCollege(
  typeId: string,
  categoryId: string,
  acysem: string
): Promise<Array<Department>> {
  const colleges = await slowPost(
    "get_college",
    encode({
      ftype: typeId,
      fcategory: categoryId,
      flang: "zh-tw",
      acysem: acysem,
      acysemend: acysem,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  const departments: Array<Department> = [];
  for (const collegeId in colleges) {
    if (collegeId.length === 0) {
      // there is no such college, pass query to getDepartment
      departments.push(
        ...(await getDepartment(typeId, categoryId, "*", acysem))
      );
    } else {
      departments.push(
        ...(await getDepartment(typeId, categoryId, collegeId, acysem))
      );
    }
  }
  return departments;
}

async function getDepartment(
  typeId: string,
  categoryId: string,
  collegeId: string,
  acysem: string
): Promise<Array<Department>> {
  const zhApiDepartments = await slowPost(
    "get_dep",
    encode({
      ftype: typeId,
      fcategory: categoryId,
      fcollege: collegeId,
      flang: "zh-tw",
      acysem: acysem,
      acysemend: acysem,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  const enApiDepartments = await slowPost(
    "get_dep",
    encode({
      ftype: typeId,
      fcategory: categoryId,
      fcollege: collegeId,
      flang: "en-us",
      acysem: acysem,
      acysemend: acysem,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    }
  );
  const departments: Array<Department> = [];
  for (const departmentId in zhApiDepartments) {
    const grades = await getGrades(
      typeId,
      categoryId,
      collegeId,
      departmentId,
      acysem
    );
    departments.push({
      name: {
        "zh-tw": zhApiDepartments[departmentId],
        "en-us": enApiDepartments[departmentId],
      },
      id: departmentId,
      typeId: typeId,
      categoryId: categoryId,
      collegeId: collegeId,
      grades: grades,
    });
  }
  return departments;
}

async function getGrades(
  typeId: string,
  categoryId: string,
  collegeId: string,
  departmentId: string,
  acysem: string
): Promise<Array<{ name: { [key: string]: string }; value: string }>> {
  return [];
  // * stop getting grade information unless it is used somewhere
  // try {
  //   const apiGrades = await slowPost(
  //     "get_grade",
  //     encode({
  //       ftype: typeId,
  //       fcategory: categoryId,
  //       fcollege: collegeId,
  //       fdep: departmentId,
  //       fgroup: "**",
  //       flang: language,
  //       acysem: acysem,
  //       acysemend: acysem,
  //     }),
  //     {
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  //       },
  //     }
  //   );
  //   const grades: Array<{ name: { [key: string]: string }; value: string }> =
  //     [];
  //   for (const grade in apiGrades) {
  //     let tmp: { name: { [key: string]: string }; value: string } = {
  //       name: {},
  //       value: grade,
  //     };
  //     tmp.name[language] = apiGrades[grade];
  //     grades.push(tmp);
  //   }
  //   return grades;
  // } catch (error) {}
  // return [];
}
