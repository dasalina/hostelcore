import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { EventForm } from "@/components/EventForm";
import { EventCard } from "@/components/EventCard";

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Event type matching backend model
interface Event {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  weblink: string;
  latitude?: number;
  longitude?: number;
  weather?: {
    temp_f: number;
    condition: string;
    humidity: number;
    wind_mph: number;
    chance_of_rain: number;
    chance_of_snow: number;
    icon_url?: string;
  };
}

export interface EventFormData {
  name: string;
  description: string;
  date: Date | undefined;
  start_time: string;
  end_time: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  weblink: string;
}

export function HostPanelPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    description: "",
    date: undefined,
    start_time: "",
    end_time: "",
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    weblink: ""
  });
  const [updatingWeatherId, setUpdatingWeatherId] = useState<string | null>(null);

  // Check authentication and fetch events on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Please log in to access the host panel");
      navigate("/login");
      return;
    }
    fetchEvents();
  }, [navigate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/hostpanel/`, {
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      if (response.status === 401) {
        toast.error("Session expired. Please log in again.");
        localStorage.removeItem("authToken");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch events");

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      toast.error("Failed to load events");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      date: undefined,
      start_time: "",
      end_time: "",
      street_address: "",
      city: "",
      state: "",
      zip_code: "",
      weblink: ""
    });
  };

  const handleCreateEvent = async (validatedData: EventFormData) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/hostpanel/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: validatedData.name,
          description: validatedData.description,
          date: `${validatedData.date!.getFullYear()}-${String(validatedData.date!.getMonth() + 1).padStart(2, '0')}-${String(validatedData.date!.getDate()).padStart(2, '0')}`,
          start_time: validatedData.start_time,
          end_time: validatedData.end_time,
          street_address: validatedData.street_address,
          city: validatedData.city,
          state: validatedData.state,
          zip_code: validatedData.zip_code,
          weblink: validatedData.weblink
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to create event");
      }

      const result = await response.json();

      // Add the new event to the list
      if (result.event) {
        setEvents([...events, result.event]);
      }

      toast.success(result.message || "Event created successfully!");
      setIsCreateDialogOpen(false);
      resetForm();

      // Refresh to get updated data with coordinates
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
      throw error;
    }
  };

  const handleEditEvent = async (validatedData: EventFormData) => {
    if (!editingEvent) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/hostpanel/${editingEvent.id}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: validatedData.name,
          description: validatedData.description,
          date: `${validatedData.date!.getFullYear()}-${String(validatedData.date!.getMonth() + 1).padStart(2, '0')}-${String(validatedData.date!.getDate()).padStart(2, '0')}`,
          start_time: validatedData.start_time,
          end_time: validatedData.end_time,
          street_address: validatedData.street_address,
          city: validatedData.city,
          state: validatedData.state,
          zip_code: validatedData.zip_code,
          weblink: validatedData.weblink
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to update event");
      }

      const result = await response.json();

      toast.success(result.message || "Event updated successfully!");
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      resetForm();

      // Refresh events
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to update event");
      throw error;
    }
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/hostpanel/${deleteEventId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      if (!response.ok) throw new Error("Failed to delete event");

      setEvents(prevEvents => prevEvents.filter(e => e.id !== deleteEventId));
      const result = await response.json();
      toast.success(result.message || "Event deleted successfully");
      setDeleteEventId(null);
    } catch (error) {
      toast.error("Failed to delete event");
      console.error(error);
    }
  };

  const handleUpdateWeather = async (eventId: string) => {
    setUpdatingWeatherId(eventId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/hostpanel/${eventId}/update_weather/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update weather");
      }

      const result = await response.json();

      // Update the event with new weather data
      setEvents(events.map(e =>
        e.id === eventId ? { ...e, weather: result.weather } : e
      ));

      toast.success(result.message || "Weather updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update weather");
      console.error(error);
    } finally {
      setUpdatingWeatherId(null);
    }
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    // Parse date without timezone conversion
    const [year, month, day] = event.date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    setFormData({
      name: event.name,
      description: event.description,
      date: localDate,
      start_time: event.start_time,
      end_time: event.end_time,
      street_address: event.street_address,
      city: event.city,
      state: event.state,
      zip_code: event.zip_code,
      weblink: event.weblink
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-2">Host Panel</h1>
            <p className="text-gray-600">Manage your events and monitor weather conditions</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto"
              onPointerDownOutside={(e) => {
                // Prevent dialog from closing when clicking MUI date picker
                const target = e.target as HTMLElement;
                if (target.closest('.MuiPickersPopper-root') || target.closest('.MuiDialog-root')) {
                  e.preventDefault();
                }
              }}
            >
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create a new event. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <EventForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateEvent}
                submitText="Create Event"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-gray-100 p-4">
                  <CalendarIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="mb-2">No events yet</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first event</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={openEditDialog}
                onDelete={setDeleteEventId}
                onUpdateWeather={handleUpdateWeather}
                isUpdatingWeather={updatingWeatherId === event.id}
              />
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingEvent(null);
            resetForm();
          }
        }}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => {
              // Prevent dialog from closing when clicking MUI date picker
              const target = e.target as HTMLElement;
              if (target.closest('.MuiPickersPopper-root') || target.closest('.MuiDialog-root')) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update the event details below. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <EventForm 
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEditEvent}
              submitText="Save Changes"
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Delete '{events.find(e => e.id === deleteEventId)?.name}'? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="!text-white">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default HostPanelPage;