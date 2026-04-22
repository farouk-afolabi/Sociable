import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';

function LinkUpButton({ targetUserId }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || !targetUserId) return;

    const checkIfFollowing = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) {
          const following = snap.data().following || [];
          setIsFollowing(following.includes(targetUserId));
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };

    checkIfFollowing();
  }, [targetUserId]);

  const handleLinkUp = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const nowFollowing = !isFollowing;
    setIsFollowing(nowFollowing);
    setLoading(true);
    setError('');

    try {
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const targetUserRef  = doc(db, 'users', targetUserId);

      if (nowFollowing) {
        await updateDoc(currentUserRef, { following: arrayUnion(targetUserId) });
        await updateDoc(targetUserRef,  { followers: arrayUnion(currentUser.uid) });
      } else {
        await updateDoc(currentUserRef, { following: arrayRemove(targetUserId) });
        await updateDoc(targetUserRef,  { followers: arrayRemove(currentUser.uid) });
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
      setIsFollowing(!nowFollowing);
      setError('Failed to update follow status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleLinkUp}
        disabled={loading}
        variant={isFollowing ? 'outlined' : 'contained'}
        color={isFollowing ? 'error' : 'primary'}
        size="small"
        startIcon={
          loading
            ? <CircularProgress size={14} color="inherit" />
            : isFollowing
              ? <PersonRemoveRoundedIcon fontSize="small" />
              : <PersonAddRoundedIcon fontSize="small" />
        }
        sx={{
          borderRadius: 5,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 13,
          px: 2,
          py: 0.75,
          minWidth: 110,
          transition: 'all 0.2s ease',
        }}
      >
        {loading ? 'Saving…' : isFollowing ? 'Unlink' : 'Link Up'}
      </Button>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default LinkUpButton;