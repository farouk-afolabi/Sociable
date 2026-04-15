import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, IconButton, InputAdornment } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { db } from '../../firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import './MessageInput.css';

// How long after the last keystroke before we write "typing" to Firestore
const WRITE_DEBOUNCE_MS = 300;
// How long of silence before we clear the typing indicator automatically
const CLEAR_AFTER_MS = 2000;

const MessageInput = ({ onSend, chatId, currentUser }) => {
  const [message, setMessage] = useState('');

  const writeDebounceRef = useRef(null);
  const clearTimeoutRef  = useRef(null);

  // Derived Firestore ref — stable as long as chatId/currentUser don't change
  const typingDocRef = useRef(null);
  useEffect(() => {
    if (chatId && currentUser?.uid) {
      typingDocRef.current = doc(db, 'chats', chatId, 'typing', currentUser.uid);
    } else {
      typingDocRef.current = null;
    }
  }, [chatId, currentUser?.uid]);

  // Delete the typing document — safe to call even if doc doesn't exist
  const clearTypingDoc = useCallback(() => {
    if (typingDocRef.current) {
      deleteDoc(typingDocRef.current).catch(() => {});
    }
  }, []);

  // Cancel all pending timers and clear Firestore
  const cancelAll = useCallback(() => {
    clearTimeout(writeDebounceRef.current);
    clearTimeout(clearTimeoutRef.current);
    clearTypingDoc();
  }, [clearTypingDoc]);

  // Clean up on unmount or when the active chat changes
  useEffect(() => {
    return () => {
      clearTimeout(writeDebounceRef.current);
      clearTimeout(clearTimeoutRef.current);
      clearTypingDoc();
    };
  }, [chatId, clearTypingDoc]);

  const handleChange = useCallback((e) => {
    setMessage(e.target.value);

    if (!typingDocRef.current) return;

    // Reset both timers on every keystroke
    clearTimeout(writeDebounceRef.current);
    clearTimeout(clearTimeoutRef.current);

    // Write "typing" after 300ms of continuous input
    writeDebounceRef.current = setTimeout(() => {
      setDoc(typingDocRef.current, {
        displayName: currentUser?.displayName
          || `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()
          || 'Someone',
        timestamp: serverTimestamp(),
      }).catch(() => {});
    }, WRITE_DEBOUNCE_MS);

    // Auto-clear after 2s of silence
    clearTimeoutRef.current = setTimeout(() => {
      clearTypingDoc();
    }, CLEAR_AFTER_MS);
  }, [currentUser, clearTypingDoc]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!message.trim() || typeof onSend !== 'function') return;

    // Clear typing indicator immediately on send
    cancelAll();

    onSend(message);
    setMessage('');
  }, [message, onSend, cancelAll]);

  return (
    <Box component="form" onSubmit={handleSubmit} className="message-form">
      <TextField
        className="message-input"
        variant="outlined"
        placeholder="Type a message..."
        value={message}
        onChange={handleChange}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                type="submit"
                disabled={!message.trim()}
                color="primary"
              >
                <SendIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default MessageInput;
