// 登录页面
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Alert, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadows } from '../theme';
import { loginUser } from '../database';
import * as Crypto from 'expo-crypto';

export default function LoginScreen({ navigation, onLoginSuccess }) {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [phoneFocused, setPhoneFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const handleLogin = async () => {
        if (!phone.trim()) {
            Alert.alert('提示', '请输入手机号');
            return;
        }
        if (!password.trim()) {
            Alert.alert('提示', '请输入密码');
            return;
        }
        if (phone.trim().length !== 11) {
            Alert.alert('提示', '请输入11位手机号');
            return;
        }

        setLoading(true);
        try {
            const hash = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                password
            );
            const user = await loginUser(phone.trim(), hash);
            onLoginSuccess(user);
        } catch (error) {
            Alert.alert('登录失败', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

            {/* 顶部装饰区域 */}
            <View style={styles.headerArea}>
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
                <View style={styles.headerContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="heart-circle" size={52} color="#fff" />
                    </View>
                    <Text style={styles.appName}>前列腺癌随访助手</Text>
                    <Text style={styles.appSlogan}>专业随访管理 · 守护健康每一天</Text>
                </View>
            </View>

            {/* 登录表单 */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formArea}
            >
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>欢迎回来</Text>

                    <View style={styles.inputGroup}>
                        <View style={[styles.inputWrapper, phoneFocused && styles.inputWrapperFocused]}>
                            <Ionicons name="phone-portrait-outline" size={20} color={phoneFocused ? Colors.primary : Colors.textTertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="请输入手机号"
                                placeholderTextColor={Colors.textTertiary}
                                keyboardType="phone-pad"
                                maxLength={11}
                                value={phone}
                                onChangeText={setPhone}
                                onFocus={() => setPhoneFocused(true)}
                                onBlur={() => setPhoneFocused(false)}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                            <Ionicons name="lock-closed-outline" size={20} color={passwordFocused ? Colors.primary : Colors.textTertiary} />
                            <TextInput
                                style={styles.input}
                                placeholder="请输入密码"
                                placeholderTextColor={Colors.textTertiary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
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

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.loginButtonText}>
                            {loading ? '登录中...' : '登 录'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.registerLink}
                        onPress={() => navigation.navigate('Register')}
                    >
                        <Text style={styles.registerLinkText}>
                            还没有账号？<Text style={styles.registerLinkBold}>立即注册</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
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
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -40,
        right: -40,
    },
    decorCircle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.06)',
        bottom: 10,
        left: -30,
    },
    headerContent: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    appSlogan: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    formArea: {
        flex: 1,
        backgroundColor: Colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -20,
    },
    formCard: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 36,
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 28,
    },
    inputGroup: {
        marginBottom: 16,
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
    inputWrapperFocused: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryBg,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        marginLeft: 12,
    },
    loginButton: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        ...Shadows.medium,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 2,
    },
    registerLink: {
        alignItems: 'center',
        marginTop: 24,
    },
    registerLinkText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    registerLinkBold: {
        color: Colors.primary,
        fontWeight: '600',
    },
});
