"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { PathNitiLogo } from "@/components/PathNitiLogo";
import { Button } from "@/components/ui/button";
import {
  Home,
  BookOpen,
  GraduationCap,
  MapPin,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Bell,
  Search,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useScrollPosition } from "@/hooks/useOptimizedScroll";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

interface DynamicHeaderProps {
  showNavigation?: boolean;
  showUserActions?: boolean;
  className?: string;
}

export function DynamicHeader({
  showNavigation = true,
  showUserActions = true,
  className = "",
}: DynamicHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Use optimized scroll position tracking
  const scrollY = useScrollPosition();
  const isScrolled = scrollY > 10;

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`/api/student/notifications?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user?.id]);

  // Fetch notifications
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/student/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (response.ok) {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Check if click is outside the dropdown and user button
      if (showUserDropdown && !target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
      // Check if click is outside the notifications dropdown
      if (showNotifications && !target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown, showNotifications]);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        console.error("Error signing out:", error);
        return;
      }
      setShowUserDropdown(false);
      // Redirect to home page after successful sign out
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Single unified header that adapts to context
  return (
    <header
      className={`bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? "shadow-lg bg-white/98" : ""
      } ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link
              href="/"
              className="hover:opacity-80 transition-all duration-300 hover:scale-105"
            >
              <PathNitiLogo size="md" showText={true} variant="horizontal" />
            </Link>

            {showNavigation && (
              <nav className="hidden md:flex items-center space-x-1">
                <Link
                  href="/"
                  className="px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100/60 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium relative group"
                >
                  <Home className="w-4 h-4" />
{t('navigation.home')}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
                </Link>
                <Link
                  href="/comprehensive-assessment"
                  className="px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100/60 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium relative group"
                >
                  <BookOpen className="w-4 h-4" />
{t('navigation.assessment')}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
                </Link>
                <Link
                  href="/colleges"
                  className="px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100/60 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium relative group"
                >
                  <GraduationCap className="w-4 h-4" />
{t('navigation.colleges')}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
                </Link>
                <Link
                  href="/scholarships"
                  className="px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100/60 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium relative group"
                >
                  <MapPin className="w-4 h-4" />
{t('navigation.scholarships')}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
                </Link>
                <Link
                  href="/chat"
                  className="px-3 py-2 text-gray-600 hover:text-primary hover:bg-gray-100/60 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium relative group"
                >
                  <MessageCircle className="w-4 h-4" />
{t('navigation.ai_chat')}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
                </Link>
              </nav>
            )}
          </div>

          {/* Right side actions */}
          {showUserActions && (
            <div className="flex items-center space-x-3">
              {/* Language Selector */}
              <LanguageSelector variant="compact" className="hidden sm:flex" />

              {/* Search Button */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Search className="w-4 h-4" />
                <span className="hidden lg:inline">{t('common.search')}</span>
              </Button>

              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <div className="relative notifications-container">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="relative"
                      onClick={() => setShowNotifications(!showNotifications)}
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </Button>

                    {showNotifications && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{t('navigation.notifications')}</h3>
                            <div className="flex items-center space-x-2">
                              {unreadCount > 0 && (
                                <Button size="sm" variant="outline" onClick={markAllAsRead}>
                                  Mark all read
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowNotifications(false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              No notifications yet
                            </div>
                          ) : (
                            notifications.slice(0, 5).map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                                  !notification.is_read ? "bg-blue-50" : ""
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-2 h-2 rounded-full mt-2 ${
                                    !notification.is_read ? "bg-blue-500" : "bg-gray-300"
                                  }`}></div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {new Date(notification.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {notifications.length > 5 && (
                          <div className="p-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              asChild
                            >
                              <Link href="/dashboard">View all notifications</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Dropdown */}
                  <div className="relative user-dropdown-container">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center gap-2 hover:bg-gray-100/60"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {(profile?.first_name || profile?.last_name)?.charAt(0) ||
                          user.email?.charAt(0) ||
                          "U"}
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-gray-700">
                        {profile?.first_name && profile?.last_name 
                          ? `${profile.first_name} ${profile.last_name}` 
                          : profile?.first_name || profile?.last_name || "User"}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </Button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {profile?.first_name && profile?.last_name 
                              ? `${profile.first_name} ${profile.last_name}` 
                              : profile?.first_name || profile?.last_name || "User"}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <Link
                          href={
                            profile?.role === "admin"
                              ? "/dashboard/admin"
                              : profile?.role === "college"
                              ? "/dashboard/college"
                              : "/dashboard/student"
                          }
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <User className="w-4 h-4" />
{t('navigation.dashboard')}
                        </Link>

                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <Settings className="w-4 h-4" />
{t('navigation.settings')}
                        </Link>

                        <hr className="my-2" />

                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
{t('navigation.sign_out')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href="/auth/login"
                      className="flex items-center gap-2 font-medium"
                    >
{t('navigation.login')}
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                    asChild
                  >
                    <Link
                      href="/auth/signup"
                      className="flex items-center gap-2 font-medium"
                    >
{t('navigation.get_started')}
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && showNavigation && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-md animate-slide-in-from-top">
            <nav className="px-4 py-4 space-y-1">
              <Link
                href="/"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
{t('navigation.home')}
              </Link>
              <Link
                href="/comprehensive-assessment"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
{t('navigation.assessment')}
              </Link>
              <Link
                href="/colleges"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <GraduationCap className="w-5 h-5" />
{t('navigation.colleges')}
              </Link>
              <Link
                href="/scholarships"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MapPin className="w-5 h-5" />
{t('navigation.scholarships')}
              </Link>
              <Link
                href="/chat"
                className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageCircle className="w-5 h-5" />
{t('navigation.ai_chat')}
              </Link>

              {/* Language Selector for Mobile */}
              <div className="pt-4 mt-4 border-t border-gray-200/50">
                <LanguageSelector variant="button" className="px-4" />
              </div>

              {/* Mobile user actions */}
              {user ? (
                <div className="pt-4 mt-4 border-t border-gray-200/50 space-y-1">
                  <Link
                    href="/dashboard/student"
                    className="block px-4 py-3 text-gray-600 hover:text-primary hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
{t('navigation.dashboard')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 flex items-center gap-3 font-medium"
                  >
                    <LogOut className="w-5 h-5" />
{t('navigation.sign_out')}
                  </button>
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-gray-200/50 space-y-2">
                  <Link
                    href="/auth/login"
                    className="block px-4 py-3 text-center text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-all duration-200 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
{t('navigation.login')}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
{t('navigation.get_started')}
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

// Simple alias for easier usage
export function Header(props: DynamicHeaderProps) {
  return <DynamicHeader {...props} />;
}

export default DynamicHeader;
