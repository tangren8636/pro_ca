// 注册页面
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Alert, StatusBar, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadows } from '../theme';
import { registerUser } from '../database';
import * as Crypto from 'expo-crypto';

export default function RegisterScreen({ navigation, onRegisterSuccess }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!phone.trim() || phone.trim().length !== 11) {
            Alert.alert('提示', '请输入正确的11位手机号');
            return;
        }
        if (!password.trim() || password.length < 6) {
            Alert.alert('提示', '密码长度不能少于6位');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('提示', '两次输入的密码不一致');
            return;
        }

        setLoading(true);
        try {
            const hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                password
            );
            const userId = await registerUser(phone.trim(), hash, nickname.trim());
            Alert.alert('注册成功', '欢迎使用前列腺癌随访助手', [
                { text: '去登录', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('注册失败', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            <View style={styles.headerArea}>
                <View style={styles.decorCircle1} />
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>创建新账号</Text>
                    <Text style={styles.headerSubtitle}>填写以下信息完成注册</Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formArea}
            >
                <ScrollView
                    contentContainerStyle={styles.formCard}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>手机号 *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="phone-portrait-outline" size={20} color={Colors.textTertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="请输入11位手机号"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="phone-pad"
                                maxLength={11}
                                value={phone}
                                onChangeText={setPhone}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>昵称（选填）</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color={Colors.textTertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="给自己取个名字吧"
                                placeholderTextColor={Colors.textTertiary}
                                maxLength={20}
                                value={nickname}
                                onChangeText={setNickname}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>设置密码 *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="至少6位密码"
                                placeholderTextColor={Colors.textTertiary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={Colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>确认密码 *</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={Colors.textTertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="请再次输入密码"
                                placeholderTextColor={Colors.textTertiary}
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.registerButtonText}>
                            {loading ? '注册中...' : '注 册'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.agreement}>
                        <Text style={styles.agreementText}>
                            注册即表示同意我们的服务条款和隐私政策
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    headerArea: {
        height: 180,
        justifyContent: 'flex-end',
        paddingBottom: 40,
        paddingHorizontal: 28,
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -30,
        left: -30,
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {},
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 6,
    },
    formArea: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    formCard: {
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 18,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: 16,
        height: 52,
        ...Shadows.small,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        marginLeft: 12,
    },
    registerButton: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        ...Shadows.medium,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 2,
    },
    agreement: {
        alignItems: 'center',
        marginTop: 20,
    },
    agreementText: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
});
