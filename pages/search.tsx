import axios from "axios";
import type {
  GetServerSideProps,
  GetServerSidePropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import { Course } from "../models/course";
import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Container,
  Fab,
  Stack,
  Typography,
} from "@mui/material";
import { CoursesApiResponse } from "./api/courses";
import { separateAcysem, toCategoryText } from "../utils/helpers";
import { Refresh } from "@mui/icons-material";
import { DateTime } from "luxon";
import LazyLoad from "react-lazyload";
import Joi from "joi";

type SearchPageParameters = {
  acysem: string;
  category: string;
  query: string;
  language: string;
  departmentId?: string | undefined;
};

const schema = Joi.object<SearchPageParameters>({
  acysem: Joi.string().required(),
  category: Joi.string()
    .required()
    .valid(
      "courseName",
      "teacherName",
      "departmentName",
      "courseId",
      "coursePermanentId"
    ),
  query: Joi.string().required(),
  language: Joi.string().default("zh-tw"),
  departmentId: Joi.when("category", {
    is: "departmentName",
    then: Joi.string().required(),
    otherwise: Joi.string(),
  }),
});

export const getServerSideProps: GetServerSideProps = async ({
  query,
}): Promise<GetServerSidePropsResult<SearchProps>> => {
  // use conditional import to avoid nextjs attempting to connect to redis at build time
  const { getCachedCourses } = await import("../utils/redis");

  const params = schema.validate(query);
  if (
    typeof params.value === "undefined" ||
    typeof params.error !== "undefined"
  ) {
    // incorrect get params
    return { notFound: true };
  }

  // get cached course if exist
  const result = await getCachedCourses({
    acysem: params.value.acysem,
    category: params.value.category,
    query:
      params.value.category === "departmentName"
        ? params.value.departmentId!
        : params.value.query,
    language: params.value.language,
  });
  if (typeof result === "undefined") {
    // cache miss, send validated params
    return {
      props: {
        courses: [],
        time: "",
        params: params.value,
      },
    };
  } else {
    // cache hit, send cached result
    return {
      props: {
        params: params.value,
        ...result,
      },
    };
  }
};

type SearchProps = {
  courses: Course[];
  time: string;
  params: SearchPageParameters;
};

const Search: NextPage<SearchProps> = ({ courses, time, params }) => {
  const cached = time !== "";
  const [loading, setLoading] = useState(!cached);
  const [coursesApiResponse, setCoursesApiResponse] =
    useState<CoursesApiResponse>({
      courses: cached ? courses : [],
      time: cached ? time : "",
    });

  const getCourses = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/courses", {
        acysem: params.acysem,
        category: params.category,
        query:
          params.category === "departmentName"
            ? params.departmentId
            : params.query,
      });
      setCoursesApiResponse(result.data);
    } catch (error) {
      setCoursesApiResponse({
        courses: [],
        time: "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!cached) {
      getCourses();
    }
  }, []);

  return (
    <>
      <Head>
        <title>{params.query} - NYCU Timetable</title>
      </Head>
      {loading ? (
        <Loading />
      ) : (
        <Container maxWidth="md">
          <InfoLine
            category={params.category}
            query={params.query}
            language={params.language}
            time={coursesApiResponse.time}
            count={coursesApiResponse.courses.length}
          />
          {coursesApiResponse.courses.map((course) => (
            <LazyLoad key={course.id}>
              <CourseCard
                key={course.id}
                course={course}
                acysem={params.acysem}
                language={params.language}
              />
            </LazyLoad>
          ))}
        </Container>
      )}
      <Fab
        color="primary"
        aria-label="add"
        style={{ position: "fixed", right: "12px", bottom: "12px" }}
        onClick={() => getCourses()}
      >
        <Refresh />
      </Fab>
    </>
  );
};

type InfoLineProps = {
  category: string;
  query: string;
  language: string;
  time: string;
  count: number;
};

const InfoLine = ({
  category,
  query,
  language,
  time,
  count,
}: InfoLineProps) => {
  const formattedTime = DateTime.fromISO(time).toLocaleString(
    DateTime.DATETIME_MED
  );
  return (
    <Stack
      direction="column"
      justifyContent="center"
      alignItems="center"
      p="24px"
    >
      <Typography variant="h6">{`${toCategoryText(
        category,
        language
      )} - ${query}`}</Typography>
      <Stack pt={1} direction="column">
        <Stack direction="row">
          <Typography variant="caption">課程總數：</Typography>
          <Typography variant="caption" ml={2}>
            查詢到 {count} 堂課程
          </Typography>
        </Stack>
        <Typography variant="caption">快取時間：{formattedTime}</Typography>
      </Stack>
    </Stack>
  );
};

type CourseCardProps = {
  course: Course;
  acysem: string;
  language: string;
};

const CourseCard = ({ course, acysem, language }: CourseCardProps) => {
  const { acy, sem } = separateAcysem(acysem);
  return (
    <Card sx={{ mb: "24px" }}>
      <Box sx={{ p: "12px" }}>
        <CardContent>
          <Stack direction="row" alignItems="end">
            <Typography variant="h4">{course.name[language]}</Typography>
            <Box width="12px" />
            <Typography variant="h6">{course.teacher}</Typography>
            <Box sx={{ flexGrow: 1 }} />
          </Stack>
          <Box height="8px" />
          <Typography variant="body1" color="text.secondary">
            {course.time} · {course.credits} 學分
          </Typography>
          {course.memo === "" ? <></> : <Box height="24px" />}
          <Typography variant="body1">{course.memo}</Typography>
        </CardContent>
        <CardActions>
          <Button>詳細資料</Button>
          <Button
            href={`${process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT}crsoutline&Acy=${acy}&Sem=${sem}&CrsNo=${course.id}&lang=${language}`}
          >
            課程綱要
          </Button>
        </CardActions>
      </Box>
    </Card>
  );
};

const Loading = () => {
  return (
    <Stack
      flex={1}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <CircularProgress />
      <Box height="30px" pt="24px">
        <Typography variant="subtitle1" textAlign="center">
          正在從緩慢的 NYCU 課表抓資料 ...
        </Typography>
      </Box>
    </Stack>
  );
};

export default Search;
