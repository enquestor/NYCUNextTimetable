import axios from "axios";
import { encode } from "querystring";
import { Department } from "../models/department";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function slowPost(
  endpoint: string,
  params: string,
  config: Object
): Promise<any> {
  try {
    console.log("request");
    const response = await axios.post(
      process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT + endpoint,
      params,
      config
    );
    await sleep(parseInt(process.env.NYCUAPI_THROTTLE!));
    console.log(response.data);
    return response.data;
  } catch (error) {}
}

export async function getDepartments(acysem: string): Promise<Department[]> {
  const types = await slowPost(
    "get_type",
    encode({
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
  for (const type of types) {
    departments.push(...(await getCategory(type.uid, acysem)));
  }
  return departments;
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
