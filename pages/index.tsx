import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import axios from "axios";
import { useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Router from "next/router";
import { SearchCategory } from "../models/search_category";

export const getStaticProps: GetStaticProps = async () => {
  try {
    const response = await axios.get(process.env.NYCU_ENDPOINT + "get_acysem");
    const acysems = response.data.map(
      (acysem: { T: string }): string => acysem.T
    );
    return {
      props: {
        acysems,
      } as HomeProps,
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        acysems: [],
      } as HomeProps,
    };
  }
};

const searchCategories: { category: SearchCategory; name: string }[] = [
  { category: "courseName", name: "Course Name" },
  { category: "teacherName", name: "Teacher Name" },
  { category: "departmentName", name: "Department" },
  { category: "courseId", name: "Course ID" },
  { category: "coursePermanentId", name: "Permanent ID" },
];

interface HomeProps {
  acysems: string[];
}

const Home: NextPage<HomeProps> = ({ acysems }) => {
  const [acysem, setAcysem] = useState<string>(acysems[0]);
  const [category, setCategory] = useState<SearchCategory>("courseName");
  const [query, setQuery] = useState<string>("");

  const handleSearch = () => {
    Router.push({
      pathname: "/search",
      query: {
        acysem,
        category,
        query,
      },
    });
  };

  return (
    <>
      <Head>
        <title>NYCU Timetable</title>
      </Head>
      <Stack
        flex={1}
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Typography variant="h2" textAlign="center">
          NYCU Timetable
        </Typography>
        <Box height="32px" />
        <TextField
          id="outlined-basic"
          variant="outlined"
          label="Search"
          sx={{ width: "90%", maxWidth: "640px" }}
          onChange={(event) => setQuery(event.target.value)}
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <Box height="20px" />
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          <Select
            value={acysem}
            onChange={(event) => setAcysem(event.target.value)}
            sx={{ height: "38px", width: "100px" }}
          >
            {acysems.map((acysem) => (
              <MenuItem key={acysem} value={acysem}>
                {acysem}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as SearchCategory)
            }
            sx={{ height: "38px", width: "160px" }}
          >
            {searchCategories.map((searchCategory) => (
              <MenuItem
                key={searchCategory.category}
                value={searchCategory.category}
              >
                {searchCategory.name}
              </MenuItem>
            ))}
          </Select>
          <Button variant="outlined" onClick={() => handleSearch()}>
            Search
          </Button>
        </Stack>
        <Box height="60px" />
      </Stack>
    </>
  );
};

export default Home;
