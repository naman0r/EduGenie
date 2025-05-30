"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getGoogleCalendarEvents,
  createGoogleCalendarTestEvent,
  initiateGoogleCalendarAuth,
} from "@/services/calendar";
import { GoogleCalendarEvent, CreateEventData } from "@/types/calendar";

const CalendarPage: React.FC = () => {
  const { firebaseUser, isGoogleCalendarIntegrated } = useAuth();
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [createEventError, setCreateEventError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
  });

  useEffect(() => {
    const fetchEvents = async () => {
      if (!firebaseUser || !isGoogleCalendarIntegrated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const eventsData = await getGoogleCalendarEvents(firebaseUser.uid);
        setEvents(eventsData);
      } catch (err: any) {
        console.error("Failed to fetch calendar events:", err);
        setError(err.message || "Failed to fetch calendar events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [firebaseUser, isGoogleCalendarIntegrated]);

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getEventsForDate = (date: Date) => {
    const dateKey = formatDateKey(date);
    return events.filter((event) => {
      const eventDate = new Date(event.start);
      const eventDateKey = formatDateKey(eventDate);
      return eventDateKey === dateKey;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      );
    }

    return days;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;

    setIsCreatingEvent(true);
    setCreateEventError(null);

    try {
      // Combine date and time inputs
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

      const eventData: CreateEventData = {
        summary: formData.summary,
        description: formData.description,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
      };

      await createGoogleCalendarTestEvent(firebaseUser.uid, eventData);

      // Reset form and close modal
      setFormData({
        summary: "",
        description: "",
        start_date: "",
        start_time: "",
        end_date: "",
        end_time: "",
      });
      setShowAddForm(false);

      // Refresh events
      const eventsData = await getGoogleCalendarEvents(firebaseUser.uid);
      setEvents(eventsData);
    } catch (err: any) {
      console.error("Failed to create event:", err);
      setCreateEventError(err.message || "Failed to create calendar event");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleConnectCalendar = () => {
    if (firebaseUser) {
      initiateGoogleCalendarAuth(firebaseUser.uid);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex justify-center items-center pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center pt-20">
        <p className="text-xl mb-4">Please log in to view your calendar.</p>
      </div>
    );
  }

  if (!isGoogleCalendarIntegrated) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">
            Google Calendar Not Connected
          </h2>
          <p className="text-gray-300 mb-6">
            To view and manage your calendar events, please connect your Google
            Calendar account.
          </p>
          <button
            onClick={handleConnectCalendar}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg"
          >
            Connect Google Calendar
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black/[0.96] text-white flex flex-col justify-center items-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Error Loading Calendar
          </h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16 md:pt-35 md:pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition duration-200"
            >
              ←
            </button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {monthYear}
            </h2>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition duration-200"
            >
              →
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 shadow-lg"
        >
          + Add Event
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-gray-800/50 rounded-lg overflow-hidden shadow-lg">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-4 text-center font-semibold text-gray-300 bg-gray-800"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  className="h-32 border-r border-b border-gray-700 bg-gray-900/50"
                />
              );
            }

            const dayEvents = getEventsForDate(date);
            const isCurrentDay = isToday(date);

            return (
              <div
                key={date.toISOString()}
                className={`h-32 border-r border-b border-gray-700 p-2 relative overflow-hidden hover:bg-gray-700/50 transition-colors ${
                  isCurrentDay ? "bg-indigo-900/30" : "bg-gray-800/30"
                }`}
              >
                {/* Day number */}
                <div
                  className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? "text-indigo-300 font-bold" : "text-gray-300"
                  }`}
                >
                  {date.getDate()}
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={event.id}
                      className="text-xs p-1 bg-indigo-600/80 rounded text-white truncate cursor-pointer hover:bg-indigo-600 transition-colors"
                      title={event.summary}
                    >
                      {event.is_all_day ? (
                        event.summary
                      ) : (
                        <>
                          {new Date(event.start).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}{" "}
                          {event.summary}
                        </>
                      )}
                    </div>
                  ))}

                  {/* Show "more" indicator if there are additional events */}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4 text-white">Add New Event</h3>

            {createEventError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300 text-sm">
                {createEventError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setCreateEventError(null);
                    setFormData({
                      summary: "",
                      description: "",
                      start_date: "",
                      start_time: "",
                      end_date: "",
                      end_time: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEvent}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingEvent ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
