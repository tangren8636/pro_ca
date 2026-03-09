// 首页仪表盘
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize, Shadows } from '../theme';
import { getDashboardData, getPsaRecords, getTestosteroneRecords, checkBiochemicalRecurrence, checkCastrationResistance } from '../database';
import { formatDateCN, daysFromNow } from '../utils/dateUtils';

export default function HomeScreen({ navigation: parentNavigation, userId, userNickname }) {
    const tabNavigation = useNavigation();
    const [data, setData] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const dashData = await getDashboardData(userId);
            setData(dashData);

            // 计算预警
            const warnings = [];
            const psaRecords = await getPsaRecords(userId);
            const tRecords = await getTestosteroneRecords(userId);

            const psaWarning = checkBiochemicalRecurrence(psaRecords);
            if (psaWarning.warning) warnings.push(psaWarning);

            const crpcWarning = checkCastrationResistance(tRecords, psaRecords);
            if (crpcWarning.warning) warnings.push(crpcWarning);

            // 检查注射提醒
            if (dashData.latestInjection?.next_due_date) {
                const daysLeft = daysFromNow(dashData.latestInjection.next_due_date);
                if (daysLeft !== null && daysLeft <= 7) {
                    warnings.push({
                        warning: true,
                        message: daysLeft <= 0
                            ? `⏰ 已超过预定注射日期 ${Math.abs(daysLeft)} 天，请尽快安排注射`
                            : `⏰ 距离下次注射还有 ${daysLeft} 天（${formatDateCN(dashData.latestInjection.next_due_date)}）`,
                        level: daysLeft <= 0 ? 'danger' : 'caution',
                    });
                }
            }
            setAlerts(warnings);
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [userId])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const QuickAction = ({ icon, label, color, bgColor, onPress }) => (
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: bgColor }]} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={22} color="#fff" />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const DataCard = ({ title, value, unit, subtitle, icon, color, onPress }) => (
        <TouchableOpacity style={styles.dataCard} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.dataCardIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={styles.dataCardTitle}>{title}</Text>
            {value !== null && value !== undefined ? (
                <View style={styles.dataCardValueRow}>
                    <Text style={[styles.dataCardValue, { color }]}>{value}</Text>
                    <Text style={styles.dataCardUnit}>{unit}</Text>
                </View>
            ) : (
                <Text style={styles.dataCardEmpty}>暂无数据</Text>
            )}
            {subtitle ? <Text style={styles.dataCardSubtitle}>{subtitle}</Text> : null}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                {/* 头部问候 */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>你好，{userNickname || '用户'} 👋</Text>
                        <Text style={styles.subtitle}>今天感觉怎么样？</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarButton} onPress={() => tabNavigation.navigate('我的')}>
                        <Ionicons name="person-circle" size={44} color={Colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* 预警提示 */}
                {alerts.length > 0 && (
                    <View style={styles.alertsSection}>
                        {alerts.map((alert, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.alertCard,
                                    alert.level === 'danger' ? styles.alertDanger : styles.alertCaution,
                                ]}
                            >
                                <Ionicons
                                    name={alert.level === 'danger' ? 'warning' : 'alert-circle'}
                                    size={20}
                                    color={alert.level === 'danger' ? Colors.danger : Colors.caution}
                                />
                                <Text style={[
                                    styles.alertText,
                                    { color: alert.level === 'danger' ? Colors.danger : '#92400E' }
                                ]}>
                                    {alert.message}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 快速操作 */}
                <Text style={styles.sectionTitle}>快速记录</Text>
                <View style={styles.quickActions}>
                    <QuickAction
                        icon="analytics" label="记录PSA"
                        color={Colors.modulePSA} bgColor={Colors.modulePSA + '10'}
                        onPress={() => tabNavigation.navigate('PSA')}
                    />
                    <QuickAction
                        icon="fitness" label="记录睾酮"
                        color={Colors.moduleTestosterone} bgColor={Colors.moduleTestosterone + '10'}
                        onPress={() => parentNavigation.navigate('Testosterone')}
                    />
                    <QuickAction
                        icon="medical" label="诊疗记录"
                        color={Colors.moduleInjection} bgColor={Colors.moduleInjection + '10'}
                        onPress={() => tabNavigation.navigate('诊疗')}
                    />
                    <QuickAction
                        icon="images" label="影像记录"
                        color={Colors.moduleImaging} bgColor={Colors.moduleImaging + '10'}
                        onPress={() => parentNavigation.navigate('Imaging')}
                    />
                </View>

                {/* 最新数据概览 */}
                <Text style={styles.sectionTitle}>最新数据</Text>
                <View style={styles.dataCardsRow}>
                    <DataCard
                        title="PSA"
                        value={data?.latestPsa?.value}
                        unit={data?.latestPsa?.unit || 'ng/mL'}
                        subtitle={data?.latestPsa ? formatDateCN(data.latestPsa.test_date) : null}
                        icon="analytics"
                        color={Colors.modulePSA}
                        onPress={() => tabNavigation.navigate('PSA')}
                    />
                    <DataCard
                        title="睾酮"
                        value={data?.latestTestosterone?.value}
                        unit={data?.latestTestosterone?.unit || 'ng/dL'}
                        subtitle={data?.latestTestosterone ? formatDateCN(data.latestTestosterone.test_date) : null}
                        icon="fitness"
                        color={Colors.moduleTestosterone}
                        onPress={() => parentNavigation.navigate('Testosterone')}
                    />
                </View>

                {/* 治疗提醒 */}
                {data?.latestInjection && (
                    <>
                        <Text style={styles.sectionTitle}>治疗信息</Text>
                        <TouchableOpacity
                            style={styles.treatmentCard}
                            onPress={() => tabNavigation.navigate('诊疗')}
                            activeOpacity={0.7}
                        >
                            <View style={styles.treatmentHeader}>
                                <View style={[styles.treatmentIcon, { backgroundColor: Colors.moduleInjection + '15' }]}>
                                    <Ionicons name="medical" size={22} color={Colors.moduleInjection} />
                                </View>
                                <View style={styles.treatmentInfo}>
                                    <Text style={styles.treatmentDrug}>{data.latestInjection.drug_name}</Text>
                                    <Text style={styles.treatmentType}>{data.latestInjection.dosage_type}剂型</Text>
                                </View>
                            </View>
                            <View style={styles.treatmentDates}>
                                <View style={styles.treatmentDateItem}>
                                    <Text style={styles.treatmentDateLabel}>上次注射</Text>
                                    <Text style={styles.treatmentDateValue}>
                                        {formatDateCN(data.latestInjection.injection_date)}
                                    </Text>
                                </View>
                                <View style={styles.treatmentDateDivider} />
                                <View style={styles.treatmentDateItem}>
                                    <Text style={styles.treatmentDateLabel}>下次注射</Text>
                                    <Text style={[styles.treatmentDateValue, { color: Colors.primary }]}>
                                        {formatDateCN(data.latestInjection.next_due_date)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </>
                )}

                {/* 记录统计 */}
                <Text style={styles.sectionTitle}>记录统计</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{data?.psaCount || 0}</Text>
                        <Text style={styles.statLabel}>PSA 检测</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{data?.testosteroneCount || 0}</Text>
                        <Text style={styles.statLabel}>睾酮检测</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {(data?.latestImaging ? 1 : 0)}
                        </Text>
                        <Text style={styles.statLabel}>影像检查</Text>
                    </View>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    avatarButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertsSection: {
        marginBottom: 20,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 14,
        borderRadius: Radius.md,
        marginBottom: 8,
        gap: 10,
    },
    alertDanger: {
        backgroundColor: Colors.dangerLight,
    },
    alertCaution: {
        backgroundColor: Colors.cautionLight,
    },
    alertText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 14,
        marginTop: 4,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    quickAction: {
        width: '23%',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: Radius.lg,
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    dataCardsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    dataCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 16,
        ...Shadows.small,
    },
    dataCardIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    dataCardTitle: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
        marginBottom: 6,
    },
    dataCardValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    dataCardValue: {
        fontSize: 26,
        fontWeight: '800',
    },
    dataCardUnit: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    dataCardEmpty: {
        fontSize: 14,
        color: Colors.textTertiary,
        marginTop: 2,
    },
    dataCardSubtitle: {
        fontSize: 11,
        color: Colors.textTertiary,
        marginTop: 4,
    },
    treatmentCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 18,
        marginBottom: 24,
        ...Shadows.small,
    },
    treatmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    treatmentIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    treatmentInfo: {},
    treatmentDrug: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    treatmentType: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    treatmentDates: {
        flexDirection: 'row',
        backgroundColor: Colors.background,
        borderRadius: Radius.md,
        padding: 14,
    },
    treatmentDateItem: {
        flex: 1,
        alignItems: 'center',
    },
    treatmentDateDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 8,
    },
    treatmentDateLabel: {
        fontSize: 12,
        color: Colors.textTertiary,
        marginBottom: 4,
    },
    treatmentDateValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 20,
        marginBottom: 16,
        ...Shadows.small,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
});
