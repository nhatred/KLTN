import { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, Clock01Icon } from '@hugeicons/core-free-icons';

interface DataPickerProps {
  onDateTimeChange: (dateTime: string) => void;
}

export default function DataPicker({ onDateTimeChange }: DataPickerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Khởi tạo với thời gian hiện tại của Việt Nam
  const getCurrentVietnamTime = () => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // Thêm 7 giờ cho múi giờ Việt Nam
    return vnTime.toISOString().slice(0, 16);
  };

  const [roomSettings, setRoomSettings] = useState({
    startTime: getCurrentVietnamTime()
  });

  // Format date theo định dạng Việt Nam
  const formatDateToVN = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Format time theo định dạng 24h
  const formatTimeTo24h = (timeString: string) => {
    return timeString;
  };

  // Tách giá trị datetime thành date và time khi component được tải
  useEffect(() => {
    if (roomSettings.startTime) {
      const dateTime = new Date(roomSettings.startTime);
      // Chuyển đổi sang múi giờ Việt Nam
      const vnDateTime = new Date(dateTime.getTime() + (7 * 60 * 60 * 1000));
      setDate(vnDateTime.toISOString().split('T')[0]);
      setTime(vnDateTime.toISOString().split('T')[1].substring(0, 5));
      onDateTimeChange(roomSettings.startTime);
    }
  }, []);

  const handleDateChange = (e: any) => {
    setDate(e.target.value);
    const newDateTime = `${e.target.value}T${time || '00:00'}`;
    setRoomSettings({
      ...roomSettings,
      startTime: newDateTime
    });
    onDateTimeChange(newDateTime);
  };

  const handleTimeChange = (e: any) => {
    setTime(e.target.value);
    const newDateTime = `${date || getCurrentVietnamTime().split('T')[0]}T${e.target.value}`;
    setRoomSettings({
      ...roomSettings,
      startTime: newDateTime
    });
    onDateTimeChange(newDateTime);
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
    setShowTimePicker(false);
  };

  const toggleTimePicker = () => {
    setShowTimePicker(!showTimePicker);
    setShowDatePicker(false);
  };

  return (
    <div className="w-full mx-auto">
      <div className="mb-6">
        <div className="relative">
          <div className="flex">
            {/* Input hiển thị datetime đã chọn */}
            <div className="w-full relative flex rounded-lg overflow-hidden border border-gray-200">
              <input
                type="text"
                value={`${date && time ? `${formatDateToVN(date)} ${formatTimeTo24h(time)}` : ''}`}
                placeholder="Chọn ngày và giờ"
                readOnly
                className="w-full p-3 outline-none"
              />
              
              <div className="flex border-l border-gray-300">
                <button 
                  type="button"
                  onClick={toggleDatePicker}
                  className="p-3 hover:bg-orange-50 transition-all"
                >
                  <HugeiconsIcon icon={Calendar03Icon} />
                </button>
                
                <button 
                    type="button"
                    onClick={toggleTimePicker}
                    className="p-3 hover:bg-orange-50 transition-all"
                    >
                    <HugeiconsIcon icon={Clock01Icon} />
                    </button>
              </div>
            </div>
            
            {/* Input datetime-local ẩn để lưu giá trị */}
            <input
              type="datetime-local"
              name="startTime"
              value={roomSettings.startTime}
              onChange={(e) => {
                setRoomSettings({
                  ...roomSettings,
                  startTime: e.target.value
                });
                onDateTimeChange(e.target.value);
              }}
              className="hidden"
            />
          </div>
          
          {/* Date Picker */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Chọn ngày</h3>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="w-full p-2 border border-gray-200 rounded"
                />
              </div>
              <div className="flex justify-end px-3 pb-3 rounded-b-lg">
                <button 
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-2 bg-orange text-white text-sm rounded btn-hover"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          )}
          
          {/* Time Picker */}
          {showTimePicker && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Chọn giờ</h3>
                <input
                  type="time"
                  value={time}
                  onChange={handleTimeChange}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-end px-3 pb-3 rounded-b-lg">
                <button 
                  onClick={() => setShowTimePicker(false)}
                  className="px-3 py-2 bg-orange text-white text-sm rounded btn-hover"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}