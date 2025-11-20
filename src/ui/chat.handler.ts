/**
 * Chat Handler
 * Maneja la interfaz del chatbot
 * Responsabilidad Única: Gestión del chat
 */
import { DOM_IDS } from '../constants/app.constants';
import { getElement } from '../utils/formatters';
import { predictionService } from '../services/prediction.service';

import type { PredictionResponse, EstudianteData } from '../types/prediction.types';
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

        // Crear wrapper
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.marginBottom = '12px';
        wrapper.style.gap = '8px';
        wrapper.style.alignItems = 'flex-end';

        if (tipo === 'user') {
            wrapper.style.flexDirection = 'row-reverse';
        }

        // Crear avatar
        const avatar = document.createElement('div');
        avatar.style.width = '36px';
        avatar.style.height = '36px';
        avatar.style.minWidth = '36px';
        avatar.style.borderRadius = '50%';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.fontSize = '20px';
        avatar.style.flexShrink = '0';
        avatar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        avatar.textContent = tipo === 'bot' ? '🤖' : '👤';
        avatar.style.background = tipo === 'bot'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #a8d5ff 0%, #c4e7ff 100%)';

        // Crear burbuja
        const bubble = document.createElement('div');
        bubble.style.maxWidth = '75%';
        bubble.style.padding = '10px 14px';
        bubble.style.borderRadius = '12px';
        bubble.style.lineHeight = '1.5';
        bubble.style.fontSize = '14px';
        bubble.style.wordWrap = 'break-word';
        bubble.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';

        if (tipo === 'bot') {
            bubble.style.background = 'white';
            bubble.style.color = '#2d3748';
            bubble.style.border = '1px solid #e2e8f0';
        } else {
            bubble.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            bubble.style.color = 'white';
        }

        // Contenido
        let contenido = texto;
        if (tipo === 'bot') {
            contenido = texto
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #667eea;">$1</strong>')
                .replace(/\\n/g, '<br>')
                .replace(/\n/g, '<br>');
        }
        bubble.innerHTML = contenido;

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Singleton
export const chatHandler = new ChatHandler();

