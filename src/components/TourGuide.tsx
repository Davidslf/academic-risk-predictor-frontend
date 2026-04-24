import { Joyride, type Step, type EventData, STATUS } from 'react-joyride'

interface Props {
  run: boolean
  steps: Step[]
  onEnd: () => void
}

/**
 * Shared react-joyride v3 wrapper styled with the AR navy/cyan palette.
 *
 * react-joyride v3 API notes:
 * - Named export `Joyride` (no default export)
 * - Options (showProgress, skipBeacon, etc.) go in `options?: Partial<Options>`
 * - Callback is `onEvent: (data: EventData, controls) => void`
 * - `styles` is in SharedProps (passed directly, not nested in `options`)
 */
export default function TourGuide({ run, steps, onEnd }: Props) {
  const handleEvent = (data: EventData) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      onEnd()
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      options={{
        showProgress:       true,
        skipBeacon:         true,
        overlayClickAction: false,
        backgroundColor:    '#1A2B4A',
        textColor:          'rgba(255,255,255,0.85)',
        primaryColor:       '#00B4D8',
        overlayColor:       'rgba(0,0,0,0.55)',
        zIndex:             20000,
        buttons:            ['back', 'primary', 'skip'],
        width:              360,
      }}
      locale={{
        back:  'Atrás',
        close: 'Cerrar',
        last:  '¡Listo!',
        next:  'Siguiente',
        open:  'Abrir',
        skip:  'Saltar tour',
      }}
      styles={{
        tooltip: {
          borderRadius: '1rem',
          padding:      '1.25rem',
          fontSize:     '0.85rem',
          boxShadow:    '0 20px 60px -10px rgba(0,0,0,0.4)',
        },
        tooltipTitle: {
          color:        '#00B4D8',
          fontWeight:   700,
          fontSize:     '0.9rem',
          marginBottom: '0.4rem',
        },
        tooltipContent: {
          padding:    '0.25rem 0',
          lineHeight: '1.6',
        },
        tooltipFooter: {
          marginTop: '0.75rem',
        },
        buttonPrimary: {
          backgroundColor: '#00B4D8',
          borderRadius:    '999px',
          fontSize:        '0.78rem',
          fontWeight:      700,
          padding:         '0.45rem 1rem',
        },
        buttonBack: {
          color:       'rgba(255,255,255,0.5)',
          fontSize:    '0.78rem',
          marginRight: '0.5rem',
        },
        buttonSkip: {
          color:    'rgba(255,255,255,0.35)',
          fontSize: '0.75rem',
        },
        buttonClose: {
          color: 'rgba(255,255,255,0.35)',
        },
        beaconInner: {
          backgroundColor: '#00B4D8',
        },
        beaconOuter: {
          backgroundColor: 'rgba(0,180,216,0.25)',
          borderColor:     '#00B4D8',
        },
      }}
    />
  )
}
