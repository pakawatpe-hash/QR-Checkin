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

// --- Theme: White & Ocean Blue ---
const colors = {
  primary: "#2563EB", // น้ำเงินสด (Royal Blue)
  primaryLight: "#EFF6FF", // ฟ้าอ่อนเกือบขาว
  primaryGradient: "linear-gradient(135deg, #2563EB 0%, #00B4D8 100%)", // ไล่สีน้ำเงินไปฟ้าทะเล
  secondary: "#1E293B", // สีดำอมน้ำเงิน (Slate Dark)
  success: "#10B981",
  successBg: "#D1FAE5",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  error: "#EF4444",
  errorBg: "#FEE2E2",
  background: "#F8FAFC", // พื้นหลังขาวอมเทาฟ้า (Cool White)
  white: "#FFFFFF",
  text: "#334155", // สีเทาเข้ม
  textLight: "#64748B", // สีเทากลาง
  border: "#E2E8F0", // เส้นขอบสีเทาอ่อน
};

const logoPath = "/logo.jpg";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap');
    
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    
    body { 
      margin: 0; 
      padding: 0; 
      background: ${colors.background}; 
      font-family: 'Prompt', sans-serif; 
      -webkit-font-smoothing: antialiased; 
      color: ${colors.text};
    }
    
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes scanLine { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    
    .app-container { display: flex; min-height: 100vh; background: ${colors.background}; }
    
    .sidebar { 
      width: 280px; 
      background: ${colors.white}; 
      padding: 32px; 
      display: flex; 
      flex-direction: column; 
      border-right: 1px solid ${colors.border}; 
      position: sticky; 
      top: 0; 
      height: 100vh; 
      z-index: 50;
      box-shadow: 4px 0 24px rgba(148, 163, 184, 0.05);
    }

    .main-content { 
      flex: 1; 
      padding: 24px; 
      padding-bottom: 120px; 
      max-width: 1000px; 
      margin: 0 auto; 
      width: 100%; 
      animation: fadeIn 0.4s ease-out;
    }

    .mobile-nav { display: none; }

    .card { 
      background: ${colors.white}; 
      border-radius: 24px; 
      padding: 32px; 
      box-shadow: 0 10px 30px -10px rgba(37, 99, 235, 0.08); 
      border: 1px solid ${colors.white};
    }

    /* Scanner UI */
    .scanner-wrapper {
      position: relative;
      width: 100%;
      max-width: 400px;
      aspect-ratio: 1/1;
      margin: 0 auto;
      border-radius: 24px;
      overflow: hidden;
      background: black;
      box-shadow: 0 20px 50px -12px rgba(37, 99, 235, 0.25);
    }
    
    .scan-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 10;
      border: 2px solid rgba(255,255,255,0.2); border-radius: 24px; pointer-events: none;
    }
    
    .scan-laser {
      position: absolute; width: 100%; height: 3px; background: #00B4D8;
      box-shadow: 0 0 15px #00B4D8; z-index: 11; animation: scanLine 2s linear infinite;
    }

    #reader { width: 100%; height: 100%; }
    #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; border-radius: 24px; }

    .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; width: 100%; margin-bottom: 24px; }
    @media (min-width: 768px) { .stat-grid { grid-template-columns: repeat(4, 1fr); } }

    .stat-card { 
      background: ${colors.white}; padding: 20px; border-radius: 20px; text-align: center; 
      border: 1px solid ${colors.border}; transition: transform 0.2s; 
      box-shadow: 0 4px 6px -1px rgba(148, 163, 184, 0.1);
    }
    .stat-card:hover { transform: translateY(-4px); border-color: ${colors.primary}; }

    .custom-modal-overlay { 
      position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(30, 41, 59, 0.6); 
      backdrop-filter: blur(4px); display: flex; alignItems: center; justifyContent: center; z-index: 9999; 
      animation: fadeIn 0.2s; 
    }
    .custom-modal { 
      background: ${colors.white}; padding: 32px; border-radius: 32px; width: 90%; max-width: 360px; 
      text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); 
    }

    .spinner { 
      width: 48px; height: 48px; border: 4px solid ${colors.primaryLight}; border-top: 4px solid ${colors.primary}; 
      border-radius: 50%; animation: spin 0.8s linear infinite; 
    }

    .list-item {
      display: flex; justify-content: space-between; align-items: center; padding: 16px; margin-bottom: 10px;
      background: ${colors.white}; border-radius: 16px; border: 1px solid ${colors.border};
      transition: all 0.2s ease;
    }
    .list-item:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(37, 99, 235, 0.05); border-color: ${colors.primaryLight}; }

    .tab-container { display: flex; background: ${colors.white}; padding: 6px; border-radius: 16px; margin-bottom: 24px; border: 1px solid ${colors.border}; }
    .tab-btn { flex: 1; padding: 10px; border: none; background: transparent; color: ${colors.textLight}; font-weight: 600; border-radius: 12px; cursor: pointer; transition: 0.3s; font-family: 'Prompt'; }
    .tab-btn.active { background: ${colors.primaryLight}; color: ${colors.primary}; }

    @media (max-width: 768px) {
      .app-container { flex-direction: column; }
      .sidebar { display: none; }
      .main-content { padding: 20px; padding-bottom: 120px; }
      
      .mobile-nav { 
        display: flex; position: fixed; bottom: 20px; left: 20px; right: 20px; 
        background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); 
        padding: 12px 24px; justify-content: space-between; align-items: center; 
        z-index: 1000; border-radius: 24px; border: 1px solid rgba(255,255,255,0.8);
        box-shadow: 0 10px 40px -10px rgba(30, 41, 59, 0.15);
      }
      
      .scan-btn-wrapper {
        position: absolute; top: -30px; left: 50%; transform: translateX(-50%);
        background: ${colors.background}; padding: 6px; border-radius: 50%;
      }
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
      background: colors.background,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div className="spinner"></div>
    <p style={{ marginTop: 24, color: colors.primary, fontWeight: 600 }}>
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
  let confirmColor = colors.primaryGradient;
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

  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>{icon}</div>
        <h3
          style={{
            margin: "0 0 8px 0",
            color: colors.secondary,
            fontSize: "1.3rem",
            fontWeight: 700,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 24px 0",
            color: colors.textLight,
            fontSize: "0.95rem",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        {inputMode && (
          <input
            style={{ ...commonStyles.input, marginTop: 0, marginBottom: 24 }}
            placeholder="กรอกข้อมูล..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoFocus
          />
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            style={{
              ...commonStyles.btnPrimary,
              margin: 0,
              background: confirmColor,
              width: "auto",
              minWidth: 110,
              boxShadow: "none",
            }}
            onClick={() => onConfirm(inputValue)}
          >
            ตกลง
          </button>
          {(type === "confirm" || onCancel) && (
            <button
              style={{ ...commonStyles.btnSecondary, margin: 0 }}
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
            padding: 24,
            background: colors.background,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 420,
              textAlign: "center",
              padding: "40px 32px",
            }}
          >
            <img
              src={logoPath}
              alt="Logo"
              style={{
                height: 90,
                marginBottom: 24,
                objectFit: "contain",
                borderRadius: 16,
              }}
            />
            <h2
              style={{
                color: colors.primary,
                marginBottom: 8,
                fontSize: "1.75rem",
                fontWeight: 700,
              }}
            >
              ระบบเช็คชื่อนักศึกษา
            </h2>
            <p style={{ color: colors.textLight, marginBottom: 32 }}>
              เข้าสู่ระบบเพื่อจัดการและตรวจสอบการเข้าเรียน
            </p>
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
            gap: 16,
            marginBottom: 48,
          }}
        >
          <img
            src={logoPath}
            alt="Logo"
            style={{
              height: 56,
              width: 56,
              objectFit: "cover",
              borderRadius: 14,
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          />
          <div>
            <h2
              style={{
                color: colors.primary,
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 700,
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
            color: colors.error,
            padding: "12px 16px",
            display: "flex",
            gap: 12,
            fontWeight: 600,
            marginTop: "auto",
            background: colors.errorBg,
            borderRadius: 12,
          }}
          onClick={onLogout}
        >
          <span>🚪</span> ออกจากระบบ
        </div>
      </div>

      <div className="main-content">
        <div
          className="mobile-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={logoPath}
              alt="Logo"
              style={{
                height: 48,
                width: 48,
                objectFit: "cover",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            />
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  color: colors.secondary,
                  fontWeight: 700,
                }}
              >
                ระบบเช็คชื่อ
              </h2>
              <span style={{ fontSize: "0.85rem", color: colors.textLight }}>
                สวัสดี, {user.name || "User"}
              </span>
            </div>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              background: colors.primaryLight,
              color: colors.primary,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}
          >
            {user.role === "teacher" ? "👩‍🏫" : "👨‍🎓"}
          </div>
        </div>

        <div
          className="card"
          style={{
            minHeight: "65vh",
            display: "flex",
            flexDirection: "column",
            padding:
              user.role === "teacher" && activeTab === "dashboard"
                ? "24px"
                : "32px",
          }}
        >
          {activeTab === "dashboard" ? (
            user.role === "teacher" ? (
              <TeacherView initialView="dashboard" showAlert={showAlert} />
            ) : (
              <div style={{ textAlign: "center", marginTop: 60, padding: 20 }}>
                <div
                  style={{
                    width: 96,
                    height: 96,
                    background: colors.primaryLight,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    fontSize: "3rem",
                    color: colors.primary,
                  }}
                >
                  🎓
                </div>
                <h2
                  style={{
                    color: colors.primary,
                    marginBottom: 12,
                    fontSize: "1.6rem",
                  }}
                >
                  ยินดีต้อนรับ!
                </h2>
                <p
                  style={{
                    color: colors.textLight,
                    maxWidth: 320,
                    margin: "0 auto",
                    lineHeight: 1.6,
                  }}
                >
                  เลือกเมนู <b>"สแกนเข้าเรียน"</b>{" "}
                  ด้านล่างเพื่อเริ่มเช็คชื่อประจำวัน
                </p>
                <div
                  style={{
                    marginTop: 32,
                    padding: "16px 24px",
                    background: colors.warningBg,
                    borderRadius: 16,
                    color: "#B45309",
                    display: "inline-block",
                    fontSize: "0.95rem",
                    fontWeight: 600,
                  }}
                >
                  ⏰ เช็คชื่อก่อน 07:50 น. ถือว่ามาปกติ
                </div>
              </div>
            )
          ) : (
            <>
              <h3
                style={{
                  marginBottom: 24,
                  color: colors.secondary,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: "1.3rem",
                  fontWeight: 700,
                }}
              >
                {user.role === "teacher"
                  ? "📷 QR Code & จัดการ"
                  : "📷 เช็คชื่อ & ประวัติ"}
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
        <div className="scan-btn-float">
          <div
            onClick={() => setActiveTab("checkin")}
            style={{
              width: 64,
              height: 64,
              background: colors.primaryGradient,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "1.8rem",
              boxShadow: "0 10px 25px rgba(37, 99, 235, 0.4)",
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
          >
            📷
          </div>
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
          setHistory(
            snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        },
        (error) => {
          if (error.message.includes("index"))
            showAlert(
              "error",
              "ระบบขัดข้อง",
              "กรุณาแจ้งอาจารย์: ขาด Index ประวัติ"
            );
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
      <div className="tab-container" style={{ width: "100%" }}>
        <button
          className={`tab-btn ${viewState === "scan" ? "active" : ""}`}
          onClick={() => setViewState("scan")}
        >
          สแกน
        </button>
        <button
          className={`tab-btn ${viewState === "history" ? "active" : ""}`}
          onClick={() => setViewState("history")}
        >
          ประวัติ
        </button>
        <button
          className={`tab-btn ${viewState === "edit" ? "active" : ""}`}
          onClick={() => setViewState("edit")}
        >
          ข้อมูล
        </button>
      </div>

      {viewState === "scan" && (
        <ScannerComponent user={user} showAlert={showAlert} />
      )}

      {viewState === "history" && (
        <div
          style={{
            width: "100%",
            maxHeight: 400,
            overflowY: "auto",
            paddingRight: 4,
          }}
        >
          {history.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: colors.textLight,
              }}
            >
              <span
                style={{
                  fontSize: "2.5rem",
                  display: "block",
                  marginBottom: 12,
                }}
              >
                📭
              </span>
              ยังไม่มีประวัติการเช็คชื่อ
            </div>
          ) : (
            history.map((log) => (
              <div key={log.id} className="list-item">
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: colors.textLight,
                      marginBottom: 4,
                    }}
                  >
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
                  <span
                    style={{
                      fontWeight: 600,
                      color: colors.secondary,
                      fontSize: "1rem",
                    }}
                  >
                    {log.subjectCode}
                  </span>
                </div>
                <div>
                  {log.status === "late" ? (
                    <span
                      style={{
                        background: colors.warningBg,
                        color: colors.warning,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      มาสาย
                    </span>
                  ) : (
                    <span
                      style={{
                        background: colors.successBg,
                        color: colors.success,
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.8rem",
                        fontWeight: 600,
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
        <div style={{ width: "100%", padding: 8 }}>
          <label
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              color: colors.secondary,
              marginBottom: 6,
              display: "block",
            }}
          >
            ชื่อ-สกุล
          </label>
          <input
            style={commonStyles.input}
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: colors.secondary,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                ระดับชั้น
              </label>
              <select
                style={commonStyles.input}
                value={editForm.level}
                onChange={(e) =>
                  setEditForm({ ...editForm, level: e.target.value })
                }
              >
                {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: colors.secondary,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                เลขที่
              </label>
              <input
                style={commonStyles.input}
                type="number"
                value={editForm.studentId}
                onChange={(e) =>
                  setEditForm({ ...editForm, studentId: e.target.value })
                }
              />
            </div>
          </div>
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
            qrbox: (w, h) => {
              const min = Math.min(w, h);
              const size = Math.floor(min * 0.75);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
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

              setStatus("success");
              await addDoc(collection(db, "attendance_logs"), {
                studentUid: user.uid,
                studentName: user.name,
                level: user.level || "-",
                studentId: user.studentId || "-",
                subjectCode: decodedText,
                status: isLate ? "late" : "present",
                timestamp: serverTimestamp(),
              });
              showAlert("success", "สำเร็จ", "เช็คชื่อเรียบร้อยแล้ว!", () =>
                setStatus("success")
              );
            } catch (err) {
              showAlert("error", "ผิดพลาด", err.message);
              setStatus("idle");
            }
          },
          () => {}
        );
        isRunningRef.current = true;
        setStatus("scanning");
      } catch (err) {
        console.warn("Camera failed", err);
      }
    }, 500);
    return () => {
      clearTimeout(timeoutId);
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .then(() => {
            scannerRef.current.clear();
            isRunningRef.current = false;
          });
      }
    };
  }, [status, user]);

  if (status === "success") {
    return (
      <div
        style={{ textAlign: "center", animation: "fadeIn 0.5s", padding: 40 }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            background: colors.success,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            fontSize: "3rem",
            color: "white",
            boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            color: colors.secondary,
            margin: "0 0 8px 0",
            fontSize: "1.5rem",
          }}
        >
          เช็คชื่อเรียบร้อย!
        </h3>
        <p style={{ color: colors.textLight, marginBottom: 32 }}>
          บันทึกข้อมูลเข้าระบบแล้ว
        </p>
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
        <div className="scanner-wrapper">
          <div className="scan-overlay"></div>
          <div className="scan-laser"></div>
          <div id="reader"></div>
        </div>
        <p
          style={{
            marginTop: 24,
            color: colors.textLight,
            fontSize: "0.95rem",
            animation: "pulse 2s infinite",
          }}
        >
          กำลังค้นหา QR Code...
        </p>
        <button
          onClick={() => setStatus("idle")}
          style={{
            ...commonStyles.btnSecondary,
            background: "#F1F5F9",
            color: "#64748B",
          }}
        >
          ยกเลิก
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: "4rem", marginBottom: 16 }}>📷</div>
      <h3 style={{ margin: "0 0 12px 0", color: colors.secondary }}>
        พร้อมเช็คชื่อ?
      </h3>
      <p style={{ color: colors.textLight, marginBottom: 32 }}>
        กดปุ่มด้านล่างเพื่อเปิดกล้อง
      </p>
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
      }
    );
  };

  const filteredStudents = allStudents.filter(
    (s) => selectedLevel === "all" || s.level === selectedLevel
  );
  const studentLogMap = {};
  logs.forEach((log) => (studentLogMap[log.studentUid] = log));
  const presentList = [],
    lateList = [],
    absentList = [];

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
    } else absentList.push(student);
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
    absentList.forEach(
      (item) =>
        (csvContent += `${selectedDate},-,${item.name},${item.studentId},${item.level},Absent\n`)
    );
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
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: colors.secondary,
                fontSize: "1.2rem",
                fontWeight: 600,
              }}
            >
              ภาพรวมประจำวัน
            </h3>
            <input
              type="date"
              style={{
                ...commonStyles.input,
                width: "auto",
                margin: 0,
                padding: "8px 12px",
                fontSize: "0.9rem",
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
            {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
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
            ...commonStyles.btnPrimary,
            background: colors.success,
            marginTop: 8,
          }}
        >
          📄 Export CSV Report
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          marginBottom: 20,
          display: "flex",
          justifyContent: "flex-end",
          gap: 12,
        }}
      >
        <select
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.white,
          }}
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="all">ทุกระดับชั้น</option>
          {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <input
          type="date"
          style={{
            padding: "8px 12px",
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
            background: colors.white,
          }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {selectedDate === new Date().toISOString().split("T")[0] && (
        <div
          style={{
            padding: 32,
            background: "linear-gradient(135deg, #fff 0%, #F8FAFC 100%)",
            border: `2px dashed ${colors.primary}`,
            borderRadius: 24,
            marginBottom: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.03)",
          }}
        >
          <QRCode value={qrValue} size={180} fgColor={colors.secondary} />
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: colors.secondary,
              letterSpacing: 4,
              marginTop: 24,
              fontFamily: "monospace",
            }}
          >
            {qrValue}
          </div>
          <p
            style={{
              color: colors.textLight,
              marginBottom: 0,
              fontSize: "0.95rem",
              marginTop: 8,
            }}
          >
            เปลี่ยนรหัสใน{" "}
            <span style={{ color: colors.primary, fontWeight: 700 }}>
              {timeLeft}
            </span>{" "}
            วินาที
          </p>
        </div>
      )}

      <div style={{ width: "100%" }}>
        <div className="tab-container">
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

        <div style={{ maxHeight: 400, overflowY: "auto", paddingRight: 4 }}>
          {viewTab === "present" &&
            (presentList.length > 0 ? (
              presentList.map((i) => (
                <StudentRow key={i.uid} item={i} status="present" />
              ))
            ) : (
              <EmptyState />
            ))}
          {viewTab === "late" &&
            (lateList.length > 0 ? (
              lateList.map((i) => (
                <StudentRow key={i.uid} item={i} status="late" />
              ))
            ) : (
              <EmptyState msg="ไม่มีคนสาย" />
            ))}
          {viewTab === "absent" &&
            (absentList.length > 0 ? (
              absentList.map((i) => (
                <StudentRow key={i.uid} item={i} status="absent" />
              ))
            ) : (
              <EmptyState msg="มาครบทุกคน!" />
            ))}
          {viewTab === "all" &&
            (filteredStudents.length > 0 ? (
              filteredStudents.map((i) => (
                <div key={i.uid} className="list-item">
                  <div>
                    <span style={{ fontWeight: 600, color: colors.secondary }}>
                      {i.name}
                    </span>
                    <div
                      style={{ fontSize: "0.85rem", color: colors.textLight }}
                    >
                      ชั้น: {i.level} เลขที่: {i.studentId}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(i.uid, i.name)}
                    style={{
                      background: colors.errorBg,
                      color: colors.error,
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      transition: "0.2s",
                    }}
                  >
                    ลบ 🗑️
                  </button>
                </div>
              ))
            ) : (
              <EmptyState msg="ไม่มีนักเรียน" />
            ))}
        </div>
      </div>
    </div>
  );
}

