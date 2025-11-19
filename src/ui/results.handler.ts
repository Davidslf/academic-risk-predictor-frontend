/**
 * Results Handler
 * Maneja la visualización de resultados
 * Responsabilidad Única: Mostrar resultados de predicción
 */

import type { PredictionResponse } from '../types/prediction.types';
import { DOM_IDS } from '../constants/app.constants';
import { getElement, formatearAnalisis, generarBadgeRiesgo, scrollToElement } from '../utils/formatters';
import { chartManager } from '../charts/chart.factory';

export class ResultsHandler {
    /**
     * Muestra los resultados de la predicción
     * @param data - Respuesta de la predicción
     */
    mostrarResultados(data: PredictionResponse): void {
        this.mostrarRiesgo(data);
        this.mostrarProbabilidadAprobar(data);
        this.mostrarAnalisisIA(data);
        this.crearGraficos(data);
        this.scrollToResults();
    }

    /**
     * Muestra el nivel de riesgo
     */
    private mostrarRiesgo(data: PredictionResponse): void {
        const riskBadge = getElement(DOM_IDS.RISK_BADGE);
        if (riskBadge) {
            riskBadge.innerHTML = generarBadgeRiesgo(data.nivel_riesgo);
        }
    }

    /**
     * Muestra la probabilidad de aprobar
     */
    private mostrarProbabilidadAprobar(data: PredictionResponse): void {
        const probAprobar = getElement(DOM_IDS.PROB_APROBAR);
        if (probAprobar) {
            const probabilidad = 100 - Math.round(data.porcentaje_riesgo);
            probAprobar.textContent = `${probabilidad}%`;
        }
    }

    /**
     * Muestra el análisis IA
     */
    private mostrarAnalisisIA(data: PredictionResponse): void {
        const iaAnalysis = getElement(DOM_IDS.IA_ANALYSIS);
        if (iaAnalysis) {
            iaAnalysis.innerHTML = formatearAnalisis(data.analisis_ia);
        }
    }

    /**
     * Crea todos los gráficos
     */
    private crearGraficos(data: PredictionResponse): void {
        chartManager.crearGraficoVelocimetro(
            data.porcentaje_riesgo,
            data.nivel_riesgo,
            DOM_IDS.GAUGE_CHART
        );
        
        chartManager.crearGraficoBarras(
            data.datos_radar,
            DOM_IDS.BAR_CHART
        );

        chartManager.crearGraficoNotas(
            data.datos_radar,
            DOM_IDS.NOTES_CHART
        );

        chartManager.crearGraficoAsistencia(
            data.datos_radar,
            DOM_IDS.ATTENDANCE_CHART
        );
    }

    /**
     * Hace scroll a los resultados
     */
    private scrollToResults(): void {
        scrollToElement(DOM_IDS.RESULTS_CONTAINER);
    }
}

// Singleton
export const resultsHandler = new ResultsHandler();

