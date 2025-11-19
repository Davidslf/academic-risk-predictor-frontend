/**
 * Formatters y utilidades
 * Funciones puras para formatear datos
 * Responsabilidad Única: Transformación de datos para visualización
 */

import type { NivelRiesgo } from '../types/prediction.types';
import { RISK_LEVELS } from '../constants/app.constants';

/**
 * Formatea el análisis IA con HTML
 * Convierte markdown simple a HTML
 * @param texto - Texto del análisis IA
 * @returns HTML formateado
 */
export function formatearAnalisis(texto: string): string {
    let html = texto;
    
    // Negrita: **texto** -> <strong>texto</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
    
    // Reemplazar saltos de línea
    html = html.replace(/\\n/g, '\n');
    
    // Procesar líneas
    html = html
        .split('\n')
        .map((linea) => {
            linea = linea.trim();
            
            if (!linea) {
                return '<div class="mb-3"></div>';
            }
            
            // Títulos con emojis
            if (linea.match(/^(⚠️|✅|🌟|💡|⚡|💪|🎉)/)) {
                return `<h6 class="fw-bold mt-3 mb-2">${linea}</h6>`;
            }
            
            // Listas con viñetas
            if (linea.startsWith('•')) {
                return `<div class="ms-3 mb-2">• ${linea.substring(1).trim()}</div>`;
            }
            
            // Sub-listas
            if (linea.startsWith('   •')) {
                return `<div class="ms-5 mb-2 small">→ ${linea.substring(4).trim()}</div>`;
            }
            
            // Separadores
            if (linea === '---') {
                return '<hr class="my-3">';
            }
            
            // Párrafos normales
            return `<p class="mb-3">${linea}</p>`;
        })
        .join('');
    
    return html;
}

/**
 * Obtiene la configuración visual del nivel de riesgo
 * @param nivel - Nivel de riesgo
 * @returns Configuración del nivel de riesgo
 */
export function getRiskConfig(nivel: NivelRiesgo) {
    return RISK_LEVELS[nivel];
}

/**
 * Genera el HTML del badge de riesgo
 * @param nivel - Nivel de riesgo
 * @returns HTML del badge
 */
export function generarBadgeRiesgo(nivel: NivelRiesgo): string {
    const config = getRiskConfig(nivel);
    return `<span class="risk-badge ${config.className}">${config.icon} ${config.label}</span>`;
}

/**
 * Formatea un número con decimales específicos
 * @param valor - Número a formatear
 * @param decimales - Cantidad de decimales
 * @returns Número formateado
 */
export function formatearNumero(valor: number, decimales: number = 2): string {
    return valor.toFixed(decimales);
}

/**
 * Convierte un valor booleano a 0 o 1
 * @param valor - Valor booleano
 * @returns 0 o 1
 */
export function boolToInt(valor: boolean): 0 | 1 {
    return valor ? 1 : 0;
}

/**
 * Obtiene el elemento del DOM de forma segura
 * @param id - ID del elemento
 * @returns Elemento HTML o null
 */
export function getElement<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

/**
 * Obtiene el elemento del DOM y lanza error si no existe
 * @param id - ID del elemento
 * @returns Elemento HTML
 * @throws Error si el elemento no existe
 */
export function getElementOrThrow<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = getElement<T>(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element;
}

/**
 * Scroll suave a un elemento
 * @param elementId - ID del elemento
 */
export function scrollToElement(elementId: string): void {
    const element = getElement(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