const StudentRow = ({ item, status }) => {
  let bg = colors.successBg;
  let text = `✓ ${item.displayTime || ""}`;
  let color = colors.success;
  if (status === "late") {
    bg = colors.warningBg;
    color = colors.warning;
    text = `สาย ${item.displayTime}`;
  }
  if (status === "absent") {
    bg = colors.errorBg;
    color = colors.error;
    text = "ขาด";
  }
  return (
    <div className="list-item">
      <div>
        <span style={{ fontWeight: 600, color: colors.secondary }}>
          {item.name}
        </span>
        <div style={{ fontSize: "0.85rem", color: colors.textLight }}>
          ชั้น: {item.level} เลขที่: {item.studentId}
        </div>
      </div>
      <span
        style={{
          color,
          background: bg,
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: "0.8rem",
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
};
const EmptyState = ({ msg = "ว่างเปล่า" }) => (
  <div style={{ textAlign: "center", color: colors.textLight, padding: 40 }}>
    <span style={{ fontSize: "2rem", display: "block", marginBottom: 8 }}>
      📭
    </span>
    {msg}
  </div>
);

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
      "กรุณากรอกอีเมล:",
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
    <div style={{ textAlign: "left", width: "100%" }}>
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
      <div style={{ textAlign: "right", marginBottom: 16 }}>
        <span
          style={{
            fontSize: "0.9rem",
            color: colors.primary,
            cursor: "pointer",
            fontWeight: 600,
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
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          color: colors.textLight,
          fontSize: "0.95rem",
        }}
      >
        ยังไม่มีบัญชี?{" "}
        <span
          style={{ color: colors.primary, cursor: "pointer", fontWeight: 700 }}
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
    if (!form.email || !form.password || !form.name)
      return showAlert("warning", "ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลให้ครบถ้วน");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
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
      await setDoc(doc(db, "users", userCredential.user.uid), userData);
      showAlert("success", "สำเร็จ", "สมัครสมาชิกเรียบร้อย", onRegisterSuccess);
    } catch (error) {
      showAlert("error", "ผิดพลาด", error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ textAlign: "left", width: "100%" }}>
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
      <label
        style={{
          fontSize: "0.9rem",
          fontWeight: 600,
          color: colors.secondary,
          marginTop: 12,
          display: "block",
          marginBottom: 4,
        }}
      >
        สถานะ
      </label>
      <select
        style={commonStyles.input}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
      >
        <option value="student">นักเรียน / นักศึกษา</option>
        <option value="teacher">อาจารย์</option>
      </select>
      {form.role === "student" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <label
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: colors.secondary,
                marginTop: 8,
                display: "block",
                marginBottom: 4,
              }}
            >
              ระดับชั้น
            </label>
            <select
              style={commonStyles.input}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              {["ปวช.1", "ปวช.2", "ปวช.3", "ปวส.1", "ปวส.2"].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: colors.secondary,
                marginTop: 8,
                display: "block",
                marginBottom: 4,
              }}
            >
              เลขที่
            </label>
            <input
              style={commonStyles.input}
              type="number"
              placeholder="เช่น 15"
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            />
          </div>
        </div>
      )}
      <button
        style={commonStyles.btnPrimary}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
      </button>
      <p
        style={{
          textAlign: "center",
          marginTop: 24,
          color: colors.textLight,
          fontSize: "0.95rem",
        }}
      >
        กลับไป{" "}
        <span
          style={{ color: colors.primary, cursor: "pointer", fontWeight: 700 }}
          onClick={onSwitch}
        >
          เข้าสู่ระบบ
        </span>
      </p>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      padding: "14px 18px",
      borderRadius: 16,
      marginBottom: 8,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 16,
      background: active ? colors.primaryGradient : "transparent",
      color: active ? "white" : colors.textLight,
      fontWeight: active ? 600 : 500,
      transition: "all 0.3s",
      boxShadow: active ? "0 8px 20px -4px rgba(37, 99, 235, 0.3)" : "none",
    }}
  >
    <span style={{ fontSize: "1.4rem" }}>{icon}</span> {label}
  </div>
);

