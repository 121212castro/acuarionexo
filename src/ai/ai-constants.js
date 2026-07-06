/* AcuarioNexo · AI constants */
(function () {
  const AI_DAY = 24 * 60 * 60 * 1000;
  const aiMeasurementPlans = {
    marine: { temperature_c: 1, salinity_ppt: 2, ph: 2, kh_dkh: 3, nitrate_no3: 7, phosphate_po4: 7, calcium_ca: 30, magnesium_mg: 30, potassium_k: 30, iodine_i: 30, strontium_sr: 30 },
    freshwater: { temperature_c: 1, ph: 7, kh_dkh: 14, gh: 14, ammonia_nh3: 7, nitrite_no2: 7, nitrate_no3: 7, phosphate_po4: 30, iron_fe: 30, tds: 14 }
  };
  const aiParameterLabels = {
    temperature_c: 'Temperatura',
    salinity_ppt: 'Salinidad',
    salinity_sg: 'Salinidad',
    ph: 'pH',
    kh_dkh: 'KH',
    nitrate_no3: 'NO3',
    phosphate_po4: 'PO4',
    calcium_ca: 'Calcio',
    magnesium_mg: 'Magnesio',
    potassium_k: 'Potasio',
    iodine_i: 'Yodo',
    strontium_sr: 'Estroncio',
    boron_b: 'Boro',
    iron_fe: 'Hierro',
    manganese_mn: 'Manganeso',
    zinc_zn: 'Zinc',
    copper_cu: 'Cobre',
    aluminum_al: 'Aluminio',
    silicon_si: 'Silicio',
    lithium_li: 'Litio',
    gh: 'GH',
    ammonia_nh3: 'NH3/NH4',
    ammonium_nh4: 'NH4',
    nitrite_no2: 'NO2',
    tds: 'TDS',
    chlorine_cl2: 'Cloro',
    oxygen_o2: 'Oxígeno',
    nickel_ni: 'Níquel',
    chromium_cr: 'Cromo',
    vanadium_v: 'Vanadio',
    molybdenum_mo: 'Molibdeno',
    fluorine_f: 'Flúor',
    bromine_br: 'Bromo'
  };

  window.ANX = window.ANX || {};
  Object.assign(window.ANX, { AI_DAY, aiMeasurementPlans, aiParameterLabels });
  window.ANX.AiConstants = { AI_DAY, aiMeasurementPlans, aiParameterLabels };
})();