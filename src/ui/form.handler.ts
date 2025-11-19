/**
 * Form Handler
 * Maneja toda la lógica del formulario
 * Responsabilidad Única: Gestión del formulario y sus controles
 */

import type { EstudianteData } from '../types/prediction.types';
import { DOM_IDS } from '../constants/app.constants';
import { getElement, boolToInt } from '../utils/formatters';

export class FormHandler {
    /**
     * Inicializa todos los event listeners del formulario
     */
    initializeEventListeners(): void {
        this.setupSliderListeners();
        this.setupCheckboxListener();
    }

    /**
     * Configura los listeners de los sliders
     */
    private setupSliderListeners(): void {
        // Asistencia
        const asistenciaSlider = getElement<HTMLInputElement>(DOM_IDS.ASISTENCIA);
        const asistenciaValue = getElement(DOM_IDS.ASISTENCIA_VALUE);
        
        asistenciaSlider?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (asistenciaValue) {
                asistenciaValue.textContent = `${target.value}%`;
            }
        });

        // Seguimiento
        const seguimientoSlider = getElement<HTMLInputElement>(DOM_IDS.SEGUIMIENTO);
        const seguimientoValue = getElement(DOM_IDS.SEGUIMIENTO_VALUE);
        
        seguimientoSlider?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (seguimientoValue) {
                seguimientoValue.textContent = parseFloat(target.value).toFixed(1);
            }
        });

        // Parcial
        const parcialSlider = getElement<HTMLInputElement>(DOM_IDS.PARCIAL);
        const parcialValue = getElement(DOM_IDS.PARCIAL_VALUE);
        
        parcialSlider?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (parcialValue) {
                parcialValue.textContent = parseFloat(target.value).toFixed(1);
            }
        });

        // Logins
        const loginsSlider = getElement<HTMLInputElement>(DOM_IDS.LOGINS);
        const loginsValue = getElement(DOM_IDS.LOGINS_VALUE);
        
        loginsSlider?.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (loginsValue) {
                loginsValue.textContent = target.value;
            }
        });
    }

    /**
     * Configura el listener del checkbox de tutorías
     */
    private setupCheckboxListener(): void {
        const tutoriasCheckbox = getElement<HTMLInputElement>(DOM_IDS.TUTORIAS);
        const tutoriasLabel = getElement(DOM_IDS.TUTORIAS_LABEL);
        
        tutoriasCheckbox?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (tutoriasLabel) {
                tutoriasLabel.textContent = target.checked 
                    ? 'Sí, uso tutorías' 
                    : 'No uso tutorías';
            }
        });
    }

    /**
     * Obtiene los datos del formulario
     * @returns Datos del estudiante
     */
    getFormData(): EstudianteData {
        const asistencia = getElement<HTMLInputElement>(DOM_IDS.ASISTENCIA);
        const seguimiento = getElement<HTMLInputElement>(DOM_IDS.SEGUIMIENTO);
        const parcial = getElement<HTMLInputElement>(DOM_IDS.PARCIAL);
        const logins = getElement<HTMLInputElement>(DOM_IDS.LOGINS);
        const tutorias = getElement<HTMLInputElement>(DOM_IDS.TUTORIAS);

        return {
            promedio_asistencia: parseFloat(asistencia?.value || '0'),
            promedio_seguimiento: parseFloat(seguimiento?.value || '0'),
            nota_parcial_1: parseFloat(parcial?.value || '0'),
            inicios_sesion_plataforma: parseInt(logins?.value || '0'),
            uso_tutorias: boolToInt(tutorias?.checked || false),
        };
    }

    /**
     * Muestra el indicador de carga
     */
    showLoading(): void {
        const loading = getElement(DOM_IDS.LOADING);
        const initialMessage = getElement(DOM_IDS.INITIAL_MESSAGE);
        const resultsContainer = getElement(DOM_IDS.RESULTS_CONTAINER);

        if (initialMessage) initialMessage.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (loading) loading.style.display = 'block';
    }

    /**
     * Oculta el indicador de carga
     */
    hideLoading(): void {
        const loading = getElement(DOM_IDS.LOADING);
        if (loading) loading.style.display = 'none';
    }

    /**
     * Muestra el mensaje inicial
     */
    showInitialMessage(): void {
        const initialMessage = getElement(DOM_IDS.INITIAL_MESSAGE);
        if (initialMessage) initialMessage.style.display = 'block';
    }

    /**
     * Muestra el contenedor de resultados
     */
    showResults(): void {
        const resultsContainer = getElement(DOM_IDS.RESULTS_CONTAINER);
        if (resultsContainer) resultsContainer.style.display = 'block';
    }
}

// Singleton
export const formHandler = new FormHandler();

