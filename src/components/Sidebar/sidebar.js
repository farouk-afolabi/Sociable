import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import {
  Box,
  Paper,
  Typography,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useThemeMode } from "../../context/ThemeContext";

const SIDEBAR_WIDTH = 260;

function Sidebar() {
  const userId = auth.currentUser?.uid;
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 1000) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(query(collection(db, "users"), limit(50)));
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredUsers([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter((user) => {
        const full = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
        return full.includes(q) || (user.businessName || "").toLowerCase().includes(q);
      })
    );
  }, [searchQuery, users]);

  const menuItems = [
    { title: "Home",      icon: <HomeRoundedIcon />,   path: "/home" },
    { title: "Messenger", icon: <ChatRoundedIcon />,   path: "/messenger" },
    { title: "Profile",   icon: <PersonRoundedIcon />, path: userId ? `/profile/${userId}` : "/login" },
  ];

  const isMobile = windowWidth <= 1000;

  const sidebarContent = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2,
        gap: 1,
      }}
    >
      {/* Brand + collapse toggle */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            background: "linear-gradient(135deg, #6366F1, #EC4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            cursor: "pointer",
          }}
          onClick={() => navigate("/home")}
        >
          Sociable
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
            <IconButton size="small" onClick={toggleMode}>
              {mode === "dark" ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          {isMobile && (
            <IconButton size="small" onClick={() => setIsMobileOpen(false)}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ position: "relative" }}>
        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            gap: 1,
          }}
        >
          <SearchRoundedIcon fontSize="small" color="action" />
          <InputBase
            placeholder="Search people…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            fullWidth
            sx={{ fontSize: 14 }}
          />
        </Paper>

        {showSearchResults && filteredUsers.length > 0 && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              zIndex: 1300,
              borderRadius: 2,
              overflow: "hidden",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {filteredUsers.map((user) => (
              <ListItemButton
                key={user.id}
                component={Link}
                to={`/profile/${user.id}`}
                dense
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Avatar
                    src={user.profilePic}
                    sx={{ width: 28, height: 28 }}
                  >
                    {(user.firstName || "?")[0]}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.businessName || "Unknown"
                  }
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItemButton>
            ))}
          </Paper>
        )}
      </Box>

      <Divider />

      {/* Nav items */}
      <List dense disablePadding>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.title}
            component={Link}
            to={item.path}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{ fontWeight: 500, fontSize: 14 }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        {/* Hamburger button */}
        <IconButton
          onClick={() => setIsMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1200,
            bgcolor: "background.paper",
            boxShadow: 2,
            display: isMobileOpen ? "none" : "flex",
          }}
        >
          <MenuRoundedIcon />
        </IconButton>

        {/* Mobile overlay */}
        {isMobileOpen && (
          <Box
            onClick={() => setIsMobileOpen(false)}
            sx={{
              position: "fixed",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.4)",
              zIndex: 1199,
            }}
          />
        )}

        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            zIndex: 1200,
            transform: isMobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
            borderRight: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          {sidebarContent}
        </Paper>
      </>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        borderRight: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      {sidebarContent}
    </Paper>
  );
}

export default Sidebar;
