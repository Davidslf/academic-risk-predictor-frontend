/**
 * Chart Factory
 * Crea y gestiona las instancias de gráficos Chart.js
 * Responsabilidad Única: Creación y configuración de gráficos
 * Patrón Factory para crear diferentes tipos de gráficos
 */

import type { NivelRiesgo, DatosRadar } from '../types/prediction.types';
import { CHART_COLORS, FEATURE_NAMES } from '../constants/app.constants';
import { getRiskConfig } from '../utils/formatters';

// Types para Chart.js (se cargan en runtime)
declare const Chart: any;

/**
 * Clase para gestionar los gráficos
 * Mantiene referencias a las instancias para poder destruirlas
 */
export class ChartManager {
    private gaugeChart: any = null;
    private barChart: any = null;
    private notesChart: any = null;
    private attendanceChart: any = null;

    /**
     * Crea o actualiza el gráfico de velocímetro
     * @param porcentaje - Porcentaje de riesgo
     * @param nivel - Nivel de riesgo
     * @param canvasId - ID del canvas
     */
    crearGraficoVelocimetro(porcentaje: number, nivel: NivelRiesgo, canvasId: string): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context');
            return;
        }

        // Destruir gráfico anterior si existe
        if (this.gaugeChart) {
            this.gaugeChart.destroy();
        }

        const riskConfig = getRiskConfig(nivel);
        const color = riskConfig.color;

        this.gaugeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [
                    {
                        data: [porcentaje, 100 - porcentaje],
                        backgroundColor: [color, CHART_COLORS.GRAY],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.2,
                circumference: 180,
                rotation: 270,
                cutout: '70%',
                layout: {
                    padding: {
                        bottom: 30
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                },
                animation: {
                    animateRotate: true,
                    animateScale: false,
                },
            },
            plugins: [
                {
                    id: 'textCenter',
                    beforeDraw: (chart: any) => {
                        const { width, height, ctx } = chart;
                        ctx.restore();

                        const centerX = width / 2;
                        const centerY = height * 0.7;

                        // Porcentaje
                        const fontSize = Math.min(height / 3.5, 60);
                        ctx.font = `bold ${fontSize}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = color;
                        ctx.fillText(`${Math.round(porcentaje)}%`, centerX, centerY);

                        // Texto
                        const smallFontSize = Math.min(height / 12, 18);
                        ctx.font = `${smallFontSize}px Arial`;
                        ctx.fillStyle = '#6b7280';
                        ctx.fillText('de Riesgo', centerX, centerY + fontSize * 0.65);

                        ctx.save();
                    },
                },
            ],
        });
    }

    /**
     * Crea o actualiza el gráfico de barras comparativo (solo Asistencia y Logins)
     * @param datosRadar - Datos para el gráfico
     * @param canvasId - ID del canvas
     */
    crearGraficoBarras(datosRadar: DatosRadar, canvasId: string): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context');
            return;
        }

        // Destruir gráfico anterior si existe
        if (this.barChart) {
            this.barChart.destroy();
        }

        // Filtrar solo Asistencia y Logins
        const filteredData = this.filtrarDatos(datosRadar, ['Asistencia', 'Logins']);

        this.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredData.labels,
                datasets: [
                    {
                        label: 'Tus Datos',
                        data: filteredData.estudiante,
                        backgroundColor: CHART_COLORS.PRIMARY,
                        borderColor: CHART_COLORS.PRIMARY,
                        borderWidth: 2,
                    },
                    {
                        label: 'Promedio Aprobados',
                        data: filteredData.promedio_aprobado,
                        backgroundColor: CHART_COLORS.SUCCESS,
                        borderColor: CHART_COLORS.SUCCESS,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    /**
     * Crea o actualiza el gráfico de notas (Seguimiento y Parcial 1) con escala 0-5
     * @param datosRadar - Datos para el gráfico
     * @param canvasId - ID del canvas
     */
    crearGraficoNotas(datosRadar: DatosRadar, canvasId: string): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context');
            return;
        }

        // Destruir gráfico anterior si existe
        if (this.notesChart) {
            this.notesChart.destroy();
        }

        // Filtrar solo Seguimiento y Parcial 1
        const filteredData = this.filtrarDatos(datosRadar, ['Seguimiento', 'Parcial 1']);

        this.notesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredData.labels,
                datasets: [
                    {
                        label: 'Tus Datos',
                        data: filteredData.estudiante,
                        backgroundColor: CHART_COLORS.PRIMARY,
                        borderColor: CHART_COLORS.PRIMARY,
                        borderWidth: 2,
                    },
                    {
                        label: 'Promedio Aprobados',
                        data: filteredData.promedio_aprobado,
                        backgroundColor: CHART_COLORS.SUCCESS,
                        borderColor: CHART_COLORS.SUCCESS,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 0.5,
                        },
                    },
                },
            },
        });
    }

    /**
     * Filtra los datos para mantener solo las variables especificadas
     * @param datosRadar - Datos originales
     * @param variablesToKeep - Array con los nombres de las variables a mantener
     * @returns Datos filtrados
     */
    private filtrarDatos(datosRadar: DatosRadar, variablesToKeep: string[]): DatosRadar {
        const indices: number[] = [];
        const filteredLabels: string[] = [];
        const filteredEstudiante: number[] = [];
        const filteredPromedio: number[] = [];

        datosRadar.labels.forEach((label, index) => {
            if (variablesToKeep.includes(label)) {
                filteredLabels.push(label);
                filteredEstudiante.push(datosRadar.estudiante[index]);
                filteredPromedio.push(datosRadar.promedio_aprobado[index]);
            }
        });

        return {
            labels: filteredLabels,
            estudiante: filteredEstudiante,
            promedio_aprobado: filteredPromedio,
        };
    }

    /**
     * Crea o actualiza el gráfico de asistencia con escala 0-100
     * @param datosRadar - Datos para el gráfico
     * @param canvasId - ID del canvas
     */
    crearGraficoAsistencia(datosRadar: DatosRadar, canvasId: string): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2d context');
            return;
        }

        // Destruir gráfico anterior si existe
        if (this.attendanceChart) {
            this.attendanceChart.destroy();
        }

        // Debug: ver qué labels están llegando
        console.log('Labels disponibles:', datosRadar.labels);
        console.log('Datos estudiante:', datosRadar.estudiante);
        console.log('Datos promedio:', datosRadar.promedio_aprobado);

        // Buscar el índice de Asistencia (puede venir con diferente nombre)
        const asistenciaIndex = datosRadar.labels.findIndex(label => 
            label.toLowerCase().includes('asistencia')
        );
        
        console.log('Índice de asistencia encontrado:', asistenciaIndex);

        let filteredData: DatosRadar;
        if (asistenciaIndex !== -1) {
            // Si encontró asistencia, usar ese dato
            filteredData = {
                labels: [datosRadar.labels[asistenciaIndex]],
                estudiante: [datosRadar.estudiante[asistenciaIndex]],
                promedio_aprobado: [datosRadar.promedio_aprobado[asistenciaIndex]]
            };
        } else {
            // Fallback: usar el primer elemento
            console.warn('No se encontró Asistencia, usando primer elemento');
            filteredData = {
                labels: [datosRadar.labels[0]],
                estudiante: [datosRadar.estudiante[0]],
                promedio_aprobado: [datosRadar.promedio_aprobado[0]]
            };
        }
        
        console.log('Datos filtrados:', filteredData);

        this.attendanceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: filteredData.labels,
                datasets: [
                    {
                        label: 'Tus Datos',
                        data: filteredData.estudiante,
                        backgroundColor: CHART_COLORS.PRIMARY,
                        borderColor: CHART_COLORS.PRIMARY,
                        borderWidth: 2,
                    },
                    {
                        label: 'Promedio Aprobados',
                        data: filteredData.promedio_aprobado,
                        backgroundColor: CHART_COLORS.SUCCESS,
                        borderColor: CHART_COLORS.SUCCESS,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 10,
                        },
                    },
                },
            },
        });
    }

    /**
     * Destruye todos los gráficos
     */
    destruirTodos(): void {
        if (this.gaugeChart) this.gaugeChart.destroy();
        if (this.barChart) this.barChart.destroy();
        if (this.notesChart) this.notesChart.destroy();
        if (this.attendanceChart) this.attendanceChart.destroy();
    }
}

// Singleton - una sola instancia del gestor de gráficos
export const chartManager = new ChartManager();

