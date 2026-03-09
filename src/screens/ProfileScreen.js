// 个人中心页面
import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Shadows } from '../theme';
import { getUserById, updateNickname } from '../database';

export default function ProfileScreen({ userId, onLogout }) {
    const [user, setUser] = useState(null);
    const [editing, setEditing] = useState(false);
    const [newNickname, setNewNickname] = useState('');

    const loadUser = async () => {
        try {
            const u = await getUserById(userId);
            setUser(u);
            setNewNickname(u?.nickname || '');
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    };

    useFocusEffect(useCallback(() => { loadUser(); }, [userId]));

    const handleSaveNickname = async () => {
        try {
            await updateNickname(userId, newNickname.trim());
            setEditing(false);
            loadUser();
            Alert.alert('成功', '昵称已更新');
        } catch (error) {
            Alert.alert('错误', '更新失败');
        }
    };

    const handleLogout = () => {
        Alert.alert('确认退出', '您确定要退出登录吗？', [
            { text: '取消', style: 'cancel' },
            { text: '退出', style: 'destructive', onPress: onLogout },
        ]);
    };

    const MenuItem = ({ icon, label, color, onPress, showArrow = true }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuIcon, { backgroundColor: (color || Colors.primary) + '15' }]}>
                <Ionicons name={icon} size={20} color={color || Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{label}</Text>
            {showArrow && <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.pageTitle}>我的</Text>

                {/* 用户信息卡片 */}
                <View style={styles.userCard}>
                    <View style={styles.avatarArea}>
                        <Ionicons name="person-circle" size={64} color={Colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                        {editing ? (
                            <View style={styles.editRow}>
                                <TextInput
                                    style={styles.editInput}
                                    value={newNickname}
                                    onChangeText={setNewNickname}
                                    placeholder="输入昵称"
                                    maxLength={20}
                                />
                                <TouchableOpacity style={styles.editSaveBtn} onPress={handleSaveNickname}>
                                    <Ionicons name="checkmark" size={20} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.editCancelBtn} onPress={() => setEditing(false)}>
                                    <Ionicons name="close" size={20} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.nicknameRow} onPress={() => setEditing(true)}>
                                <Text style={styles.nickname}>{user?.nickname || '未设置昵称'}</Text>
                                <Ionicons name="pencil" size={16} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.phone}>{user?.phone ? `手机号：${user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}` : ''}</Text>
                    </View>
                </View>

                {/* 菜单项 */}
                <View style={styles.menuSection}>
                    <MenuItem icon="shield-checkmark-outline" label="数据安全" color="#10B981"
                        onPress={() => Alert.alert('数据安全', '您的所有数据都安全地存储在手机本地，不会上传到任何服务器。卸载应用会删除所有数据，建议定期导出报告备份。')}
                    />
                    <MenuItem icon="information-circle-outline" label="关于应用" color="#3B82F6"
                        onPress={() => Alert.alert('关于', '前列腺癌随访助手 v1.0.2\n\n专业的前列腺癌随访管理工具，帮助患者更好地管理疾病，提高生活质量。\n\n⚠️ 免责声明：本应用提供的信息和分析仅供参考，不构成医学诊断或治疗建议。任何医疗决策请咨询专业医生。')}
                    />
                    <MenuItem icon="help-circle-outline" label="使用帮助" color="#8B5CF6"
                        onPress={() => Alert.alert('使用帮助', '1. 首页可以查看健康概况和预警\n2. 各模块可以录入检查数据\n3. 长按记录可以删除\n4. 综合报告可导出 PDF 分享给医生\n5. 系统会自动计算 PSADT 和预警')}
                    />
                </View>

                <View style={styles.menuSection}>
                    <MenuItem icon="log-out-outline" label="退出登录" color={Colors.danger}
                        onPress={handleLogout} showArrow={false}
                    />
                </View>

                <Text style={styles.version}>前列腺癌随访助手 v1.0.2</Text>
                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
    userCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
        borderRadius: Radius.lg, padding: 20, marginBottom: 24, ...Shadows.medium,
    },
    avatarArea: { marginRight: 16 },
    userInfo: { flex: 1 },
    nicknameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nickname: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
    phone: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
    editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    editInput: {
        flex: 1, backgroundColor: Colors.background, borderRadius: Radius.sm,
        paddingHorizontal: 12, paddingVertical: 6, fontSize: 15, borderWidth: 1, borderColor: Colors.primary,
    },
    editSaveBtn: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    editCancelBtn: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background,
        alignItems: 'center', justifyContent: 'center',
    },
    menuSection: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        marginBottom: 16, overflow: 'hidden', ...Shadows.small,
    },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16,
        borderBottomWidth: 0.5, borderBottomColor: Colors.borderLight,
    },
    menuIcon: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    menuLabel: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
    version: {
        fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: 20,
    },
});
