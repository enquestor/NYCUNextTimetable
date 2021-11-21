export type NycuCoursesApiReponse = {
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
