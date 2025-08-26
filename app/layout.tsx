import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/material-theme.css";
import Script from "next/script";
import { ThemeProvider } from "./contexts/ThemeContext";

export const metadata: Metadata = {
  title: "日本語文章解析器 - AI驱动",
  description: "AI驱动・深入理解日语句子结构与词义",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预连接字体CDN以提高加载速度 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* CJK优化字体 - Noto Sans CJK SC */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+CJK+SC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        
        {/* 日文字体支持 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Material Design Roboto字体作为后备 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Icons */}
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        {/* 主题初始化脚本 - 防止闪烁 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            function getThemePreference() {
              if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                return localStorage.getItem('theme');
              }
              return 'system';
            }
            
            function getActualTheme(theme) {
              if (theme === 'system') {
                return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              }
              return theme;
            }
            
            const theme = getThemePreference();
            const actualTheme = getActualTheme(theme);
            document.documentElement.classList.add(actualTheme);
          })();
        `}} />
        {/* Safari浏览器检测脚本 - 仅添加CSS类，不修改样式 */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (isSafari) {
              document.documentElement.classList.add('safari');
            }
          })();
        `}} />
      </head>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 transition-colors duration-200" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/js/all.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
