import {
  Box,
  Card,
  CardContent,
  Container,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import github from "../public/github.png";

const About: NextPage = () => {
  return (
    <>
      <Head>
        <title>About - NYCU Timetable</title>
      </Head>
      <Container maxWidth="md">
        <Stack direction="column">
          <AboutCard />
          <AuthorCard />
          <ContributeCard />
        </Stack>
      </Container>
    </>
  );
};

const AboutCard = () => {
  return (
    <Card sx={{ mt: "18px" }}>
      <Box sx={{ p: "12px" }}>
        <CardContent>
          <Typography variant="h5" pb="24px">
            About
          </Typography>
          <Typography variant="body2" gutterBottom>
            NYCU Next Timetable
            是我的資工專題，目標是讓課表能用一點，不要每次到了學期初選課其間就整個動不了。
          </Typography>
          <Typography variant="body2" gutterBottom>
            如果有幫助到你，歡迎到下方 GitHub 連結點個 Star :D
          </Typography>
          <Typography variant="body2">
            另外也希望學校趕快醒醒，把我們課表的糞前端跟超慢的後端改一改。
          </Typography>
        </CardContent>
      </Box>
    </Card>
  );
};

const ContributeCard = () => {
  return (
    <Card sx={{ mt: "18px" }}>
      <Box sx={{ p: "12px" }}>
        <CardContent>
          <Typography variant="h5" pb="24px">
            Contribute
          </Typography>
          <Stack direction="row" alignItems="center">
            <Typography variant="body2" pr="18px">
              NYCU Next Timetable
              是個開源專案。如果你遇到任何問題或想幫忙加個功能，可以點右方
              GitHub 連結來發個 Issue 或 PR。
            </Typography>
            <Link href="https://github.com/Allen-Hu/NYCUNextTimetable">
              <a>
                <Image src={github} alt="github" height="120px" width="200px" />
              </a>
            </Link>
          </Stack>
        </CardContent>
      </Box>
    </Card>
  );
};

const AuthorCard = () => {
  return (
    <Card sx={{ mt: "18px" }}>
      <Box sx={{ p: "12px" }}>
        <CardContent>
          <Typography variant="h5" pb="24px">
            Author
          </Typography>
          <Typography variant="body2">
            本網站由
            <MuiLink href="https://yagami.dev/about" pl="4px" pr="4px">
              Allen Hu/Yagami
            </MuiLink>
            製作。
          </Typography>
        </CardContent>
      </Box>
    </Card>
  );
};

export default About;
