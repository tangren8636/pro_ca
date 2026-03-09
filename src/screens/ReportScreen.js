// 综合报告页面
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors, Radius, Shadows } from '../theme';
import { getPsaRecords, getTestosteroneRecords, getImagingRecords, getInjectionRecords, calculatePSADT, checkBiochemicalRecurrence, checkCastrationResistance } from '../database';
import { formatDateCN, getToday } from '../utils/dateUtils';

export default function ReportScreen({ userId, userNickname }) {
    const [psaRecords, setPsaRecords] = useState([]);
    const [tRecords, setTRecords] = useState([]);
    const [imagingRecords, setImagingRecords] = useState([]);
    const [injectionRecords, setInjectionRecords] = useState([]);
    const [generating, setGenerating] = useState(false);

    const loadData = async () => {
        try {
            setPsaRecords(await getPsaRecords(userId));
            setTRecords(await getTestosteroneRecords(userId));
            setImagingRecords(await getImagingRecords(userId));
            setInjectionRecords(await getInjectionRecords(userId));
        } catch (error) {
            console.error('加载数据失败:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, [userId]));

    const generateReport = async () => {
        setGenerating(true);
        try {
            const psadt = calculatePSADT(psaRecords);
            const psaWarning = checkBiochemicalRecurrence(psaRecords);
            const crpcWarning = checkCastrationResistance(tRecords, psaRecords);

            const sortedPsa = [...psaRecords].sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
            const sortedT = [...tRecords].sort((a, b) => new Date(b.test_date) - new Date(a.test_date));
            const sortedImaging = [...imagingRecords].sort((a, b) => new Date(b.exam_date) - new Date(a.exam_date));
            const sortedInjection = [...injectionRecords].sort((a, b) => new Date(b.injection_date) - new Date(a.injection_date));

            const html = `
        <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #1a1d21; padding: 30px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0D7C66; padding-bottom: 20px; }
            .header h1 { font-size: 22px; color: #0D7C66; margin-bottom: 6px; }
            .header .subtitle { font-size: 14px; color: #5f6b7a; }
            .header .date { font-size: 12px; color: #9ba5b1; margin-top: 8px; }
            .section { margin-bottom: 24px; }
            .section-title { font-size: 16px; font-weight: 700; color: #0D7C66; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e8ecf0; }
            .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px 14px; margin-bottom: 14px; border-radius: 4px; font-size: 13px; color: #dc2626; }
            .caution-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 14px; margin-bottom: 14px; border-radius: 4px; font-size: 13px; color: #92400e; }
            .info-box { background: #e6faf5; border-left: 4px solid #0d7c66; padding: 10px 14px; margin-bottom: 14px; border-radius: 4px; font-size: 13px; color: #065f4e; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 13px; }
            th { background: #f1f4f8; padding: 8px 12px; text-align: left; font-weight: 600; border: 1px solid #e8ecf0; }
            td { padding: 8px 12px; border: 1px solid #e8ecf0; }
            .highlight { color: #ef4444; font-weight: 600; }
            .good { color: #10b981; font-weight: 600; }
            .metric { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-right: 8px; }
            .metric-primary { background: #e6faf5; color: #0d7c66; }
            .footer { text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e8ecf0; font-size: 11px; color: #9ba5b1; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 前列腺癌随访报告</h1>
            <div class="subtitle">${userNickname || '患者'}</div>
            <div class="date">生成日期：${formatDateCN(getToday())}</div>
          </div>

          ${psaWarning.warning ? `<div class="${psaWarning.level === 'danger' ? 'warning-box' : 'caution-box'}">${psaWarning.message}</div>` : ''}
          ${crpcWarning.warning ? `<div class="warning-box">${crpcWarning.message}</div>` : ''}

          <div class="section">
            <div class="section-title">📊 PSA 数据</div>
            ${psadt ? `<div class="info-box">PSA 倍增时间 (PSADT)：<strong>${psadt} 天</strong> ${psadt < 90 ? '(高风险)' : psadt < 365 ? '(需关注)' : '(相对稳定)'}</div>` : ''}
            ${sortedPsa.length > 0 ? `
              <table>
                <tr><th>日期</th><th>PSA (ng/mL)</th><th>机构</th></tr>
                ${sortedPsa.slice(0, 20).map(r => `
                  <tr>
                    <td>${formatDateCN(r.test_date)}</td>
                    <td class="${r.value > 0.2 ? 'highlight' : 'good'}">${r.value}</td>
                    <td>${r.institution || '-'}</td>
                  </tr>
                `).join('')}
              </table>
            ` : '<p style="color:#9ba5b1;font-size:13px;">暂无 PSA 记录</p>'}
          </div>

          <div class="section">
            <div class="section-title">💉 睾酮数据</div>
            ${sortedT.length > 0 ? `
              <table>
                <tr><th>日期</th><th>睾酮值</th><th>单位</th><th>状态</th></tr>
                ${sortedT.slice(0, 20).map(r => `
                  <tr>
                    <td>${formatDateCN(r.test_date)}</td>
                    <td>${r.value}</td>
                    <td>${r.unit}</td>
                    <td class="${(r.unit === 'ng/dL' ? r.value < 50 : r.value < 1.7) ? 'good' : 'highlight'}">
                      ${(r.unit === 'ng/dL' ? r.value < 50 : r.value < 1.7) ? '去势水平 ✓' : '未达去势'}
                    </td>
                  </tr>
                `).join('')}
              </table>
            ` : '<p style="color:#9ba5b1;font-size:13px;">暂无睾酮记录</p>'}
          </div>

          <div class="section">
            <div class="section-title">🖼 影像学检查</div>
            ${sortedImaging.length > 0 ? `
              <table>
                <tr><th>日期</th><th>类型</th><th>结论</th><th>机构</th></tr>
                ${sortedImaging.slice(0, 10).map(r => `
                  <tr>
                    <td>${formatDateCN(r.exam_date)}</td>
                    <td>${r.type}</td>
                    <td>${r.conclusion}</td>
                    <td>${r.institution || '-'}</td>
                  </tr>
                `).join('')}
              </table>
            ` : '<p style="color:#9ba5b1;font-size:13px;">暂无影像记录</p>'}
          </div>

          <div class="section">
            <div class="section-title">💊 内分泌治疗</div>
            ${sortedInjection.length > 0 ? `
              <table>
                <tr><th>注射日期</th><th>药物</th><th>剂型</th><th>下次预约</th></tr>
                ${sortedInjection.slice(0, 10).map(r => `
                  <tr>
                    <td>${formatDateCN(r.injection_date)}</td>
                    <td>${r.drug_name}</td>
                    <td>${r.dosage_type}</td>
                    <td>${formatDateCN(r.next_due_date)}</td>
                  </tr>
                `).join('')}
              </table>
            ` : '<p style="color:#9ba5b1;font-size:13px;">暂无注射记录</p>'}
          </div>

          <div class="footer">
            <p>本报告由"前列腺癌随访助手"自动生成</p>
            <p>本报告仅供参考，不构成医学诊断或治疗建议，请遵医嘱</p>
          </div>
        </body>
        </html>
      `;

            const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: '分享随访报告',
                UTI: 'com.adobe.pdf',
            });
        } catch (error) {
            Alert.alert('错误', '生成报告失败: ' + error.message);
        } finally {
            setGenerating(false);
        }
    };

    const totalRecords = psaRecords.length + tRecords.length + imagingRecords.length + injectionRecords.length;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>综合报告</Text>
                <Text style={styles.pageSubtitle}>生成完整随访报告并导出分享</Text>

                {/* 报告预览卡片 */}
                <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                        <Ionicons name="document-text" size={36} color={Colors.moduleReport} />
                        <View style={styles.previewTitleArea}>
                            <Text style={styles.previewTitle}>前列腺癌随访报告</Text>
                            <Text style={styles.previewDate}>{formatDateCN(getToday())}</Text>
                        </View>
                    </View>

                    <View style={styles.previewStats}>
                        <View style={styles.previewStat}>
                            <Text style={styles.previewStatValue}>{psaRecords.length}</Text>
                            <Text style={styles.previewStatLabel}>PSA 记录</Text>
                        </View>
                        <View style={styles.previewStatDivider} />
                        <View style={styles.previewStat}>
                            <Text style={styles.previewStatValue}>{tRecords.length}</Text>
                            <Text style={styles.previewStatLabel}>睾酮记录</Text>
                        </View>
                        <View style={styles.previewStatDivider} />
                        <View style={styles.previewStat}>
                            <Text style={styles.previewStatValue}>{imagingRecords.length}</Text>
                            <Text style={styles.previewStatLabel}>影像记录</Text>
                        </View>
                        <View style={styles.previewStatDivider} />
                        <View style={styles.previewStat}>
                            <Text style={styles.previewStatValue}>{injectionRecords.length}</Text>
                            <Text style={styles.previewStatLabel}>注射记录</Text>
                        </View>
                    </View>
                </View>

                {/* 报告内容说明 */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>📋 报告包含内容</Text>
                    <View style={styles.infoList}>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.infoItemText}>全部 PSA 检测数据和趋势分析</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.infoItemText}>睾酮水平数据和去势状态评估</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.infoItemText}>影像学检查结论摘要</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.infoItemText}>内分泌治疗注射记录</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.infoItemText}>临床预警提示（生化复发/去势抵抗）</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                            <Text style={styles.infoItemText}>PSA 倍增时间 (PSADT) 计算结果</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.generateButton, (generating || totalRecords === 0) && styles.generateButtonDisabled]}
                    onPress={generateReport}
                    disabled={generating || totalRecords === 0}
                    activeOpacity={0.8}
                >
                    <Ionicons name={generating ? "hourglass-outline" : "download-outline"} size={22} color="#fff" />
                    <Text style={styles.generateButtonText}>
                        {generating ? '正在生成...' : totalRecords === 0 ? '暂无数据可生成' : '生成并分享 PDF 报告'}
                    </Text>
                </TouchableOpacity>

                <Text style={styles.hint}>
                    生成的 PDF 报告可通过微信、邮件等方式分享给主治医生
                </Text>
                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
    pageSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24 },
    previewCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 20,
        marginBottom: 20, ...Shadows.medium,
    },
    previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    previewTitleArea: { marginLeft: 14 },
    previewTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    previewDate: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    previewStats: {
        flexDirection: 'row', backgroundColor: Colors.background,
        borderRadius: Radius.md, padding: 14,
    },
    previewStat: { flex: 1, alignItems: 'center' },
    previewStatDivider: { width: 1, backgroundColor: Colors.border },
    previewStatValue: { fontSize: 22, fontWeight: '800', color: Colors.moduleReport },
    previewStatLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    infoCard: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 18,
        marginBottom: 24, ...Shadows.small,
    },
    infoTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 14 },
    infoList: { gap: 10 },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoItemText: { flex: 1, fontSize: 14, color: Colors.textSecondary },
    generateButton: {
        flexDirection: 'row', backgroundColor: Colors.moduleReport, borderRadius: Radius.md,
        height: 54, alignItems: 'center', justifyContent: 'center', gap: 10,
        ...Shadows.medium,
    },
    generateButtonDisabled: { opacity: 0.5 },
    generateButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    hint: {
        fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginTop: 14,
        lineHeight: 20,
    },
});
