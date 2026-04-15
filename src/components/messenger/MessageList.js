import { Box, Typography, Avatar, Fade } from '@mui/material';
import { keyframes } from '@mui/system';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import './MessageList.css';

// ─── Bouncing dot animation ───────────────────────────────────────────────────
const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0);   opacity: 0.4; }
  30%            { transform: translateY(-5px); opacity: 1;   }
`;

function TypingDot({ delay }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        bgcolor: 'text.secondary',
        mx: '2px',
        animation: `${bounce} 1.2s ease-in-out infinite`,
        animationDelay: delay,
      }}
    />
  );
}

// ─── Typing indicator row ─────────────────────────────────────────────────────
function TypingIndicator({ typingUsers }) {
  const names = typingUsers.map((u) => u.displayName).join(', ');
  const label = typingUsers.length === 1
    ? `${names} is typing`
    : `${names} are typing`;

  return (
    <Fade in>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: 3,
            px: 1.5,
            py: 0.75,
            gap: 0.5,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            {label}
          </Typography>
          <TypingDot delay="0s" />
          <TypingDot delay="0.15s" />
          <TypingDot delay="0.3s" />
        </Box>
      </Box>
    </Fade>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
const MessageItem = ({ message, isCurrentUser, senderName }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isCurrentUser ? 'flex-end' : 'flex-start',
      mb: 2,
      px: 2,
    }}
  >
    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>
      {senderName}
    </Typography>

    <Box
      sx={{
        display: 'flex',
        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        maxWidth: '70%',
      }}
    >
      {!isCurrentUser && (
        <Avatar
          sx={{ mr: 1, width: 32, height: 32 }}
          src={message.senderPhotoURL}
          alt={senderName}
        />
      )}

      <Box
        sx={{
          bgcolor: isCurrentUser ? 'primary.main' : 'grey.100',
          color: isCurrentUser ? 'white' : 'text.primary',
          p: 1.5,
          borderRadius: 2,
          wordBreak: 'break-word',
        }}
      >
        <Typography>{message.text}</Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'right',
            color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'text.secondary',
          }}
        >
          {message.timestamp?.toDate
            ? format(message.timestamp.toDate(), 'h:mm a')
            : 'Just now'}
        </Typography>
      </Box>
    </Box>
  </Box>
);

// ─── Message list ─────────────────────────────────────────────────────────────
const STALE_MS = 10_000; // ignore typing docs older than 10s

const MessageList = ({ messages, currentUser, activeChat }) => {
  const [userData, setUserData]     = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const fetchedIds = useRef(new Set());
  const bottomRef  = useRef(null);

  // ── Fetch user display data — fixed: use a ref to track fetched IDs
  //    so we don't re-fetch on every render (old code had userData in
  //    the dependency array which caused an infinite loop)
  useEffect(() => {
    if (!messages?.length) return;

    const toFetch = [];
    messages.forEach((m) => {
      if (m.senderId && !fetchedIds.current.has(m.senderId)) toFetch.push(m.senderId);
    });
    if (!toFetch.length) return;

    toFetch.forEach((id) => fetchedIds.current.add(id));

    Promise.all(
      toFetch.map(async (userId) => {
        try {
          const snap = await getDoc(doc(db, 'users', userId));
          return snap.exists() ? [userId, snap.data()] : null;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      const newUsers = {};
      results.forEach((r) => { if (r) newUsers[r[0]] = r[1]; });
      if (Object.keys(newUsers).length) {
        setUserData((prev) => ({ ...prev, ...newUsers }));
      }
    });
  }, [messages]);

  // ── Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // ── Subscribe to typing subcollection ─────────────────────────────────────
  useEffect(() => {
    if (!activeChat?.id || !currentUser?.uid) return;

    const typingRef = collection(db, 'chats', activeChat.id, 'typing');
    const unsubscribe = onSnapshot(typingRef, (snapshot) => {
      const now = Date.now();
      const active = [];

      snapshot.docs.forEach((d) => {
        // Never show the current user's own indicator
        if (d.id === currentUser.uid) return;

        const data = d.data();

        // Ignore stale documents (safety net for failed cleanups)
        const ts = data.timestamp?.toMillis?.();
        if (ts && now - ts > STALE_MS) return;

        active.push({ uid: d.id, displayName: data.displayName || 'Someone' });
      });

      setTypingUsers(active);
    });

    return () => unsubscribe();
  }, [activeChat?.id, currentUser?.uid]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', py: 2 }}>
      {/* Messages */}
      {messages.map((message) => {
        const isCurrentUser = message.senderId === currentUser.uid;
        const sender = userData[message.senderId] || {};
        const senderName = sender.firstName
          ? `${sender.firstName} ${sender.lastName || ''}`.trim()
          : 'Unknown';

        return (
          <MessageItem
            key={message.id}
            message={message}
            isCurrentUser={isCurrentUser}
            senderName={senderName}
          />
        );
      })}

      {/* Typing indicator — shown only when someone else is typing */}
      {typingUsers.length > 0 && (
        <TypingIndicator typingUsers={typingUsers} />
      )}

      {/* Invisible anchor for auto-scroll */}
      <Box ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
