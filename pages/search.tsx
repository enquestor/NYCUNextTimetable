import axios from "axios";
import type { NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { Course } from "../models/course";
import { SearchCategory } from "../models/search_category";
import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { CoursesApiResponse } from "./api/courses";

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

const Search: NextPage = () => {
  const router = useRouter();
  const { acysem, category, query } = router.query;

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
        setCoursesApiResponse(response.data as CoursesApiResponse);
      })
      .catch((error) => {});
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
        <Container>{JSON.stringify(coursesApiResponse.courses)}</Container>
      )}
    </>
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
