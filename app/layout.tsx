import type { Metadata } from "next";
import "./globals.css";
import AnalyticsWrapper from "./_lib/Analytics";
import WebVitals from "./_lib/WebVitals";

export const metadata: Metadata = {
  title: "Transit",
  description: "Real-time transit departures",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <AnalyticsWrapper />
        <WebVitals />
      </body>
    </html>
  );
}
