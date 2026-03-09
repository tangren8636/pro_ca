// 内分泌治疗（注射）跟踪页面
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
    TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Shadows } from '../theme';
import { getInjectionRecords, addInjectionRecord, deleteInjectionRecord } from '../database';
import { formatDateCN, getToday, daysFromNow } from '../utils/dateUtils';

const DRUG_PRESETS = ['亮丙瑞林', '戈舍瑞林', '曲普瑞林', '地加瑞克', '其他'];
const DOSAGE_TYPES = ['1月', '3月', '6月'];

export default function InjectionScreen({ userId }) {
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [drugName, setDrugName] = useState('亮丙瑞林');
    const [dosageType, setDosageType] = useState('1月');
    const [injectionDate, setInjectionDate] = useState(getToday());
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    const loadRecords = async () => {
        try {
            const data = await getInjectionRecords(userId);
            setRecords(data);
        } catch (error) {
            console.error('加载注射记录失败:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadRecords(); }, [userId]));

    const handleAdd = async () => {
        try {
            await addInjectionRecord(userId, drugName, dosageType, injectionDate, location, notes);
            setDrugName('亮丙瑞林'); setDosageType('1月');
            setInjectionDate(getToday()); setLocation(''); setNotes('');
            setShowModal(false);
            loadRecords();
        } catch (error) {
            Alert.alert('错误', '添加记录失败');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('确认删除', '确定要删除这条注射记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除', style: 'destructive', onPress: async () => {
                    await deleteInjectionRecord(id);
                    loadRecords();
                }
            },
        ]);
    };

    const latestRecord = records.length > 0 ? records[0] : null;
    const daysToNext = latestRecord?.next_due_date ? daysFromNow(latestRecord.next_due_date) : null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>内分泌治疗跟踪</Text>
                <Text style={styles.pageSubtitle}>注射计划管理与提醒</Text>

                {/* 下次注射提醒卡片 */}
                {latestRecord && (
                    <View style={[styles.reminderCard, daysToNext !== null && daysToNext <= 0 ? styles.reminderUrgent : daysToNext <= 7 ? styles.reminderSoon : styles.reminderNormal]}>
                        <View style={styles.reminderIconArea}>
                            <Ionicons
                                name={daysToNext <= 0 ? "alarm" : "timer-outline"}
                                size={32}
                                color={daysToNext <= 0 ? Colors.danger : daysToNext <= 7 ? Colors.caution : Colors.primary}
                            />
                        </View>
                        <View style={styles.reminderContent}>
                            <Text style={styles.reminderLabel}>下次注射</Text>
                            <Text style={styles.reminderDate}>{formatDateCN(latestRecord.next_due_date)}</Text>
                            <Text style={[styles.reminderDays, {
                                color: daysToNext <= 0 ? Colors.danger : daysToNext <= 7 ? Colors.caution : Colors.primary,
                            }]}>
                                {daysToNext <= 0
                                    ? `已逾期 ${Math.abs(daysToNext)} 天`
                                    : `还有 ${daysToNext} 天`}
                            </Text>
                        </View>
                        <View style={styles.reminderDrugInfo}>
                            <Text style={styles.reminderDrugName}>{latestRecord.drug_name}</Text>
                            <Text style={styles.reminderDrugType}>{latestRecord.dosage_type}剂型</Text>
                        </View>
                    </View>
                )}

                {/* 注射记录列表 */}
                <Text style={styles.sectionTitle}>注射记录</Text>
                {records.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="medical-outline" size={56} color={Colors.textTertiary} />
                        <Text style={styles.emptyText}>暂无注射记录</Text>
                        <Text style={styles.emptyHint}>点击右下角按钮添加注射记录</Text>
                    </View>
                ) : (
                    records.map((record, index) => (
                        <TouchableOpacity
                            key={record.id} style={styles.recordCard}
                            onLongPress={() => handleDelete(record.id)} activeOpacity={0.7}
                        >
                            <View style={styles.recordIconArea}>
                                <View style={[styles.recordIcon, { backgroundColor: Colors.moduleInjection + '15' }]}>
                                    <Ionicons name="medical" size={18} color={Colors.moduleInjection} />
                                </View>
                                {index < records.length - 1 && <View style={styles.recordLine} />}
                            </View>
                            <View style={styles.recordContent}>
                                <View style={styles.recordHeader}>
                                    <Text style={styles.recordDrug}>{record.drug_name}</Text>
                                    <View style={styles.dosageBadge}>
                                        <Text style={styles.dosageBadgeText}>{record.dosage_type}</Text>
                                    </View>
                                </View>
                                <Text style={styles.recordDate}>
                                    注射日期：{formatDateCN(record.injection_date)}
                                </Text>
                                {record.location ? (
                                    <Text style={styles.recordMeta}>地点：{record.location}</Text>
                                ) : null}
                                {record.notes ? (
                                    <Text style={styles.recordMeta}>备注：{record.notes}</Text>
                                ) : null}
                                <Text style={styles.recordNext}>
                                    下次预约：{formatDateCN(record.next_due_date)}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <ScrollView>
                        <View style={styles.modalSpacer} />
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>添加注射记录</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>药物名称 *</Text>
                                <View style={styles.drugRow}>
                                    {DRUG_PRESETS.map(drug => (
                                        <TouchableOpacity
                                            key={drug}
                                            style={[styles.drugBtn, drugName === drug && styles.drugBtnActive]}
                                            onPress={() => setDrugName(drug)}
                                        >
                                            <Text style={[styles.drugBtnText, drugName === drug && styles.drugBtnTextActive]}>{drug}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>剂型 *</Text>
                                <View style={styles.dosageRow}>
                                    {DOSAGE_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.dosageBtn, dosageType === type && styles.dosageBtnActive]}
                                            onPress={() => setDosageType(type)}
                                        >
                                            <Text style={[styles.dosageBtnText, dosageType === type && styles.dosageBtnTextActive]}>
                                                {type}剂型
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>注射日期 *</Text>
                                <TextInput style={styles.input} placeholder="YYYY-MM-DD"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={injectionDate} onChangeText={setInjectionDate}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>注射地点</Text>
                                <TextInput style={styles.input} placeholder="例如：北京协和医院"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={location} onChangeText={setLocation}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>备注</Text>
                                <TextInput style={styles.input} placeholder="其他需要记录的信息"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={notes} onChangeText={setNotes}
                                />
                            </View>

                            <TouchableOpacity style={styles.saveButton} onPress={handleAdd} activeOpacity={0.8}>
                                <Text style={styles.saveButtonText}>保存记录</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
    pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 20 },
    reminderCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg,
        padding: 18, marginBottom: 24, ...Shadows.medium,
    },
    reminderNormal: { backgroundColor: Colors.primaryBg },
    reminderSoon: { backgroundColor: Colors.cautionLight },
    reminderUrgent: { backgroundColor: Colors.dangerLight },
    reminderIconArea: { marginRight: 14 },
    reminderContent: { flex: 1 },
    reminderLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
    reminderDate: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    reminderDays: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    reminderDrugInfo: { alignItems: 'flex-end' },
    reminderDrugName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    reminderDrugType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textTertiary, marginTop: 16 },
    emptyHint: { fontSize: 13, color: Colors.textTertiary, marginTop: 6 },
    recordCard: { flexDirection: 'row', marginBottom: 4 },
    recordIconArea: { width: 36, alignItems: 'center' },
    recordIcon: {
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center', zIndex: 1,
    },
    recordLine: { width: 2, flex: 1, backgroundColor: Colors.border },
    recordContent: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
        padding: 16, marginLeft: 10, marginBottom: 12, ...Shadows.small,
    },
    recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    recordDrug: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    dosageBadge: {
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
        backgroundColor: Colors.moduleInjection + '15',
    },
    dosageBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.moduleInjection },
    recordDate: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
    recordMeta: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
    recordNext: { fontSize: 13, color: Colors.primary, fontWeight: '500', marginTop: 6 },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
        borderRadius: 28, backgroundColor: Colors.moduleInjection,
        alignItems: 'center', justifyContent: 'center', ...Shadows.large,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSpacer: { height: 100 },
    modalContent: {
        backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8 },
    input: {
        backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
        borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 15, color: Colors.textPrimary,
    },
    drugRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    drugBtn: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.border,
    },
    drugBtnActive: { borderColor: Colors.moduleInjection, backgroundColor: Colors.moduleInjection + '10' },
    drugBtnText: { fontSize: 13, color: Colors.textSecondary },
    drugBtnTextActive: { color: Colors.moduleInjection, fontWeight: '600' },
    dosageRow: { flexDirection: 'row', gap: 10 },
    dosageBtn: {
        flex: 1, paddingVertical: 10, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
    },
    dosageBtnActive: { borderColor: Colors.moduleInjection, backgroundColor: Colors.moduleInjection + '10' },
    dosageBtnText: { fontSize: 14, color: Colors.textSecondary },
    dosageBtnTextActive: { color: Colors.moduleInjection, fontWeight: '600' },
    saveButton: {
        backgroundColor: Colors.moduleInjection, borderRadius: Radius.md, height: 50,
        alignItems: 'center', justifyContent: 'center', marginTop: 6, ...Shadows.medium,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
