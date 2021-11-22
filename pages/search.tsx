import axios from "axios";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
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
import Cookies from "js-cookie";
import { separateAcysem, toAcysemText, toCategoryText } from "../utils/helpers";
import { Refresh } from "@mui/icons-material";
import { DateTime } from "luxon";
import LazyLoad from "react-lazyload";

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

const Search: NextPage = () => {
  const router = useRouter();
  const parmas = router.query;
  const acysem: string = parmas.acysem as string;
  const category: string = parmas.category as string;
  const query: string = parmas.query as string;
  const language = Cookies.get("language") ?? "zh-tw";

  const [loading, setLoading] = useState(true);
  const [veryLong, setVeryLong] = useState(false);
  const [coursesApiResponse, setCoursesApiResponse] =
    useState<CoursesApiResponse>({
      courses: [],
      time: "",
    });

  useEffect(() => {
    axios
      .post("/api/courses", {
        acysem: acysem,
        category: category,
        query: query,
      })
      .then((response) => {
        setLoading(false);
        setVeryLong(false);
        setCoursesApiResponse(response.data as CoursesApiResponse);
      })
      .catch((error) => {
        setLoading(false);
        setVeryLong(false);
      });
    setTimeout(function () {
      setVeryLong(true);
    }, 2000);
  }, []);

  const handleForceRefresh = () => {
    setLoading(true);
    axios
      .post("/api/courses", {
        acysem: acysem,
        category: category,
        query: query,
        force: true,
      })
      .then((response) => {
        setLoading(false);
        setCoursesApiResponse(response.data as CoursesApiResponse);
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  return (
    <>
      <Head>
        <title>{query} - NYCU Timetable</title>
      </Head>
      {loading ? (
        <Loading veryLong={veryLong} />
      ) : (
        <Container maxWidth="md">
          <InfoLine
            acysem={acysem}
            category={category}
            query={query}
            language={language}
            time={coursesApiResponse.time}
          />
          {coursesApiResponse.courses.map((course) => (
            <LazyLoad key={course.id}>
              <CourseCard
                key={course.id}
                course={course}
                acysem={acysem}
                language={language}
              />
            </LazyLoad>
          ))}
        </Container>
      )}
      <Fab
        color="primary"
        aria-label="add"
        style={{ position: "fixed", right: "12px", bottom: "12px" }}
        onClick={() => handleForceRefresh()}
      >
        <Refresh />
      </Fab>
    </>
  );
};

type InfoLineProps = {
  acysem: string;
  category: string;
  query: string;
  language: string;
  time: string;
};

const InfoLine = ({
  acysem,
  category,
  query,
  language,
  time,
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
      <Typography variant="h6">{`在 ${toCategoryText(
        category,
        language
      )} 查詢了 ${query}`}</Typography>
      <Typography variant="body2">快取時間：{formattedTime}</Typography>
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
            {course.time} . {course.credits} credits
          </Typography>
          {course.memo === "" ? <></> : <Box height="24px" />}
          <Typography variant="body1">{course.memo}</Typography>
        </CardContent>
        <CardActions>
          <Button>詳細資料</Button>
          <Button
            href={`${process.env.NEXT_PUBLIC_NYCU_ENDPOINT}crsoutline&Acy=${acy}&Sem=${sem}&CrsNo=${course.id}&lang=${language}`}
          >
            課程綱要
          </Button>
        </CardActions>
      </Box>
    </Card>
  );
};

type LoadingProps = {
  veryLong?: boolean;
};

const Loading = ({ veryLong }: LoadingProps) => {
  return (
    <Stack
      flex={1}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <CircularProgress />
      <Box height="30px" sx={{ opacity: veryLong ? 1 : 0 }} pt="24px">
        <Typography variant="subtitle1" textAlign="center">
          本次查詢未被快取，正在從 NYCU 課表抓資料...
        </Typography>
      </Box>
    </Stack>
  );
};

export default Search;
