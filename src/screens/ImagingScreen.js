// 影像学管理页面
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
    TextInput, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Shadows } from '../theme';
import { getImagingRecords, addImagingRecord, deleteImagingRecord } from '../database';
import { formatDateCN, getToday, daysFromNow } from '../utils/dateUtils';

const EXAM_TYPES = ['骨扫描', 'CT', 'MRI', 'PET-CT', '其他'];
const CONCLUSION_PRESETS = [
    '未见明显转移',
    '骨转移病灶稳定',
    '骨转移病灶增加',
    '软组织转移稳定',
    '软组织转移增加',
    '治疗后好转',
];

export default function ImagingScreen({ userId }) {
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [examType, setExamType] = useState('骨扫描');
    const [conclusion, setConclusion] = useState('');
    const [examDate, setExamDate] = useState(getToday());
    const [institution, setInstitution] = useState('');
    const [notes, setNotes] = useState('');

    const loadRecords = async () => {
        try {
            const data = await getImagingRecords(userId);
            setRecords(data);
        } catch (error) {
            console.error('加载影像记录失败:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadRecords(); }, [userId]));

    const handleAdd = async () => {
        if (!conclusion.trim()) {
            Alert.alert('提示', '请填写检查结论');
            return;
        }
        try {
            await addImagingRecord(userId, examType, conclusion.trim(), examDate, institution, '', notes);
            setConclusion(''); setInstitution(''); setNotes('');
            setExamDate(getToday()); setExamType('骨扫描');
            setShowModal(false);
            loadRecords();
        } catch (error) {
            Alert.alert('错误', '添加记录失败');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('确认删除', '确定要删除这条影像记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除', style: 'destructive', onPress: async () => {
                    await deleteImagingRecord(id);
                    loadRecords();
                }
            },
        ]);
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case '骨扫描': return 'body-outline';
            case 'CT': return 'scan-outline';
            case 'MRI': return 'radio-outline';
            case 'PET-CT': return 'nuclear-outline';
            default: return 'image-outline';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case '骨扫描': return '#8B5CF6';
            case 'CT': return '#06B6D4';
            case 'MRI': return '#EC4899';
            case 'PET-CT': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>影像学管理</Text>
                <Text style={styles.pageSubtitle}>检查报告与结论记录</Text>

                {/* 时间轴视图 */}
                {records.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="images-outline" size={56} color={Colors.textTertiary} />
                        <Text style={styles.emptyText}>暂无影像学记录</Text>
                        <Text style={styles.emptyHint}>点击右下角按钮添加检查记录</Text>
                    </View>
                ) : (
                    <View style={styles.timeline}>
                        {records.map((record, index) => (
                            <TouchableOpacity
                                key={record.id}
                                style={styles.timelineItem}
                                onLongPress={() => handleDelete(record.id)}
                                activeOpacity={0.7}
                            >
                                {/* 时间轴线 */}
                                <View style={styles.timelineLine}>
                                    <View style={[styles.timelineDot, { backgroundColor: getTypeColor(record.type) }]}>
                                        <Ionicons name={getTypeIcon(record.type)} size={14} color="#fff" />
                                    </View>
                                    {index < records.length - 1 && <View style={styles.timelineConnector} />}
                                </View>

                                {/* 内容卡片 */}
                                <View style={styles.timelineCard}>
                                    <View style={styles.timelineCardHeader}>
                                        <View style={[styles.typeBadge, { backgroundColor: getTypeColor(record.type) + '15' }]}>
                                            <Text style={[styles.typeBadgeText, { color: getTypeColor(record.type) }]}>
                                                {record.type}
                                            </Text>
                                        </View>
                                        <Text style={styles.timelineDate}>{formatDateCN(record.exam_date)}</Text>
                                    </View>
                                    <Text style={styles.conclusionText}>{record.conclusion}</Text>
                                    {record.institution ? (
                                        <View style={styles.metaRow}>
                                            <Ionicons name="business-outline" size={12} color={Colors.textTertiary} />
                                            <Text style={styles.metaText}>{record.institution}</Text>
                                        </View>
                                    ) : null}
                                    {record.notes ? (
                                        <View style={styles.metaRow}>
                                            <Ionicons name="document-text-outline" size={12} color={Colors.textTertiary} />
                                            <Text style={styles.metaText}>{record.notes}</Text>
                                        </View>
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
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
                                <Text style={styles.modalTitle}>添加影像记录</Text>
                                <TouchableOpacity onPress={() => setShowModal(false)}>
                                    <Ionicons name="close" size={24} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>检查类型 *</Text>
                                <View style={styles.typeRow}>
                                    {EXAM_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.typeBtn, examType === type && { borderColor: getTypeColor(type), backgroundColor: getTypeColor(type) + '10' }]}
                                            onPress={() => setExamType(type)}
                                        >
                                            <Text style={[styles.typeBtnText, examType === type && { color: getTypeColor(type) }]}>{type}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>检查结论 *</Text>
                                <View style={styles.presetsRow}>
                                    {CONCLUSION_PRESETS.map(preset => (
                                        <TouchableOpacity
                                            key={preset}
                                            style={[styles.presetBtn, conclusion === preset && styles.presetBtnActive]}
                                            onPress={() => setConclusion(preset)}
                                        >
                                            <Text style={[styles.presetBtnText, conclusion === preset && styles.presetBtnTextActive]}>{preset}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput
                                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                                    placeholder="或手动输入检查结论"
                                    placeholderTextColor={Colors.textTertiary}
                                    multiline value={conclusion} onChangeText={setConclusion}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>检查日期 *</Text>
                                <TextInput style={styles.input} placeholder="YYYY-MM-DD"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={examDate} onChangeText={setExamDate}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>检查机构</Text>
                                <TextInput style={styles.input} placeholder="例如：北京协和医院"
                                    placeholderTextColor={Colors.textTertiary}
                                    value={institution} onChangeText={setInstitution}
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
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', color: Colors.textTertiary, marginTop: 16 },
    emptyHint: { fontSize: 13, color: Colors.textTertiary, marginTop: 6 },
    timeline: { paddingLeft: 4 },
    timelineItem: { flexDirection: 'row', minHeight: 100 },
    timelineLine: { width: 32, alignItems: 'center' },
    timelineDot: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center', zIndex: 1,
    },
    timelineConnector: {
        width: 2, flex: 1, backgroundColor: Colors.border, marginTop: -2,
    },
    timelineCard: {
        flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
        padding: 16, marginLeft: 12, marginBottom: 16, ...Shadows.small,
    },
    timelineCardHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
    },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    typeBadgeText: { fontSize: 12, fontWeight: '600' },
    timelineDate: { fontSize: 12, color: Colors.textTertiary },
    conclusionText: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary, lineHeight: 22, marginBottom: 8 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText: { fontSize: 12, color: Colors.textTertiary },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
        borderRadius: 28, backgroundColor: Colors.moduleImaging,
        alignItems: 'center', justifyContent: 'center', ...Shadows.large,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSpacer: { height: 80 },
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
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    typeBtn: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.border,
    },
    typeBtnText: { fontSize: 13, color: Colors.textSecondary },
    presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    presetBtn: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
        borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
    },
    presetBtnActive: { borderColor: Colors.moduleImaging, backgroundColor: Colors.moduleImaging + '10' },
    presetBtnText: { fontSize: 12, color: Colors.textSecondary },
    presetBtnTextActive: { color: Colors.moduleImaging, fontWeight: '600' },
    saveButton: {
        backgroundColor: Colors.moduleImaging, borderRadius: Radius.md, height: 50,
        alignItems: 'center', justifyContent: 'center', marginTop: 6, ...Shadows.medium,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
