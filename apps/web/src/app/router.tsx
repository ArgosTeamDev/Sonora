import { createHashRouter } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { FeedPage } from "@/pages/FeedPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { AlbumDetailPage } from "@/pages/AlbumDetailPage";
import { ArtistPage } from "@/pages/ArtistPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ReviewPage } from "@/pages/ReviewPage";
import { MyReviewsPage } from "@/pages/MyReviewsPage";
import { PeoplePage } from "@/pages/PeoplePage";
import { LoginPage } from "@/pages/LoginPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "albums/:id", element: <AlbumDetailPage /> },
      { path: "artists/:slug", element: <ArtistPage /> },
      { path: "u/:username", element: <ProfilePage /> },
      { path: "reviews/:id", element: <ReviewPage /> },
      { path: "my-reviews", element: <MyReviewsPage /> },
      { path: "people", element: <PeoplePage /> },
      { path: "login", element: <LoginPage /> },
    ],
  },
]);
