import { ReactNode } from "react";

export function Layout({
  menu,
  children,
}: {
  menu?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex min-h-20 border-b bg-background/80 backdrop-blur">
        <nav className="container w-full justify-between flex flex-row items-center gap-6">
          <div className="flex items-center gap-6 md:gap-10">
            <a href="/">
              <h1 className="text-base font-semibold">Family Scrum V3</h1>
            </a>
            <div className="flex items-center gap-4 text-sm"></div>
          </div>
          {menu}
        </nav>
      </header>
      <main className="flex grow flex-col overflow-y-auto mb-6">
        {children}
      </main>
      <footer className="border-t hidden sm:block">
        <div className="container py-4 text-sm leading-loose"></div>
      </footer>
    </div>
  );
}
