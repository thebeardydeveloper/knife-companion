import type { Translations } from './en';

export const es: Translations = {
  common: {
    appName: 'KnifeCompanion',
    search: 'Buscar',
    all: 'Todos',
    cancel: 'Cancelar',
    noResults: 'Sin resultados',
    errorLoad: 'No se pudieron cargar los datos',
    retry: 'Reintentar',
    hardness: 'Dureza',
    hrc: 'HRC',
  },
  tabs: {
    search: 'Buscar',
    browse: 'Explorar',
    settings: 'Ajustes',
  },
  categories: {
    carbon: 'Acero al Carbono',
    spring: 'Acero de Resorte',
    bearing: 'Acero de Rodamiento',
    alloy: 'Acero de Aleación',
    tool_oil: 'Herramienta Endurecida en Aceite',
    tool_water: 'Herramienta Endurecida en Agua',
    tool_air: 'Herramienta Endurecida al Aire',
    tool_german: 'Acero Herramienta Alemán',
    stainless: 'Acero Inoxidable',
    semi_stainless: 'Semi-Inoxidable',
    pm: 'Pulvimetalurgia',
  },
  steelDetail: {
    tabs: {
      composition: 'Composición',
      properties: 'Propiedades',
      heatTreatment: 'Tratamiento Térmico',
      history: 'Historia',
    },
    composition: {
      title: 'Composición Química',
      element: 'Elemento',
      percentage: '%',
    },
    properties: {
      title: 'Propiedades',
      hardness: 'Rango de Dureza',
      toughness: 'Tenacidad',
      edgeRetention: 'Retención de Filo',
      corrosionResistance: 'Resistencia a la Corrosión',
      sharpenability: 'Facilidad de Afilado',
    },
    heatTreatment: {
      title: 'Guía de Tratamiento Térmico',
      stepTypes: {
        normalize: 'Normalizado',
        anneal: 'Recocido',
        stress_relief: 'Alivio de Tensiones',
        harden: 'Temple',
        quench: 'Enfriamiento',
        cryo: 'Tratamiento Criogénico',
        temper: 'Revenido',
      },
      quenchMedia: {
        oil: 'Aceite',
        water: 'Agua',
        air: 'Aire',
        brine: 'Salmuera',
        plates: 'Placas',
        interrupted: 'Interrumpido',
      },
      temperCycles: 'Ciclos de Revenido',
      cycles: 'ciclos',
      duration: 'min',
    },
    history: {
      origin: 'Origen',
      characteristics: 'Características',
    },
  },
  home: {
    subtitle: 'Tu referencia de aceros para cuchillos',
    sections: {
      encyclopedia: 'Enciclopedia de Aceros',
      encyclopediaDesc: 'Composición, propiedades y guías de tratamiento térmico para 50 aceros',
    },
  },
  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    languageOptions: {
      en: 'Inglés',
      es: 'Español',
    },
  },
};
