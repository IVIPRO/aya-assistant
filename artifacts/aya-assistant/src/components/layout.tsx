import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { 
  Home, 
  Smile, 
  BookOpen, 
  CalendarHeart, 
  HeartHandshake, 
  Users,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children, isJunior = false }: { children: ReactNode, isJunior?: boolean }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: Home, color: "text-foreground" },
    { href: "/junior",    label: t.nav.junior,    icon: Smile,        color: "text-junior" },
    { href: "/student",   label: t.nav.student,   icon: BookOpen,     color: "text-student" },
    { href: "/family",    label: t.nav.family,    icon: CalendarHeart, color: "text-family" },
    { href: "/psychology",label: t.nav.psychology, icon: HeartHandshake, color: "text-psychology" },
  ];

  if (user?.role === "parent") {
    navItems.push({ href: "/parent", label: t.nav.parent, icon: Users, color: "text-primary" });
  }

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row w-full", isJunior ? "junior-mode" : "")}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border/50 shadow-xl shadow-black/5 z-20 relative">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold text-xl">
              A
            </div>
            <span className="font-display font-bold text-2xl text-foreground tracking-tight">AYA</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-foreground/5 text-foreground font-semibold shadow-sm" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("w-5 h-5 relative z-10", isActive ? item.color : "group-hover:scale-110 transition-transform")} />
                  <span className="relative z-10">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <div className="bg-muted/30 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role === "parent" ? t.nav.parent : (user?.role ?? "")}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t.nav.signOut}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-h-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 px-2 pb-safe pt-2">
        <div className="flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex-1 flex justify-center p-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive ? "bg-primary/10" : "hover:bg-muted"
                  )}>
                    <Icon className={cn("w-6 h-6", isActive ? item.color : "text-muted-foreground")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
