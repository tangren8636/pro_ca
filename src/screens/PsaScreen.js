// PSA 数据跟踪页面
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
    TextInput, Alert, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Colors, Spacing, Radius, FontSize, Shadows } from '../theme';
import { getPsaRecords, addPsaRecord, deletePsaRecord, calculatePSADT, checkBiochemicalRecurrence } from '../database';
import { formatDateCN, formatDateShort, getToday } from '../utils/dateUtils';
import DatePickerInput from '../components/DatePickerInput';

const screenWidth = Dimensions.get('window').width;

export default function PsaScreen({ userId }) {
    const [records, setRecords] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [value, setValue] = useState('');
    const [testDate, setTestDate] = useState(getToday());
    const [institution, setInstitution] = useState('');
    const [timeRange, setTimeRange] = useState('all');
    const [psadt, setPsadt] = useState(null);
    const [warning, setWarning] = useState({ warning: false });

    const loadRecords = async () => {
        try {
            const data = await getPsaRecords(userId);
            setRecords(data);
            const dt = calculatePSADT(data);
            setPsadt(dt);
            const warn = checkBiochemicalRecurrence(data);
            setWarning(warn);
        } catch (error) {
            console.error('加载 PSA 记录失败:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadRecords(); }, [userId]));

    const handleAdd = async () => {
        if (!value || isNaN(parseFloat(value))) {
            Alert.alert('提示', '请输入有效的 PSA 数值');
            return;
        }
        try {
            await addPsaRecord(userId, parseFloat(value), 'ng/mL', testDate, institution);
            setValue(''); setInstitution(''); setTestDate(getToday());
            setShowModal(false);
            loadRecords();
        } catch (error) {
            Alert.alert('错误', '添加记录失败');
        }
    };

    const handleDelete = (id) => {
        Alert.alert('确认删除', '确定要删除这条 PSA 记录吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除', style: 'destructive', onPress: async () => {
                    await deletePsaRecord(id);
                    loadRecords();
                }
            },
        ]);
    };

    // 按时间范围过滤
    const filteredRecords = records.filter(r => {
        if (timeRange === 'all') return true;
        const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        return new Date(r.test_date) >= cutoff;
    }).sort((a, b) => new Date(a.test_date) - new Date(b.test_date));

    // 准备图表数据
    const chartData = filteredRecords.length >= 2 ? {
        labels: filteredRecords.map(r => formatDateShort(r.test_date)),
        datasets: [
            {
                data: filteredRecords.map(r => r.value),
                color: (opacity = 1) => `rgba(13, 124, 102, ${opacity})`,
                strokeWidth: 2.5,
            },
            // 阈值线 0.2 ng/mL
            {
                data: filteredRecords.map(() => 0.2),
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity * 0.5})`,
                strokeWidth: 1,
                withDots: false,
            },
        ],
    } : null;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* 页面标题 */}
                <Text style={styles.pageTitle}>PSA 数据跟踪</Text>
                <Text style={styles.pageSubtitle}>前列腺特异性抗原监测</Text>

                {/* 预警卡片 */}
                {warning.warning && (
                    <View style={[styles.warningCard, warning.level === 'danger' ? styles.warningDanger : styles.warningCaution]}>
                        <Ionicons name="warning" size={20} color={warning.level === 'danger' ? Colors.danger : Colors.caution} />
                        <Text style={[styles.warningText, { color: warning.level === 'danger' ? Colors.danger : '#92400E' }]}>
                            {warning.message}
                        </Text>
                    </View>
                )}

                {/* PSADT 指标 */}
                {psadt !== null && (
                    <View style={styles.psadtCard}>
                        <View style={styles.psadtHeader}>
                            <Ionicons name="timer-outline" size={20} color={Colors.primary} />
                            <Text style={styles.psadtTitle}>PSA 倍增时间 (PSADT)</Text>
                        </View>
                        <View style={styles.psadtValueRow}>
                            <Text style={styles.psadtValue}>{psadt}</Text>
                            <Text style={styles.psadtUnit}>天</Text>
                        </View>
                        <Text style={styles.psadtHint}>
                            {psadt < 90 ? '⚠ PSADT < 3个月，提示高风险，建议尽快就医'
                                : psadt < 365 ? '⚡ PSADT 3-12个月，需要密切关注'
                                    : '✅ PSADT > 12个月，风险相对较低'}
                        </Text>
                    </View>
                )}

                {/* 时间范围选择 */}
                <View style={styles.timeRangeRow}>
                    {['3m', '6m', '1y', 'all'].map(range => (
                        <TouchableOpacity
                            key={range}
                            style={[styles.timeRangeBtn, timeRange === range && styles.timeRangeBtnActive]}
                            onPress={() => setTimeRange(range)}
                        >
                            <Text style={[styles.timeRangeBtnText, timeRange === range && styles.timeRangeBtnTextActive]}>
                                {range === '3m' ? '3个月' : range === '6m' ? '6个月' : range === '1y' ? '1年' : '全部'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 趋势图表 */}
                {chartData ? (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>PSA 趋势变化</Text>
                        <LineChart
                            data={chartData}
                            width={screenWidth - 64}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#fff',
                                backgroundGradientFrom: '#fff',
                                backgroundGradientTo: '#fff',
                                decimalCount: 2,
                                color: (opacity = 1) => `rgba(13, 124, 102, ${opacity})`,
                                labelColor: () => Colors.textSecondary,
                                propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.primary },
                                propsForBackgroundLines: { stroke: Colors.chartGrid, strokeDasharray: '' },
                            }}
                            bezier
                            style={styles.chart}
                            fromZero
                        />
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                                <Text style={styles.legendText}>PSA 值</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.danger }]} />
                                <Text style={styles.legendText}>复发阈值 (0.2)</Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.emptyChart}>
                        <Ionicons name="analytics-outline" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyChartText}>至少录入2条数据后显示趋势图</Text>
                    </View>
                )}

                {/* 历史记录列表 */}
                <Text style={styles.sectionTitle}>历史记录</Text>
                {records.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>暂无 PSA 记录，点击右下角按钮添加</Text>
                    </View>
                ) : (
                    records.map(record => (
                        <TouchableOpacity
                            key={record.id}
                            style={styles.recordCard}
                            onLongPress={() => handleDelete(record.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.recordLeft}>
                                <Text style={styles.recordValue}>{record.value}</Text>
                                <Text style={styles.recordUnit}>{record.unit}</Text>
                            </View>
                            <View style={styles.recordRight}>
                                <Text style={styles.recordDate}>{formatDateCN(record.test_date)}</Text>
                                {record.institution ? (
                                    <Text style={styles.recordInst}>{record.institution}</Text>
                                ) : null}
                            </View>
                            {record.value > 0.2 && (
                                <View style={styles.recordFlag}>
                                    <Ionicons name="flag" size={14} color={Colors.danger} />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 80 }} />
            </ScrollView>

            {/* 浮动添加按钮 */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            {/* 添加数据弹窗 */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>添加 PSA 记录</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>PSA 数值 (ng/mL) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="例如：0.15"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="decimal-pad"
                                value={value}
                                onChangeText={setValue}
                            />
                        </View>

                        <DatePickerInput
                            label="检测日期"
                            value={testDate}
                            onChange={setTestDate}
                            required
                        />

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>检测机构</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="例如：北京协和医院"
                                placeholderTextColor={Colors.textTertiary}
                                value={institution}
                                onChangeText={setInstitution}
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
        borderRadius: Radius.md, marginBottom: 16, gap: 10,
    },
    warningDanger: { backgroundColor: Colors.dangerLight },
    warningCaution: { backgroundColor: Colors.cautionLight },
    warningText: { flex: 1, fontSize: 13, lineHeight: 20 },
    psadtCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 18,
        marginBottom: 16, ...Shadows.small,
    },
    psadtHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    psadtTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    psadtValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 },
    psadtValue: { fontSize: 36, fontWeight: '800', color: Colors.primary },
    psadtUnit: { fontSize: 16, color: Colors.textSecondary },
    psadtHint: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
    timeRangeRow: {
        flexDirection: 'row', gap: 8, marginBottom: 16,
    },
    timeRangeBtn: {
        paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: Radius.full, backgroundColor: Colors.surface,
        borderWidth: 1, borderColor: Colors.border,
    },
    timeRangeBtnActive: {
        backgroundColor: Colors.primary, borderColor: Colors.primary,
    },
    timeRangeBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
    timeRangeBtnTextActive: { color: '#fff' },
    chartCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16,
        marginBottom: 20, ...Shadows.small,
    },
    chartTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 12 },
    chart: { borderRadius: 12, marginLeft: -8 },
    chartLegend: {
        flexDirection: 'row', gap: 20, marginTop: 12, paddingLeft: 4,
    },
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
    recordLeft: { flexDirection: 'row', alignItems: 'baseline', gap: 4, width: 100 },
    recordValue: { fontSize: 20, fontWeight: '700', color: Colors.primary },
    recordUnit: { fontSize: 12, color: Colors.textTertiary },
    recordRight: { flex: 1 },
    recordDate: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
    recordInst: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
    recordFlag: { marginLeft: 8 },
    fab: {
        position: 'absolute', right: 20, bottom: 24, width: 56, height: 56,
        borderRadius: 28, backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center', ...Shadows.large,
    },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
    inputGroup: { marginBottom: 18 },
    inputLabel: {
        fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border,
        borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 15, color: Colors.textPrimary,
    },
    saveButton: {
        backgroundColor: Colors.primary, borderRadius: Radius.md, height: 50,
        alignItems: 'center', justifyContent: 'center', marginTop: 6, ...Shadows.medium,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
