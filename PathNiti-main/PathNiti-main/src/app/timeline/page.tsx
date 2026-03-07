"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import {
  GraduationCap,
  Calendar,
  ArrowLeft,
  Clock,
  CheckCircle,
  BookOpen,
  Award,
  MapPin,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { PathNitiLogo } from "@/components/PathNitiLogo";
import { DynamicHeader } from "@/components/DynamicHeader";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  type: "deadline" | "exam" | "admission" | "scholarship" | "result";
  status: "upcoming" | "ongoing" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  category: string;
  location?: string;
  website?: string;
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Helper function to map database deadline_type to timeline event type
  const mapDeadlineTypeToEventType = (deadlineType: string): "deadline" | "exam" | "admission" | "scholarship" | "result" => {
    switch (deadlineType.toLowerCase()) {
      case 'application':
        return 'deadline';
      case 'exam':
        return 'exam';
      case 'result':
        return 'result';
      case 'counseling':
        return 'admission';
      default:
        return 'deadline';
    }
  };

  // Helper function to determine priority based on deadline type and stream
  const determinePriority = (deadlineType: string, stream: string | null): "high" | "medium" | "low" => {
    // High priority for major exams and results
    if (deadlineType === 'exam' || deadlineType === 'result') {
      return 'high';
    }
    
    // High priority for engineering and medical streams
    if (stream === 'engineering' || stream === 'medical') {
      return 'high';
    }
    
    // Medium priority for other streams
    if (stream === 'science' || stream === 'commerce') {
      return 'medium';
    }
    
    // Default to medium priority
    return 'medium';
  };

  // Helper function to calculate event status based on current date
  const calculateEventStatus = (eventDate: string, eventType: string): "upcoming" | "ongoing" | "completed" | "overdue" => {
    const today = new Date();
    const eventDateTime = new Date(eventDate);
    
    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    eventDateTime.setHours(0, 0, 0, 0);
    
    const timeDiff = eventDateTime.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
      // Past date
      if (eventType === "result" || eventType === "exam") {
        return "completed";
      } else {
        return "overdue";
      }
    } else if (daysDiff === 0) {
      // Today
      return "ongoing";
    } else if (daysDiff <= 7) {
      // Within a week
      return "upcoming";
    } else {
      // More than a week away
      return "upcoming";
    }
  };

  const fetchTimelineEvents = useCallback(async () => {
    try {
      // Fetch events from database API
      const response = await fetch('/api/timeline?limit=50');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timeline events: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Transform database events to TimelineEvent format
      const dbEvents: TimelineEvent[] = data.events.map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        date: event.deadline_date,
        type: mapDeadlineTypeToEventType(event.deadline_type),
        status: calculateEventStatus(event.deadline_date, mapDeadlineTypeToEventType(event.deadline_type)),
        priority: determinePriority(event.deadline_type, event.stream),
        category: event.stream || 'General',
        website: null, // Not available in current schema
      }));
      
      // If no database events, fall back to sample data
      if (dbEvents.length === 0) {
        console.log("No database events found, using sample data");
        const sampleEvents: TimelineEvent[] = [
        {
          id: "1",
          title: "JEE Main 2024 Registration",
          description: "Registration for JEE Main 2024 examination begins",
          date: "2024-12-15",
          type: "exam",
          status: calculateEventStatus("2024-12-15", "exam"),
          priority: "high",
          category: "Engineering",
          website: "https://jeemain.nta.ac.in",
        },
        {
          id: "2",
          title: "NEET 2024 Application Deadline",
          description: "Last date to submit NEET 2024 application forms",
          date: "2024-01-15",
          type: "deadline",
          status: calculateEventStatus("2024-01-15", "deadline"),
          priority: "high",
          category: "Medical",
          website: "https://neet.nta.nic.in",
        },
        {
          id: "3",
          title: "CUET 2024 Registration",
          description: "Common University Entrance Test registration opens",
          date: "2024-02-01",
          type: "exam",
          status: calculateEventStatus("2024-02-01", "exam"),
          priority: "high",
          category: "General",
          website: "https://cuet.samarth.ac.in",
        },
        {
          id: "4",
          title: "Delhi University Admissions",
          description: "Delhi University undergraduate admissions begin",
          date: "2024-05-15",
          type: "admission",
          status: calculateEventStatus("2024-05-15", "admission"),
          priority: "medium",
          category: "General",
          location: "New Delhi",
        },
        {
          id: "5",
          title: "National Merit Scholarship Application",
          description: "Apply for National Merit Scholarship Scheme",
          date: "2024-03-15",
          type: "scholarship",
          status: calculateEventStatus("2024-03-15", "scholarship"),
          priority: "medium",
          category: "Scholarship",
          website: "https://scholarships.gov.in",
        },
        {
          id: "6",
          title: "IIT JEE Advanced 2024",
          description: "JEE Advanced examination for IIT admissions",
          date: "2024-06-02",
          type: "exam",
          status: calculateEventStatus("2024-06-02", "exam"),
          priority: "high",
          category: "Engineering",
          website: "https://jeeadv.ac.in",
        },
        {
          id: "7",
          title: "AIIMS MBBS Entrance Exam",
          description: "All India Institute of Medical Sciences entrance exam",
          date: "2024-05-26",
          type: "exam",
          status: calculateEventStatus("2024-05-26", "exam"),
          priority: "high",
          category: "Medical",
          website: "https://aiimsexams.ac.in",
        },
        {
          id: "8",
          title: "NIT Admissions Counseling",
          description: "National Institute of Technology counseling begins",
          date: "2024-07-01",
          type: "admission",
          status: calculateEventStatus("2024-07-01", "admission"),
          priority: "medium",
          category: "Engineering",
        },
        {
          id: "9",
          title: "Post Matric Scholarship Deadline",
          description:
            "Last date for SC/ST Post Matric Scholarship applications",
          date: "2024-04-30",
          type: "scholarship",
          status: calculateEventStatus("2024-04-30", "scholarship"),
          priority: "medium",
          category: "Scholarship",
          website: "https://scholarships.gov.in",
        },
        {
          id: "10",
          title: "Class 12 Board Results",
          description: "CBSE Class 12 board examination results declaration",
          date: "2024-05-13",
          type: "result",
          status: calculateEventStatus("2024-05-13", "result"),
          priority: "high",
          category: "General",
          website: "https://cbse.gov.in",
        },
        ];
        
        setEvents(sampleEvents);
      } else {
        // Use database events
        setEvents(dbEvents);
      }
    } catch (error) {
      console.error("Error fetching timeline events:", error);
      
      // Fall back to sample data on error
      console.log("Falling back to sample data due to error");
      const sampleEvents: TimelineEvent[] = [
        {
          id: "1",
          title: "JEE Main 2024 Registration",
          description: "Registration for JEE Main 2024 examination begins",
          date: "2024-12-15",
          type: "exam",
          status: calculateEventStatus("2024-12-15", "exam"),
          priority: "high",
          category: "Engineering",
          website: "https://jeemain.nta.ac.in",
        },
        {
          id: "2",
          title: "NEET 2024 Application Deadline",
          description: "Last date to submit NEET 2024 application forms",
          date: "2024-01-15",
          type: "deadline",
          status: calculateEventStatus("2024-01-15", "deadline"),
          priority: "high",
          category: "Medical",
          website: "https://neet.nta.nic.in",
        },
        {
          id: "3",
          title: "CUET 2024 Registration",
          description: "Common University Entrance Test registration opens",
          date: "2024-02-01",
          type: "exam",
          status: calculateEventStatus("2024-02-01", "exam"),
          priority: "high",
          category: "General",
          website: "https://cuet.samarth.ac.in",
        },
        {
          id: "4",
          title: "Delhi University Admissions",
          description: "Delhi University undergraduate admissions begin",
          date: "2024-05-15",
          type: "admission",
          status: calculateEventStatus("2024-05-15", "admission"),
          priority: "medium",
          category: "General",
          location: "New Delhi",
        },
        {
          id: "5",
          title: "National Merit Scholarship Application",
          description: "Apply for National Merit Scholarship Scheme",
          date: "2024-03-15",
          type: "scholarship",
          status: calculateEventStatus("2024-03-15", "scholarship"),
          priority: "medium",
          category: "Scholarship",
          website: "https://scholarships.gov.in",
        },
        {
          id: "6",
          title: "IIT JEE Advanced 2024",
          description: "JEE Advanced examination for IIT admissions",
          date: "2024-06-02",
          type: "exam",
          status: calculateEventStatus("2024-06-02", "exam"),
          priority: "high",
          category: "Engineering",
          website: "https://jeeadv.ac.in",
        },
        {
          id: "7",
          title: "AIIMS MBBS Entrance Exam",
          description: "All India Institute of Medical Sciences entrance exam",
          date: "2024-05-26",
          type: "exam",
          status: calculateEventStatus("2024-05-26", "exam"),
          priority: "high",
          category: "Medical",
          website: "https://aiimsexams.ac.in",
        },
        {
          id: "8",
          title: "NIT Admissions Counseling",
          description: "National Institute of Technology counseling begins",
          date: "2024-07-01",
          type: "admission",
          status: calculateEventStatus("2024-07-01", "admission"),
          priority: "medium",
          category: "Engineering",
        },
        {
          id: "9",
          title: "Post Matric Scholarship Deadline",
          description:
            "Last date for SC/ST Post Matric Scholarship applications",
          date: "2024-04-30",
          type: "scholarship",
          status: calculateEventStatus("2024-04-30", "scholarship"),
          priority: "medium",
          category: "Scholarship",
          website: "https://scholarships.gov.in",
        },
        {
          id: "10",
          title: "Class 12 Board Results",
          description: "CBSE Class 12 board examination results declaration",
          date: "2024-05-13",
          type: "result",
          status: calculateEventStatus("2024-05-13", "result"),
          priority: "high",
          category: "General",
          website: "https://cbse.gov.in",
        },
      ];
      
      setEvents(sampleEvents);
    }
  }, []);

  const filterEvents = useCallback(() => {
    let filtered = events;

    if (selectedType) {
      filtered = filtered.filter((event) => event.type === selectedType);
    }

    if (selectedStatus) {
      filtered = filtered.filter((event) => event.status === selectedStatus);
    }

    // Sort by date
    filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    setFilteredEvents(filtered);
  }, [events, selectedType, selectedStatus]);

  useEffect(() => {
    fetchTimelineEvents();
  }, [fetchTimelineEvents]);

  useEffect(() => {
    filterEvents();
  }, [filterEvents]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "upcoming":
        return "default";
      case "ongoing":
        return "info";
      case "completed":
        return "success";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deadline":
        return Clock;
      case "exam":
        return BookOpen;
      case "admission":
        return GraduationCap;
      case "scholarship":
        return Award;
      case "result":
        return CheckCircle;
      default:
        return Calendar;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getDaysUntilEvent = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const types = Array.from(new Set(events.map((event) => event.type)));
  const statuses = Array.from(new Set(events.map((event) => event.status)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <DynamicHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Academic Timeline Tracker
          </h1>
          <p className="text-gray-600">
            Never miss important deadlines, exams, and admission dates. Stay on
            top of your academic journey.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedType("");
                  setSelectedStatus("");
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>

        {/* Timeline Events */}
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const Icon = getTypeIcon(event.type);
            const daysUntil = getDaysUntilEvent(event.date);

            return (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          event.status === "overdue"
                            ? "bg-red-100"
                            : event.status === "upcoming"
                              ? "bg-blue-100"
                              : event.status === "ongoing"
                                ? "bg-yellow-100"
                                : "bg-green-100"
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 ${
                            event.status === "overdue"
                              ? "text-red-600"
                              : event.status === "upcoming"
                                ? "text-blue-600"
                                : event.status === "ongoing"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {event.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {event.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.date).toLocaleDateString(
                                "en-IN",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </div>

                            {event.location && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location}
                              </div>
                            )}

                            <div
                              className={`font-medium ${getPriorityColor(event.priority)}`}
                            >
                              {event.priority.toUpperCase()} Priority
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={getStatusBadgeVariant(event.status)}
                            >
                              {event.status.charAt(0).toUpperCase() +
                                event.status.slice(1)}
                            </Badge>

                            <Badge variant="outline">{event.category}</Badge>

                            {daysUntil >= 0 && (
                              <Badge
                                variant={
                                  daysUntil <= 7 ? "destructive" : "secondary"
                                }
                              >
                                {daysUntil === 0
                                  ? "Today"
                                  : daysUntil === 1
                                    ? "Tomorrow"
                                    : `${daysUntil} days left`}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {event.website && (
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={event.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Visit
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
