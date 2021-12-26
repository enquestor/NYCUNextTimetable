import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import axios from "axios";
import { useState, useEffect } from "react";
import {
  Autocomplete,
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
import { toAcysemText, toCategoryText } from "../utils/helpers";
import { Department } from "../models/department";
import Fuse from "fuse.js";
import { DEV_DEPARTMENTS } from "../utils/constants";
import { getDepartments } from "../utils/nycuapi";

export const getStaticProps: GetStaticProps = async () => {
  let props: HomeProps = {
    acysems: [],
    departments: [],
  };

  // get acysems
  console.log("get acysems");
  try {
    const response = await axios.get(
      process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT + "get_acysem"
    );
    props.acysems = response.data.map(
      (acysem: { T: string }): string => acysem.T
    );
  } catch (error) {
    console.error(error);
  }

  // get departments
  console.log("get departments");
  if (process.env.NODE_ENV === "production") {
    const result = await getDepartments({ acysem: props.acysems[0] });
    if (typeof result === "undefined") {
      props.departments = [];
    } else {
      props.departments = result.departments;
    }
  } else {
    props.departments = DEV_DEPARTMENTS;
  }

  return { props };
};

// const searchCategories: { category: SearchCategory; name: string }[] = [
//   { category: "courseName", name: "課程名稱" },
//   { category: "teacherName", name: "教師名稱" },
//   { category: "departmentName", name: "科系 / 分類" },
//   { category: "courseId", name: "當期課號" },
//   { category: "coursePermanentId", name: "永久課號" },
// ];
const searchCategories: SearchCategory[] = [
  "courseName",
  "teacherName",
  "departmentName",
  "courseId",
  "coursePermanentId",
];

interface HomeProps {
  acysems: string[];
  departments: Department[];
}

const Home: NextPage<HomeProps> = ({ acysems, departments }) => {
  const [acysem, setAcysem] = useState<string>(acysems[0]);
  const [category, setCategory] = useState<SearchCategory>("courseName");
  const [query, setQuery] = useState<string>("");
  const language = "zh-tw"; // TODO: en-us language support

  const handleSearch = () => {
    if (category === "departmentName") {
      const suggestions = getDepartmentSuggestions(query);
      if (suggestions.length === 0) {
        // only allow search for existing department names
        return;
      }
      Router.push({
        pathname: "/search",
        query: {
          acysem,
          category,
          query: suggestions[0].name[language],
          departmentId: suggestions[0].id,
        },
      });
    } else {
      Router.push({
        pathname: "/search",
        query: {
          acysem,
          category,
          query,
        },
      });
    }
  };

  const getDepartmentSuggestions = (departmentName: string): Department[] => {
    const fuse = new Fuse(departments, {
      keys: [["name", language]],
    });
    return fuse.search(departmentName).map((e) => e.item);
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
        <SearchBar
          acysem={acysem}
          category={category}
          query={query}
          language={language}
          getDepartmentSuggestions={(departmentName) =>
            getDepartmentSuggestions(departmentName)
          }
          onChange={(newQuery) => setQuery(newQuery)}
          onSearch={() => handleSearch()}
          onNextCategory={() => {
            const categoryIndex = searchCategories.findIndex(
              (searchCategory) => searchCategory === category
            );
            const newCategory = (categoryIndex + 1) % searchCategories.length;
            setCategory(searchCategories[newCategory]);
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
                {toAcysemText(acysem, "zh-tw")}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as SearchCategory)
            }
            sx={{ height: "38px", width: "120px" }}
          >
            {searchCategories.map((searchCategory) => (
              <MenuItem key={searchCategory} value={searchCategory}>
                {toCategoryText(searchCategory, "zh-tw")}
              </MenuItem>
            ))}
          </Select>
          <Button variant="outlined" onClick={() => handleSearch()}>
            搜尋
          </Button>
        </Stack>
        <Box height="60px" />
      </Stack>
    </>
  );
};

type SearchBarProps = {
  acysem: string;
  category: SearchCategory;
  query: string;
  language: string;
  getDepartmentSuggestions(departmentName: string): Department[];
  onChange: (query: string) => void;
  onSearch: () => void;
  onNextCategory: () => void;
};

const SearchBar = ({
  acysem,
  category,
  query,
  language,
  getDepartmentSuggestions,
  onChange,
  onSearch,
  onNextCategory,
}: SearchBarProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return undefined;
    }
    if (category === "courseName" || category === "teacherName") {
      axios
        .post("/api/suggestions", {
          acysem,
          category,
          query,
        })
        .then((response) => {
          setSuggestions(response.data);
        })
        .catch((error) => {
          setSuggestions([]);
        });
    } else if (category === "departmentName") {
      const result = getDepartmentSuggestions(query)
        .map((e) => e.name[language])
        .slice(0, parseInt(process.env.NEXT_PUBLIC_RECOMMENDATION_COUNT!));
      setSuggestions(result);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    if (!open) {
      setSuggestions([]);
    }
  }, [open]);

  return (
    <Autocomplete
      id="asynchronous-demo"
      sx={{ width: "90%", maxWidth: "640px" }}
      freeSolo
      open={open}
      options={suggestions}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      onChange={(_, newValue) => onChange(newValue as string)}
      isOptionEqualToValue={(option: string, value: string) => option === value}
      getOptionLabel={(option: string) => option}
      filterOptions={(x) => x}
      renderInput={(params: any) => (
        <TextField
          {...params}
          label="搜尋"
          onChange={(event) => onChange(event.target.value)}
          onKeyPress={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
            if (event.key === " ") {
              setOpen(false);
              onNextCategory();
              event.preventDefault();
            }
          }}
          InputProps={{
            ...params.InputProps,
            endAdornment: <></>,
          }}
        />
      )}
    />
  );
};

export default Home;
