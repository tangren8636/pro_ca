// 通用日期选择器组件
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../theme';
import { formatDate, formatDateCN } from '../utils/dateUtils';

export default function DatePickerInput({ label, value, onChange, required = false }) {
    const [show, setShow] = useState(false);
    const currentDate = value ? new Date(value + 'T00:00:00') : new Date();

    const handleChange = (event, selectedDate) => {
        setShow(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
            onChange(formatDate(selectedDate));
        }
    };

    return (
        <View style={styles.container}>
            {label ? (
                <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
            ) : null}
            <TouchableOpacity style={styles.pickerButton} onPress={() => setShow(true)} activeOpacity={0.7}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <Text style={[styles.pickerText, !value && styles.placeholderText]}>
                    {value ? formatDateCN(value) : '请选择日期'}
                </Text>
                <Ionicons name="chevron-down" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
            {show && (
                <DateTimePicker
                    value={currentDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    maximumDate={new Date()}
                    locale="zh-Hans"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginBottom: 18 },
    label: {
        fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8,
    },
    pickerButton: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
        borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 13,
    },
    pickerText: {
        flex: 1, fontSize: 15, color: Colors.textPrimary,
    },
    placeholderText: {
        color: Colors.textTertiary,
    },
});
