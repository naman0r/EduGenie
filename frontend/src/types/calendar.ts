export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  html_link: string;
  location: string;
  creator: {
    email?: string;
    displayName?: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  is_all_day: boolean;
}

export interface CreateEventData {
  summary: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
}
