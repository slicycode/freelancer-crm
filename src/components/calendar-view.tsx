"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarEvent } from "@/types";
import { ChevronLeft, ChevronRight, Clock, User, FolderOpen } from "lucide-react";
import { useState } from "react";

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Generate calendar days
  const calendarDays = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventsForDay = (day: number) => {
    const dayDate = new Date(year, month, day);
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === dayDate.toDateString();
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const isToday = (day: number) => {
    const dayDate = new Date(year, month, day);
    return dayDate.toDateString() === today.toDateString();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">
                  {monthNames[month]} {year}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 ${day ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'
                      } ${isToday(day || 0) ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                          }`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {getEventsForDay(day).slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className="text-xs p-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 truncate"
                              title={event.title}
                            >
                              {event.allDay ? event.title : `${formatTime(event.startTime)} ${event.title}`}
                            </div>
                          ))}
                          {getEventsForDay(day).length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              +{getEventsForDay(day).length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events
                  .filter(event => new Date(event.startTime) >= today)
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 10)
                  .map(event => (
                    <div key={event.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm truncate flex-1">{event.title}</h3>
                        {event.allDay && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            All Day
                          </Badge>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {event.allDay
                            ? new Date(event.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : `${new Date(event.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${formatTime(event.startTime)}`
                          }
                        </span>
                      </div>

                      {event.clientName && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <User className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.clientName}</span>
                        </div>
                      )}

                      {event.projectName && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <FolderOpen className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.projectName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                {events.filter(event => new Date(event.startTime) >= today).length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No upcoming events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 