import type { JSX } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "@/shared/ui/BottomNav";
import { TopNav } from "@/shared/ui/TopNav";
import { SkipLink } from "@/shared/ui/SkipLink";
import { Footer } from "@/shared/ui/Footer";
import { PlayerProvider } from "@/shared/player/PlayerContext";
import { NowPlayingBar } from "@/shared/player/NowPlayingBar";

export function RootLayout(): JSX.Element {
  return (
    <PlayerProvider>
      <div className="min-h-dvh bg-bg-base text-text-primary">
        <SkipLink />
        <TopNav />
        <main id="main-content">
          {/* Every page's content shares this max-width with TopNav's inner
              container, so headings/cards/buttons line up under the logo and
              the nav links instead of stretching edge-to-edge on wide screens. */}
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
        {/* The bottom-nav clearance moves here since Footer, not main, is
            now the last thing in normal flow — otherwise the fixed
            BottomNav would cover it on mobile. */}
        <div className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          <Footer />
        </div>
        <NowPlayingBar />
        <BottomNav />
      </div>
    </PlayerProvider>
  );
}
