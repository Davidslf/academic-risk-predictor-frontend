/**
 * Application Controller
 * Controlador principal de la aplicación
 * Orquesta todos los módulos siguiendo el patrón MVC
 * Responsabilidad Única: Coordinar los diferentes componentes
 */

import { predictionService } from '../services/prediction.service';
import { formHandler } from '../ui/form.handler';
import { resultsHandler } from '../ui/results.handler';
import { chatHandler } from '../ui/chat.handler';
import { mathModalHandler } from '../ui/math-modal.handler';
import { DOM_IDS } from '../constants/app.constants';
import { getElement } from '../utils/formatters';

export class AppController {
    /**
     * Inicializa la aplicación
     * Punto de entrada principal
     */
    initialize(): void {
        console.log('🚀 Inicializando aplicación...');
        
        this.setupEventListeners();
        
        console.log('✅ Aplicación inicializada correctamente');
    }

    /**
     * Configura todos los event listeners
     */
    private setupEventListeners(): void {
        // Formulario
        formHandler.initializeEventListeners();
        this.setupFormSubmit();

        // Chat
        chatHandler.initializeEventListeners();

        // Modal matemático
        mathModalHandler.initializeEventListeners();
    }

    /**
     * Configura el submit del formulario
     */
    private setupFormSubmit(): void {
        const form = getElement(DOM_IDS.FORM);
        
        form?.addEventListener('submit', async (e: Event) => {
            e.preventDefault();
            await this.realizarPrediccion();
        });
    }

    /**
     * Realiza la predicción del riesgo académico
     * Método principal que orquesta todo el flujo
     */
    private async realizarPrediccion(): Promise<void> {
        try {
            console.log('🔍 Iniciando predicción...');
            
            // 1. Mostrar loading
            formHandler.showLoading();

            // 2. Obtener datos del formulario
            const estudianteData = formHandler.getFormData();
            console.log('📊 Datos del estudiante:', estudianteData);

            // 3. Llamar al servicio
            const resultado = await predictionService.predict(estudianteData);
            console.log('✅ Predicción recibida:', resultado);

            // 4. Ocultar loading y mostrar resultados
            formHandler.hideLoading();
            formHandler.showResults();

            // 5. Renderizar resultados
            resultsHandler.mostrarResultados(resultado);

            // 6. Preparar detalles matemáticos
            mathModalHandler.mostrarDetalles(resultado);

            // 7. Configurar contexto del chat
            chatHandler.setPrediction(resultado, estudianteData);

            console.log('🎉 Predicción completada exitosamente');

        } catch (error) {
            console.error('❌ Error en la predicción:', error);
            
            // Manejar error
            formHandler.hideLoading();
            formHandler.showInitialMessage();

            // Mostrar mensaje de error al usuario
            const mensaje = error instanceof Error 
                ? error.message 
                : 'Error desconocido. Por favor intenta de nuevo.';
            
            alert(mensaje);
        }
    }
}

// Singleton - instancia única del controlador
export const appController = new AppController();

