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
  Stack,
  Typography,
} from "@mui/material";
import { CoursesApiResponse } from "./api/courses";
import Cookies from "js-cookie";
import { toAcysemText, toCategoryText } from "../utils/helpers";

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

  const [isLoading, setIsLoading] = useState(true);
  const [isVeryLong, setIsVeryLong] = useState(false);
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
        setIsLoading(false);
        setIsVeryLong(false);
        setCoursesApiResponse(response.data as CoursesApiResponse);
      })
      .catch((error) => {
        setIsLoading(false);
        setIsVeryLong(false);
      });
    setTimeout(function () {
      setIsVeryLong(true);
    }, 1000);
  }, []);

  return (
    <>
      <Head>
        <title>{query} - NYCU Timetable</title>
      </Head>
      {isLoading ? (
        <Loading isVeryLong={isVeryLong} />
      ) : (
        <Container maxWidth="md">
          <InfoLine
            acysem={acysem}
            category={category}
            query={query}
            language={language}
          />
          {coursesApiResponse.courses.map((course) => (
            <CourseCard course={course} acysem={acysem} language={language} />
          ))}
        </Container>
      )}
    </>
  );
};

type InfoLineProps = {
  acysem: string;
  category: string;
  query: string;
  language: string;
};

const InfoLine = ({ acysem, category, query, language }: InfoLineProps) => {
  return (
    <Stack alignItems="center" p="24px">
      <Typography variant="h6">{`${toAcysemText(
        acysem,
        language
      )} - Queried ${query} with ${toCategoryText(
        category,
        language
      )}`}</Typography>
    </Stack>
  );
};

type CourseCardProps = {
  course: Course;
  acysem: string;
  language: string;
};

const CourseCard = ({ course, acysem, language }: CourseCardProps) => {
  const acy = acysem.slice(0, 3);
  const sem = acysem.slice(3, 4);
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
          <Button>Details</Button>
          <Button
            href={`${process.env.NEXT_PUBLIC_NYCU_ENDPOINT}crsoutline&Acy=${acy}&Sem=${sem}&CrsNo=${course.id}&lang=${language}`}
          >
            Syllabus
          </Button>
        </CardActions>
      </Box>
    </Card>
  );
};

type LoadingProps = {
  isVeryLong?: boolean;
};

const Loading = ({ isVeryLong }: LoadingProps) => {
  return (
    <Stack
      flex={1}
      direction="column"
      justifyContent="center"
      alignItems="center"
    >
      <CircularProgress />
      <Box height="30px" sx={{ opacity: isVeryLong ? 1 : 0 }} pt="24px">
        <Typography variant="subtitle1" textAlign="center">
          This page has not been cached, so it would take a while to load...
        </Typography>
      </Box>
    </Stack>
  );
};

export default Search;
