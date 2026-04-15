import React from "react";
import { Box } from "@mui/material";
import PostFeed from "../PostFeed/PostFeed.js";
import Sidebar from "../Sidebar/sidebar.js";
import Sidebarfeeds from "../sidebarfeeds/Sidebarfeeds.js";

const SIDEBAR_WIDTH   = 260;
const RIGHTBAR_WIDTH  = 280;

function Home() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar />

      {/* Main feed — offset by sidebar widths */}
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: `${SIDEBAR_WIDTH}px`,
          mr: { xs: 0, lg: `${RIGHTBAR_WIDTH}px` },
          maxWidth: 680,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: 3,
          // On large screens the auto-margin fights with the fixed sidebars,
          // so we override to be sidebar-aware
          "@media (min-width: 1200px)": {
            ml: `${SIDEBAR_WIDTH}px`,
            mr: `${RIGHTBAR_WIDTH}px`,
            maxWidth: "none",
          },
        }}
      >
        <PostFeed />
      </Box>

      {/* Right sidebar */}
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: RIGHTBAR_WIDTH,
        }}
      >
        <Sidebarfeeds />
      </Box>
    </Box>
  );
}

export default Home;
