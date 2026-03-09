// 数据库初始化和操作模块
import * as SQLite from 'expo-sqlite';

let db = null;

// 初始化数据库
export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('proca_followup.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      nickname TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS psa_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      value REAL NOT NULL,
      unit TEXT DEFAULT 'ng/mL',
      test_date TEXT NOT NULL,
      institution TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS testosterone_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      value REAL NOT NULL,
      unit TEXT DEFAULT 'ng/dL',
      test_date TEXT NOT NULL,
      institution TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS imaging_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      conclusion TEXT DEFAULT '',
      exam_date TEXT NOT NULL,
      institution TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS injection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      drug_name TEXT NOT NULL,
      dosage_type TEXT NOT NULL,
      injection_date TEXT NOT NULL,
      location TEXT DEFAULT '',
      next_due_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  return db;
}

export function getDb() {
  return db;
}

// ============ 用户操作 ============

export async function registerUser(phone, passwordHash, nickname = '') {
  const existing = await db.getFirstAsync('SELECT id FROM users WHERE phone = ?', [phone]);
  if (existing) {
    throw new Error('该手机号已注册');
  }
  const result = await db.runAsync(
    'INSERT INTO users (phone, password_hash, nickname) VALUES (?, ?, ?)',
    [phone, passwordHash, nickname]
  );
  return result.lastInsertRowId;
}

export async function loginUser(phone, passwordHash) {
  const user = await db.getFirstAsync(
    'SELECT * FROM users WHERE phone = ? AND password_hash = ?',
    [phone, passwordHash]
  );
  if (!user) {
    throw new Error('手机号或密码错误');
  }
  return user;
}

export async function getUserById(userId) {
  return await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [userId]);
}

export async function updateNickname(userId, nickname) {
  await db.runAsync('UPDATE users SET nickname = ? WHERE id = ?', [nickname, userId]);
}

// ============ PSA 记录操作 ============

export async function addPsaRecord(userId, value, unit, testDate, institution) {
  const result = await db.runAsync(
    'INSERT INTO psa_records (user_id, value, unit, test_date, institution) VALUES (?, ?, ?, ?, ?)',
    [userId, value, unit, testDate, institution]
  );
  return result.lastInsertRowId;
}

export async function getPsaRecords(userId, limit = 100) {
  return await db.getAllAsync(
    'SELECT * FROM psa_records WHERE user_id = ? ORDER BY test_date DESC LIMIT ?',
    [userId, limit]
  );
}

export async function deletePsaRecord(recordId) {
  await db.runAsync('DELETE FROM psa_records WHERE id = ?', [recordId]);
}

// ============ 睾酮记录操作 ============

export async function addTestosteroneRecord(userId, value, unit, testDate, institution) {
  const result = await db.runAsync(
    'INSERT INTO testosterone_records (user_id, value, unit, test_date, institution) VALUES (?, ?, ?, ?, ?)',
    [userId, value, unit, testDate, institution]
  );
  return result.lastInsertRowId;
}

export async function getTestosteroneRecords(userId, limit = 100) {
  return await db.getAllAsync(
    'SELECT * FROM testosterone_records WHERE user_id = ? ORDER BY test_date DESC LIMIT ?',
    [userId, limit]
  );
}

export async function deleteTestosteroneRecord(recordId) {
  await db.runAsync('DELETE FROM testosterone_records WHERE id = ?', [recordId]);
}

// ============ 影像学记录操作 ============

export async function addImagingRecord(userId, type, conclusion, examDate, institution, imagePath, notes) {
  const result = await db.runAsync(
    'INSERT INTO imaging_records (user_id, type, conclusion, exam_date, institution, image_path, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, type, conclusion, examDate, institution, imagePath || '', notes || '']
  );
  return result.lastInsertRowId;
}

export async function getImagingRecords(userId, limit = 100) {
  return await db.getAllAsync(
    'SELECT * FROM imaging_records WHERE user_id = ? ORDER BY exam_date DESC LIMIT ?',
    [userId, limit]
  );
}

export async function deleteImagingRecord(recordId) {
  await db.runAsync('DELETE FROM imaging_records WHERE id = ?', [recordId]);
}

// ============ 注射记录操作 ============

export async function addInjectionRecord(userId, drugName, dosageType, injectionDate, location, notes) {
  // 根据剂型计算下次注射日期
  const nextDueDate = calculateNextDueDate(injectionDate, dosageType);
  const result = await db.runAsync(
    'INSERT INTO injection_records (user_id, drug_name, dosage_type, injection_date, location, next_due_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, drugName, dosageType, injectionDate, location || '', nextDueDate, notes || '']
  );
  return result.lastInsertRowId;
}

export async function getInjectionRecords(userId, limit = 100) {
  return await db.getAllAsync(
    'SELECT * FROM injection_records WHERE user_id = ? ORDER BY injection_date DESC LIMIT ?',
    [userId, limit]
  );
}

export async function getLatestInjection(userId) {
  return await db.getFirstAsync(
    'SELECT * FROM injection_records WHERE user_id = ? ORDER BY injection_date DESC LIMIT 1',
    [userId]
  );
}

export async function deleteInjectionRecord(recordId) {
  await db.runAsync('DELETE FROM injection_records WHERE id = ?', [recordId]);
}