const MobileNavItem = ({ icon, label, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      opacity: active ? 1 : 0.6,
      transition: "0.2s",
      cursor: "pointer",
      transform: active ? "scale(1.1)" : "scale(1)",
    }}
  >
    <span
      style={{
        fontSize: "1.5rem",
        color: active ? colors.primary : colors.textLight,
      }}
    >
      {icon}
    </span>
    <span
      style={{
        fontSize: "0.75rem",
        fontWeight: 600,
        color: active ? colors.primary : colors.textLight,
      }}
    >
      {label}
    </span>
  </div>
);

const commonStyles = {
  input: {
    width: "100%",
    padding: "14px 16px",
    margin: "6px 0",
    borderRadius: 14,
    border: "2px solid #E2E8F0",
    background: "#F8FAFC",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "0.3s",
    color: colors.text,
    fontFamily: "Prompt",
  },
  btnPrimary: {
    width: "100%",
    padding: "16px",
    background: colors.primaryGradient,
    color: "white",
    border: "none",
    borderRadius: 14,
    fontSize: "1.05rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 24,
    boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  btnSecondary: {
    padding: "12px 24px",
    background: "#F1F5F9",
    color: "#475569",
    border: "none",
    borderRadius: 12,
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "0.2s",
  },
  btnSmall: {
    padding: "8px 16px",
    borderRadius: 20,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.85rem",
    transition: "0.2s",
  },
};
