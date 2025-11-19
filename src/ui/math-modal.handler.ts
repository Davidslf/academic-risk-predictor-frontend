/**
 * Math Modal Handler
 * Maneja el modal de detalles matemáticos
 * Responsabilidad Única: Visualización de detalles matemáticos
 */

import type { PredictionResponse } from '../types/prediction.types';
import { DOM_IDS, FEATURE_NAMES } from '../constants/app.constants';
import { getElement } from '../utils/formatters';

// Declaración global para katex y bootstrap
declare const katex: any;
declare const bootstrap: any;

export class MathModalHandler {
    /**
     * Inicializa los event listeners del modal
     */
    initializeEventListeners(): void {
        const showMathBtn = getElement(DOM_IDS.SHOW_MATH_BTN);
        showMathBtn?.addEventListener('click', () => this.show());
    }

    /**
     * Muestra el modal con los detalles matemáticos
     */
    private show(): void {
        const modalElement = document.getElementById('mathModal');
        if (modalElement && typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        }
    }

    /**
     * Renderiza los detalles matemáticos
     */
    mostrarDetalles(data: PredictionResponse): void {
        const detalles = data.detalles_matematicos;

        // Renderizar fórmulas con KaTeX si está disponible
        if (typeof katex !== 'undefined') {
            this.renderFormula(
                detalles.formula_logit,
                DOM_IDS.FORMULA_LOGIT
            );
            this.renderFormula(
                detalles.formula_sigmoide,
                DOM_IDS.FORMULA_SIGMOIDE
            );
        }

        // Tabla de detalles
        this.renderTabla(detalles);

        // Cálculos finales
        this.renderCalculos(detalles);
    }

    /**
     * Renderiza una fórmula con KaTeX
     */
    private renderFormula(formula: string, elementId: string): void {
        const element = getElement(elementId);
        if (element && typeof katex !== 'undefined') {
            try {
                katex.render(formula, element, {
                    throwOnError: false,
                    displayMode: true,
                });
            } catch (error) {
                console.error('Error rendering KaTeX formula:', error);
            }
        }
    }

    /**
     * Renderiza la tabla de variables
     */
    private renderTabla(detalles: PredictionResponse['detalles_matematicos']): void {
        const tableBody = getElement(DOM_IDS.MATH_TABLE_BODY);
        if (!tableBody) return;

        const featureNames = [
            FEATURE_NAMES.ASISTENCIA,
            FEATURE_NAMES.SEGUIMIENTO,
            FEATURE_NAMES.PARCIAL,
            FEATURE_NAMES.LOGINS,
            FEATURE_NAMES.TUTORIAS,
        ];

        const rows = detalles.features_scaled.map((featScaled, index) => {
            const coef = detalles.coeficientes[index];
            const impacto = featScaled * coef;

            return `
                <tr>
                    <td>${featureNames[index]}</td>
                    <td class="text-center">${featScaled.toFixed(4)}</td>
                    <td class="text-center">${coef.toFixed(4)}</td>
                    <td class="text-center">${impacto.toFixed(4)}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = rows.join('');
    }

    /**
     * Renderiza los cálculos finales
     */
    private renderCalculos(detalles: PredictionResponse['detalles_matematicos']): void {
        const interceptoValue = getElement(DOM_IDS.INTERCEPTO_VALUE);
        const calculoLogit = getElement(DOM_IDS.CALCULO_LOGIT);
        const calculoProbabilidad = getElement(DOM_IDS.CALCULO_PROBABILIDAD);

        if (interceptoValue) {
            interceptoValue.textContent = detalles.intercepto.toFixed(4);
        }
        if (calculoLogit) {
            calculoLogit.textContent = detalles.calculo_logit_texto;
        }
        if (calculoProbabilidad) {
            calculoProbabilidad.textContent = detalles.calculo_probabilidad_texto;
        }
    }
}

// Singleton
export const mathModalHandler = new MathModalHandler();

