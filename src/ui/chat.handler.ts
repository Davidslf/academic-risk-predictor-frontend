/**
 * Chat Handler
 * Maneja la interfaz del chatbot
 * Responsabilidad Única: Gestión del chat
 */

import type { PredictionResponse, EstudianteData } from '../types/prediction.types';
import { DOM_IDS } from '../constants/app.constants';
import { getElement, formatearAnalisis } from '../utils/formatters';
import { predictionService } from '../services/prediction.service';

export class ChatHandler {
    private currentPrediction: PredictionResponse | null = null;
    private currentStudentData: EstudianteData | null = null;

    /**
     * Inicializa los event listeners del chat
     */
    initializeEventListeners(): void {
        const chatToggle = getElement(DOM_IDS.CHAT_TOGGLE);
        const chatClose = getElement(DOM_IDS.CHAT_CLOSE);
        const chatSend = getElement(DOM_IDS.CHAT_SEND);
        const chatInput = getElement<HTMLInputElement>(DOM_IDS.CHAT_INPUT);

        chatToggle?.addEventListener('click', () => this.toggleChat(true));
        chatClose?.addEventListener('click', () => this.toggleChat(false));
        chatSend?.addEventListener('click', () => this.enviarMensaje());
        
        chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.enviarMensaje();
            }
        });
    }

    /**
     * Establece la predicción actual para el contexto del chat
     */
    setPrediction(prediction: PredictionResponse, studentData: EstudianteData): void {
        this.currentPrediction = prediction;
        this.currentStudentData = studentData;
    }

    /**
     * Alterna la visibilidad del chat
     */
    private toggleChat(show: boolean): void {
        const chatbot = getElement(DOM_IDS.CHATBOT);
        const chatToggle = getElement(DOM_IDS.CHAT_TOGGLE);

        if (show) {
            chatbot?.classList.add('show');
            if (chatToggle) chatToggle.style.display = 'none';
        } else {
            chatbot?.classList.remove('show');
            if (chatToggle) chatToggle.style.display = 'flex';
        }
    }

    /**
     * Envía un mensaje al chatbot
     */
    private async enviarMensaje(): Promise<void> {
        const chatInput = getElement<HTMLInputElement>(DOM_IDS.CHAT_INPUT);
        const pregunta = chatInput?.value.trim();

        if (!pregunta || !this.currentPrediction || !this.currentStudentData) {
            return;
        }

        // Agregar mensaje del usuario
        this.agregarMensaje(pregunta, 'user');
        if (chatInput) chatInput.value = '';

        try {
            const response = await predictionService.chat({
                pregunta,
                datos_estudiante: this.currentStudentData,
                prediccion_actual: this.currentPrediction,
            });

            this.agregarMensaje(response.respuesta, 'bot');
        } catch (error) {
            const mensaje = error instanceof Error 
                ? error.message 
                : 'Lo siento, hubo un error. Intenta de nuevo.';
            
            this.agregarMensaje(mensaje, 'bot');
        }
    }

    /**
     * Agrega un mensaje al chat
     */
    private agregarMensaje(texto: string, tipo: 'user' | 'bot'): void {
        const chatMessages = getElement(DOM_IDS.CHAT_MESSAGES);
        if (!chatMessages) return;

        const contenido = tipo === 'bot' ? formatearAnalisis(texto) : texto;
        const mensajeHtml = `<div class="chat-message ${tipo}">${contenido}</div>`;
        
        chatMessages.innerHTML += mensajeHtml;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Singleton
export const chatHandler = new ChatHandler();

