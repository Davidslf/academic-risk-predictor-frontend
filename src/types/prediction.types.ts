/**
 * Tipos para el sistema de predicción académica
 * Siguiendo principios de Type Safety y Clean Code
 */

export interface EstudianteData {
    promedio_asistencia: number;
    promedio_seguimiento: number;
    nota_parcial_1: number;
    inicios_sesion_plataforma: number;
    uso_tutorias: 0 | 1;
}

export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';

export interface DatosRadar {
    labels: string[];
    estudiante: number[];
    promedio_aprobado: number[];
}

export interface DetallesMatematicos {
    intercepto: number;
    coeficientes: number[];
    features_scaled: number[];
    formula_logit: string;
    formula_sigmoide: string;
    calculo_logit_texto: string;
    calculo_probabilidad_texto: string;
}

export interface PredictionResponse {
    porcentaje_riesgo: number;
    nivel_riesgo: NivelRiesgo;
    analisis_ia: string;
    datos_radar: DatosRadar;
    detalles_matematicos: DetallesMatematicos;
}

export interface ChatRequest {
    pregunta: string;
    datos_estudiante: EstudianteData;
    prediccion_actual: PredictionResponse;
}

export interface ChatResponse {
    respuesta: string;
}

