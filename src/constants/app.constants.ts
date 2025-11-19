/**
 * Constantes de la aplicación
 * Single Source of Truth para configuración
 */

export const API_CONFIG = {
    BASE_URL: 'https://academic-risk-predictor-api.onrender.com',
    ENDPOINTS: {
        PREDICT: '/predict',
        CHAT: '/chat',
    },
    TIMEOUT: 30000,
} as const;

export const CHART_COLORS = {
    PRIMARY: 'rgb(102, 126, 234)',
    PRIMARY_ALPHA: 'rgba(102, 126, 234, 0.2)',
    SUCCESS: 'rgb(16, 185, 129)',
    SUCCESS_ALPHA: 'rgba(16, 185, 129, 0.2)',
    DANGER: '#ef4444',
    WARNING: '#f59e0b',
    LOW_RISK: '#10b981',
    GRAY: '#e5e7eb',
} as const;

export const RISK_LEVELS = {
    BAJO: {
        className: 'risk-bajo',
        icon: '✅',
        label: 'RIESGO BAJO',
        color: CHART_COLORS.LOW_RISK,
    },
    MEDIO: {
        className: 'risk-medio',
        icon: '⚠️',
        label: 'RIESGO MEDIO',
        color: CHART_COLORS.WARNING,
    },
    ALTO: {
        className: 'risk-alto',
        icon: '🚨',
        label: 'RIESGO ALTO',
        color: CHART_COLORS.DANGER,
    },
} as const;

export const FEATURE_NAMES = {
    ASISTENCIA: 'Asistencia',
    SEGUIMIENTO: 'Seguimiento',
    PARCIAL: 'Parcial 1',
    LOGINS: 'Logins',
    TUTORIAS: 'Tutorías',
} as const;

export const DOM_IDS = {
    // Forms
    FORM: 'prediction-form',
    ASISTENCIA: 'asistencia',
    SEGUIMIENTO: 'seguimiento',
    PARCIAL: 'parcial',
    LOGINS: 'logins',
    TUTORIAS: 'tutorias',
    
    // Value displays
    ASISTENCIA_VALUE: 'asistencia-value',
    SEGUIMIENTO_VALUE: 'seguimiento-value',
    PARCIAL_VALUE: 'parcial-value',
    LOGINS_VALUE: 'logins-value',
    TUTORIAS_LABEL: 'tutorias-label',
    
    // Results
    LOADING: 'loading',
    INITIAL_MESSAGE: 'initial-message',
    RESULTS_CONTAINER: 'results-container',
    RISK_BADGE: 'risk-badge',
    PROB_APROBAR: 'prob-aprobar',
    IA_ANALYSIS: 'ia-analysis',
    
    // Charts
    GAUGE_CHART: 'gauge-chart',
    BAR_CHART: 'bar-chart',
    NOTES_CHART: 'notes-chart',
    ATTENDANCE_CHART: 'attendance-chart',
    
    // Math modal
    SHOW_MATH_BTN: 'show-math-btn',
    FORMULA_LOGIT: 'formula-logit',
    FORMULA_SIGMOIDE: 'formula-sigmoide',
    MATH_TABLE_BODY: 'math-table-body',
    INTERCEPTO_VALUE: 'intercepto-value',
    CALCULO_LOGIT: 'calculo-logit',
    CALCULO_PROBABILIDAD: 'calculo-probabilidad',
    
    // Chat
    CHAT_TOGGLE: 'chat-toggle',
    CHAT_CLOSE: 'chat-close',
    CHATBOT: 'chatbot',
    CHAT_SEND: 'chat-send',
    CHAT_INPUT: 'chat-input',
    CHAT_MESSAGES: 'chat-messages',
} as const;

