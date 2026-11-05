import { Navbar } from "../components/nav";
import Footer from "../components/footer";

// Classic, quiet reading layout for blog / projects / photos.
// The homepage lives outside this group so it can go full-bleed.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center mx-auto mt-2 lg:mt-8 mb-12">
      <main className="flex-auto min-w-0 mt-2 md:mt-6 flex flex-col px-6 sm:px-4 md:px-0 max-w-[624px] w-full">
        <Navbar />
        {children}
        <Footer />
      </main>
    </div>
  );
}
