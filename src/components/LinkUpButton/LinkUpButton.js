import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import "./LinkUpButton.css"

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

    // Optimistic update — flip the button immediately
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
      // Revert optimistic update on failure
      setIsFollowing(!nowFollowing);
      setError('Failed to update follow status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleLinkUp} disabled={loading} className='linkup-btn'>
        {loading ? 'Processing...' : isFollowing ? 'Unlink' : 'Link Up'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LinkUpButton;