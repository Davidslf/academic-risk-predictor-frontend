/**
 * Prediction Service
 * Maneja todas las llamadas a la API siguiendo el patrón Service
 * Responsabilidad Única: Comunicación con el backend
 */

import type { EstudianteData, PredictionResponse, ChatRequest, ChatResponse } from '../types/prediction.types';
import { API_CONFIG } from '../constants/app.constants';

class PredictionService {
    private readonly baseUrl: string;
    private readonly timeout: number;

    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL; // http://0.0.0.0:8000
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * Realiza la predicción del riesgo académico
     * @param data - Datos del estudiante
     * @returns Promise con la respuesta de la predicción
     * @throws Error si la petición falla
     */
    async predict(data: EstudianteData): Promise<PredictionResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.PREDICT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('La petición tardó demasiado. El servidor puede estar "dormido" (plan gratuito). Espera 30 segundos e intenta de nuevo.');
                }
                throw new Error(`Error al conectar con el servidor: ${error.message}`);
            }

            throw new Error('Error desconocido al realizar la predicción');
        }
    }

    /**
     * Envía una pregunta al chatbot
     * @param request - Datos de la petición del chat
     * @returns Promise con la respuesta del chatbot
     * @throws Error si la petición falla
     */
    async chat(request: ChatRequest): Promise<ChatResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.CHAT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('La petición tardó demasiado. Intenta de nuevo.');
                }
                throw new Error(`Error al procesar tu pregunta: ${error.message}`);
            }

            throw new Error('Error desconocido al enviar el mensaje');
        }
    }
}

// Singleton pattern - una sola instancia del servicio
export const predictionService = new PredictionService();

