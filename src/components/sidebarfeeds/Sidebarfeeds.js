import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import Following from "./Following";
import Followers from "./Followers";
import SuggestedFriends from "./suggestedFriends";

function Sidebarfeeds() {
  const [tab, setTab] = useState(0);

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderLeft: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          Updates
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40 }}
        TabIndicatorProps={{ style: { height: 2 } }}
      >
        <Tab
          icon={<PeopleOutlineRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="Following"
          sx={{ minHeight: 40, fontSize: 12, textTransform: "none" }}
        />
        <Tab
          icon={<GroupRoundedIcon fontSize="small" />}
          iconPosition="start"
          label="Followers"
          sx={{ minHeight: 40, fontSize: 12, textTransform: "none" }}
        />
      </Tabs>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {tab === 0 && <Following />}
        {tab === 1 && <Followers />}
      </Box>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <PersonAddRoundedIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            Suggested People
          </Typography>
        </Box>
        <SuggestedFriends showAll={false} />
      </Box>
    </Paper>
  );
}

export default Sidebarfeeds;
