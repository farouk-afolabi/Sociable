import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { FaStore, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./Followers.css";

const Followers = () => {
  const [followers, setFollowers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [followersDetails, setFollowersDetails] = useState([]);

  useEffect(() => {
    const authorization = getAuth();
    const userId = authorization.currentUser ? authorization.currentUser.uid : null;

    if (!userId) return setErrorMessage("No user is logged in!");

    const userRef = doc(db, "users", userId);

    const fetchUserData = async () => {
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData.followers && Array.isArray(userData.followers)) {
          setFollowers(userData.followers);
          fetchFollowersDetails(userData.followers);
        } else {
          setFollowers([]);
          setErrorMessage("No followers found.");
        }
      } else {
        setErrorMessage("No such document!");
      }
    };

    const fetchFollowersDetails = async (followersList) => {
      const followersData = [];

      for (const userId of followersList) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          const profileImage =
            userData.profilePic && userData.profilePic !== ""
              ? userData.profilePic
              : "profilePic.png";

          const fullName = (
            <div className="follower-info">
              <img
                src={profileImage}
                alt={`${userData.firstName || "User"}'s profile`}
                className="profile-img"
              />
              <div className="name-text">
                {userData.firstName && userData.lastName
                  ? `${userData.firstName} ${userData.lastName}`
                  : userData.businessName || "Unknown"}
              </div>
              {userData.firstName && userData.lastName ? <FaUser /> : <FaStore />}
            </div>
          );

          followersData.push({ userId, fullName });
        }
      }

      setFollowersDetails(followersData);
    };

    fetchUserData();
  }, []); // Run once on mount

  return (
    <div>
      {errorMessage && <p>{errorMessage}</p>}
      <div className="followers-list">
        {followersDetails.length > 0 ? (
          followersDetails.map((follower) => (
            <div key={follower.userId} className="follower-item">
              <Link to={`/profile/${follower.userId}`}>{follower.fullName}</Link>
            </div>
          ))
        ) : (
          <p className="noFollowers">No followers to display</p>
        )}
      </div>
    </div>
  );
};

export default Followers;
