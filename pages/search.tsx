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
  Link,
  Modal,
  Stack,
  Typography,
} from "@mui/material";
import { CoursesApiResponse } from "./api/courses";
import { separateAcysem, toCategoryText } from "../utils/helpers";
import { Refresh } from "@mui/icons-material";
import { DateTime } from "luxon";
import LazyLoad from "react-lazyload";
import Joi from "joi";
import { COURSE_TYPE_COLORS } from "../utils/constants";

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
        <title>{params.query} - Next Timetable</title>
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
        <Typography variant="caption">快取時間：{formattedTime}</Typography>
        <Stack direction="row">
          <Typography variant="caption">課程總數：</Typography>
          <Typography variant="caption" ml={2}>
            查詢到 {count} 堂課程
          </Typography>
        </Stack>
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card sx={{ mb: "18px" }}>
        <Box sx={{ p: "12px" }}>
          <CardContent>
            <Stack direction="row" alignItems="center">
              {typeof course.link === "undefined" ? (
                <Typography
                  variant="h5"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                >
                  {course.name[language]}
                </Typography>
              ) : (
                <Link
                  variant="h5"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  color="inherit"
                  target="_blank"
                  rel="noreferrer noopener"
                  href={course.link}
                  sx={{ cursor: "pointer" }}
                >
                  {course.name[language]}
                </Link>
              )}
              <Box width="12px" />
              <Stack direction="column">
                <Typography variant="body1" whiteSpace="nowrap" pt={1}>
                  {course.credits} 學分
                </Typography>
              </Stack>
              <Box flexGrow={1} minWidth="12px" />
              <Box
                border="1px solid"
                borderRadius="12px"
                borderColor={COURSE_TYPE_COLORS[course.type]}
              >
                <Typography
                  variant="body2"
                  whiteSpace="nowrap"
                  p="4px"
                  color={COURSE_TYPE_COLORS[course.type]}
                >
                  {course.type}
                </Typography>
              </Box>
            </Stack>
            <Box height="4px" />
            <Stack direction="row">
              <Typography
                variant="body2"
                color="text.secondary"
                whiteSpace="nowrap"
              >
                {course.time} ·
              </Typography>
              {typeof course.teacherLink === "undefined" ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  pl="2px"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                >
                  {course.teacher}
                </Typography>
              ) : (
                <Link
                  variant="body2"
                  color="text.secondary"
                  pl="2px"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  target="_blank"
                  rel="noreferrer noopener"
                  href={course.teacherLink}
                  sx={{ cursor: "pointer" }}
                >
                  {course.teacher}
                </Link>
              )}
            </Stack>
            {typeof course.memo === "undefined" ? <></> : <Box height="24px" />}
            <Typography variant="body2">{course.memo}</Typography>
          </CardContent>
          <CardActions>
            <Button sx={{ whiteSpace: "nowrap" }} onClick={() => setOpen(true)}>
              詳細資料
            </Button>
            <Button
              target="_blank"
              rel="noreferrer noopener"
              sx={{ whiteSpace: "nowrap" }}
              href={`${process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT}crsoutline&Acy=${acy}&Sem=${sem}&CrsNo=${course.id}&lang=${language}`}
            >
              課程綱要
            </Button>
            <Box flexGrow={1} />
            <Typography
              variant="body2"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              overflow="hidden"
              pr={1}
              pl={1}
              color="text.secondary"
            >
              {course.departmentName[language]}
            </Typography>
          </CardActions>
        </Box>
      </Card>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: "400px",
            bgcolor: "background.paper",
            borderRadius: "12px",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2">
            詳細資料
          </Typography>
          <Box id="modal-description" sx={{ mt: 2 }}>
            <Typography variant="body2">
              上課時數：{course.hours} 小時
            </Typography>
            {typeof course.typeInformation === "undefined" ? (
              <></>
            ) : (
              <Typography variant="body2">
                課程資訊：{course.typeInformation}
              </Typography>
            )}
            <Typography variant="body2" pt={1}>
              選修人數：{course.registered} 人（僅供參考）
            </Typography>
            <Typography variant="body2">人數上限：{course.limit} 人</Typography>
            <Typography variant="body2" pt={1}>
              當期課號：{course.id}
            </Typography>
            <Typography variant="body2">
              永久課號：{course.permanentId}
            </Typography>
          </Box>
        </Box>
      </Modal>
    </>
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
