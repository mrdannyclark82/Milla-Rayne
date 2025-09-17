import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface CalendarAppProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "reminder" | "task" | "appointment";
}

export default function CalendarApp({ isOpen, onClose }: CalendarAppProps) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [events] = useState<CalendarEvent[]>([
    {
      id: "1",
      title: "Chat with user about AI topics",
      date: new Date(),
      type: "task"
    },
    {
      id: "2", 
      title: "Process memory consolidation",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      type: "reminder"
    },
    {
      id: "3",
      title: "Review conversation patterns",
      date: new Date(Date.now() + 48 * 60 * 60 * 1000),
      type: "task"
    }
  ]);

  const selectedDateEvents = events.filter(event => 
    selected && format(event.date, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd")
  );

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "reminder": return "bg-blue-500";
      case "task": return "bg-green-500";
      case "appointment": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>📅</span>
            <span>Calendar & Schedule</span>
            {selected && (
              <div className="ml-auto text-sm text-muted-foreground">
                {format(selected, "MMMM d, yyyy")}
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex gap-6">
          {/* Calendar */}
          <div className="flex-1">
            <div className="border rounded-lg p-4 bg-white/95 backdrop-blur-sm">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={setSelected}
                className="rounded-md"
                modifiers={{
                  hasEvents: events.map(e => e.date)
                }}
                modifiersStyles={{
                  hasEvents: { 
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.3)"
                  }
                }}
              />
            </div>
          </div>
          
          {/* Events for selected date */}
          <div className="w-80">
            <div className="border rounded-lg p-4 bg-white/95 backdrop-blur-sm h-full">
              <h3 className="font-semibold mb-4">
                {selected ? `Events for ${format(selected, "MMM d")}` : "Select a date"}
              </h3>
              
              {selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No events scheduled for this date.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)} mt-1`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.title}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {event.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Legend */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Event Types</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Reminders</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Tasks</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Appointments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}