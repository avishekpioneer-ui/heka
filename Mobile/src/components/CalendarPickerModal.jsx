import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CalendarPickerModal({
  visible,
  onClose,
  onSelectDate,
  currentDate,
  title = 'Select Date',
  minDate,
}) {
  const getInitialDate = () => {
    if (currentDate && !isNaN(new Date(currentDate).getTime())) {
      return new Date(currentDate);
    }
    return new Date();
  };

  const [viewDate, setViewDate] = useState(getInitialDate());
  const [selectedDateStr, setSelectedDateStr] = useState(
    currentDate || new Date().toISOString().substring(0, 10)
  );

  useEffect(() => {
    if (visible) {
      const initial = getInitialDate();
      setViewDate(initial);
      setSelectedDateStr(currentDate || initial.toISOString().substring(0, 10));
    }
  }, [visible, currentDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Generate days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleDayPress = (day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    setSelectedDateStr(dateStr);
    onSelectDate(dateStr);
    onClose();
  };

  const handlePreset = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = d.toISOString().substring(0, 10);
    setSelectedDateStr(dateStr);
    onSelectDate(dateStr);
    onClose();
  };

  const todayStr = new Date().toISOString().substring(0, 10);

  const daysGrid = [];
  // Leading empty slots
  for (let i = 0; i < firstDayIndex; i++) {
    daysGrid.push({ day: null, key: `empty-${i}` });
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    daysGrid.push({
      day: d,
      dateStr,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDateStr,
      key: `day-${d}`,
    });
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                Selected: <Text style={{ fontWeight: '700', color: '#0f766e' }}>{selectedDateStr}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContainer}
          >
            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(0)}>
              <Text style={styles.presetBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(1)}>
              <Text style={styles.presetBtnText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(3)}>
              <Text style={styles.presetBtnText}>+3 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetBtn} onPress={() => handlePreset(7)}>
              <Text style={styles.presetBtnText}>Next Week</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrevMonth}>
              <Text style={styles.navBtnText}>◀</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={handleNextMonth}>
              <Text style={styles.navBtnText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday Row */}
          <View style={styles.weekdaysRow}>
            {DAYS_OF_WEEK.map((w, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {daysGrid.map((item) => {
              if (!item.day) {
                return <View key={item.key} style={styles.dayCellEmpty} />;
              }
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.dayCell,
                    item.isToday && styles.dayCellToday,
                    item.isSelected && styles.dayCellSelected,
                  ]}
                  onPress={() => handleDayPress(item.day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      item.isToday && styles.dayTextToday,
                      item.isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '700',
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  navBtn: {
    padding: 6,
  },
  navBtnText: {
    fontSize: 14,
    color: '#0f766e',
    fontWeight: '800',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#0D9488',
  },
  dayCellSelected: {
    backgroundColor: '#0D9488',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayTextToday: {
    color: '#0D9488',
    fontWeight: '800',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
});
