// GENERATED FILE. Edit src/library/core/library-schema*.js and run npm run library:sync-server.
export const LIBRARY_CONTRACT = {
  "statuses": [
    "identified",
    "draft",
    "review",
    "validated",
    "published"
  ],
  "biologicalTypes": [
    "pez_marino",
    "pez_dulce",
    "coral",
    "invertebrado",
    "planta",
    "microfauna",
    "fitoplancton"
  ],
  "productTypes": [
    "producto",
    "medicamento",
    "sal",
    "aditivo",
    "alimento",
    "test",
    "equipamiento"
  ],
  "contracts": {
    "pez_marino": [
      "title",
      "scientific_name",
      "common_names",
      "synonyms",
      "family",
      "order_name",
      "class_name",
      "distribution",
      "habitat",
      "depth_range",
      "natural_environment",
      "adult_size_cm",
      "life_expectancy_years",
      "minimum_tank_liters",
      "recommended_tank_liters",
      "tank_maturity",
      "temperature_min",
      "temperature_max",
      "ph_min",
      "ph_max",
      "kh_min",
      "kh_max",
      "salinity_min",
      "salinity_max",
      "nitrate_max",
      "phosphate_max",
      "diet",
      "feeding_frequency",
      "feeding_notes",
      "behavior",
      "aggressiveness",
      "territoriality",
      "social_behavior",
      "compatibility",
      "fish_compatibility",
      "coral_compatibility",
      "invertebrate_compatibility",
      "reef_safe",
      "reef_safe_notes",
      "care_level",
      "beginner_suitable",
      "acclimation",
      "common_diseases",
      "health_notes",
      "reproduction",
      "purchase_recommendations",
      "common_mistakes",
      "curiosities",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "pez_dulce": [
      "title",
      "scientific_name",
      "common_names",
      "synonyms",
      "family",
      "order_name",
      "class_name",
      "distribution",
      "habitat",
      "natural_environment",
      "adult_size_cm",
      "life_expectancy_years",
      "minimum_tank_liters",
      "recommended_tank_liters",
      "temperature_min",
      "temperature_max",
      "ph_min",
      "ph_max",
      "gh_min",
      "gh_max",
      "kh_min",
      "kh_max",
      "diet",
      "feeding_frequency",
      "feeding_notes",
      "behavior",
      "aggressiveness",
      "territoriality",
      "schooling",
      "swimming_zone",
      "compatibility",
      "plant_compatibility",
      "invertebrate_compatibility",
      "care_level",
      "beginner_suitable",
      "acclimation",
      "common_diseases",
      "health_notes",
      "reproduction",
      "breeding_notes",
      "purchase_recommendations",
      "common_mistakes",
      "curiosities",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "coral": [
      "title",
      "scientific_name",
      "common_names",
      "synonyms",
      "family",
      "distribution",
      "habitat",
      "depth_range",
      "natural_environment",
      "coral_type",
      "growth_form",
      "lighting",
      "par_range",
      "flow",
      "placement",
      "aggressiveness",
      "sweeper_tentacles",
      "growth_rate",
      "adult_size_cm",
      "feeding",
      "feeding_frequency",
      "photosynthetic",
      "reef_safe",
      "compatibility",
      "fish_compatibility",
      "invertebrate_compatibility",
      "temperature_min",
      "temperature_max",
      "salinity_min",
      "salinity_max",
      "ph_min",
      "ph_max",
      "kh_min",
      "kh_max",
      "calcium_min",
      "calcium_max",
      "magnesium_min",
      "magnesium_max",
      "nitrate_range",
      "phosphate_range",
      "care_level",
      "beginner_suitable",
      "fragging",
      "propagation",
      "common_problems",
      "pests",
      "purchase_recommendations",
      "common_mistakes",
      "curiosities",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "invertebrado": [
      "title",
      "scientific_name",
      "common_names",
      "synonyms",
      "family",
      "distribution",
      "habitat",
      "natural_environment",
      "adult_size_cm",
      "minimum_tank_liters",
      "temperature_min",
      "temperature_max",
      "ph_min",
      "ph_max",
      "salinity_min",
      "salinity_max",
      "kh_min",
      "kh_max",
      "diet",
      "feeding",
      "feeding_frequency",
      "behavior",
      "aggressiveness",
      "territoriality",
      "reef_safe",
      "reef_safe_notes",
      "coral_compatibility",
      "fish_compatibility",
      "invertebrate_compatibility",
      "molting",
      "iodine_sensitivity",
      "copper_sensitivity",
      "care_level",
      "beginner_suitable",
      "acclimation",
      "common_problems",
      "reproduction",
      "purchase_recommendations",
      "common_mistakes",
      "curiosities",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "planta": [
      "title",
      "scientific_name",
      "common_names",
      "synonyms",
      "family",
      "distribution",
      "habitat",
      "natural_environment",
      "plant_type",
      "growth_rate",
      "height_cm",
      "placement",
      "temperature_min",
      "temperature_max",
      "ph_min",
      "ph_max",
      "gh_min",
      "gh_max",
      "kh_min",
      "kh_max",
      "lighting",
      "co2",
      "fertilization",
      "substrate",
      "propagation",
      "maintenance",
      "trimming",
      "compatibility",
      "fish_compatibility",
      "invertebrate_compatibility",
      "care_level",
      "beginner_suitable",
      "common_problems",
      "algae_risk",
      "purchase_recommendations",
      "common_mistakes",
      "curiosities",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "microfauna": [
      "title",
      "scientific_name",
      "common_names",
      "culture_type",
      "identification",
      "use_in_aquarium",
      "target_animals",
      "culture_method",
      "container",
      "temperature_min",
      "temperature_max",
      "salinity_min",
      "salinity_max",
      "feeding",
      "feeding_frequency",
      "harvest",
      "harvest_frequency",
      "maintenance",
      "water_changes",
      "density_control",
      "crash_risks",
      "contamination_risks",
      "storage",
      "care_level",
      "common_problems",
      "common_mistakes",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "fitoplancton": [
      "title",
      "scientific_name",
      "common_names",
      "synonyms",
      "family",
      "class_name",
      "phylum",
      "culture_type",
      "identification",
      "cell_size",
      "pigmentation",
      "use_in_aquarium",
      "target_animals",
      "culture_method",
      "container",
      "lighting",
      "photoperiod",
      "temperature_min",
      "temperature_max",
      "salinity_min",
      "salinity_max",
      "feeding",
      "fertilization",
      "aeration",
      "harvest",
      "harvest_frequency",
      "maintenance",
      "water_changes",
      "density_control",
      "crash_risks",
      "contamination_risks",
      "storage",
      "care_level",
      "common_problems",
      "common_mistakes",
      "curiosities",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "producto": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "category",
      "composition",
      "active_components",
      "intended_use",
      "dose",
      "dose_calculation",
      "use",
      "instructions",
      "monitoring",
      "compatibility",
      "risks",
      "warnings",
      "storage",
      "expiry",
      "aquarium_type",
      "source_label",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "sal": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "composition",
      "declared_parameters",
      "salinity_reference",
      "grams_per_liter",
      "mixing",
      "mixing_time",
      "dose",
      "dose_calculation",
      "use",
      "water_change_use",
      "monitoring",
      "compatibility",
      "risks",
      "storage",
      "expiry",
      "aquarium_type",
      "source_label",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "aditivo": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "composition",
      "active_components",
      "what_corrects",
      "parameter_target",
      "dose",
      "dose_calculation",
      "maximum_dose",
      "use",
      "instructions",
      "monitoring",
      "compatibility",
      "risks",
      "warnings",
      "storage",
      "expiry",
      "aquarium_type",
      "source_label",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "alimento": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "food_type",
      "composition",
      "analysis",
      "particle_size",
      "target_species",
      "feeding_frequency",
      "dose",
      "use",
      "instructions",
      "compatibility",
      "risks",
      "storage",
      "expiry",
      "aquarium_type",
      "source_label",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "medicamento": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "active_ingredient",
      "indications",
      "target_diseases",
      "dose",
      "dose_calculation",
      "treatment_days",
      "repeat_treatment",
      "remove_equipment",
      "water_change_after",
      "monitoring",
      "compatibility",
      "contraindications",
      "risks",
      "warnings",
      "storage",
      "expiry",
      "hospital_tank_use",
      "source_label",
      "ai_notes",
      "user_summary",
      "sources"
    ],
    "test": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "test_type",
      "intended_use",
      "parameter",
      "measured_ion_or_compound",
      "reading_unit",
      "range",
      "resolution",
      "accuracy",
      "scale_values",
      "device_min_limit",
      "device_max_limit",
      "led_wavelength",
      "compatibility",
      "freshwater_compatible",
      "saltwater_compatible",
      "reef_compatible",
      "use_limitations",
      "included_reagents",
      "reagent_code",
      "reagent_tests",
      "standard_code",
      "expiry",
      "lot",
      "storage",
      "sample_volume",
      "final_cuvette_volume",
      "zero_water_required",
      "procedure",
      "mixing_time",
      "waiting_time",
      "reading_time",
      "cleaning_after_use",
      "method",
      "interpretation",
      "error_messages",
      "interferences",
      "repeat_measurement_if",
      "recommended_min",
      "recommended_max",
      "target_value",
      "alert_min",
      "alert_max",
      "related_parameters",
      "primary_field",
      "internal_unit",
      "data_type",
      "save_date",
      "save_time",
      "save_reagent_lot",
      "save_reagent_expiry",
      "save_observations",
      "user_summary",
      "action_if_value_under_target",
      "action_if_value_over_target",
      "check_before_correction",
      "common_errors",
      "interpretation_risks",
      "correction_risks",
      "ai_notes",
      "do_not_confuse_with",
      "safety_rules",
      "source_label",
      "sources"
    ],
    "equipamiento": [
      "title",
      "manufacturer",
      "brand",
      "product_code",
      "equipment_type",
      "specifications",
      "power",
      "consumption_watts",
      "flow",
      "volume",
      "tank_size_recommended",
      "installation",
      "setup",
      "maintenance",
      "cleaning_frequency",
      "spare_parts",
      "compatibility",
      "risks",
      "warnings",
      "warranty",
      "source_manual",
      "ai_notes",
      "user_summary",
      "sources"
    ]
  },
  "fieldRules": {
    "pez_marino": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "synonyms": {
        "id": "synonyms",
        "label": "Sinónimos",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "family": {
        "id": "family",
        "label": "Familia",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "order_name": {
        "id": "order_name",
        "label": "Orden",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "class_name": {
        "id": "class_name",
        "label": "Clase",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "adult_size_cm": {
        "id": "adult_size_cm",
        "label": "Tamaño adulto",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "life_expectancy_years": {
        "id": "life_expectancy_years",
        "label": "Esperanza de vida",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "beginner_suitable": {
        "id": "beginner_suitable",
        "label": "Apto para principiantes",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "distribution": {
        "id": "distribution",
        "label": "Distribución",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "habitat": {
        "id": "habitat",
        "label": "Hábitat natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "depth_range": {
        "id": "depth_range",
        "label": "Profundidad",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "natural_environment": {
        "id": "natural_environment",
        "label": "Entorno natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "minimum_tank_liters": {
        "id": "minimum_tank_liters",
        "label": "Acuario mínimo",
        "section": "aquarium",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "recommended_tank_liters": {
        "id": "recommended_tank_liters",
        "label": "Acuario recomendado",
        "section": "aquarium",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "tank_maturity": {
        "id": "tank_maturity",
        "label": "Madurez del acuario",
        "section": "aquarium",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_min": {
        "id": "ph_min",
        "label": "pH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_max": {
        "id": "ph_max",
        "label": "pH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_min": {
        "id": "kh_min",
        "label": "KH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_max": {
        "id": "kh_max",
        "label": "KH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_min": {
        "id": "salinity_min",
        "label": "Salinidad mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_max": {
        "id": "salinity_max",
        "label": "Salinidad máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "nitrate_max": {
        "id": "nitrate_max",
        "label": "Nitrato máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "phosphate_max": {
        "id": "phosphate_max",
        "label": "Fosfato máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "behavior": {
        "id": "behavior",
        "label": "Comportamiento",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "aggressiveness": {
        "id": "aggressiveness",
        "label": "Agresividad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "territoriality": {
        "id": "territoriality",
        "label": "Territorialidad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "social_behavior": {
        "id": "social_behavior",
        "label": "Comportamiento social",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "fish_compatibility": {
        "id": "fish_compatibility",
        "label": "Compatibilidad con peces",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "coral_compatibility": {
        "id": "coral_compatibility",
        "label": "Compatibilidad con corales",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "invertebrate_compatibility": {
        "id": "invertebrate_compatibility",
        "label": "Compatibilidad con invertebrados",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "diet": {
        "id": "diet",
        "label": "Dieta",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_frequency": {
        "id": "feeding_frequency",
        "label": "Frecuencia de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_notes": {
        "id": "feeding_notes",
        "label": "Notas de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "reef_safe": {
        "id": "reef_safe",
        "label": "Reef safe",
        "section": "reef_safe",
        "type": "enum",
        "minLength": 1,
        "allowed": [
          "Sí",
          "Sí con precaución",
          "No"
        ],
        "validator": null
      },
      "reef_safe_notes": {
        "id": "reef_safe_notes",
        "label": "Detalle reef safe",
        "section": "reef_safe",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "reproduction": {
        "id": "reproduction",
        "label": "Reproducción",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "acclimation": {
        "id": "acclimation",
        "label": "Aclimatación",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_diseases": {
        "id": "common_diseases",
        "label": "Enfermedades frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "health_notes": {
        "id": "health_notes",
        "label": "Notas de salud",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "purchase_recommendations": {
        "id": "purchase_recommendations",
        "label": "Antes de comprar",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "curiosities": {
        "id": "curiosities",
        "label": "Curiosidades",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "pez_dulce": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "synonyms": {
        "id": "synonyms",
        "label": "Sinónimos",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "family": {
        "id": "family",
        "label": "Familia",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "order_name": {
        "id": "order_name",
        "label": "Orden",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "class_name": {
        "id": "class_name",
        "label": "Clase",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "adult_size_cm": {
        "id": "adult_size_cm",
        "label": "Tamaño adulto",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "life_expectancy_years": {
        "id": "life_expectancy_years",
        "label": "Esperanza de vida",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "beginner_suitable": {
        "id": "beginner_suitable",
        "label": "Apto para principiantes",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "distribution": {
        "id": "distribution",
        "label": "Distribución",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "habitat": {
        "id": "habitat",
        "label": "Hábitat natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "natural_environment": {
        "id": "natural_environment",
        "label": "Entorno natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "minimum_tank_liters": {
        "id": "minimum_tank_liters",
        "label": "Acuario mínimo",
        "section": "aquarium",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "recommended_tank_liters": {
        "id": "recommended_tank_liters",
        "label": "Acuario recomendado",
        "section": "aquarium",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_min": {
        "id": "ph_min",
        "label": "pH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_max": {
        "id": "ph_max",
        "label": "pH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "gh_min": {
        "id": "gh_min",
        "label": "GH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "gh_max": {
        "id": "gh_max",
        "label": "GH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_min": {
        "id": "kh_min",
        "label": "KH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_max": {
        "id": "kh_max",
        "label": "KH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "behavior": {
        "id": "behavior",
        "label": "Comportamiento",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "aggressiveness": {
        "id": "aggressiveness",
        "label": "Agresividad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "territoriality": {
        "id": "territoriality",
        "label": "Territorialidad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "schooling": {
        "id": "schooling",
        "label": "Cardumen / grupo",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "swimming_zone": {
        "id": "swimming_zone",
        "label": "Zona de nado",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "plant_compatibility": {
        "id": "plant_compatibility",
        "label": "Compatibilidad con plantas",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "invertebrate_compatibility": {
        "id": "invertebrate_compatibility",
        "label": "Compatibilidad con invertebrados",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "diet": {
        "id": "diet",
        "label": "Dieta",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_frequency": {
        "id": "feeding_frequency",
        "label": "Frecuencia de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_notes": {
        "id": "feeding_notes",
        "label": "Notas de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "reproduction": {
        "id": "reproduction",
        "label": "Reproducción",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "breeding_notes": {
        "id": "breeding_notes",
        "label": "Notas de cría",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "acclimation": {
        "id": "acclimation",
        "label": "Aclimatación",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_diseases": {
        "id": "common_diseases",
        "label": "Enfermedades frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "health_notes": {
        "id": "health_notes",
        "label": "Notas de salud",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "purchase_recommendations": {
        "id": "purchase_recommendations",
        "label": "Antes de comprar",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "curiosities": {
        "id": "curiosities",
        "label": "Curiosidades",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "coral": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "synonyms": {
        "id": "synonyms",
        "label": "Sinónimos",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "family": {
        "id": "family",
        "label": "Familia",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "coral_type": {
        "id": "coral_type",
        "label": "Tipo de coral",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "adult_size_cm": {
        "id": "adult_size_cm",
        "label": "Tamaño adulto",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "beginner_suitable": {
        "id": "beginner_suitable",
        "label": "Apto para principiantes",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "distribution": {
        "id": "distribution",
        "label": "Distribución",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "habitat": {
        "id": "habitat",
        "label": "Hábitat natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "depth_range": {
        "id": "depth_range",
        "label": "Profundidad",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "natural_environment": {
        "id": "natural_environment",
        "label": "Entorno natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_min": {
        "id": "salinity_min",
        "label": "Salinidad mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_max": {
        "id": "salinity_max",
        "label": "Salinidad máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_min": {
        "id": "ph_min",
        "label": "pH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_max": {
        "id": "ph_max",
        "label": "pH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_min": {
        "id": "kh_min",
        "label": "KH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_max": {
        "id": "kh_max",
        "label": "KH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "calcium_min": {
        "id": "calcium_min",
        "label": "Calcio mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "calcium_max": {
        "id": "calcium_max",
        "label": "Calcio máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "magnesium_min": {
        "id": "magnesium_min",
        "label": "Magnesio mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "magnesium_max": {
        "id": "magnesium_max",
        "label": "Magnesio máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "nitrate_range": {
        "id": "nitrate_range",
        "label": "Rango de nitrato",
        "section": "parameters",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "phosphate_range": {
        "id": "phosphate_range",
        "label": "Rango de fosfato",
        "section": "parameters",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "growth_form": {
        "id": "growth_form",
        "label": "Forma de crecimiento",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "aggressiveness": {
        "id": "aggressiveness",
        "label": "Agresividad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sweeper_tentacles": {
        "id": "sweeper_tentacles",
        "label": "Tentáculos barredores",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "growth_rate": {
        "id": "growth_rate",
        "label": "Crecimiento",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "photosynthetic": {
        "id": "photosynthetic",
        "label": "Fotosintético",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "fish_compatibility": {
        "id": "fish_compatibility",
        "label": "Compatibilidad con peces",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "invertebrate_compatibility": {
        "id": "invertebrate_compatibility",
        "label": "Compatibilidad con invertebrados",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding": {
        "id": "feeding",
        "label": "Alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_frequency": {
        "id": "feeding_frequency",
        "label": "Frecuencia de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "reef_safe": {
        "id": "reef_safe",
        "label": "Reef safe",
        "section": "reef_safe",
        "type": "enum",
        "minLength": 1,
        "allowed": [
          "Sí",
          "Sí con precaución",
          "No"
        ],
        "validator": null
      },
      "fragging": {
        "id": "fragging",
        "label": "Fragging",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "propagation": {
        "id": "propagation",
        "label": "Propagación",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_problems": {
        "id": "common_problems",
        "label": "Problemas frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "pests": {
        "id": "pests",
        "label": "Plagas",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "purchase_recommendations": {
        "id": "purchase_recommendations",
        "label": "Antes de comprar",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "lighting": {
        "id": "lighting",
        "label": "Iluminación",
        "section": "lighting",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "par_range": {
        "id": "par_range",
        "label": "Rango PAR",
        "section": "lighting",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "flow": {
        "id": "flow",
        "label": "Flujo",
        "section": "flow",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "placement": {
        "id": "placement",
        "label": "Ubicación",
        "section": "placement",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "curiosities": {
        "id": "curiosities",
        "label": "Curiosidades",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "invertebrado": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "synonyms": {
        "id": "synonyms",
        "label": "Sinónimos",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "family": {
        "id": "family",
        "label": "Familia",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "adult_size_cm": {
        "id": "adult_size_cm",
        "label": "Tamaño adulto",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "beginner_suitable": {
        "id": "beginner_suitable",
        "label": "Apto para principiantes",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "distribution": {
        "id": "distribution",
        "label": "Distribución",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "habitat": {
        "id": "habitat",
        "label": "Hábitat natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "natural_environment": {
        "id": "natural_environment",
        "label": "Entorno natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "minimum_tank_liters": {
        "id": "minimum_tank_liters",
        "label": "Acuario mínimo",
        "section": "aquarium",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_min": {
        "id": "ph_min",
        "label": "pH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_max": {
        "id": "ph_max",
        "label": "pH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_min": {
        "id": "salinity_min",
        "label": "Salinidad mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_max": {
        "id": "salinity_max",
        "label": "Salinidad máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_min": {
        "id": "kh_min",
        "label": "KH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_max": {
        "id": "kh_max",
        "label": "KH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "behavior": {
        "id": "behavior",
        "label": "Comportamiento",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "aggressiveness": {
        "id": "aggressiveness",
        "label": "Agresividad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "territoriality": {
        "id": "territoriality",
        "label": "Territorialidad",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "coral_compatibility": {
        "id": "coral_compatibility",
        "label": "Compatibilidad con corales",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "fish_compatibility": {
        "id": "fish_compatibility",
        "label": "Compatibilidad con peces",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "invertebrate_compatibility": {
        "id": "invertebrate_compatibility",
        "label": "Compatibilidad con invertebrados",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "diet": {
        "id": "diet",
        "label": "Dieta",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding": {
        "id": "feeding",
        "label": "Alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_frequency": {
        "id": "feeding_frequency",
        "label": "Frecuencia de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "reef_safe": {
        "id": "reef_safe",
        "label": "Reef safe",
        "section": "reef_safe",
        "type": "enum",
        "minLength": 1,
        "allowed": [
          "Sí",
          "Sí con precaución",
          "No"
        ],
        "validator": null
      },
      "reef_safe_notes": {
        "id": "reef_safe_notes",
        "label": "Detalle reef safe",
        "section": "reef_safe",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "reproduction": {
        "id": "reproduction",
        "label": "Reproducción",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "molting": {
        "id": "molting",
        "label": "Muda",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "iodine_sensitivity": {
        "id": "iodine_sensitivity",
        "label": "Sensibilidad al yodo",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "copper_sensitivity": {
        "id": "copper_sensitivity",
        "label": "Sensibilidad al cobre",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "acclimation": {
        "id": "acclimation",
        "label": "Aclimatación",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_problems": {
        "id": "common_problems",
        "label": "Problemas frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "purchase_recommendations": {
        "id": "purchase_recommendations",
        "label": "Antes de comprar",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "curiosities": {
        "id": "curiosities",
        "label": "Curiosidades",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "planta": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "synonyms": {
        "id": "synonyms",
        "label": "Sinónimos",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "family": {
        "id": "family",
        "label": "Familia",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "plant_type": {
        "id": "plant_type",
        "label": "Tipo de planta",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "height_cm": {
        "id": "height_cm",
        "label": "Altura",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "beginner_suitable": {
        "id": "beginner_suitable",
        "label": "Apto para principiantes",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "distribution": {
        "id": "distribution",
        "label": "Distribución",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "habitat": {
        "id": "habitat",
        "label": "Hábitat natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "natural_environment": {
        "id": "natural_environment",
        "label": "Entorno natural",
        "section": "habitat",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "substrate": {
        "id": "substrate",
        "label": "Sustrato",
        "section": "aquarium",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_min": {
        "id": "ph_min",
        "label": "pH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "ph_max": {
        "id": "ph_max",
        "label": "pH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "gh_min": {
        "id": "gh_min",
        "label": "GH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "gh_max": {
        "id": "gh_max",
        "label": "GH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_min": {
        "id": "kh_min",
        "label": "KH mínimo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "kh_max": {
        "id": "kh_max",
        "label": "KH máximo",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "growth_rate": {
        "id": "growth_rate",
        "label": "Crecimiento",
        "section": "behavior",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "fish_compatibility": {
        "id": "fish_compatibility",
        "label": "Compatibilidad con peces",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "invertebrate_compatibility": {
        "id": "invertebrate_compatibility",
        "label": "Compatibilidad con invertebrados",
        "section": "compatibility",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "propagation": {
        "id": "propagation",
        "label": "Propagación",
        "section": "breeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_problems": {
        "id": "common_problems",
        "label": "Problemas frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "co2": {
        "id": "co2",
        "label": "CO2",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "fertilization": {
        "id": "fertilization",
        "label": "Fertilización",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "maintenance": {
        "id": "maintenance",
        "label": "Mantenimiento",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "trimming": {
        "id": "trimming",
        "label": "Poda",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "purchase_recommendations": {
        "id": "purchase_recommendations",
        "label": "Antes de comprar",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "lighting": {
        "id": "lighting",
        "label": "Iluminación",
        "section": "lighting",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "placement": {
        "id": "placement",
        "label": "Ubicación",
        "section": "placement",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "algae_risk": {
        "id": "algae_risk",
        "label": "Riesgo de algas",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "curiosities": {
        "id": "curiosities",
        "label": "Curiosidades",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "microfauna": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "culture_type": {
        "id": "culture_type",
        "label": "Tipo de cultivo",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "identification": {
        "id": "identification",
        "label": "Identificación",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "target_animals": {
        "id": "target_animals",
        "label": "Animales objetivo",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_min": {
        "id": "salinity_min",
        "label": "Salinidad mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_max": {
        "id": "salinity_max",
        "label": "Salinidad máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "feeding": {
        "id": "feeding",
        "label": "Alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_frequency": {
        "id": "feeding_frequency",
        "label": "Frecuencia de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_problems": {
        "id": "common_problems",
        "label": "Problemas frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "maintenance": {
        "id": "maintenance",
        "label": "Mantenimiento",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "culture_method": {
        "id": "culture_method",
        "label": "Método de cultivo",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "container": {
        "id": "container",
        "label": "Recipiente",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "water_changes": {
        "id": "water_changes",
        "label": "Cambios de agua",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "density_control": {
        "id": "density_control",
        "label": "Control de densidad",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "crash_risks": {
        "id": "crash_risks",
        "label": "Riesgos de colapso",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "contamination_risks": {
        "id": "contamination_risks",
        "label": "Riesgos de contaminación",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "harvest": {
        "id": "harvest",
        "label": "Cosecha",
        "section": "harvest",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "harvest_frequency": {
        "id": "harvest_frequency",
        "label": "Frecuencia de cosecha",
        "section": "harvest",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "use_in_aquarium": {
        "id": "use_in_aquarium",
        "label": "Uso en acuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "fitoplancton": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scientific_name": {
        "id": "scientific_name",
        "label": "Nombre científico",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": "scientificName"
      },
      "common_names": {
        "id": "common_names",
        "label": "Otros nombres comunes",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "synonyms": {
        "id": "synonyms",
        "label": "Sinónimos",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "family": {
        "id": "family",
        "label": "Familia",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "class_name": {
        "id": "class_name",
        "label": "Clase",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "phylum": {
        "id": "phylum",
        "label": "Filo",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "culture_type": {
        "id": "culture_type",
        "label": "Tipo de cultivo",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "identification": {
        "id": "identification",
        "label": "Identificación",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "cell_size": {
        "id": "cell_size",
        "label": "Tamaño celular",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "pigmentation": {
        "id": "pigmentation",
        "label": "Pigmentación",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "target_animals": {
        "id": "target_animals",
        "label": "Animales objetivo",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "care_level": {
        "id": "care_level",
        "label": "Nivel de cuidado",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "temperature_min": {
        "id": "temperature_min",
        "label": "Temperatura mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "temperature_max": {
        "id": "temperature_max",
        "label": "Temperatura máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_min": {
        "id": "salinity_min",
        "label": "Salinidad mínima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "salinity_max": {
        "id": "salinity_max",
        "label": "Salinidad máxima",
        "section": "parameters",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "feeding": {
        "id": "feeding",
        "label": "Alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_problems": {
        "id": "common_problems",
        "label": "Problemas frecuentes",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "fertilization": {
        "id": "fertilization",
        "label": "Fertilización",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "aeration": {
        "id": "aeration",
        "label": "Aireación",
        "section": "maintenance",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "maintenance": {
        "id": "maintenance",
        "label": "Mantenimiento",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "lighting": {
        "id": "lighting",
        "label": "Iluminación",
        "section": "lighting",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "photoperiod": {
        "id": "photoperiod",
        "label": "Fotoperiodo",
        "section": "lighting",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "culture_method": {
        "id": "culture_method",
        "label": "Método de cultivo",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "container": {
        "id": "container",
        "label": "Recipiente",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "water_changes": {
        "id": "water_changes",
        "label": "Cambios de agua",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "density_control": {
        "id": "density_control",
        "label": "Control de densidad",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "crash_risks": {
        "id": "crash_risks",
        "label": "Riesgos de colapso",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "contamination_risks": {
        "id": "contamination_risks",
        "label": "Riesgos de contaminación",
        "section": "culture",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "harvest": {
        "id": "harvest",
        "label": "Cosecha",
        "section": "harvest",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "harvest_frequency": {
        "id": "harvest_frequency",
        "label": "Frecuencia de cosecha",
        "section": "harvest",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "use_in_aquarium": {
        "id": "use_in_aquarium",
        "label": "Uso en acuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "common_mistakes": {
        "id": "common_mistakes",
        "label": "Errores frecuentes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "curiosities": {
        "id": "curiosities",
        "label": "Curiosidades",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "producto": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "category": {
        "id": "category",
        "label": "Categoría",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "active_components": {
        "id": "active_components",
        "label": "Componentes activos",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "intended_use": {
        "id": "intended_use",
        "label": "Uso previsto",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "aquarium_type": {
        "id": "aquarium_type",
        "label": "Tipo de acuario",
        "section": "aquarium",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "composition": {
        "id": "composition",
        "label": "Composición",
        "section": "feeding",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "expiry": {
        "id": "expiry",
        "label": "Caducidad",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "source_label": {
        "id": "source_label",
        "label": "Etiqueta de fuente",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "use": {
        "id": "use",
        "label": "Uso recomendado",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "instructions": {
        "id": "instructions",
        "label": "Instrucciones",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose": {
        "id": "dose",
        "label": "Dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose_calculation": {
        "id": "dose_calculation",
        "label": "Cálculo de dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "monitoring": {
        "id": "monitoring",
        "label": "Seguimiento",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "risks": {
        "id": "risks",
        "label": "Riesgos",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "warnings": {
        "id": "warnings",
        "label": "Advertencias",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "sal": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "grams_per_liter": {
        "id": "grams_per_liter",
        "label": "Gramos por litro",
        "section": "identity",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "aquarium_type": {
        "id": "aquarium_type",
        "label": "Tipo de acuario",
        "section": "aquarium",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "declared_parameters": {
        "id": "declared_parameters",
        "label": "Parámetros declarados",
        "section": "parameters",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "salinity_reference": {
        "id": "salinity_reference",
        "label": "Referencia de salinidad",
        "section": "parameters",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "composition": {
        "id": "composition",
        "label": "Composición",
        "section": "feeding",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "expiry": {
        "id": "expiry",
        "label": "Caducidad",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "source_label": {
        "id": "source_label",
        "label": "Etiqueta de fuente",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "mixing_time": {
        "id": "mixing_time",
        "label": "Tiempo de mezcla",
        "section": "procedure",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "mixing": {
        "id": "mixing",
        "label": "Preparación / mezcla",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "use": {
        "id": "use",
        "label": "Uso recomendado",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "water_change_use": {
        "id": "water_change_use",
        "label": "Uso en cambios de agua",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose": {
        "id": "dose",
        "label": "Dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose_calculation": {
        "id": "dose_calculation",
        "label": "Cálculo de dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "monitoring": {
        "id": "monitoring",
        "label": "Seguimiento",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "risks": {
        "id": "risks",
        "label": "Riesgos",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "aditivo": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "active_components": {
        "id": "active_components",
        "label": "Componentes activos",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "what_corrects": {
        "id": "what_corrects",
        "label": "Qué corrige",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "aquarium_type": {
        "id": "aquarium_type",
        "label": "Tipo de acuario",
        "section": "aquarium",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "parameter_target": {
        "id": "parameter_target",
        "label": "Parámetro objetivo",
        "section": "parameters",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "composition": {
        "id": "composition",
        "label": "Composición",
        "section": "feeding",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "expiry": {
        "id": "expiry",
        "label": "Caducidad",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "source_label": {
        "id": "source_label",
        "label": "Etiqueta de fuente",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "use": {
        "id": "use",
        "label": "Uso recomendado",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "instructions": {
        "id": "instructions",
        "label": "Instrucciones",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose": {
        "id": "dose",
        "label": "Dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose_calculation": {
        "id": "dose_calculation",
        "label": "Cálculo de dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "maximum_dose": {
        "id": "maximum_dose",
        "label": "Dosis máxima",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "monitoring": {
        "id": "monitoring",
        "label": "Seguimiento",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "risks": {
        "id": "risks",
        "label": "Riesgos",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "warnings": {
        "id": "warnings",
        "label": "Advertencias",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "alimento": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "food_type": {
        "id": "food_type",
        "label": "Tipo de alimento",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "aquarium_type": {
        "id": "aquarium_type",
        "label": "Tipo de acuario",
        "section": "aquarium",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "composition": {
        "id": "composition",
        "label": "Composición",
        "section": "feeding",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "analysis": {
        "id": "analysis",
        "label": "Análisis garantizado",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "particle_size": {
        "id": "particle_size",
        "label": "Tamaño de partícula",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "target_species": {
        "id": "target_species",
        "label": "Especies objetivo",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "feeding_frequency": {
        "id": "feeding_frequency",
        "label": "Frecuencia de alimentación",
        "section": "feeding",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "expiry": {
        "id": "expiry",
        "label": "Caducidad",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "source_label": {
        "id": "source_label",
        "label": "Etiqueta de fuente",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "use": {
        "id": "use",
        "label": "Uso recomendado",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "instructions": {
        "id": "instructions",
        "label": "Instrucciones",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose": {
        "id": "dose",
        "label": "Dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "risks": {
        "id": "risks",
        "label": "Riesgos",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "medicamento": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "remove_equipment": {
        "id": "remove_equipment",
        "label": "Retirar durante tratamiento",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "water_change_after": {
        "id": "water_change_after",
        "label": "Cambio de agua posterior",
        "section": "identity",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "target_diseases": {
        "id": "target_diseases",
        "label": "Enfermedades objetivo",
        "section": "health",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "expiry": {
        "id": "expiry",
        "label": "Caducidad",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "source_label": {
        "id": "source_label",
        "label": "Etiqueta de fuente",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "hospital_tank_use": {
        "id": "hospital_tank_use",
        "label": "Uso en acuario hospital",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "active_ingredient": {
        "id": "active_ingredient",
        "label": "Principio activo",
        "section": "dose",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "indications": {
        "id": "indications",
        "label": "Usos indicados",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose": {
        "id": "dose",
        "label": "Dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "dose_calculation": {
        "id": "dose_calculation",
        "label": "Cálculo de dosis",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "treatment_days": {
        "id": "treatment_days",
        "label": "Duración del tratamiento",
        "section": "dose",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "repeat_treatment": {
        "id": "repeat_treatment",
        "label": "Repetición del tratamiento",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "contraindications": {
        "id": "contraindications",
        "label": "Contraindicaciones",
        "section": "dose",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "monitoring": {
        "id": "monitoring",
        "label": "Seguimiento",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "risks": {
        "id": "risks",
        "label": "Riesgos",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "warnings": {
        "id": "warnings",
        "label": "Advertencias",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "test": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "test_type": {
        "id": "test_type",
        "label": "Tipo de test",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "intended_use": {
        "id": "intended_use",
        "label": "Uso previsto",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "parameter": {
        "id": "parameter",
        "label": "Parámetro medido",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "measured_ion_or_compound": {
        "id": "measured_ion_or_compound",
        "label": "Ion / compuesto medido",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "reading_unit": {
        "id": "reading_unit",
        "label": "Unidad de lectura",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "range": {
        "id": "range",
        "label": "Rango",
        "section": "measurement",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "resolution": {
        "id": "resolution",
        "label": "Resolución",
        "section": "measurement",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "accuracy": {
        "id": "accuracy",
        "label": "Precisión",
        "section": "measurement",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "scale_values": {
        "id": "scale_values",
        "label": "Valores de escala",
        "section": "measurement",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "device_min_limit": {
        "id": "device_min_limit",
        "label": "Límite inferior del equipo",
        "section": "measurement",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "device_max_limit": {
        "id": "device_max_limit",
        "label": "Límite superior del equipo",
        "section": "measurement",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "led_wavelength": {
        "id": "led_wavelength",
        "label": "Longitud de onda / LED",
        "section": "measurement",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "freshwater_compatible": {
        "id": "freshwater_compatible",
        "label": "Agua dulce",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "saltwater_compatible": {
        "id": "saltwater_compatible",
        "label": "Agua marina",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "reef_compatible": {
        "id": "reef_compatible",
        "label": "Arrecife",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "use_limitations": {
        "id": "use_limitations",
        "label": "Limitaciones de uso",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "cleaning_after_use": {
        "id": "cleaning_after_use",
        "label": "Limpieza posterior",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "expiry": {
        "id": "expiry",
        "label": "Caducidad",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "lot": {
        "id": "lot",
        "label": "Lote",
        "section": "purchase",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "storage": {
        "id": "storage",
        "label": "Conservación",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "source_label": {
        "id": "source_label",
        "label": "Etiqueta de fuente",
        "section": "purchase",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "included_reagents": {
        "id": "included_reagents",
        "label": "Reactivos incluidos",
        "section": "reagents",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "reagent_code": {
        "id": "reagent_code",
        "label": "Código de reactivo",
        "section": "reagents",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "reagent_tests": {
        "id": "reagent_tests",
        "label": "Número de tests por recambio",
        "section": "reagents",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "standard_code": {
        "id": "standard_code",
        "label": "Código de estándar / verificación",
        "section": "reagents",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "sample_volume": {
        "id": "sample_volume",
        "label": "Volumen de muestra",
        "section": "procedure",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "final_cuvette_volume": {
        "id": "final_cuvette_volume",
        "label": "Volumen final en cubeta",
        "section": "procedure",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "zero_water_required": {
        "id": "zero_water_required",
        "label": "Agua necesaria para cero",
        "section": "procedure",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "procedure": {
        "id": "procedure",
        "label": "Procedimiento",
        "section": "procedure",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "mixing_time": {
        "id": "mixing_time",
        "label": "Tiempo de mezcla",
        "section": "procedure",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "waiting_time": {
        "id": "waiting_time",
        "label": "Tiempo de espera",
        "section": "procedure",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "reading_time": {
        "id": "reading_time",
        "label": "Tiempo de lectura",
        "section": "procedure",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "do_not_confuse_with": {
        "id": "do_not_confuse_with",
        "label": "Do not confuse with",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "method": {
        "id": "method",
        "label": "Método",
        "section": "reading",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "interpretation": {
        "id": "interpretation",
        "label": "Interpretación",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "error_messages": {
        "id": "error_messages",
        "label": "Mensajes de error",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "interferences": {
        "id": "interferences",
        "label": "Interferencias",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "repeat_measurement_if": {
        "id": "repeat_measurement_if",
        "label": "Repetir medición si",
        "section": "reading",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "recommended_min": {
        "id": "recommended_min",
        "label": "Valor mínimo recomendado",
        "section": "recommended_values",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "recommended_max": {
        "id": "recommended_max",
        "label": "Valor máximo recomendado",
        "section": "recommended_values",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "target_value": {
        "id": "target_value",
        "label": "Valor objetivo",
        "section": "recommended_values",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "alert_min": {
        "id": "alert_min",
        "label": "Valor de alerta inferior",
        "section": "recommended_values",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "alert_max": {
        "id": "alert_max",
        "label": "Valor de alerta superior",
        "section": "recommended_values",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "related_parameters": {
        "id": "related_parameters",
        "label": "Parámetros relacionados",
        "section": "recommended_values",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "primary_field": {
        "id": "primary_field",
        "label": "Campo principal",
        "section": "mapping",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "internal_unit": {
        "id": "internal_unit",
        "label": "Unidad interna",
        "section": "mapping",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "data_type": {
        "id": "data_type",
        "label": "Tipo de dato",
        "section": "mapping",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "save_date": {
        "id": "save_date",
        "label": "Guardar fecha",
        "section": "mapping",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "save_time": {
        "id": "save_time",
        "label": "Guardar hora",
        "section": "mapping",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "save_reagent_lot": {
        "id": "save_reagent_lot",
        "label": "Guardar lote",
        "section": "mapping",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "save_reagent_expiry": {
        "id": "save_reagent_expiry",
        "label": "Guardar caducidad",
        "section": "mapping",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "save_observations": {
        "id": "save_observations",
        "label": "Guardar observaciones",
        "section": "mapping",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "common_errors": {
        "id": "common_errors",
        "label": "Errores comunes",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "interpretation_risks": {
        "id": "interpretation_risks",
        "label": "Interpretation risks",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "correction_risks": {
        "id": "correction_risks",
        "label": "Correction risks",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "action_if_value_under_target": {
        "id": "action_if_value_under_target",
        "label": "Action if value under target",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "action_if_value_over_target": {
        "id": "action_if_value_over_target",
        "label": "Action if value over target",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "check_before_correction": {
        "id": "check_before_correction",
        "label": "Check before correction",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "safety_rules": {
        "id": "safety_rules",
        "label": "Safety rules",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    },
    "equipamiento": {
      "title": {
        "id": "title",
        "label": "Nombre común / producto",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "manufacturer": {
        "id": "manufacturer",
        "label": "Fabricante",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "brand": {
        "id": "brand",
        "label": "Marca",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "product_code": {
        "id": "product_code",
        "label": "Modelo / código",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "equipment_type": {
        "id": "equipment_type",
        "label": "Equipment type",
        "section": "identity",
        "type": "text",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "warranty": {
        "id": "warranty",
        "label": "Warranty",
        "section": "identity",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "tank_size_recommended": {
        "id": "tank_size_recommended",
        "label": "Tank size recommended",
        "section": "aquarium",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "compatibility": {
        "id": "compatibility",
        "label": "Compatibilidad general",
        "section": "compatibility",
        "type": "text",
        "minLength": 2,
        "allowed": null,
        "validator": null
      },
      "maintenance": {
        "id": "maintenance",
        "label": "Mantenimiento",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "cleaning_frequency": {
        "id": "cleaning_frequency",
        "label": "Cleaning frequency",
        "section": "maintenance",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "spare_parts": {
        "id": "spare_parts",
        "label": "Spare parts",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "source_manual": {
        "id": "source_manual",
        "label": "Source manual",
        "section": "purchase",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "flow": {
        "id": "flow",
        "label": "Flujo",
        "section": "flow",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "user_summary": {
        "id": "user_summary",
        "label": "Resumen para usuario",
        "section": "use",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "risks": {
        "id": "risks",
        "label": "Riesgos",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "warnings": {
        "id": "warnings",
        "label": "Advertencias",
        "section": "risks",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "specifications": {
        "id": "specifications",
        "label": "Specifications",
        "section": "specs",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "power": {
        "id": "power",
        "label": "Power",
        "section": "specs",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "consumption_watts": {
        "id": "consumption_watts",
        "label": "Consumption watts",
        "section": "specs",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "volume": {
        "id": "volume",
        "label": "Volume",
        "section": "specs",
        "type": "number",
        "minLength": 1,
        "allowed": null,
        "validator": null
      },
      "installation": {
        "id": "installation",
        "label": "Installation",
        "section": "specs",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "setup": {
        "id": "setup",
        "label": "Setup",
        "section": "specs",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "ai_notes": {
        "id": "ai_notes",
        "label": "Notas para IA",
        "section": "ai",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      },
      "sources": {
        "id": "sources",
        "label": "Sources",
        "section": "sources",
        "type": "text",
        "minLength": 20,
        "allowed": null,
        "validator": null
      }
    }
  },
  "sourcePolicy": {
    "minimumSources": 3,
    "minimumIndependentSources": 2,
    "specializedDomains": {
      "pez_marino": [
        "fishbase.se",
        "catalogoffishes.org",
        "marinespecies.org",
        "iucnredlist.org",
        "gbif.org"
      ],
      "pez_dulce": [
        "fishbase.se",
        "catalogoffishes.org",
        "iucnredlist.org",
        "gbif.org"
      ],
      "planta": [
        "powo.science.kew.org",
        "worldfloraonline.org",
        "tropicos.org",
        "gbif.org"
      ],
      "coral": [
        "marinespecies.org",
        "coraltraits.org",
        "iucnredlist.org",
        "gbif.org"
      ],
      "invertebrado": [
        "marinespecies.org",
        "iucnredlist.org",
        "gbif.org"
      ],
      "microfauna": [
        "marinespecies.org",
        "algaebase.org",
        "gbif.org"
      ],
      "fitoplancton": [
        "algaebase.org",
        "marinespecies.org",
        "gbif.org"
      ]
    },
    "officialSourcePattern": "\\b(fabricante|manufacturer|oficial|official|manual|prospecto|ficha t[eé]cnica|datasheet|safety data|sds)\\b",
    "weakSourceDomainPattern": "\\b(wikipedia\\.org|facebook\\.com|instagram\\.com|amazon\\.|ebay\\.|aliexpress\\.|mercadolibre\\.|reddit\\.com)\\b"
  }
} as const;
