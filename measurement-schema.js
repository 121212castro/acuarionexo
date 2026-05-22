/* AcuarioNexo · esquema central de mediciones · GitHub Pages + Supabase */
(function(){
  const S = {
    aquariumTypes:{reef:"Reef",marine:"Marino",freshwater:"Dulce",planted:"Dulce plantado",betta:"Betta",angelfish:"Escalares",breeding:"Cría",hospital:"Hospital",quarantine:"Cuarentena",other:"Otro"},
    mainByMode:{
      marine:["temperature_c","salinity_ppt","specific_gravity","ph","kh_dkh","nitrite_no2","nitrate_no3","phosphate_po4","calcium_ca","magnesium_mg","potassium_k"],
      freshwater:["temperature_c","ph","kh_dkh","gh","ammonia_nh3","nitrite_no2","nitrate_no3","phosphate_po4","tds","conductivity","co2","iron_fe"]
    },
    advancedGroups:{
      marine:{"ICP / Trazas":["strontium_sr","boron_b","iodine_i","iron_fe","manganese_mn","molybdenum_mo","vanadium_v","lithium_li","barium_ba"],"Contaminantes":["copper_cu","zinc_zn","nickel_ni","chromium_cr","aluminum_al","chlorine_cl"],"Oxígeno / ORP":["oxygen_o2","orp_mv"],"Agua / ósmosis":["tds","conductivity","silicate_sio2"]},
      freshwater:{"Básicos dulce":["temperature_c","ph","kh_dkh","gh"],"Nitrogenados":["ammonia_nh3","nitrite_no2","nitrate_no3"],"Plantado":["co2","phosphate_po4","iron_fe","potassium_k"],"Agua / ósmosis":["tds","conductivity","chlorine_cl"],"Avanzados":["oxygen_o2","silicate_sio2","copper_cu","alkalinity_total"]}
    },
    brands:["Hanna","Salifert","JBL","Red Sea","Sera","API","Colombo","Fauna Marin","Tropic Marin","Nyos","ICP","Sonda","Controlador","Refractómetro","Densímetro","Medidor digital","Manual/Otro"],
    parameters:{
      temperature_c:{label:"Temperatura",unit:"°C",decimals:1,category:"físicos",methods:["Manual/Otro","Sonda","Controlador"],ranges:{reef:[24.5,26,24,27],marine:[24,26.5,23,28],freshwater:[22,27,20,30],planted:[22,26,20,28],betta:[25,27,24,29],angelfish:[25,28,24,30],breeding:[25,28,24,30],hospital:[24,28,23,30],quarantine:[24,28,23,30]}},
      salinity_ppt:{label:"Salinidad",unit:"ppt",decimals:1,category:"físicos",methods:["Refractómetro","Medidor digital","Manual/Otro"],ranges:{reef:[34,35.5,33,36],marine:[33,35.5,32,36],hospital:[30,35,28,36],quarantine:[30,35,28,36]}},
      specific_gravity:{label:"Densidad",unit:"SG",decimals:3,category:"físicos",methods:["Refractómetro","Densímetro","Medidor digital"],ranges:{reef:[1.024,1.026,1.023,1.027],marine:[1.022,1.026,1.020,1.028]}},
      ph:{label:"pH",unit:"pH",decimals:2,category:"estabilidad",methods:["JBL","Salifert","Red Sea","Sera","API","Hanna","Sonda","Manual/Otro"],ranges:{reef:[8.0,8.4,7.8,8.5],marine:[8.0,8.4,7.8,8.5],freshwater:[6.5,7.8,6.0,8.5],planted:[6.4,7.4,6.0,8.0],betta:[6.5,7.5,6.0,8.0],angelfish:[6.2,7.2,6.0,7.8],breeding:[6.0,7.5,5.8,8.0]}},
      kh_dkh:{label:"KH / Alcalinidad",unit:"dKH",decimals:1,category:"estabilidad",methods:["Hanna","Salifert","JBL","Red Sea","Fauna Marin","Tropic Marin","Nyos","Manual/Otro"],ranges:{reef:[7.5,8.8,7,9.5],marine:[7,10,6.5,11],freshwater:[3,10,1,15],planted:[3,7,1,10],betta:[2,6,1,10],angelfish:[1,5,0,8]}},
      calcium_ca:{label:"Calcio Ca",unit:"mg/L Ca",decimals:0,category:"mayores",methods:["Hanna","Salifert","Red Sea","JBL","Fauna Marin","Tropic Marin","Nyos","ICP","Manual/Otro"],ranges:{reef:[400,450,380,470],marine:[380,460,350,500]}},
      magnesium_mg:{label:"Magnesio Mg",unit:"mg/L Mg",decimals:0,category:"mayores",methods:["Salifert","Red Sea","JBL","Fauna Marin","Tropic Marin","Nyos","ICP","Manual/Otro"],ranges:{reef:[1250,1400,1200,1450],marine:[1200,1450,1150,1550]}},
      potassium_k:{label:"Potasio K",unit:"mg/L K",decimals:0,category:"mayores/trazas",methods:["Salifert","Fauna Marin","Tropic Marin","ICP","Manual/Otro"],ranges:{reef:[380,430,360,450],marine:[360,440,330,480],freshwater:[10,30,5,40],planted:[10,30,5,40]}},
      strontium_sr:{label:"Estroncio Sr",unit:"mg/L Sr",decimals:1,category:"trazas",methods:["Salifert","Fauna Marin","ICP","Manual/Otro"],ranges:{reef:[7,10,5,12],marine:[6,11,4,14]}},
      boron_b:{label:"Boro B",unit:"mg/L B",decimals:2,category:"trazas",methods:["ICP","Manual/Otro"],ranges:{reef:[4,5,3,6],marine:[3.5,5.5,2.5,7]}},
      iodine_i:{label:"Yodo I",unit:"mg/L I",decimals:3,category:"trazas",methods:["Salifert","Red Sea","Fauna Marin","ICP","Manual/Otro"],ranges:{reef:[0.03,0.08,0.02,0.10],marine:[0.02,0.09,0.01,0.12]}},
      iron_fe:{label:"Hierro Fe",unit:"mg/L Fe",decimals:3,category:"trazas",methods:["JBL","Red Sea","ICP","Manual/Otro"],ranges:{reef:[0,0.05,0,0.10],marine:[0,0.05,0,0.10],freshwater:[0.05,0.20,0.02,0.50],planted:[0.05,0.20,0.02,0.50]}},
      manganese_mn:{label:"Manganeso Mn",unit:"µg/L Mn",decimals:2,category:"trazas",methods:["ICP","Manual/Otro"],ranges:{reef:[0,2,0,5]}},
      molybdenum_mo:{label:"Molibdeno Mo",unit:"µg/L Mo",decimals:2,category:"trazas",methods:["ICP","Manual/Otro"],ranges:{reef:[8,14,5,20]}},
      vanadium_v:{label:"Vanadio V",unit:"µg/L V",decimals:2,category:"trazas",methods:["ICP","Manual/Otro"],ranges:{reef:[0,2,0,5]}},
      lithium_li:{label:"Litio Li",unit:"µg/L Li",decimals:1,category:"trazas",methods:["ICP","Manual/Otro"],ranges:{reef:[150,250,80,350]}},
      barium_ba:{label:"Bario Ba",unit:"µg/L Ba",decimals:1,category:"trazas",methods:["ICP","Manual/Otro"],ranges:{reef:[0,20,0,50]}},
      zinc_zn:{label:"Zinc Zn",unit:"µg/L Zn",decimals:2,category:"trazas/contaminantes",methods:["ICP","Manual/Otro"],ranges:{reef:[0,5,0,10]}},
      copper_cu:{label:"Cobre Cu",unit:"µg/L Cu",decimals:2,category:"contaminantes",methods:["ICP","Salifert","JBL","Manual/Otro"],ranges:{reef:[0,1,0,3],marine:[0,2,0,5],freshwater:[0,10,0,20]}},
      nickel_ni:{label:"Níquel Ni",unit:"µg/L Ni",decimals:2,category:"contaminantes",methods:["ICP","Manual/Otro"],ranges:{reef:[0,5,0,10]}},
      chromium_cr:{label:"Cromo Cr",unit:"µg/L Cr",decimals:2,category:"contaminantes",methods:["ICP","Manual/Otro"],ranges:{reef:[0,2,0,5]}},
      aluminum_al:{label:"Aluminio Al",unit:"µg/L Al",decimals:1,category:"contaminantes",methods:["ICP","Manual/Otro"],ranges:{reef:[0,30,0,80]}},
      phosphate_po4:{label:"Fosfato PO4",unit:"ppm PO4",decimals:4,category:"nutrientes",methods:["Hanna Fósforo ULR ppb P","Hanna Fosfato ULR ppm PO4","JBL","Salifert","Red Sea","Nyos","Fauna Marin","ICP","Manual/Otro"],ranges:{reef:[0.02,0.08,0.01,0.12],marine:[0.02,0.15,0,0.25],freshwater:[0.1,1.5,0,3],planted:[0.5,2,0.1,3]}},
      phosphorus_p:{label:"Fósforo P",unit:"ppb P",decimals:0,category:"nutrientes",methods:["Hanna Fósforo ULR ppb P","ICP","Manual/Otro"],ranges:{reef:[7,26,3,39]}},
      nitrate_no3:{label:"Nitrato NO3",unit:"ppm NO3",decimals:2,category:"nutrientes",methods:["Hanna","JBL","Salifert","Red Sea","Nyos","Sera","API","ICP","Manual/Otro"],ranges:{reef:[2,15,1,25],marine:[2,30,0,50],freshwater:[5,40,0,60],planted:[10,30,5,50],betta:[5,30,0,50],angelfish:[5,25,0,40],breeding:[0,20,0,30]}},
      nitrite_no2:{label:"Nitrito NO2",unit:"ppm NO2",decimals:3,category:"ciclado",methods:["JBL","Salifert","Red Sea","Sera","API","Manual/Otro"],ranges:{reef:[0,0,0,0.02],marine:[0,0,0,0.02],freshwater:[0,0,0,0.05],hospital:[0,0,0,0.05],quarantine:[0,0,0,0.05]}},
      ammonia_nh3:{label:"Amonio/Amoniaco NH3/NH4",unit:"ppm NH3/NH4",decimals:3,category:"ciclado",methods:["JBL","Salifert","Red Sea","Sera","API","Seachem Alert","Manual/Otro"],ranges:{reef:[0,0,0,0.02],marine:[0,0,0,0.02],freshwater:[0,0,0,0.05],hospital:[0,0,0,0.05],quarantine:[0,0,0,0.05]}},
      silicate_sio2:{label:"Silicato SiO2",unit:"ppm SiO2",decimals:2,category:"nutrientes",methods:["JBL","Salifert","ICP","Manual/Otro"],ranges:{reef:[0,0.1,0,0.3],marine:[0,0.2,0,0.5],freshwater:[0,2,0,5]}},
      oxygen_o2:{label:"Oxígeno O2",unit:"mg/L O2",decimals:1,category:"físicos",methods:["JBL","Sera","Sonda","Manual/Otro"],ranges:{reef:[6,9,5,10],marine:[6,9,5,10],freshwater:[6,10,5,12]}},
      orp_mv:{label:"ORP",unit:"mV",decimals:0,category:"físicos",methods:["Sonda","Controlador","Manual/Otro"],ranges:{reef:[300,420,250,450],marine:[280,430,230,470]}},
      co2:{label:"CO2",unit:"mg/L CO2",decimals:1,category:"plantado",methods:["Drop checker","Tabla pH/KH","Sonda","Manual/Otro"],ranges:{planted:[15,30,5,40],freshwater:[0,20,0,35]}},
      chlorine_cl:{label:"Cloro",unit:"mg/L Cl",decimals:3,category:"agua",methods:["JBL","Sera","API","Manual/Otro"],ranges:{reef:[0,0,0,0],marine:[0,0,0,0],freshwater:[0,0,0,0]}},
      tds:{label:"TDS",unit:"ppm TDS",decimals:0,category:"agua",methods:["Medidor digital","Manual/Otro"],ranges:{reef:[0,5,0,10],freshwater:[50,400,20,800],planted:[80,350,30,600],betta:[80,250,30,500]}},
      conductivity:{label:"Conductividad",unit:"µS/cm",decimals:0,category:"agua",methods:["Medidor digital","Sonda","Manual/Otro"],ranges:{freshwater:[100,700,50,1200],planted:[150,650,80,1000],betta:[100,450,50,900]}},
      gh:{label:"GH",unit:"dGH",decimals:1,category:"dulce",methods:["JBL","Sera","API","Manual/Otro"],ranges:{freshwater:[4,14,2,25],planted:[3,12,1,20],betta:[3,8,1,15],angelfish:[2,8,1,12],breeding:[1,8,0,12]}},
      alkalinity_total:{label:"Alcalinidad total",unit:"mg/L CaCO3",decimals:0,category:"estabilidad",methods:["Manual/Otro","ICP"],ranges:{freshwater:[50,180,20,300]}}
    }
  };
  window.MeasurementSchema = S;
  window.MEASUREMENT_SCHEMA = S;
})();