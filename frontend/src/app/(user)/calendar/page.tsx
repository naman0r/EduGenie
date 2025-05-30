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

  const formatEventDate = (dateString: string, isAllDay: boolean): string => {
    const date = new Date(dateString);

    if (isAllDay) {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEventTimeColor = (startString: string): string => {
    const eventDate = new Date(startString);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours < 0) {
      return "text-gray-500"; // Past event
    } else if (diffHours <= 2) {
      return "text-red-400"; // Very soon
    } else if (diffHours <= 24) {
      return "text-orange-400"; // Today
    } else if (diffHours <= 168) {
      // 7 days
      return "text-yellow-400"; // This week
    } else {
      return "text-green-400"; // Later
    }
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

  return (
    <div className="min-h-screen bg-black/[0.96] text-white pt-20 px-4 md:px-8 lg:px-16  md:pt-35">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Calendar</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {events.length} upcoming events
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 shadow-lg"
          >
            + Add Event
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-10 px-6 bg-gray-800/40 rounded-lg shadow-md">
          <h2 className="text-xl text-gray-300 mb-4">
            No upcoming events found.
          </h2>
          <p className="text-gray-400 mb-6">
            Your calendar is empty. Create your first event to get started!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200 shadow-lg text-lg font-semibold"
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-800/70 p-6 rounded-lg shadow-lg border border-gray-700 hover:shadow-indigo-500/20 hover:border-indigo-600/50 transition-all duration-300"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="flex-1 mb-4 md:mb-0 md:mr-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {event.summary}
                  </h3>

                  {event.description && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                      {event.description}
                    </p>
                  )}

                  {event.location && (
                    <p className="text-sm text-indigo-300 mb-2">
                      📍 {event.location}
                    </p>
                  )}

                  {event.attendees && event.attendees.length > 0 && (
                    <div className="text-sm text-gray-400 mb-2">
                      👥 {event.attendees.length} attendee
                      {event.attendees.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end space-y-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${getEventTimeColor(
                        event.start
                      )}`}
                    >
                      {formatEventDate(event.start, event.is_all_day)}
                    </p>
                    {!event.is_all_day && (
                      <p className="text-xs text-gray-500">
                        to {formatEventDate(event.end, event.is_all_day)}
                      </p>
                    )}
                    {event.is_all_day && (
                      <p className="text-xs text-gray-500">All day event</p>
                    )}
                  </div>

                  <a
                    href={event.html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition duration-200 shadow-md"
                  >
                    View in Google Calendar
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
