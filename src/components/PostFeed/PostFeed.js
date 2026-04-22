import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { db, auth, storage } from "../../firebase";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  TextField,
  Button,
  IconButton,
  Skeleton,
  Divider,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  Fade,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const PAGE_SIZE = 20;
const COMPRESS_THRESHOLD_MB = 2;
const COMPRESS_OPTIONS = {
  maxSizeMB: COMPRESS_THRESHOLD_MB,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function maybeCompress(file) {
  const sizeMB = file.size / 1024 / 1024;
  if (sizeMB <= COMPRESS_THRESHOLD_MB) return file;
  return imageCompression(file, COMPRESS_OPTIONS);
}

// ─── Skeleton card shown while feed loads ────────────────────────────────────
function PostSkeleton() {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="40%" height={20} />
            <Skeleton width="25%" height={16} />
          </Box>
        </Box>
        <Skeleton height={16} sx={{ mb: 0.5 }} />
        <Skeleton height={16} width="80%" />
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Skeleton width={60} height={32} sx={{ borderRadius: 1 }} />
        <Skeleton width={80} height={32} sx={{ borderRadius: 1, ml: 1 }} />
      </CardActions>
    </Card>
  );
}

// ─── Single post card ─────────────────────────────────────────────────────────
const PostCard = React.memo(function PostCard({ post, onLike }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 0 }}>
        {/* Author row */}
        <Box
          component={Link}
          to={`/profile/${post.userId}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <Avatar src={post.profilePic} alt={post.author} sx={{ width: 44, height: 44 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              {post.author}
            </Typography>
            {post.timestamp?.toDate && (
              <Typography variant="caption" color="text.secondary">
                {post.timestamp.toDate().toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Post text */}
        {post.content && (
          <Typography
            component={Link}
            to={`/post/${post.id}`}
            variant="body1"
            color="text.primary"
            sx={{ textDecoration: "none", display: "block", lineHeight: 1.7, mb: post.imageUrl ? 1.5 : 0 }}
          >
            {post.content}
          </Typography>
        )}

        {/* Post image */}
        {post.imageUrl && (
          <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
            {/* Skeleton shown until image has loaded */}
            {!imgLoaded && (
              <Skeleton
                variant="rectangular"
                width="100%"
                height={280}
                sx={{ borderRadius: 2 }}
              />
            )}
            <Box
              component="img"
              src={post.imageUrl}
              alt="Post image"
              onLoad={() => setImgLoaded(true)}
              onClick={() => setLightboxOpen(true)}
              sx={{
                display: imgLoaded ? "block" : "none",
                width: "100%",
                maxHeight: 500,
                objectFit: "cover",
                borderRadius: 2,
                cursor: "zoom-in",
                transition: "opacity 0.2s ease",
                "&:hover": { opacity: 0.92 },
              }}
            />
          </Box>
        )}
      </CardContent>

      <Divider sx={{ mx: 2, mt: 1.5 }} />

      <CardActions sx={{ px: 2, py: 1 }}>
        <Tooltip title={post.liked ? "Unlike" : "Like"}>
          <IconButton
            size="small"
            onClick={() => onLike(post.id)}
            color={post.liked ? "error" : "default"}
            sx={{ gap: 0.5 }}
          >
            {post.liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            <Typography variant="caption" color="text.secondary">
              {post.likesCount}
            </Typography>
          </IconButton>
        </Tooltip>

        <Tooltip title="View comments">
          <IconButton
            component={Link}
            to={`/post/${post.id}`}
            size="small"
            sx={{ gap: 0.5 }}
          >
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              {post.commentsCount}
            </Typography>
          </IconButton>
        </Tooltip>
      </CardActions>

      {/* Lightbox */}
      {post.imageUrl && (
        <Dialog
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          maxWidth="lg"
          TransitionComponent={Fade}
          PaperProps={{ sx: { bgcolor: "transparent", boxShadow: "none", overflow: "hidden" } }}
        >
          <DialogContent sx={{ p: 0, position: "relative" }}>
            <IconButton
              onClick={() => setLightboxOpen(false)}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 1,
                bgcolor: "rgba(0,0,0,0.5)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
            <Box
              component="img"
              src={post.imageUrl}
              alt="Full size"
              sx={{ display: "block", maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
});

// ─── Main PostFeed component ──────────────────────────────────────────────────
function PostFeed({ title }) {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfilePic, setUserProfilePic] = useState("/profilepic.png");
  const [userFullName, setUserFullName] = useState("Anonymous");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // null = idle, 0-100 = uploading
  const [selectedImage, setSelectedImage] = useState(null);   // File
  const [imagePreview, setImagePreview] = useState(null);     // object URL
  const [toastError, setToastError] = useState(null);

  const fileInputRef = useRef(null);
  const userCache = useRef({});
  const likedPostsCache = useRef({});
  const pendingLikes = useRef(new Set()); // postIds with an in-flight write

  // Clean up object URL when image is removed/changed
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const getUserData = useCallback(async (userId) => {
    if (userCache.current[userId]) return userCache.current[userId];
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const d = userDoc.data();
        const result = {
          fullName: d.firstName && d.lastName
            ? `${d.firstName} ${d.lastName}`
            : d.businessName || "Anonymous",
          profilePic: d.profilePic || "/profilepic.png",
        };
        userCache.current[userId] = result;
        return result;
      }
    } catch { /* ignore */ }
    return { fullName: "Anonymous", profilePic: "/profilepic.png" };
  }, []);

  const batchGetUsers = useCallback(async (userIds) => {
    const unique = [...new Set(userIds)];
    const uncached = unique.filter((id) => !userCache.current[id]);
    if (uncached.length > 0) {
      const chunks = [];
      for (let i = 0; i < uncached.length; i += 30) chunks.push(uncached.slice(i, i + 30));
      await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await getDocs(query(collection(db, "users"), where("uid", "in", chunk)));
          snap.docs.forEach((d) => {
            const data = d.data();
            userCache.current[d.id] = {
              fullName: data.firstName && data.lastName
                ? `${data.firstName} ${data.lastName}`
                : data.businessName || "Anonymous",
              profilePic: data.profilePic || "/profilepic.png",
            };
          });
        })
      );
    }
    return userCache.current;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const user = auth.currentUser;

    const init = async () => {
      if (user) {
        const { fullName, profilePic } = await getUserData(user.uid);
        if (isMounted) { setUserFullName(fullName); setUserProfilePic(profilePic); }
      }
    };

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!isMounted) return;
      const validDocs = snapshot.docs.filter((d) => d.data().content || d.data().imageUrl);
      const userIds = validDocs.map((d) => d.data().userId);
      const cache = await batchGetUsers(userIds);
      if (!isMounted) return;

      const currentUser = auth.currentUser;
      if (currentUser) {
        await Promise.all(validDocs.map(async (d) => {
          if (likedPostsCache.current[d.id] === undefined) {
            const likeSnap = await getDoc(doc(db, "posts", d.id, "likes", currentUser.uid));
            likedPostsCache.current[d.id] = likeSnap.exists();
          }
        }));
      }

      const postsArray = validDocs.map((d) => {
        const postData = d.data();
        const userData = cache[postData.userId] || { fullName: "Anonymous", profilePic: "/profilepic.png" };
        return {
          id: d.id,
          author: userData.fullName,
          profilePic: userData.profilePic,
          content: postData.content || "",
          imageUrl: postData.imageUrl || null,
          likesCount: postData.likesCount || 0,
          commentsCount: postData.commentsCount || 0,
          timestamp: postData.timestamp,
          userId: postData.userId,
          liked: likedPostsCache.current[d.id] || false,
        };
      });

      if (isMounted) {
        setPosts((prev) => {
          const prevMap = new Map(prev.map((p) => [p.id, p]));
          return postsArray.map((p) => {
            // If a like write is in-flight for this post, keep the optimistic
            // count/liked state so Firestore's stale snapshot doesn't clobber it.
            if (pendingLikes.current.has(p.id)) {
              const prevPost = prevMap.get(p.id);
              if (prevPost) return { ...p, liked: prevPost.liked, likesCount: prevPost.likesCount };
            }
            return p;
          });
        });
        setLoading(false);
      }
    });

    init();
    return () => { isMounted = false; unsubscribe(); };
  }, [getUserData, batchGetUsers]);

  // ── Image selection ──────────────────────────────────────────────────────────
  const handleImageSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";           // allow re-selecting same file
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setToastError("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {       // 20 MB sanity cap before compression
      setToastError("Image must be under 20 MB.");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  }, [imagePreview]);

  const handleRemoveImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setSelectedImage(null);
    setImagePreview(null);
  }, [imagePreview]);

  // ── Upload image to Storage, return download URL ─────────────────────────────
  const uploadImage = useCallback((file, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const compressed = await maybeCompress(file);
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `posts/${userId}/${timestamp}_${safeName}`);
        const uploadTask = uploadBytesResumable(storageRef, compressed, {
          contentType: compressed.type,
        });

        uploadTask.on(
          "state_changed",
          (snap) => {
            const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            setUploadProgress(pct);
          },
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  // ── Post submission ──────────────────────────────────────────────────────────
  const handlePostSubmit = useCallback(async () => {
    const hasText = newPost.trim() !== "";
    const hasImage = selectedImage !== null;
    if ((!hasText && !hasImage) || submitting) return;

    const user = auth.currentUser;
    if (!user) return;

    setSubmitting(true);
    setUploadProgress(hasImage ? 0 : null);

    try {
      let imageUrl = null;
      if (hasImage) {
        imageUrl = await uploadImage(selectedImage, user.uid);
      }

      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        content: newPost.trim(),
        ...(imageUrl && { imageUrl }),
        timestamp: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
      });

      setNewPost("");
      handleRemoveImage();
    } catch (err) {
      console.error("Post submit error:", err);
      setToastError("Failed to publish post. Please try again.");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }, [newPost, selectedImage, submitting, uploadImage, handleRemoveImage]);

  // ── Like toggle ──────────────────────────────────────────────────────────────
  const handleLike = useCallback(async (postId) => {
    const user = auth.currentUser;
    if (!user) return;

    // Determine current liked state from cache
    const wasLiked = likedPostsCache.current[postId] || false;
    const delta = wasLiked ? -1 : 1;

    // Mark write as in-flight so onSnapshot doesn't overwrite the optimistic state
    pendingLikes.current.add(postId);

    // Optimistic update — flip the button immediately
    likedPostsCache.current[postId] = !wasLiked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !wasLiked, likesCount: p.likesCount + delta }
          : p
      )
    );

    const likeRef = doc(db, "posts", postId, "likes", user.uid);
    const postRef = doc(db, "posts", postId);
    try {
      if (wasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { userId: user.uid });
        await updateDoc(postRef, { likesCount: increment(1) });
      }
    } catch (err) {
      console.error("Like error:", err);
      // Revert optimistic update on failure
      likedPostsCache.current[postId] = wasLiked;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: wasLiked, likesCount: p.likesCount - delta }
            : p
        )
      );
    } finally {
      // Write is settled — let onSnapshot take over for this post again
      pendingLikes.current.delete(postId);
    }
  }, []);

  const canPost = (newPost.trim() !== "" || selectedImage !== null) && !submitting;

  return (
    <Box>
      {title && (
        <Typography variant="h6" fontWeight={700} mb={2}>{title}</Typography>
      )}

      {/* ── Compose card ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: uploadProgress !== null ? 0 : undefined }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
            <Avatar src={userProfilePic} alt={userFullName} />
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                placeholder="What's on your mind?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ mb: 1.5 }}
                disabled={submitting}
              />

              {/* Image preview */}
              {imagePreview && (
                <Box sx={{ position: "relative", mb: 1.5, display: "inline-block" }}>
                  <Box
                    component="img"
                    src={imagePreview}
                    alt="Preview"
                    sx={{
                      maxHeight: 200,
                      maxWidth: "100%",
                      borderRadius: 2,
                      display: "block",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleRemoveImage}
                    disabled={submitting}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      bgcolor: "rgba(0,0,0,0.55)",
                      color: "#fff",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                    }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {/* Attach button */}
                <Tooltip title="Attach image">
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                      color="primary"
                    >
                      <AttachFileRoundedIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePostSubmit}
                  disabled={!canPost}
                >
                  {submitting ? "Posting…" : "Post"}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>

        {/* Upload progress bar */}
        {uploadProgress !== null && (
          <LinearProgress
            variant="determinate"
            value={uploadProgress}
            sx={{ height: 3, borderRadius: 0 }}
          />
        )}
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />

      {/* ── Feed ── */}
      {loading ? (
        <><PostSkeleton /><PostSkeleton /><PostSkeleton /></>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))
      ) : (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">No posts yet. Be the first!</Typography>
        </Card>
      )}

      {/* Error toast */}
      <Snackbar
        open={!!toastError}
        autoHideDuration={5000}
        onClose={() => setToastError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setToastError(null)}
          sx={{ width: "100%" }}
        >
          {toastError}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PostFeed;
