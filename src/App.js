import React, { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWSz3ZEZ-gzTVCKvflB43Kx2UMoouF8JE",
  authDomain: "checkinsystem-58299.firebaseapp.com",
  projectId: "checkinsystem-58299",
  storageBucket: "checkinsystem-58299.firebasestorage.app",
  messagingSenderId: "514481199105",
  appId: "1:514481199105:web:c803a5debdafe6c9528800",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const colors = {
  primary: "#6C63FF",
  primaryLight: "#EEEDFF",
  secondary: "#2F2E41",
  success: "#00C851",
  warning: "#FF9800",
  error: "#FF5252",
  background: "#F8F9FA",
  white: "#FFFFFF",
  text: "#2D3748",
  gray: "#A0AEC0",
};

const logoPath = "/logo.jpg";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap');
    body { margin: 0; padding: 0; background: ${colors.background}; font-family: 'Prompt', sans-serif; -webkit-font-smoothing: antialiased; }
    
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .spinner { width: 50px; height: 50px; border: 5px solid ${colors.primaryLight}; border-top: 5px solid ${colors.primary}; border-radius: 50%; animation: spin 1s linear infinite; }

    .app-container { display: flex; min-height: 100vh; }
    .main-content { flex: 1; padding: 20px; padding-bottom: 80px; max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .sidebar { width: 280px; background: white; padding: 24px; display: flex; flex-direction: column; border-right: 1px solid #E2E8F0; position: sticky; top: 0; height: 100vh; box-sizing: border-box; }
    .mobile-nav { display: none; }
    .scanner-box { width: 100%; max-width: 350px; margin: 0 auto; border-radius: 24px; overflow: hidden; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.1); background: black; aspect-ratio: 1/1; }
    .card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid #EFF2F7; }
    
    .tab-btn { flex: 1; padding: 10px; border: none; background: none; font-family: 'Prompt'; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; transition: 0.3s; white-space: nowrap; font-size: 0.9rem; }
    .tab-btn.active { border-bottom: 3px solid ${colors.primary}; color: ${colors.primary}; }
    
    .history-item, .student-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    .history-item:last-child, .student-item:last-child { border-bottom: none; }
    
    .edit-form { background: #f0f2f5; padding: 15px; border-radius: 12px; margin-top: 20px; animation: fadeIn 0.3s; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; width: 100%; margin-bottom: 20px; }
    .stat-card { background: white; padding: 15px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); text-align: center; border: 1px solid #eee; }
    .stat-number { font-size: 1.5rem; font-weight: 700; color: ${colors.secondary}; }
    .stat-label { font-size: 0.8rem; color: ${colors.gray}; }

    .custom-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(3px); animation: fadeIn 0.2s; }
    .custom-modal { background: white; padding: 30px; border-radius: 24px; width: 90%; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); text-align: center; animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-origin: bottom; }
    @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

    .delete-btn { background: #FFEBEE; color: #FF5252; border: none; padding: 5px 10px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; font-weight: 600; transition: 0.2s; }
    .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: white; display: inline-block; min-width: 60px; text-align: center; }

    @media (max-width: 768px) {
      .app-container { flex-direction: column; }
      .sidebar { display: none; }
      .main-content { padding: 16px; padding-bottom: 90px; }
      .mobile-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 12px 24px; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); justify-content: space-around; align-items: center; z-index: 1000; border-top-left-radius: 20px; border-top-right-radius: 20px; }
      .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    }
  `}</style>
);

const LoadingScreen = () => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: colors.white,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div className="spinner"></div>
    <p style={{ marginTop: 20, color: colors.primary, fontWeight: 500 }}>
      กำลังโหลดข้อมูล...
    </p>
  </div>
);

const CustomModal = ({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  inputMode,
}) => {
  const [inputValue, setInputValue] = useState("");
  if (!isOpen) return null;

  let icon = "ℹ️";
  let confirmColor = colors.primary;
  if (type === "success") {
    icon = "✅";
    confirmColor = colors.success;
  }
  if (type === "error") {
    icon = "❌";
    confirmColor = colors.error;
  }
  if (type === "warning") {
    icon = "⚠️";
    confirmColor = colors.warning;
  }
  if (type === "confirm") {
    icon = "❓";
    confirmColor = colors.warning;
  }
  if (type === "input") {
    icon = "🔐";
  }

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <div
          style={{
            fontSize: "3rem",
            marginBottom: 15,
            display: "inline-block",
          }}
        >
          {icon}
        </div>
        <h3
          style={{
            margin: "0 0 10px 0",
            color: colors.secondary,
            fontSize: "1.2rem",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 25px 0",
            color: colors.gray,
            fontSize: "0.95rem",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        {inputMode && (
          <input
            style={{ ...commonStyles.input, marginTop: 0, marginBottom: 20 }}
            placeholder="กรอกข้อมูล..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            style={{
              ...commonStyles.btnPrimary,
              margin: 0,
              background: confirmColor,
              width: "auto",
              minWidth: 100,
            }}
            onClick={() => onConfirm(inputValue)}
          >
            ตกลง
          </button>
          {(type === "confirm" || onCancel) && (
            <button
              style={{
                ...commonStyles.btnSecondary,
                margin: 0,
                background: "#eee",
                color: "#555",
              }}
              onClick={onCancel}
            >
              ยกเลิก
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState("login");
  const [authLoading, setAuthLoading] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: null,
  });

  const showAlert = (
    type,
    title,
    message,
    onConfirm = () => {},
    onCancel = null,
    inputMode = false
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: (val) => {
        setModal((p) => ({ ...p, isOpen: false }));
        onConfirm(val);
      },
      onCancel: onCancel
        ? () => {
            setModal((p) => ({ ...p, isOpen: false }));
            onCancel();
          }
        : null,
      inputMode,
    });
  };

  useEffect(() => {
    const img = new Image();
    img.src = logoPath;
    img.onload = () => setImageReady(true);
    img.onerror = () => setImageReady(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.isDeleted) {
            await signOut(auth);
            setUser(null);
            setCurrentPage("login");
            showAlert(
              "error",
              "เข้าสู่ระบบไม่ได้",
              "บัญชีของคุณถูกลบออกจากระบบแล้ว"
            );
          } else {
            setUser({ ...firebaseUser, ...userData });
          }
        } else {
          await signOut(auth);
          setUser(null);
          setCurrentPage("login");
        }
      } else {
        setUser(null);
        setCurrentPage("login");
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentPage("login");
  };

  if (authLoading || !imageReady)
    return (
      <>
        <GlobalStyle />
        <LoadingScreen />
      </>
    );

  return (
    <>
      <GlobalStyle />
      <CustomModal {...modal} />
      {user ? (
        <DashboardLayout
          user={user}
          setUser={setUser}
          onLogout={handleLogout}
          showAlert={showAlert}
        />
      ) : (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 400, textAlign: "center" }}
          >
            <img
              src={logoPath}
              alt="Logo"
              style={{ height: 80, marginBottom: 20, objectFit: "contain" }}
            />
            <h2
              style={{
                color: colors.primary,
                marginBottom: 30,
                fontSize: "1.5rem",
                marginTop: 0,
              }}
            >
              ระบบเช็คชื่อนักศึกษา
            </h2>
            {currentPage === "login" && (
              <LoginPage
                onSwitch={() => setCurrentPage("register")}
                showAlert={showAlert}
              />
            )}
            {currentPage === "register" && (
              <RegisterPage
                onRegisterSuccess={() => setCurrentPage("login")}
                onSwitch={() => setCurrentPage("login")}
                showAlert={showAlert}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DashboardLayout({ user, setUser, onLogout, showAlert }) {
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().isDeleted) {
        showAlert("error", "Session Expired", "บัญชีของคุณถูกระงับการใช้งาน");
        onLogout();
      }
    });
    return () => unsub();
  }, [user.uid]);

  return (
    <div className="app-container">
      <div className="sidebar">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            marginBottom: 40,
          }}
        >
          <img
            src={logoPath}
            alt="Logo"
            style={{
              height: 50,
              width: 50,
              objectFit: "cover",
              borderRadius: 12,
            }}
          />
          <div>
            <h2
              style={{
                color: colors.primary,
                margin: 0,
                fontSize: "1.1rem",
                lineHeight: 1.2,
              }}
            >
              ระบบเช็คชื่อ
              <br />
              นักศึกษา
            </h2>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          <NavItem
            icon="🏠"
            label="หน้าหลัก"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <NavItem
            icon="✅"
            label={user.role === "teacher" ? "ระบบเช็คชื่อ" : "สแกนเข้าเรียน"}
            active={activeTab === "checkin"}
            onClick={() => setActiveTab("checkin")}
          />
        </nav>
        <div
          style={{
            cursor: "pointer",
            color: "#FF5252",
            padding: 12,
            display: "flex",
            gap: 10,
            fontWeight: 500,
          }}
          onClick={onLogout}
        >
          <span>🚪</span> ออกจากระบบ
        </div>
      </div>

      <div className="main-content">
        <div className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src={logoPath}
              alt="Logo"
              style={{
                height: 40,
                width: 40,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  color: colors.secondary,
                }}
              >
                ระบบเช็คชื่อนักศึกษา
              </h2>
              <span style={{ fontSize: "0.8rem", color: colors.gray }}>
                สวัสดี, {user.name || user.email}
              </span>
              {user.role === "student" && (
                <span
                  style={{
                    display: "block",
                    fontSize: "0.7rem",
                    color: colors.primary,
                  }}
                >
                  ระดับ: {user.level} เลขที่: {user.studentId}
                </span>
              )}
            </div>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              background: colors.primaryLight,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
            }}
          >
            {user.role === "teacher" ? "👩‍🏫" : "👨‍🎓"}
          </div>
        </div>

        <div
          className="card"
          style={{
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent:
              activeTab === "dashboard" ? "flex-start" : "flex-start",
          }}
        >
          {activeTab === "dashboard" ? (
            user.role === "teacher" ? (
              <TeacherView initialView="dashboard" showAlert={showAlert} />
            ) : (
              <div style={{ textAlign: "center", marginTop: 50 }}>
                <h3 style={{ color: colors.primary }}>ยินดีต้อนรับ!</h3>
                <p style={{ color: colors.gray }}>
                  เลือกเมนู "สแกนเข้าเรียน" เพื่อเริ่มเช็คชื่อ
                </p>
                <p
                  style={{
                    color: colors.error,
                    fontSize: "0.9rem",
                    marginTop: 20,
                  }}
                >
                  *เช็คชื่อก่อน 07:50 น. ถือว่ามาปกติ
                </p>
                <div style={{ fontSize: "3rem", marginTop: 10 }}>🎓</div>
              </div>
            )
          ) : (
            <>
              <h3 style={{ marginBottom: 20, color: colors.primary }}>
                {user.role === "teacher"
                  ? "QR Code & จัดการ"
                  : "เช็คชื่อ & ประวัติ"}
              </h3>
              {user.role === "teacher" ? (
                <TeacherView initialView="list" showAlert={showAlert} />
              ) : (
                <StudentView
                  user={user}
                  setUser={setUser}
                  showAlert={showAlert}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="mobile-nav">
        <MobileNavItem
          icon="🏠"
          label="หน้าหลัก"
          active={activeTab === "dashboard"}
          onClick={() => setActiveTab("dashboard")}
        />
        <div
          onClick={() => setActiveTab("checkin")}
          style={{
            width: 60,
            height: 60,
            background: colors.primary,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "1.8rem",
            marginTop: -40,
            boxShadow: "0 8px 20px rgba(108, 99, 255, 0.4)",
            border: "4px solid white",
          }}
        >
          📷
        </div>
        <MobileNavItem icon="🚪" label="ออก" onClick={onLogout} />
      </div>
    </div>
  );
}

function StudentView({ user, setUser, showAlert }) {
  const [viewState, setViewState] = useState("scan");
  const [history, setHistory] = useState([]);
  const [editForm, setEditForm] = useState({
    name: user.name,
    level: user.level,
    studentId: user.studentId,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (viewState === "history") {
      const q = query(
        collection(db, "attendance_logs"),
        where("studentUid", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const logs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setHistory(logs);
        },
        (error) => {
          console.error(error);
          if (error.message.includes("index")) {
            showAlert(
              "error",
              "ระบบขัดข้อง",
              "กรุณาแจ้งอาจารย์: ขาด Index ประวัติ"
            );
          }
        }
      );
      return () => unsubscribe();
    }
  }, [viewState, user.uid]);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: editForm.name,
        level: editForm.level,
        studentId: editForm.studentId,
      });
      setUser({ ...user, ...editForm });
      showAlert("success", "เรียบร้อย", "บันทึกข้อมูลสำเร็จ");
      setViewState("scan");
    } catch (error) {
      showAlert("error", "ผิดพลาด", error.message);
    }
    setIsSaving(false);
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          style={{
            ...commonStyles.btnSmall,
            background: viewState === "scan" ? colors.primary : "#eee",
            color: viewState === "scan" ? "white" : "#555",
          }}
          onClick={() => setViewState("scan")}
        >
          สแกน
        </button>
        <button
          style={{
            ...commonStyles.btnSmall,
            background: viewState === "history" ? colors.primary : "#eee",
            color: viewState === "history" ? "white" : "#555",
          }}
          onClick={() => setViewState("history")}
        >
          ประวัติ
        </button>
        <button
          style={{
            ...commonStyles.btnSmall,
            background: viewState === "edit" ? colors.primary : "#eee",
            color: viewState === "edit" ? "white" : "#555",
          }}
          onClick={() => setViewState("edit")}
        >
          แก้ไขข้อมูล
        </button>
      </div>
      {viewState === "scan" && (
        <ScannerComponent user={user} showAlert={showAlert} />
      )}
      {viewState === "history" && (
        <div
          style={{
            width: "100%",
            maxHeight: 300,
            overflowY: "auto",
            background: "#f9f9f9",
            borderRadius: 10,
          }}
        >
          {history.length === 0 ? (
            <p style={{ textAlign: "center", padding: 20, color: colors.gray }}>
              ยังไม่มีประวัติการเช็คชื่อ
            </p>
          ) : (
            history.map((log) => (
              <div key={log.id} className="history-item">
                <div>
                  <span style={{ display: "block", fontSize: "0.85rem" }}>
                    {log.timestamp
                      ? log.timestamp.toDate().toLocaleDateString("th-TH")
                      : "-"}{" "}
                    {log.timestamp
                      ? log.timestamp
                          .toDate()
                          .toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      : "-"}
                  </span>
                  <span style={{ fontWeight: 600, color: colors.primary }}>
                    {log.subjectCode}
                  </span>
                </div>
                <div>
                  {log.status === "late" ? (
                    <span
                      style={{
                        ...commonStyles.statusBadge,
                        background: colors.warning,
                      }}
                    >
                      สาย
                    </span>
                  ) : (
                    <span
                      style={{
                        ...commonStyles.statusBadge,
                        background: colors.success,
                      }}
                    >
                      ทันเวลา
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {viewState === "edit" && (
        <div className="edit-form" style={{ width: "100%" }}>
          <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            ชื่อ-สกุล
          </label>
          <input
            style={commonStyles.input}
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            ระดับชั้น
          </label>
          <select
            style={commonStyles.input}
            value={editForm.level}
            onChange={(e) =>
              setEditForm({ ...editForm, level: e.target.value })
            }
          >
            <option value="ปวช.1">ปวช.1</option>
            <option value="ปวช.2">ปวช.2</option>
            <option value="ปวช.3">ปวช.3</option>
            <option value="ปวส.1">ปวส.1</option>
            <option value="ปวส.2">ปวส.2</option>
          </select>
          <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>เลขที่</label>
          <input
            style={commonStyles.input}
            type="number"
            value={editForm.studentId}
            onChange={(e) =>
              setEditForm({ ...editForm, studentId: e.target.value })
            }
          />
          <button
            style={commonStyles.btnPrimary}
            onClick={handleUpdateProfile}
            disabled={isSaving}
          >
            {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
          </button>
        </div>
      )}
    </div>
  );
}

function ScannerComponent({ user, showAlert }) {
  const [status, setStatus] = useState("idle");
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (status === "success") return;

    const timeoutId = setTimeout(async () => {
      if (!document.getElementById("reader")) return;

      if (scannerRef.current) {
        if (isRunningRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) {}
          isRunningRef.current = false;
        }
        try {
          await scannerRef.current.clear();
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      try {
            await html5QrCode.start(
                { facingMode: "environment" },
                { 
                    fps: 10, 
                    
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                       
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        
                        const size = Math.floor(minEdge * 0.85);
                       
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0 
                    
                }, 
                async (decodedText) => { 
                    if (isRunningRef.current) {
                        try { 
                            await html5QrCode.stop(); 
                        } catch (e) {}
                        isRunningRef.current = false;
                    }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            try {
              const q = query(
                collection(db, "attendance_logs"),
                where("studentUid", "==", user.uid),
                where("timestamp", ">=", today)
              );
              const snap = await getDocs(q);

              if (!snap.empty) {
                showAlert(
                  "warning",
                  "แจ้งเตือน",
                  "วันนี้คุณเช็คชื่อไปแล้วครับ!",
                  () => setStatus("idle")
                );
                return;
              }

              const now = new Date();
              const limit = new Date();
              limit.setHours(7, 50, 0, 0);
              const isLate = now > limit;
              const statusText = isLate ? "late" : "present";

              setStatus("success");
              await addDoc(collection(db, "attendance_logs"), {
                studentUid: user.uid,
                studentName: user.name,
                level: user.level || "-",
                studentId: user.studentId || "-",
                subjectCode: decodedText,
                status: statusText,
                timestamp: serverTimestamp(),
              });
              showAlert("success", "สำเร็จ", "เช็คชื่อเรียบร้อยแล้ว!", () =>
                setStatus("success")
              );
            } catch (err) {
              console.error(err);
              if (err.message.includes("requires an index")) {
                showAlert(
                  "error",
                  "ระบบขัดข้อง",
                  "กรุณาแจ้งอาจารย์ให้สร้าง Database Index"
                );
              } else {
                showAlert("error", "ผิดพลาด", err.message);
              }
              setStatus("idle");
            }
          },
          () => {}
        );
        isRunningRef.current = true;
        setStatus("scanning");
      } catch (err) {
        console.warn("Camera start failed", err);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current
          .stop()
          .catch((err) => {})
          .then(() => {
            scannerRef.current.clear();
            isRunningRef.current = false;
          });
      }
    };
  }, [status, user]);

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", animation: "fadeIn 0.5s" }}>
        <div
          style={{
            width: 80,
            height: 80,
            background: colors.success,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            fontSize: "2.5rem",
            color: "white",
          }}
        >
          ✓
        </div>
        <h3 style={{ color: colors.text, margin: 0 }}>เช็คชื่อเรียบร้อย!</h3>
        <button
          onClick={() => setStatus("idle")}
          style={commonStyles.btnSecondary}
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  if (status === "scanning") {
    return (
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="scanner-box">
          <div id="reader" style={{ width: "100%", height: "100%" }}></div>
        </div>
        <p style={{ marginTop: 20, color: colors.gray, fontSize: "0.9rem" }}>
          กำลังค้นหากล้อง...
        </p>
        <button
          onClick={() => setStatus("idle")}
          style={{
            ...commonStyles.btnSecondary,
            background: "#eee",
            color: "#555",
          }}
        >
          ยกเลิก
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: 20 }}>
      <div style={{ fontSize: "3rem", marginBottom: 10 }}>📷</div>
      <button
        onClick={() => setStatus("scanning")}
        style={commonStyles.btnPrimary}
      >
        เริ่มสแกน QR Code
      </button>
    </div>
  );
}

function TeacherView({ initialView = "dashboard", showAlert }) {
  const [qrValue, setQrValue] = useState("Loading...");
  const [timeLeft, setTimeLeft] = useState(60);
  const [viewTab, setViewTab] = useState("present");
  const [allStudents, setAllStudents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedLevel, setSelectedLevel] = useState("all");

  useEffect(() => {
    const generateQR = () => {
      setQrValue(Math.random().toString(36).substring(7).toUpperCase());
      setTimeLeft(60);
    };
    generateQR();
    const interval = setInterval(generateQR, 60000);
    const timer = setInterval(
      () => setTimeLeft((p) => (p > 0 ? p - 1 : 0)),
      1000
    );
    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "student"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllStudents(
        snapshot.docs
          .map((doc) => ({ uid: doc.id, ...doc.data() }))
          .filter((s) => !s.isDeleted)
      );
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "attendance_logs"),
      (snapshot) => {
        const filteredLogs = snapshot.docs
          .map((doc) => doc.data())
          .filter((log) => {
            if (!log.timestamp) return false;
            const logDate = log.timestamp.toDate();
            const targetDate = new Date(selectedDate);
            return (
              logDate.getDate() === targetDate.getDate() &&
              logDate.getMonth() === targetDate.getMonth() &&
              logDate.getFullYear() === targetDate.getFullYear()
            );
          });
        setLogs(filteredLogs);
      }
    );
    return () => unsubscribe();
  }, [selectedDate]);

  const handleDeleteUser = async (studentId, studentName) => {
    showAlert(
      "confirm",
      "ยืนยันการลบ",
      `คุณแน่ใจหรือไม่ว่าจะลบบัญชีนักเรียน: ${studentName}?`,
      async () => {
        try {
          await updateDoc(doc(db, "users", studentId), { isDeleted: true });
          showAlert("success", "สำเร็จ", "ลบข้อมูลนักเรียนเรียบร้อยแล้ว");
        } catch (error) {
          showAlert("error", "ผิดพลาด", error.message);
        }
      },
      () => {}
    );
  };

  const filteredStudents = allStudents.filter(
    (s) => selectedLevel === "all" || s.level === selectedLevel
  );
  const studentLogMap = {};
  logs.forEach((log) => (studentLogMap[log.studentUid] = log));

  const presentList = [];
  const lateList = [];
  const absentList = [];

  filteredStudents.forEach((student) => {
    const log = studentLogMap[student.uid];
    if (log) {
      const item = {
        ...student,
        displayTime: log.timestamp
          .toDate()
          .toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        logStatus: log.status,
      };
      if (log.status === "late") lateList.push(item);
      else presentList.push(item);
    } else {
      absentList.push(student);
    }
  });

  const exportCSV = async () => {
    let csvContent =
      "data:text/csv;charset=utf-8,\uFEFFDate,Time,Student Name,Student ID,Level,Status\n";
    [...presentList, ...lateList].forEach((item) => {
      const st = item.logStatus
        ? item.logStatus === "late"
          ? "Late"
          : "Present"
        : "Present";
      csvContent += `${selectedDate},${item.displayTime},${item.name},${item.studentId},${item.level},${st}\n`;
    });
    absentList.forEach((item) => {
      csvContent += `${selectedDate},-,${item.name},${item.studentId},${item.level},Absent\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `attendance_${selectedDate}_${selectedLevel}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (initialView === "dashboard") {
    return (
      <div style={{ width: "100%", padding: "0 10px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0, color: colors.secondary }}>ภาพรวม</h3>
            <input
              type="date"
              style={{
                ...commonStyles.input,
                width: "auto",
                margin: 0,
                padding: "5px 10px",
              }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <select
            style={{ ...commonStyles.input, margin: 0 }}
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="all">ทุกระดับชั้น</option>
            <option value="ปวช.1">ปวช.1</option>
            <option value="ปวช.2">ปวช.2</option>
            <option value="ปวช.3">ปวช.3</option>
            <option value="ปวส.1">ปวส.1</option>
            <option value="ปวส.2">ปวส.2</option>
          </select>
        </div>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-number" style={{ color: colors.primary }}>
              {filteredStudents.length}
            </div>
            <div className="stat-label">ทั้งหมด</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: colors.success }}>
              {presentList.length}
            </div>
            <div className="stat-label">มาปกติ</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: colors.warning }}>
              {lateList.length}
            </div>
            <div className="stat-label">มาสาย</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: colors.error }}>
              {absentList.length}
            </div>
            <div className="stat-label">ขาด</div>
          </div>
        </div>
        <button
          onClick={exportCSV}
          style={{
            ...commonStyles.btnSmall,
            background: colors.success,
            color: "white",
            width: "100%",
          }}
        >
          📄 Export Report ({selectedDate})
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          marginBottom: 15,
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        <select
          style={{ padding: 5, borderRadius: 5, border: "1px solid #ccc" }}
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="all">ทุกระดับชั้น</option>
          <option value="ปวช.1">ปวช.1</option>
          <option value="ปวช.2">ปวช.2</option>
          <option value="ปวช.3">ปวช.3</option>
          <option value="ปวส.1">ปวส.1</option>
          <option value="ปวส.2">ปวส.2</option>
        </select>
        <input
          type="date"
          style={{ padding: 5, borderRadius: 5, border: "1px solid #ccc" }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {selectedDate === new Date().toISOString().split("T")[0] && (
        <div
          style={{
            padding: 20,
            border: `2px dashed ${colors.primary}`,
            borderRadius: 20,
            marginBottom: 10,
          }}
        >
          <QRCode value={qrValue} size={150} fgColor={colors.secondary} />
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: colors.secondary,
              letterSpacing: 2,
              marginTop: 10,
            }}
          >
            {qrValue}
          </div>
          <p
            style={{ color: colors.gray, marginBottom: 0, fontSize: "0.8rem" }}
          >
            เปลี่ยนรหัสใน{" "}
            <span style={{ color: colors.primary, fontWeight: 600 }}>
              {timeLeft}
            </span>{" "}
            วินาที
          </p>
        </div>
      )}

      <div
        style={{
          width: "100%",
          background: "#f9f9f9",
          borderRadius: 15,
          padding: 15,
          textAlign: "left",
        }}
      >
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #ddd",
            marginBottom: 10,
            overflowX: "auto",
            gap: 5,
          }}
        >
          <button
            className={`tab-btn ${viewTab === "present" ? "active" : ""}`}
            onClick={() => setViewTab("present")}
          >
            ปกติ ({presentList.length})
          </button>
          <button
            className={`tab-btn ${viewTab === "late" ? "active" : ""}`}
            onClick={() => setViewTab("late")}
          >
            สาย ({lateList.length})
          </button>
          <button
            className={`tab-btn ${viewTab === "absent" ? "active" : ""}`}
            onClick={() => setViewTab("absent")}
          >
            ขาด ({absentList.length})
          </button>
          <button
            className={`tab-btn ${viewTab === "all" ? "active" : ""}`}
            onClick={() => setViewTab("all")}
          >
            จัดการ
          </button>
        </div>

        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {viewTab === "present" &&
            (presentList.length > 0 ? (
              presentList.map((item) => (
                <div key={item.uid} className="student-item">
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <div style={{ fontSize: "0.8rem", color: colors.gray }}>
                      ชั้น: {item.level} เลขที่: {item.studentId}
                    </div>
                  </div>
                  <span style={{ color: colors.success }}>
                    ✓ {item.displayTime}
                  </span>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: colors.gray,
                  fontSize: "0.8rem",
                }}
              >
                ว่างเปล่า
              </p>
            ))}
          {viewTab === "late" &&
            (lateList.length > 0 ? (
              lateList.map((item) => (
                <div key={item.uid} className="student-item">
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <div style={{ fontSize: "0.8rem", color: colors.gray }}>
                      ชั้น: {item.level} เลขที่: {item.studentId}
                    </div>
                  </div>
                  <span style={{ color: colors.warning }}>
                    สาย {item.displayTime}
                  </span>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: colors.gray,
                  fontSize: "0.8rem",
                }}
              >
                ไม่มีคนสาย
              </p>
            ))}
          {viewTab === "absent" &&
            (absentList.length > 0 ? (
              absentList.map((item) => (
                <div key={item.uid} className="student-item">
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <div style={{ fontSize: "0.8rem", color: colors.gray }}>
                      ชั้น: {item.level} เลขที่: {item.studentId}
                    </div>
                  </div>
                  <span style={{ color: colors.error }}>ขาด</span>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: colors.success,
                  fontSize: "0.8rem",
                }}
              >
                มาครบ!
              </p>
            ))}
          {viewTab === "all" &&
            (filteredStudents.length > 0 ? (
              filteredStudents.map((item) => (
                <div key={item.uid} className="student-item">
                  <div>
                    <span style={{ fontWeight: 600 }}>{item.name}</span>
                    <div style={{ fontSize: "0.8rem", color: colors.gray }}>
                      ชั้น: {item.level} เลขที่: {item.studentId}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteUser(item.uid, item.name)}
                  >
                    ลบ 🗑️
                  </button>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: colors.gray,
                  fontSize: "0.8rem",
                }}
              >
                ไม่มีนักเรียนในระบบ
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ onSwitch, showAlert }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
    } catch (error) {
      showAlert("error", "เข้าสู่ระบบไม่สำเร็จ", "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
    setLoading(false);
  };

  const handleForgotPassword = () => {
    showAlert(
      "input",
      "ลืมรหัสผ่าน?",
      "กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน:",
      async (email) => {
        if (!email) return;
        try {
          await sendPasswordResetEmail(auth, email);
          showAlert("success", "สำเร็จ", `ส่งลิงก์ไปที่ ${email} แล้ว`);
        } catch (e) {
          showAlert("error", "ผิดพลาด", e.message);
        }
      },
      null,
      true
    );
  };

  return (
    <div style={{ textAlign: "left" }}>
      <input
        style={commonStyles.input}
        placeholder="อีเมล"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        style={commonStyles.input}
        type="password"
        placeholder="รหัสผ่าน"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <div style={{ textAlign: "right", marginBottom: 10 }}>
        <span
          style={{
            fontSize: "0.8rem",
            color: colors.primary,
            cursor: "pointer",
          }}
          onClick={handleForgotPassword}
        >
          ลืมรหัสผ่าน?
        </span>
      </div>
      <button
        style={commonStyles.btnPrimary}
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "..." : "เข้าสู่ระบบ"}
      </button>
      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          color: colors.gray,
          fontSize: "0.9rem",
        }}
      >
        ยังไม่มีบัญชี?{" "}
        <span
          style={{ color: colors.primary, cursor: "pointer", fontWeight: 600 }}
          onClick={onSwitch}
        >
          ลงทะเบียน
        </span>
      </p>
    </div>
  );
}

function RegisterPage({ onRegisterSuccess, onSwitch, showAlert }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "student",
    level: "ปวช.1",
    studentId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;
      const userData = {
        name: form.name,
        role: form.role,
        email: form.email,
        isDeleted: false,
        createdAt: serverTimestamp(),
      };
      if (form.role === "student") {
        userData.level = form.level;
        userData.studentId = form.studentId;
      }
      await setDoc(doc(db, "users", user.uid), userData);
      showAlert("success", "สำเร็จ", "สมัครสมาชิกเรียบร้อย", () =>
        onRegisterSuccess()
      );
    } catch (error) {
      showAlert("error", "ผิดพลาด", error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "left" }}>
      <input
        style={commonStyles.input}
        placeholder="ชื่อ-นามสกุล"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        style={commonStyles.input}
        placeholder="อีเมล"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        style={commonStyles.input}
        type="password"
        placeholder="รหัสผ่าน (6 ตัวขึ้นไป)"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>สถานะ</label>
      <select
        style={commonStyles.input}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="student">นักเรียน / นักศึกษา</option>
        <option value="teacher">อาจารย์</option>
      </select>
      {form.role === "student" && (
        <>
          <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            ระดับชั้น
          </label>
          <select
            style={commonStyles.input}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
          >
            <option value="ปวช.1">ปวช.1</option>
            <option value="ปวช.2">ปวช.2</option>
            <option value="ปวช.3">ปวช.3</option>
            <option value="ปวส.1">ปวส.1</option>
            <option value="ปวส.2">ปวส.2</option>
          </select>
          <label style={{ fontSize: "0.9rem", fontWeight: 600 }}>เลขที่</label>
          <input
            style={commonStyles.input}
            type="number"
            placeholder="เช่น 15"
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          />
        </>
      )}
      <button
        style={commonStyles.btnPrimary}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "..." : "สมัครสมาชิก"}
      </button>
      <p
        style={{
          textAlign: "center",
          marginTop: 20,
          color: colors.gray,
          fontSize: "0.9rem",
        }}
      >
        กลับไป{" "}
        <span
          style={{ color: colors.primary, cursor: "pointer", fontWeight: 600 }}
          onClick={onSwitch}
        >
          เข้าสู่ระบบ
        </span>
      </p>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 12,
        marginBottom: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: active ? colors.primary : "transparent",
        color: active ? "white" : colors.text,
        fontWeight: active ? 600 : 500,
        transition: "0.2s",
      }}
    >
      <span>{icon}</span> {label}
    </div>
  );
}
function MobileNavItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: active ? 1 : 0.6,
      }}
    >
      <span
        style={{
          fontSize: "1.5rem",
          color: active ? colors.primary : colors.text,
        }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: active ? colors.primary : colors.text,
        }}
      >
        {label}
      </span>
    </div>
  );
}
const commonStyles = {
  input: {
    width: "100%",
    padding: "14px",
    margin: "8px 0",
    borderRadius: 12,
    border: "1px solid #E2E8F0",
    background: "#F7FAFC",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  },
  btnPrimary: {
    width: "100%",
    padding: "14px",
    background: colors.primary,
    color: "white",
    border: "none",
    borderRadius: 12,
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 16,
    boxShadow: "0 4px 12px rgba(108, 99, 255, 0.3)",
  },
  btnGoogle: {
    width: "100%",
    padding: "14px",
    background: colors.white,
    color: colors.text,
    border: "1px solid #E2E8F0",
    borderRadius: 12,
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  btnSecondary: {
    padding: "12px 24px",
    background: colors.primaryLight,
    color: colors.primary,
    border: "none",
    borderRadius: 10,
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnSmall: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: 12,
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "white",
    display: "inline-block",
    minWidth: 60,
    textAlign: "center",
  },
};
