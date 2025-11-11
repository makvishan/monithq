import { Outfit, Fira_Code } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { SocketProvider } from "@/components/SocketProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import NotificationToast from "@/components/NotificationToast";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
});

export const metadata = {
  title: "MonitHQ - AI-Powered Website Monitoring & Uptime Tracking",
  description: "Monitor your websites 24/7 with AI-powered insights. Get instant alerts, track uptime, and resolve issues faster with intelligent summaries.",
  keywords: "website monitoring, uptime tracking, AI monitoring, site uptime, performance monitoring, incident management",
  authors: [{ name: "MonitHQ" }],
  openGraph: {
    title: "MonitHQ - AI-Powered Website Monitoring",
    description: "Monitor your websites 24/7 with AI-powered insights and instant alerts.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  const { SnackbarProvider } = require('@/components/ui/SnackbarProvider');
  return (
    <html lang="en" className={`${outfit.variable} ${firaCode.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <SidebarProvider>
            <SocketProvider>
              <SnackbarProvider>
                {children}
                <NotificationToast />
                <Toaster />
              </SnackbarProvider>
            </SocketProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
