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
      process.env.NYCU_ENDPOINT + endpoint,
      params,
      config
    );
    await sleep(parseInt(process.env.NYCU_THROTTLE ?? "1000"));
    console.log(response.data);
    return response.data;
  } catch (error) {}
}

export async function getDepartments(
  acysem: string,
  language: string
): Promise<Department[]> {
  const types = await slowPost(
    "get_type",
    encode({
      flang: language,
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
    departments.push(...(await getCategory(type.uid, acysem, language)));
  }
  return departments;
}

async function getCategory(
  typeId: string,
  acysem: string,
  language: string
): Promise<Array<Department>> {
  const categories = await slowPost(
    "get_category",
    encode({
      ftype: typeId,
      flang: language,
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
  for (const categoryId in categories) {
    if (categoryId.length === 0) {
      departments.push(
        ...(await getDepartment(typeId, categoryId, "*", acysem, language))
      );
    } else if (categoryId.length === 36) {
      // this is already a department
      departments.push({
        name: categories[categoryId],
        id: categoryId,
        grades: [],
      });
    } else {
      // this is a category
      departments.push(
        ...(await getCollege(typeId, categoryId, acysem, language))
      );
    }
  }
  return departments;
}

async function getCollege(
  typeId: string,
  categoryId: string,
  acysem: string,
  language: string
): Promise<Array<Department>> {
  const colleges = await slowPost(
    "get_college",
    encode({
      ftype: typeId,
      fcategory: categoryId,
      flang: language,
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
        ...(await getDepartment(typeId, categoryId, "*", acysem, language))
      );
    } else {
      departments.push(
        ...(await getDepartment(
          typeId,
          categoryId,
          collegeId,
          acysem,
          language
        ))
      );
    }
  }
  return departments;
}

async function getDepartment(
  typeId: string,
  categoryId: string,
  collegeId: string,
  acysem: string,
  language: string
): Promise<Array<Department>> {
  try {
    const apiDepartments = await slowPost(
      "get_dep",
      encode({
        ftype: typeId,
        fcategory: categoryId,
        fcollege: collegeId,
        flang: language,
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
    for (const departmentId in apiDepartments) {
      const grades = await getGrades(
        typeId,
        categoryId,
        collegeId,
        departmentId,
        acysem,
        language
      );
      departments.push({
        name: apiDepartments[departmentId],
        id: departmentId,
        grades: grades,
      });
    }
    return departments;
  } catch (error) {}
  return [];
}

async function getGrades(
  typeId: string,
  categoryId: string,
  collegeId: string,
  departmentId: string,
  acysem: string,
  language: string
): Promise<Array<{ name: { [key: string]: string }; value: string }>> {
  try {
    const apiGrades = await slowPost(
      "get_grade",
      encode({
        ftype: typeId,
        fcategory: categoryId,
        fcollege: collegeId,
        fdep: departmentId,
        fgroup: "**",
        flang: language,
        acysem: acysem,
        acysemend: acysem,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    );
    const grades: Array<{ name: { [key: string]: string }; value: string }> =
      [];
    for (const grade in apiGrades) {
      let tmp: { name: { [key: string]: string }; value: string } = {
        name: {},
        value: grade,
      };
      tmp.name[language] = apiGrades[grade];
      grades.push(tmp);
    }
    return grades;
  } catch (error) {}
  return [];
}
