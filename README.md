Sociable
A full-stack social networking web application built with React and Firebase. Sociable lets users connect, share posts, follow each other, and message in real time — built to production standards with security, performance, and scalability in mind.
Live demo: farouk-afolabi.github.io/Sociable

Features

Authentication — Email and password sign up / sign in via Firebase Auth
Post feed — Create, like, and comment on posts with paginated infinite scroll
User profiles — Profile photos, bio, follower and following counts
Follow system — Follow and unfollow other users; personalised feed based on who you follow
Real-time messenger — One-to-one chat powered by Firestore real-time listeners
User search — Find and discover other users on the platform
Dark mode — Full light/dark theme with user preference saved to localStorage
Responsive design — Mobile-first layout that works across all screen sizes


Tech Stack
LayerTechnologyFrontendReact 19, React Router v7UIMaterial UI v7, EmotionBackendFirebase Firestore (NoSQL)AuthenticationFirebase AuthHostingGitHub PagesBuild toolVitePackage managernpm

Architecture Highlights

Firestore security rules — Per-user access controls on all collections. Users can only read/write their own data. Chat messages restricted to conversation participants only.
Paginated queries — All feed queries use limit(20) with startAfter() cursor-based pagination. No unbounded collection reads.
Batched Firestore reads — N+1 query problem eliminated. Author profiles fetched in a single batched getDocs call instead of one request per post.
Code splitting — All route components lazy-loaded with React.lazy and Suspense. Vendor chunks split across React, Firebase, and MUI bundles for optimal load times.
Error boundaries — App-level error boundary prevents full crashes. Users see a graceful fallback UI instead of a blank screen.
Performance — React.memo on list items, useCallback on all handlers, and a useRef user data cache prevent unnecessary re-renders.


Getting Started
Prerequisites

Node.js 18+
A Firebase project with Firestore and Authentication enabled

Installation
bashgit clone https://github.com/farouk-afolabi/Sociable.git
cd Sociable
npm install
Environment Variables
Create a .env file in the project root with your Firebase config:
envVITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
Run locally
bashnpm start
Opens at http://localhost:5173
Build and deploy
bashnpm run deploy
Builds the app and pushes to the gh-pages branch automatically.

Project Structure
src/
├── components/
│   ├── Home/           # Main feed layout
│   ├── Login/          # Authentication screens
│   ├── Register/       # User registration
│   ├── Profile/        # User profile page
│   ├── PostFeed/       # Feed with paginated posts
│   ├── Sidebar/        # Navigation and search
│   ├── Sidebarfeeds/   # Followers, following, suggestions
│   ├── messenger/      # Real-time chat
│   └── postdetail/     # Individual post view with comments
├── context/
│   ├── AuthContext.js  # Firebase auth state
│   └── ThemeContext.js # Light/dark mode state
├── firebase.js         # Firebase initialisation
└── main.jsx            # App entry point

Security

Firestore security rules enforce authentication on all read/write operations
Users cannot modify other users' posts, profiles, or messages
Chat access restricted to conversation participants only
Environment variables never committed to version control


Roadmap

 Image uploads for posts via Firebase Storage
 Push notifications for likes, comments, and messages
 Stories feature (24-hour disappearing content)
 Post bookmarking and collections
 Hashtag support and trending topics
 Video post support
 Read receipts in messenger
 Group chats


Author
Farouk Afolabi
Web Developer | IT Support Professional | London, ON
Portfolio · LinkedIn · GitHub

License
MIT