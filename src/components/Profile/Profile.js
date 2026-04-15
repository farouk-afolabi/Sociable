import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, storage } from "../../firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import Sidebar from "../Sidebar/sidebar.js";
import ProfilePost from "../ProfilePost/ProfilePost.js";
import LinkUpButton from "../LinkUpButton/LinkUpButton.js";
import "../ProfilePost/ProfilePost.css";
import "../LinkUpButton/LinkUpButton.css";
import {
  Box,
  Avatar,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Divider,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const SIDEBAR_WIDTH = 260;
const COMPRESS_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
};

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [toastError, setToastError] = useState(null);
  const [toastSuccess, setToastSuccess] = useState(null);

  const avatarInputRef = useRef(null);

  const isOwnProfile = auth.currentUser?.uid === userId;

  useEffect(() => {
    if (!userId) { setError("User ID is missing."); setLoading(false); return; }

    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) { navigate("/login"); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({ ...data, profilePic: data.profilePic || "/profilepic.png" });
        } else {
          setError("User not found.");
        }
      } catch {
        setError("Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId, navigate]);

  // ── Profile text save ────────────────────────────────────────────────────────
  const handleSaveProfile = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      setToastSuccess("Profile updated.");
      setIsEditing(false);
    } catch {
      setToastError("Failed to update profile.");
    }
  }, [userData]);

  // ── Avatar upload ────────────────────────────────────────────────────────────
  const handleAvatarSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setToastError("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setToastError("Image must be under 20 MB.");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    setAvatarUploading(true);
    setAvatarProgress(0);

    try {
      const sizeMB = file.size / 1024 / 1024;
      const compressed = sizeMB > 2 ? await imageCompression(file, COMPRESS_OPTIONS) : file;

      const storageRef = ref(storage, `avatars/${user.uid}/profile.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, compressed, {
        contentType: "image/jpeg",
      });

      await new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snap) => {
            setAvatarProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);

            // Update Firestore
            await updateDoc(doc(db, "users", user.uid), { profilePic: url });

            // Optimistic UI update
            setUserData((prev) => ({ ...prev, profilePic: url }));
            setToastSuccess("Profile photo updated.");
            resolve();
          }
        );
      });
    } catch {
      setToastError("Photo upload failed. Please try again.");
    } finally {
      setAvatarUploading(false);
      setAvatarProgress(0);
    }
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", ml: `${SIDEBAR_WIDTH}px`, p: 4 }}>
        <Sidebar />
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", ml: `${SIDEBAR_WIDTH}px`, p: 4 }}>
        <Sidebar />
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: `${SIDEBAR_WIDTH}px`,
          flex: 1,
          maxWidth: 680,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: 4,
          "@media (min-width: 1200px)": { ml: `${SIDEBAR_WIDTH}px`, mr: 0 },
        }}
      >
        {/* ── Profile card ── */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          {/* Avatar */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
            <Tooltip title={isOwnProfile ? "Change profile photo" : ""} placement="bottom">
              <Box
                sx={{
                  position: "relative",
                  cursor: isOwnProfile ? "pointer" : "default",
                  display: "inline-block",
                }}
                onClick={() => isOwnProfile && !avatarUploading && avatarInputRef.current?.click()}
              >
                <Avatar
                  src={userData.profilePic}
                  alt={`${userData.firstName} ${userData.lastName}`}
                  sx={{
                    width: 120,
                    height: 120,
                    border: "3px solid",
                    borderColor: "primary.main",
                    opacity: avatarUploading ? 0.5 : 1,
                    transition: "opacity 0.2s",
                  }}
                />

                {/* Upload spinner overlay */}
                {avatarUploading && (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                    }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={avatarProgress}
                      size={52}
                      thickness={4}
                      sx={{ color: "primary.main" }}
                    />
                  </Box>
                )}

                {/* Camera badge — shown on hover for own profile */}
                {isOwnProfile && !avatarUploading && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      bgcolor: "primary.main",
                      borderRadius: "50%",
                      width: 28,
                      height: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: 2,
                    }}
                  >
                    <CameraAltRoundedIcon sx={{ fontSize: 16, color: "#fff" }} />
                  </Box>
                )}
              </Box>
            </Tooltip>

            {/* Progress bar below avatar */}
            {avatarUploading && (
              <LinearProgress
                variant="determinate"
                value={avatarProgress}
                sx={{ width: 120, mt: 1, borderRadius: 1 }}
              />
            )}

            <Typography variant="h6" fontWeight={700} mt={1.5}>
              {userData.firstName} {userData.lastName}
            </Typography>
            {userData.bio && (
              <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
                {userData.bio}
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Action buttons */}
          {isOwnProfile ? (
            <Box sx={{ display: "flex", justifyContent: "center", mb: isEditing ? 2 : 0 }}>
              <Button
                variant={isEditing ? "outlined" : "contained"}
                size="small"
                startIcon={<EditRoundedIcon />}
                onClick={() => setIsEditing((v) => !v)}
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <LinkUpButton targetUserId={userId} />
            </Box>
          )}

          {/* Edit form */}
          {isEditing && (
            <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  size="small"
                  value={userData.firstName || ""}
                  onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  size="small"
                  value={userData.lastName || ""}
                  onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                />
              </Box>
              <TextField
                fullWidth
                label="Email"
                size="small"
                type="email"
                value={userData.email || ""}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              />
              <TextField
                fullWidth
                label="Bio"
                size="small"
                multiline
                minRows={2}
                value={userData.bio || ""}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
              />
              <Button variant="contained" onClick={handleSaveProfile} sx={{ alignSelf: "flex-end" }}>
                Save Changes
              </Button>
            </Box>
          )}
        </Paper>

        {/* ── Posts ── */}
        <ProfilePost />
      </Box>

      {/* Hidden avatar file input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleAvatarSelect}
      />

      {/* Toasts */}
      <Snackbar
        open={!!toastError}
        autoHideDuration={5000}
        onClose={() => setToastError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setToastError(null)} sx={{ width: "100%" }}>
          {toastError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!toastSuccess}
        autoHideDuration={3000}
        onClose={() => setToastSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToastSuccess(null)} sx={{ width: "100%" }}>
          {toastSuccess}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Profile;
