import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Calendar, Clock, Save, Plus, Trash2 } from 'lucide-react';
import { doctorAPI } from '../services/api';

interface ScheduleDay {
  dayOfWeek: string;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface DoctorScheduleManagerProps {
  doctorId: string;
  onScheduleUpdate?: (schedule: ScheduleDay[]) => void;
}

const DoctorScheduleManager: React.FC<DoctorScheduleManagerProps> = ({ 
  doctorId, 
  onScheduleUpdate 
}) => {
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

  // Helper function to sort schedule by day order
  const sortScheduleByDay = (scheduleArray: ScheduleDay[]) => {
    return scheduleArray.sort((a, b) => {
      return daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek);
    });
  };

  useEffect(() => {
    loadSchedule();
  }, [doctorId]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Try to load existing schedule
      const response = await doctorAPI.getShiftSchedule(doctorId);
      
      if (response && response.length > 0) {
        // Sort the schedule by day order
        const sortedSchedule = sortScheduleByDay(response);
        setSchedule(sortedSchedule);
      } else {
        // Initialize with default schedule (all days active, 9-5)
        const defaultSchedule = daysOfWeek.map(day => ({
          dayOfWeek: day,
          isActive: day !== 'Saturday' && day !== 'Sunday', // Weekends off by default
          startTime: '09:00',
          endTime: '17:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00'
        }));
        setSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      // Initialize with default schedule
      const defaultSchedule = daysOfWeek.map(day => ({
        dayOfWeek: day,
        isActive: day !== 'Saturday' && day !== 'Sunday',
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      }));
      setSchedule(defaultSchedule);
    } finally {
      setLoading(false);
    }
  };

  const updateDaySchedule = (dayOfWeek: string, updates: Partial<ScheduleDay>) => {
    const updatedSchedule = schedule.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, ...updates }
        : day
    );
    setSchedule(sortScheduleByDay(updatedSchedule));
  };

  const saveSchedule = async () => {
    setSaving(true);
    setError('');
    
    try {
      // Validate schedule
      const hasActiveDays = schedule.some(day => day.isActive);
      if (!hasActiveDays) {
        setError('At least one day must be active');
        return;
      }

      // Save schedule using the correct shift schedule endpoint
      await doctorAPI.updateShiftSchedule(doctorId, schedule);
      
      if (onScheduleUpdate) {
        onScheduleUpdate(schedule);
      }
      
      alert('Schedule updated successfully!');
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      setError('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllDays = (isActive: boolean) => {
    const updatedSchedule = schedule.map(day => ({ ...day, isActive }));
    setSchedule(sortScheduleByDay(updatedSchedule));
  };

  const copyScheduleToAll = (sourceDay: string) => {
    const sourceSchedule = schedule.find(day => day.dayOfWeek === sourceDay);
    if (sourceSchedule) {
      const updatedSchedule = schedule.map(day => ({
        ...day,
        isActive: sourceSchedule.isActive,
        startTime: sourceSchedule.startTime,
        endTime: sourceSchedule.endTime,
        breakStartTime: sourceSchedule.breakStartTime,
        breakEndTime: sourceSchedule.breakEndTime
      }));
      setSchedule(sortScheduleByDay(updatedSchedule));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading schedule...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Weekly Schedule</span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleAllDays(true)}
          >
            Activate All
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => toggleAllDays(false)}
          >
            Deactivate All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {sortScheduleByDay(schedule).map((day) => (
          <div key={day.dayOfWeek} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={day.isActive}
                  onCheckedChange={(checked: boolean) => updateDaySchedule(day.dayOfWeek, { isActive: checked })}
                />
                <Label className="text-lg font-medium">{day.dayOfWeek}</Label>
                {day.isActive && (
                  <span className="text-sm text-green-600">Active</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyScheduleToAll(day.dayOfWeek)}
              >
                Copy to All
              </Button>
            </div>

            {day.isActive && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shift Start</Label>
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => updateDaySchedule(day.dayOfWeek, { startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shift End</Label>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateDaySchedule(day.dayOfWeek, { endTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break Start (Optional)</Label>
                  <Input
                    type="time"
                    value={day.breakStartTime || ''}
                    onChange={(e) => updateDaySchedule(day.dayOfWeek, { breakStartTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Break End (Optional)</Label>
                  <Input
                    type="time"
                    value={day.breakEndTime || ''}
                    onChange={(e) => updateDaySchedule(day.dayOfWeek, { breakEndTime: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            variant="outline" 
            onClick={loadSchedule}
            disabled={saving}
          >
            Reset
          </Button>
          <Button 
            onClick={saveSchedule}
            disabled={saving}
            className="bg-primary hover:bg-primary/90"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Schedule</span>
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorScheduleManager;
