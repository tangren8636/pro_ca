// 睾酮数据跟踪页面
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
    TextInput, Alert, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Radius, Shadows } from '../theme';
import { getTestosteroneRecords, addTestosteroneRecord, deleteTestosteroneRecord, getPsaRecords, checkCastrationResistance } from '../database';
import { formatDateCN, formatDateShort, getToday } from '../utils/dateUtils';

const screenWidth = Dimensions.get('window').width;
const CASTRATION_THRESHOLD_NGDL = 50;
const CASTRATION_THRESHOLD_NMOL = 1.7;

export default function TestosteroneScreen({ userId }) {
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [value, setValue] = useState('');
    const [unit, setUnit] = useState('ng/dL');
    const [testDate, setTestDate] = useState(getToday());
    const [institution, setInstitution] = useState('');
    const [crpcWarning, setCrpcWarning] = useState({ warning: false });

    const loadRecords = async () => {
        try {
            const data = await getTestosteroneRecords(userId);
            setRecords(data);
            const psaData = await getPsaRecords(userId);
            const warn = checkCastrationResistance(data, psaData);
            setCrpcWarning(warn);
        } catch (error) {
            console.error('加载睾酮记录失败:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadRecords(); }, [userId]));

    const handleAdd = async () => {
        if (!value || isNaN(parseFloat(value))) {
            Alert.alert('提示', '请输入有效的睾酮数值');
            return;
        }
        try {
            await addTestosteroneRecord(userId, parseFloat(value), unit, testDate, institution);
            setValue(''); setInstitution(''); setTestDate(getToday());
            setShowModal(false);
            loadRecords();
        } catch (error) {
            Alert.alert('错误', '添加记录失败');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('确认删除', '确定要删除这条睾酮记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除', style: 'destructive', onPress: async () => {
                    await deleteTestosteroneRecord(id);
                    loadRecords();
                }
            },
        ]);
    };

    const sorted = [...records].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
    const threshold = unit === 'ng/dL' ? CASTRATION_THRESHOLD_NGDL : CASTRATION_THRESHOLD_NMOL;

    const chartData = sorted.length >= 2 ? {
        labels: sorted.map(r => formatDateShort(r.test_date)),
        datasets: [
            {
                data: sorted.map(r => r.value),
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                strokeWidth: 2.5,
            },
            {
                data: sorted.map(() => threshold),
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity * 0.5})`,
                strokeWidth: 1,
                withDots: false,
            },
        ],
    } : null;

    const latestRecord = records.length > 0 ? records[0] : null;
    const isCastrate = latestRecord ? (latestRecord.unit === 'ng/dL' ? latestRecord.value < 50 : latestRecord.value < 1.7) : false;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>睾酮数据跟踪</Text>
                <Text style={styles.pageSubtitle}>内分泌治疗效果监控</Text>

                {/* 去势抵抗预警 */}
                {crpcWarning.warning && (
                    <View style={styles.warningCard}>
                        <Ionicons name="warning" size={20} color={Colors.danger} />
                        <Text style={styles.warningText}>{crpcWarning.message}</Text>
                    </View>
                )}

                {/* 去势状态卡片 */}
                {latestRecord && (
                    <View style={[styles.statusCard, isCastrate ? styles.statusGood : styles.statusAlert]}>
                        <View style={styles.statusIcon}>
                            <Ionicons
                                name={isCastrate ? "checkmark-circle" : "alert-circle"}
                                size={28}
                                color={isCastrate ? Colors.success : Colors.caution}
                            />
                        </View>
                        <View style={styles.statusInfo}>
                            <Text style={styles.statusLabel}>当前去势状态</Text>
                            <Text style={[styles.statusText, { color: isCastrate ? Colors.success : Colors.caution }]}>
                                {isCastrate ? '已达去势水平 ✓' : '未达去势水平'}
                            </Text>
                            <Text style={styles.statusDetail}>
                                最新睾酮：{latestRecord.value} {latestRecord.unit}（阈值：{latestRecord.unit === 'ng/dL' ? '50 ng/dL' : '1.7 nmol/L'}）
                            </Text>
                        </View>
                    </View>
                )}

                {/* 趋势图 */}
                {chartData ? (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>睾酮趋势变化</Text>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 64}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#fff',
                                backgroundGradientFrom: '#fff',
                                backgroundGradientTo: '#fff',
                                decimalCount: 1,
                                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                                labelColor: () => Colors.textSecondary,
                                propsForDots: { r: '4', strokeWidth: '2', stroke: '#3B82F6' },
                                propsForBackgroundLines: { stroke: Colors.chartGrid, strokeDasharray: '' },
                            }}
                            bezier
                            style={styles.chart}
                            fromZero
                        />
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                                <Text style={styles.legendText}>睾酮值</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                                <Text style={styles.legendText}>去势阈值 ({threshold})</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Ionicons name="fitness-outline" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyChartText}>至少录入2条数据后显示趋势图</Text>
                    </View>
                )}

                {/* 历史记录 */}
                <Text style={styles.sectionTitle}>历史记录</Text>
                {records.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>暂无睾酮记录，点击右下角按钮添加</Text>
                    </View>
                ) : (
                    records.map(record => (
                        <TouchableOpacity
                            key={record.id} style={styles.recordCard}
                            onLongPress={() => handleDelete(record.id)} activeOpacity={0.7}
                        >
                            <View style={styles.recordLeft}>
                                <Text style={[styles.recordValue, { color: Colors.moduleTestosterone }]}>{record.value}</Text>
                                <Text style={styles.recordUnit}>{record.unit}</Text>
                            </View>
                            <View style={styles.recordRight}>
                                <Text style={styles.recordDate}>{formatDateCN(record.test_date)}</Text>
                                {record.institution ? <Text style={styles.recordInst}>{record.institution}</Text> : null}
                            </View>
                            <View style={[styles.recordBadge, {
                                backgroundColor: (record.unit === 'ng/dL' ? record.value < 50 : record.value < 1.7)
                                    ? Colors.successLight : Colors.cautionLight
                            }]}>
                                <Text style={[styles.recordBadgeText, {
                                    color: (record.unit === 'ng/dL' ? record.value < 50 : record.value < 1.7)
                                        ? Colors.success : Colors.caution
                                }]}>
                                    {(record.unit === 'ng/dL' ? record.value < 50 : record.value < 1.7) ? '去势' : '未去势'}
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>添加睾酮记录</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>睾酮数值 *</Text>
                            <TextInput
                                style={styles.input} placeholder="请输入数值"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="decimal-pad" value={value} onChangeText={setValue}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>单位</Text>
                            <View style={styles.unitRow}>
                                {['ng/dL', 'nmol/L'].map(u => (
                                    <TouchableOpacity
                                        key={u}
                                        style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                                        onPress={() => setUnit(u)}
                                    >
                                        <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>{u}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>检测日期 *</Text>
                            <TextInput
                                style={styles.input} placeholder="YYYY-MM-DD"
                                placeholderTextColor={Colors.textTertiary}
                                value={testDate} onChangeText={setTestDate}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>检测机构</Text>
                            <TextInput
                                style={styles.input} placeholder="例如：北京协和医院"
                                placeholderTextColor={Colors.textTertiary}
                                value={institution} onChangeText={setInstitution}
                            />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={handleAdd} activeOpacity={0.8}>
                            <Text style={styles.saveButtonText}>保存记录</Text>
                        </TouchableOpacity>
                    </View>
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
    warningCard: {
        flexDirection: 'row', alignItems: 'flex-start', padding: 14,
        borderRadius: Radius.md, marginBottom: 16, gap: 10, backgroundColor: Colors.dangerLight,
    },
    warningText: { flex: 1, fontSize: 13, lineHeight: 20, color: Colors.danger },
    statusCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg,
        padding: 18, marginBottom: 16, ...Shadows.small,
    },
    statusGood: { backgroundColor: '#F0FDF4' },
    statusAlert: { backgroundColor: '#FFFBEB' },
    statusIcon: { marginRight: 14 },
    statusInfo: { flex: 1 },
    statusLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    statusText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    statusDetail: { fontSize: 12, color: Colors.textSecondary },
    chartCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16,
        marginBottom: 20, ...Shadows.small,
    },
    chartTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
    chart: { borderRadius: 12, marginLeft: -8 },
    chartLegend: { flexDirection: 'row', gap: 20, marginTop: 12, paddingLeft: 4 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: Colors.textSecondary },
    emptyChart: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 40,
        alignItems: 'center', marginBottom: 20, ...Shadows.small,
    },
    emptyChartText: { fontSize: 14, color: Colors.textTertiary, marginTop: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 32 },
    emptyText: { fontSize: 14, color: Colors.textTertiary },
    recordCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
        borderRadius: Radius.md, padding: 16, marginBottom: 10, ...Shadows.small,
    },
    recordLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 4, width: 90 },
    recordValue: { fontSize: 20, fontWeight: '700' },
    recordUnit: { fontSize: 11, color: Colors.textTertiary },
    recordRight: { flex: 1 },
    recordDate: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
    recordInst: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
    recordBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    recordBadgeText: { fontSize: 11, fontWeight: '600' },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
        borderRadius: 28, backgroundColor: Colors.moduleTestosterone,
        alignItems: 'center', justifyContent: 'center', ...Shadows.large,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
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
    unitRow: { flexDirection: 'row', gap: 10 },
    unitBtn: {
        flex: 1, paddingVertical: 10, borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
    },
    unitBtnActive: { borderColor: Colors.moduleTestosterone, backgroundColor: Colors.moduleTestosterone + '10' },
    unitBtnText: { fontSize: 14, color: Colors.textSecondary },
    unitBtnTextActive: { color: Colors.moduleTestosterone, fontWeight: '600' },
    saveButton: {
        backgroundColor: Colors.moduleTestosterone, borderRadius: Radius.md, height: 50,
        alignItems: 'center', justifyContent: 'center', marginTop: 6, ...Shadows.medium,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
