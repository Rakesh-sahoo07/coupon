
import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <ThemeProvider defaultTheme="light">
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