// ============ 辅助计算函数 ============

// 计算下次注射日期
function calculateNextDueDate(injectionDate, dosageType) {
  const date = new Date(injectionDate);
  switch (dosageType) {
    case '1月':
      date.setMonth(date.getMonth() + 1);
      break;
    case '3月':
      date.setMonth(date.getMonth() + 3);
      break;
    case '6月':
      date.setMonth(date.getMonth() + 6);
      break;
    default:
      date.setMonth(date.getMonth() + 1);
  }
  return date.toISOString().split('T')[0];
}

// 计算 PSA 倍增时间 (PSADT)
// 使用对数线性回归法：PSADT = ln(2) * Δt / ln(PSA2/PSA1)
export function calculatePSADT(records) {
  if (!records || records.length < 2) return null;
  
  // 按日期升序排列
  const sorted = [...records].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  
  // 取最近的记录进行计算
  const recentRecords = sorted.slice(-Math.min(sorted.length, 5));
  
  if (recentRecords.length < 2) return null;
  
  // 使用最小二乘法拟合 ln(PSA) vs time
  const n = recentRecords.length;
  const t0 = new Date(recentRecords[0].test_date).getTime();
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    const x = (new Date(recentRecords[i].test_date).getTime() - t0) / (1000 * 60 * 60 * 24); // 天数
    const y = Math.log(recentRecords[i].value);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  if (slope <= 0) return null; // PSA 下降时不计算倍增时间
  
  const psadt = Math.LN2 / slope; // 天数
  return Math.round(psadt * 10) / 10; // 保留一位小数
}

// 检查生化复发预警
// 根治术后 PSA > 0.2 ng/mL 连续两次升高
export function checkBiochemicalRecurrence(records) {
  if (!records || records.length < 2) return { warning: false };
  
  const sorted = [...records].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  const recent = sorted.slice(-3);
  
  // 检查最近两次是否连续升高且超过阈值
  if (recent.length >= 2) {
    const last = recent[recent.length - 1];
    const secondLast = recent[recent.length - 2];
    
    if (last.value > 0.2 && secondLast.value > 0.2 && last.value > secondLast.value) {
      return {
        warning: true,
        message: `⚠️ 生化复发预警：最近两次 PSA 值连续升高且超过 0.2 ng/mL（${secondLast.value} → ${last.value}），建议及时就医`,
        level: 'danger'
      };
    }
    
    if (last.value > 0.2) {
      return {
        warning: true,
        message: `⚠ 注意：最近一次 PSA 值为 ${last.value} ng/mL，超过根治术后复发阈值 0.2 ng/mL`,
        level: 'caution'
      };
    }
  }
  
  return { warning: false };
}

// 检查去势抵抗预警
// 睾酮 < 50 ng/dL（去势水平）但 PSA 持续升高
export function checkCastrationResistance(testosteroneRecords, psaRecords) {
  if (!testosteroneRecords || !psaRecords || testosteroneRecords.length < 1 || psaRecords.length < 2) {
    return { warning: false };
  }
  
  const sortedT = [...testosteroneRecords].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  const sortedPSA = [...psaRecords].sort((a, b) => new Date(a.test_date) - new Date(b.test_date));
  
  const latestT = sortedT[sortedT.length - 1];
  const recentPSA = sortedPSA.slice(-3);
  
  // 睾酮已达去势水平
  const isCastrate = latestT.unit === 'ng/dL' ? latestT.value < 50 : latestT.value < 1.7;
  
  if (isCastrate && recentPSA.length >= 2) {
    const psaRising = recentPSA.every((r, i) => i === 0 || r.value >= recentPSA[i - 1].value);
    
    if (psaRising) {
      return {
        warning: true,
        message: '⚠️ 去势抵抗预警：睾酮已达去势水平但 PSA 持续升高，可能已进入 CRPC 阶段，建议及时与医生沟通调整治疗方案',
        level: 'danger'
      };
    }
  }
  
  return { warning: false };
}

// 获取仪表盘综合数据
export async function getDashboardData(userId) {
  const latestPsa = await db.getFirstAsync(
    'SELECT * FROM psa_records WHERE user_id = ? ORDER BY test_date DESC LIMIT 1',
    [userId]
  );
  const latestT = await db.getFirstAsync(
    'SELECT * FROM testosterone_records WHERE user_id = ? ORDER BY test_date DESC LIMIT 1',
    [userId]
  );
  const latestImaging = await db.getFirstAsync(
    'SELECT * FROM imaging_records WHERE user_id = ? ORDER BY exam_date DESC LIMIT 1',
    [userId]
  );
  const latestInjection = await db.getFirstAsync(
    'SELECT * FROM injection_records WHERE user_id = ? ORDER BY injection_date DESC LIMIT 1',
    [userId]
  );
  const psaCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM psa_records WHERE user_id = ?',
    [userId]
  );
  const tCount = await db.getFirstAsync(
    'SELECT COUNT(*) as count FROM testosterone_records WHERE user_id = ?',
    [userId]
  );

  return {
    latestPsa,
    latestTestosterone: latestT,
    latestImaging,
    latestInjection,
    psaCount: psaCount?.count || 0,
    testosteroneCount: tCount?.count || 0,
  };
}
