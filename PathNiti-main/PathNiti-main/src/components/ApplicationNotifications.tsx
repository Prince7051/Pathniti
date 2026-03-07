"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Notification } from "@/lib/supabase/types";

interface ApplicationNotificationsProps {
  userId: string;
}

export function ApplicationNotifications({
  userId,
}: ApplicationNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/student/notifications?userId=${userId}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();

      if (result.success) {
        setNotifications(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch notifications",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);

      const response = await fetch(
        `/api/student/notifications/${notificationId}/read`,
        {
          method: "PUT",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "admission_deadline":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "scholarship":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "exam_reminder":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "admission_deadline":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Deadline
          </Badge>
        );
      case "scholarship":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Scholarship
          </Badge>
        );
      case "exam_reminder":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Exam
          </Badge>
        );
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>Stay updated on your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">
              Loading notifications...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
          </CardTitle>
          <CardDescription>Stay updated on your applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">No notifications yet</p>
            <p className="text-xs text-gray-400">
              You&apos;ll receive updates about your applications here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Stay updated on your applications and important deadlines
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500 mb-2">No notifications yet</p>
            <p className="text-xs text-gray-400">
              You&apos;ll receive updates about your applications here
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border rounded-lg p-3 transition-all ${
                  notification.is_read
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getNotificationIcon(notification.type)}
                    <h4
                      className={`font-medium text-sm ${
                        notification.is_read ? "text-gray-700" : "text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    {getNotificationBadge(notification.type)}
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>

                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      disabled={markingAsRead === notification.id}
                      className="h-6 w-6 p-0"
                    >
                      {markingAsRead === notification.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>

                <p
                  className={`text-sm mb-2 ${
                    notification.is_read ? "text-gray-600" : "text-gray-800"
                  }`}
                >
                  {notification.message}
                </p>

                <p className="text-xs text-gray-500">
                  {formatDate(notification.sent_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
