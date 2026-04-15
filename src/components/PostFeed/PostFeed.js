import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../../firebase";
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
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const PAGE_SIZE = 20;

// ─── Skeleton card shown while posts load ───────────────────────────────────
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

// ─── Single post card ────────────────────────────────────────────────────────
const PostCard = React.memo(function PostCard({ post, onLike }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: 0 }}>
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
          <Avatar
            src={post.profilePic}
            alt={post.author}
            sx={{ width: 44, height: 44 }}
          />
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              {post.author}
            </Typography>
            {post.timestamp && (
              <Typography variant="caption" color="text.secondary">
                {post.timestamp.toDate
                  ? post.timestamp.toDate().toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </Typography>
            )}
          </Box>
        </Box>

        <Typography
          component={Link}
          to={`/post/${post.id}`}
          variant="body1"
          color="text.primary"
          sx={{ textDecoration: "none", display: "block", lineHeight: 1.7 }}
        >
          {post.content}
        </Typography>
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
    </Card>
  );
});

// ─── Main PostFeed component ─────────────────────────────────────────────────
function PostFeed({ title }) {
  const [newPost, setNewPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfilePic, setUserProfilePic] = useState("/profilepic.png");
  const [userFullName, setUserFullName] = useState("Anonymous");
  const [submitting, setSubmitting] = useState(false);

  const userCache = useRef({});
  const likedPostsCache = useRef({});

  const getUserData = useCallback(async (userId) => {
    if (userCache.current[userId]) return userCache.current[userId];
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const d = userDoc.data();
        const result = {
          fullName:
            d.firstName && d.lastName
              ? `${d.firstName} ${d.lastName}`
              : d.businessName || "Anonymous",
          profilePic: d.profilePic || "/profilepic.png",
        };
        userCache.current[userId] = result;
        return result;
      }
    } catch {
      // ignore
    }
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
          const snap = await getDocs(
            query(collection(db, "users"), where("uid", "in", chunk))
          );
          snap.docs.forEach((d) => {
            const data = d.data();
            userCache.current[d.id] = {
              fullName:
                data.firstName && data.lastName
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
        if (isMounted) {
          setUserFullName(fullName);
          setUserProfilePic(profilePic);
        }
      }
    };

    const q = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc"),
      limit(PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (!isMounted) return;
      const validDocs = snapshot.docs.filter((d) => d.data().content);
      const userIds = validDocs.map((d) => d.data().userId);
      const cache = await batchGetUsers(userIds);
      if (!isMounted) return;

      // Check liked status for current user
      const currentUser = auth.currentUser;
      if (currentUser) {
        await Promise.all(
          validDocs.map(async (d) => {
            if (likedPostsCache.current[d.id] === undefined) {
              const likeSnap = await getDoc(
                doc(db, "posts", d.id, "likes", currentUser.uid)
              );
              likedPostsCache.current[d.id] = likeSnap.exists();
            }
          })
        );
      }

      const postsArray = validDocs.map((d) => {
        const postData = d.data();
        const userData = cache[postData.userId] || {
          fullName: "Anonymous",
          profilePic: "/profilepic.png",
        };
        return {
          id: d.id,
          author: userData.fullName,
          profilePic: userData.profilePic,
          content: postData.content,
          likesCount: postData.likesCount || 0,
          commentsCount: postData.commentsCount || 0,
          timestamp: postData.timestamp,
          userId: postData.userId,
          liked: likedPostsCache.current[d.id] || false,
        };
      });

      setPosts(postsArray);
      setLoading(false);
    });

    init();
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [getUserData, batchGetUsers]);

  const handlePostSubmit = useCallback(async () => {
    if (newPost.trim() === "" || submitting) return;
    const user = auth.currentUser;
    if (!user) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        content: newPost,
        timestamp: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
      });
      setNewPost("");
    } catch (error) {
      console.error("Error adding post:", error);
    } finally {
      setSubmitting(false);
    }
  }, [newPost, submitting]);

  const handleLike = useCallback(async (postId) => {
    const user = auth.currentUser;
    if (!user) return;
    const likeRef = doc(db, "posts", postId, "likes", user.uid);
    const postRef = doc(db, "posts", postId);
    try {
      const [likeDoc, postDoc] = await Promise.all([
        getDoc(likeRef),
        getDoc(postRef),
      ]);
      if (!postDoc.exists()) return;
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
        likedPostsCache.current[postId] = false;
      } else {
        await setDoc(likeRef, { userId: user.uid });
        await updateDoc(postRef, { likesCount: increment(1) });
        likedPostsCache.current[postId] = true;
      }
    } catch (error) {
      console.error("Error handling like:", error);
    }
  }, []);

  return (
    <Box>
      {title && (
        <Typography variant="h6" fontWeight={700} mb={2}>
          {title}
        </Typography>
      )}

      {/* Compose box */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
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
              />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlePostSubmit}
                  disabled={!newPost.trim() || submitting}
                >
                  {submitting ? "Posting…" : "Post"}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Feed */}
      {loading ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))
      ) : (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">No posts yet. Be the first!</Typography>
        </Card>
      )}
    </Box>
  );
}

export default PostFeed;
