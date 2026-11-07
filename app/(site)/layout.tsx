import "../components/desktop/desktop.css";
import { ClassicWindow } from "../components/classic-window";
import { pixel, term } from "../lib/desktop-fonts";

// Blog, projects and photos open as one long retro window.
// The homepage lives outside this group so it can be the desktop.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`classic ${pixel.variable} ${term.variable}`}>
      <ClassicWindow>{children}</ClassicWindow>
    </div>
  );
}
