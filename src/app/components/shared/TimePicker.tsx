import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({ label, value, onChange, disabled }) => {
  // Generate hours (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Generate minutes (00, 15, 30, 45)
  const minutes = ['00', '15', '30', '45'];

  const currentHour = value ? value.split(':')[0] : '09';
  const currentMinute = value ? value.split(':')[1] : '00';

  const handleHourChange = (hour: string) => {
    onChange(`${hour}:${currentMinute}`);
  };

  const handleMinuteChange = (minute: string) => {
    onChange(`${currentHour}:${minute}`);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select value={currentHour} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex items-center text-xl">:</span>
        <Select value={currentMinute} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
