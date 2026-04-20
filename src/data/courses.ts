export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  content: string;
  duration: string;
  order: number;
}

export interface AssessmentQuestion {
  label: string;
  text: string;
}

export interface AssessmentSection {
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  content?: string;
  sections?: AssessmentSection[];
  type: 'case-study' | 'calculation' | 'scenario' | 'report' | 'plan' | 'quiz' | 'business' | 'selection';
}

export interface Module {
  id: string;
  title: string;
  description: string;
  introduction: string;
  duration: string;
  topics: Topic[];
  learningObjectives: string[];
  quiz: QuizQuestion[];
  assessment?: Assessment;
  answerGuide?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price: number;
  image: string;
  modules: Module[];
  learningObjectives: string[];
  rating: number;
  students: number;
}

export const courses: Course[] = [
  {
    id: 'intermediate-crop-production',
    title: 'Intermediate Crop Production',
    description: 'Master the core principles of crop production, from soil health and irrigation to pest management and post-harvest handling. This course provides practical, actionable knowledge for commercial farming success.',
    category: 'Crop Production',
    level: 'Intermediate',
    duration: '10 Weeks',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800',
    rating: 4.9,
    students: 128,
    learningObjectives: [
      'Understand soil fertility and how to manage amendments effectively',
      'Implement efficient irrigation and water management systems',
      'Apply integrated pest and disease management strategies',
      'Master harvest and post-harvest handling techniques',
      'Develop robust farm planning and record-keeping systems'
    ],
    modules: [
      {
        id: 'module-6',
        title: 'Module 6: Soil Fertility & Amendments',
        description: 'Soil nutrient deficiencies, fertility amendment plans, and practical science of plant nutrition.',
        introduction: `
Understanding how to feed your soil — and therefore your crops — is one of the most valuable skills in crop farming. 

This module moves beyond the basics of soil types (covered in Level 1) into:
- Practical science of plant nutrition.
- Fertiliser selection.
- Compost-making.
- Reading soil test results.

A farmer who manages soil fertility well consistently outperforms one who does not.
        `,
        duration: '1 Week',
        learningObjectives: [
          'Diagnose soil nutrient deficiencies and develop a fertility amendment plan',
          'Understand the role of macronutrients (NPK) and micronutrients',
          'Learn about organic fertilisers: compost, manure, and green manures',
          'Calculate fertiliser application rates correctly',
          'Interpret soil test reports and apply liming techniques'
        ],
        topics: [
          {
            id: 'topic-6-1',
            title: '6.1 Macronutrients: Nitrogen, Phosphorus, Potassium',
            order: 1,
            duration: '1 Day',
            content: `
Plants require 17 essential nutrients to grow. Of these, three are consumed in the largest quantities and are most likely to be deficient in farm soils. These are referred to as the primary macronutrients, abbreviated NPK — the same letters found on fertiliser bags.

| Nutrient | Symbol | Role in the Plant | Deficiency Symptoms |
| :--- | :--- | :--- | :--- |
| **Nitrogen** | N | Drives vegetative growth; essential for chlorophyll (green colour) and protein production | Yellowing (chlorosis) of older leaves first; stunted, pale plants |
| **Phosphorus** | P | Supports root development, flowering, seed formation, and energy transfer | Purple or reddish colouring on leaf undersides; poor root growth; delayed maturity |
| **Potassium** | K | Regulates water use, disease resistance, and quality of fruit, tubers, and grain | Brown scorching on leaf edges (marginal scorch); weak stems; poor fruit fill |

Secondary macronutrients — calcium (Ca), magnesium (Mg), and sulphur (S) — are also needed in significant quantities:
- **Calcium (Ca)**: Builds cell walls and prevents blossom end rot in tomatoes.
- **Magnesium (Mg)**: Central atom of chlorophyll.
- **Sulphur (S)**: Needed for amino acid synthesis.
            `
          },
          {
            id: 'topic-6-2',
            title: '6.2 Micronutrients and Deficiency Symptoms',
            order: 2,
            duration: '1 Day',
            content: `
Micronutrients are needed in tiny quantities but are no less essential. Deficiencies are common in soils with extreme pH, heavily leached soils, and soils with little organic matter.

| Micronutrient | Deficiency Symptom | Common Cause |
| :--- | :--- | :--- |
| **Iron (Fe)** | Yellowing of young leaves while veins stay green (interveinal chlorosis) | High pH (alkaline soil) locks up iron |
| **Zinc (Zn)** | Stunted new growth; small, deformed leaves; shortened internodes | Sandy, leached, or high-pH soils |
| **Boron (B)** | Distorted, thickened growing tips; hollow stems in brassicas | Dry conditions; light sandy soils |
| **Manganese (Mn)** | Interveinal chlorosis on young leaves; grey speck in oats | High pH; waterlogged soils |

> **Key Principle**: Micronutrient deficiencies are often a pH problem, not an absence of the nutrient in the soil. Correcting soil pH (especially reducing excess alkalinity with sulphur or acidifying fertilisers) often resolves deficiencies without additional micronutrient products.
            `
          },
          {
            id: 'topic-6-3',
            title: '6.3 Organic Fertilisers: Compost, Manure, Green Manures',
            order: 3,
            duration: '1 Day',
            content: `
Organic fertilisers feed the soil as well as the plant. They improve soil structure, stimulate biological activity, increase water-holding capacity, and release nutrients slowly — reducing the risk of over-fertilisation and nutrient leaching.

#### Compost:
- Made from decomposed plant material, kitchen scraps, and farm wastes
- NPK is low (typically 1-0.5-1) but delivers a broad spectrum of nutrients and organic matter
- Apply at 5–10 tonnes per hectare (or a 5 cm layer on garden beds) before planting
- Mature compost is dark, crumbly, earthy-smelling, and free of recognisable original materials

#### Animal manure:
- Chicken manure is highest in nitrogen (3–5% N); should be composted before use to avoid burning plants
- Cattle and pig manure are lower in N but add significant organic matter and improve soil structure
- Always compost or age raw manure for at least 6–8 weeks before applying to edible crops

#### Green manures and cover crops:
- Leguminous cover crops (clover, cowpea, vetch, beans) fix atmospheric nitrogen into the soil via root bacteria
- Slash or plough green manures in at flowering stage when nitrogen content is highest
- A well-managed legume cover crop can fix 80–200 kg N/ha — equivalent to significant bags of fertiliser
            `
          },
          {
            id: 'topic-6-4',
            title: '6.4 Inorganic Fertilisers: Types and Application Rates',
            order: 4,
            duration: '1 Day',
            content: `
Inorganic (synthetic) fertilisers deliver nutrients in concentrated, readily available forms. They act quickly but do not improve soil structure and can damage soil biology if over-applied.

| Fertiliser | NPK Analysis | Best Used For | Application Method |
| :--- | :--- | :--- | :--- |
| **LAN (Limestone Ammonium Nitrate)** | 28% N | Top-dressing growing crops for nitrogen | Band apply beside rows; avoid leaf contact |
| **Superphosphate** | 0-19-0 | Pre-plant phosphorus incorporation | Incorporate into soil before planting |
| **KCl (Muriate of Potash)** | 0-0-60 | Potassium supplementation | Incorporate or band; avoid high rates near seed |
| **2:3:2 (22) compound** | 2-3-2 + trace | Balanced basal dressing at planting | Apply in planting furrow or incorporate |
| **Urea** | 46% N | High-analysis nitrogen source; cost-effective | Apply before rain; do not leave on surface in heat |

> **Fertiliser Calculation**: To apply 60 kg N/ha using LAN (28% N): Amount of LAN needed = 60 ÷ 0.28 = 214 kg/ha. Always calculate from the nutrient content, not the bag weight. Over-application wastes money and can burn crops or pollute groundwater.
            `
          },
          {
            id: 'topic-6-5',
            title: '6.5 Reading a Soil Test Report',
            order: 5,
            duration: '1 Day',
            content: `
A soil test is one of the most cost-effective investments a farmer can make. It removes guesswork from fertiliser decisions and prevents the costly mistake of applying nutrients that are already adequate while missing those that are deficient.

How to interpret a standard soil test report:
- **pH reading**: Compare to the optimal range for your intended crop. Values below 5.5 need liming; above 7.5 may need acidifying amendments.
- **Macronutrient levels (P, K, Ca, Mg)**: Each is rated Low, Medium, or High. Apply fertiliser to correct Low ratings; maintain Medium ratings; reduce or withhold fertiliser on High ratings.
- **Organic matter %**: Below 2% is low — prioritise compost and cover crops. Above 4% is excellent.
- **Cation Exchange Capacity (CEC)**: A measure of the soil's ability to hold and supply nutrients. Sandy soils have low CEC; clay and organic-rich soils have high CEC.
- **Recommendations section**: Most laboratory reports include a crop-specific fertiliser recommendation. Use this as your starting point.
            `
          },
          {
            id: 'topic-6-6',
            title: '6.6 Liming to Correct Soil Acidity',
            order: 6,
            duration: '1 Day',
            content: `
Acidic soils (pH below 5.5) are a widespread problem, especially in high-rainfall areas and intensively farmed land. Liming raises pH, unlocks nutrients, and improves soil biology.

Types of lime:
- **Agricultural lime (ground limestone, CaCO3)**: most common; slow-acting; apply 3–6 months before planting
- **Dolomitic lime (CaMg(CO3)2)**: also supplies magnesium; preferred when Mg is deficient
- **Calcitic lime**: high in calcium; used when calcium deficiency is the primary concern

Lime application guidelines:
- Apply based on soil test recommendation — typical rates are 1–4 tonnes/ha
- Incorporate into the top 20 cm with tillage for best results
- Lime works slowly — re-test soil pH 3–6 months after application
- Do not apply lime and nitrogen fertiliser at the same time — nitrogen loss increases in alkaline conditions
            `
          }
        ],
        assessment: {
          id: 'assessment-6',
          title: 'Module 6 Assessment: Soil Test Case Study & Calculation',
          description: 'This assessment has two parts. Part A is a soil test case study requiring analysis and recommendations. Part B is a practical fertiliser calculation exercise. Both must be completed for a pass.',
          type: 'case-study',
          sections: [
            {
              title: 'Part A — Soil Test Case Study',
              description: '#### Part A — Soil Test Case Study\n\n**Scenario**: A vegetable farmer planning to grow tomatoes.\n\n| Soil Parameter | Result | Optimal Range | Status |\n| :--- | :--- | :--- | :--- |\n| **pH (KCl)** | 5.1 | 6.0 – 6.8 | Acidic (Critical) |\n| **Phosphorus (P)** | 8 mg/kg | 25 – 50 mg/kg | Low (Critical) |\n| **Potassium (K)** | 180 mg/kg | 150 – 250 mg/kg | Medium (Optimal) |\n| **Organic matter** | 1.4% | > 3% | Low |\n| **Magnesium (Mg)** | 42 mg/kg | 60 – 120 mg/kg | Low |',
              questions: [
                { label: 'Question 1', text: 'Identify the TWO most urgent problems shown in this soil test and explain why they are urgent.' },
                { label: 'Question 2', text: 'The farmer asks whether she should apply agricultural lime or dolomitic lime. Which would you recommend and why? How much should she apply, and when relative to planting?' },
                { label: 'Question 3', text: 'The organic matter level is 1.4%. Suggest TWO practical, low-cost actions the farmer can take over the next growing season to improve this, and explain how each one works.' }
              ]
            },
            {
              title: 'Part B — Fertiliser Calculation Exercise',
              description: '#### Part B — Fertiliser Calculation Exercise\n\n**Scenario**: A maize farmer has a 2-hectare field. The soil test recommends applying 80 kg N/ha and 40 kg P2O5/ha as a basal application at planting. He has access to 2:3:2 (22) compound fertiliser (NPK = 8.8% N, 13.2% P2O5, 8.8% K2O).',
              questions: [
                { label: 'Calculation 1', text: 'How many kg of 2:3:2 (22) compound fertiliser does the farmer need to supply 40 kg P2O5/ha across his 2 ha?\n\n**Show your working:**' },
                { label: 'Calculation 2', text: 'After applying the compound, will the maize meet its nitrogen requirement of 80 kg N/ha from this application alone? If not, how many kg of LAN (28% N) per hectare must he apply as a top-dressing to make up the shortfall?' }
              ]
            }
          ]
        },
        quiz: [],
        answerGuide: 'CASE STUDY: (1) pH 5.1 and low P. (2) Dolomitic lime (corrects Mg). (3) Compost and legume cover crops. CALC: (1) 606 kg total. (2) 190 kg LAN/ha.'
      },
      {
        id: 'module-7',
        title: 'Module 7: Irrigation & Water Management',
        description: 'Water movement, irrigation systems, and scheduling for maximum crop benefit.',
        introduction: `
Water scarcity is one of the greatest challenges facing agriculture. 

This module covers:
- How water moves through soil and plants.
- How different irrigation systems work.
- How to schedule irrigation for maximum crop benefit.
        `,
        duration: '1 Week',
        learningObjectives: [
          'Understand the role of water in crop production',
          'Compare different irrigation systems (Drip, Sprinkler, Furrow)',
          'Calculate crop water requirements per growth stage',
          'Implement effective irrigation scheduling',
          'Learn water harvesting and conservation techniques'
        ],
        topics: [
          {
            id: 'topic-7-1',
            title: '7.1 Importance of Water in Crop Production',
            order: 1,
            duration: '1 Day',
            content: `
Water performs multiple critical functions in the life of a crop:
- **Nutrient transport**: dissolved nutrients move from soil into roots and up through the plant via water
- **Photosynthesis**: water molecules are split during photosynthesis to produce oxygen and energy
- **Transpiration cooling**: plants release water vapour through leaf pores (stomata) to regulate temperature — critical in hot climates
- **Turgor pressure**: water pressure inside plant cells gives them rigidity; without it, plants wilt
- **Cell growth and expansion**: new cells can only expand when adequately hydrated

Water stress at critical growth stages is particularly damaging:
- **At germination**: prevents emergence or kills seedlings
- **At flowering**: causes flower drop, pollination failure, and poor fruit set
- **At grain fill**: reduces grain weight and yield by 30–50% or more
            `
          },
          {
            id: 'topic-7-2',
            title: '7.2 Types of Irrigation Systems and Their Pros and Cons',
            order: 2,
            duration: '1 Day',
            content: `
The choice of irrigation system depends on the crop, soil type, water availability, topography, budget, and scale of operation.

| System | How It Works | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- |
| **Flood / furrow** | Water flows along furrows between crop rows by gravity | Low cost; no energy needed; simple to manage | High water use; uneven distribution; encourages weed germination; unsuitable for sandy soils |
| **Sprinkler** | Pressurised water sprayed over crop surface from nozzles or rotary heads | Relatively uniform coverage; can apply fertigation; good for germination watering | Energy costs; evaporation losses; wet foliage can promote fungal disease |
| **Drip (micro irrigation)** | Water delivered directly to root zone through emitters in pipes | Most efficient (90%+ application efficiency); reduces weed pressure; enables fertigation; ideal for vegetables and orchards | High installation cost; requires filtration and maintenance; emitters can block |
| **Centre pivot** | Large rotating arm irrigates circular areas | Covers large areas; automated; consistent | Very high cost; unsuitable for small farms or irregular fields |

> **Water Use Efficiency**: Drip irrigation can reduce water use by 30–50% compared to furrow irrigation while delivering equal or better yields. For smallholder vegetable producers, even a simple gravity-fed drip kit from a raised tank is a transformative investment.
            `
          },
          {
            id: 'topic-7-3',
            title: '7.3 Crop Water Requirements Per Growth Stage',
            order: 3,
            duration: '1 Day',
            content: `
Crop water requirement (CWR) is the total depth of water a crop needs to complete its growth cycle under no-stress conditions. It varies by crop species, climate, and growth stage.

| Crop | Establishment (mm) | Veg. Growth (mm) | Flowering/Fruit (mm) | Total Season (mm) |
| :--- | :---: | :---: | :---: | :---: |
| **Maize** | 25 – 50 | 80 – 120 | 100 – 140 | 500 – 800 |
| **Tomato** | 30 – 50 | 80 – 100 | 120 – 160 | 400 – 800 |
| **Dry beans** | 20 – 40 | 60 – 80 | 60 – 80 | 300 – 500 |
| **Cabbage** | 20 – 30 | 60 – 80 | 80 – 100 | 380 – 500 |
| **Potato** | 30 – 40 | 50 – 80 | 80 – 120 | 500 – 700 |

Actual water applied must account for rainfall, evaporation, and soil type.
            `
          },
          {
            id: 'topic-7-4',
            title: '7.4 Irrigation Scheduling and Frequency',
            order: 4,
            duration: '1 Day',
            content: `
Irrigation scheduling is the practice of determining how much water to apply and when. Over-irrigation wastes water and money, leaches nutrients, and promotes root diseases. Under-irrigation stresses crops and reduces yields.

Two core concepts:
- **Field capacity (FC)**: the maximum amount of water soil can hold after excess has drained. This is the ideal irrigation target — filling the soil to field capacity.
- **Permanent wilting point (PWP)**: the moisture level below which a plant can no longer extract water and begins to wilt permanently. Never allow soil to reach this point.

Simple scheduling approaches:
- **Feel method**: push a soil probe or your finger to root depth. If it comes out dry and crumbly — irrigate. If moist and forms a ball — hold off.
- **Calendar method**: set a fixed schedule based on crop stage and historical evaporation data for your area. Adjust when rainfall occurs.
- **Soil moisture monitoring**: use tensiometers or capacitance probes to measure actual soil moisture and trigger irrigation at a defined threshold.

General irrigation frequency guidelines:
- **Sandy soils**: irrigate more frequently with smaller amounts (every 1–2 days for vegetables)
- **Clay soils**: irrigate less frequently with more water (every 4–7 days for vegetables)
- **Loam soils**: intermediate — every 2–4 days for vegetables depending on weather
            `
          },
          {
            id: 'topic-7-5',
            title: '7.5 Water Harvesting and Conservation',
            order: 5,
            duration: '1 Day',
            content: `
On-farm water conservation reduces dependency on irrigation infrastructure and extends the productivity of limited water sources. These techniques are especially important in semi-arid and water-scarce regions.
- **Mulching**: applying a layer of organic material (straw, dry grass, wood chips) or plastic film over the soil surface. Reduces evaporation by 30–50%, suppresses weeds, and moderates soil temperature.
- **Tied ridges and micro-catchments**: small earthen walls built across furrows to trap rainwater in the field, allowing it to infiltrate rather than run off.
- **Rainwater harvesting tanks**: collecting roof runoff into tanks for supplementary irrigation. A 50 m2 roof can collect 30,000 litres in a 600 mm rainfall year.
- **Planting basins (zai pits)**: small planting holes dug to concentrate rainwater and organic matter around individual plants — proven in dryland farming across Africa.
- **Deficit irrigation**: applying less than full crop water requirement during less-sensitive growth stages to achieve acceptable yields with significantly less water.
            `
          },
          {
            id: 'topic-7-6',
            title: '7.6 Waterlogging and Drainage',
            order: 6,
            duration: '1 Day',
            content: `
Just as crops suffer from too little water, they also suffer from too much. Waterlogged soils displace oxygen from pores, suffocating roots and promoting soil-borne diseases — particularly Pythium and Phytophthora root rots.

#### Signs of waterlogging:
- Yellowing and wilting despite wet soil
- Foul or sulphurous smell from the soil
- Bluish-grey soil colour at depth (gleying)
- Stunted growth and poor root systems

#### Drainage solutions:
- **Raised beds**: elevate the root zone above the water table and improve aeration
- **Subsurface drainage pipes (French drains)**: perforated pipes laid underground to carry excess water away
- **Surface drains and furrows**: channels cut to lead surface water off the field
- **Avoid compaction**: tractor traffic on wet soil compresses soil layers and blocks drainage — use controlled traffic farming or avoid field entry when wet
            `
          }
        ],
        assessment: {
          id: 'assessment-7',
          title: 'Module 7 Assessment: Irrigation Plan Design',
          description: 'Design a simple but practical irrigation plan for the scenario described below. Your plan must address all five questions. Marks are awarded for reasoning and agronomy — not just answers.',
          type: 'plan',
          sections: [
            {
              title: 'Part A — Irrigation System Design',
              description: '#### Part A — Irrigation System Design\n\n**Scenario**: A farmer has a 0.5-hectare (5,000 m2) plot with loam soil in a semi-arid area. Average annual rainfall is 400 mm. The farmer has a borehole delivering 2,000 litres per hour.',
              questions: [
                { label: 'Question 1', text: 'Which irrigation system would you recommend — drip or sprinkler — and why? Consider water efficiency, disease risk for tomatoes, and her budget.' },
                { label: 'Question 2', text: 'Using the crop water requirement data from Topic 7.3, estimate how much additional irrigation (in mm) the farmer will need to supply over the season if rainfall provides only 400 mm.' },
                { label: 'Question 3', text: 'During the flowering and fruit-set stage, how frequently should she irrigate on loam soil, and what method would you use to determine when to irrigate?' }
              ]
            },
            {
              title: 'Part B — Troubleshooting & Conservation',
              description: '#### Part B — Troubleshooting & Conservation',
              questions: [
                { label: 'Question 4', text: 'After a week of unusually heavy rainfall, she notices that one section of the field has standing water. The tomato leaves in that area are yellowing. Diagnose the problem and recommend two corrective actions.' },
                { label: 'Question 5', text: 'Suggest TWO water conservation measures she could implement on this farm at low cost to reduce irrigation demand next season.' }
              ]
            }
          ]
        },
        quiz: [],
        answerGuide: 'Q1: Drip. Q2: ~200 mm. Q3: Every 2–4 days. Q4: Waterlogging; dig channels. Q5: Mulching and tied ridges.'
      },
      {
        id: 'module-8',
        title: 'Module 8: Integrated Pest & Disease Management',
        description: 'Sustainable alternative to chemical-only pest control using IPM principles.',
        introduction: `
Pests and diseases cause 20–40% of production losses each year. 

This module teaches Integrated Pest Management (IPM):
- A smarter, more sustainable alternative to heavy chemical use.
- Core principles of prevention and monitoring.
- Biological and cultural control tactics.
        `,
        duration: '1 Week',
        learningObjectives: [
          'Understand the core principles of IPM',
          'Identify common insect pests, mites, and rodents',
          'Recognize fungal, bacterial, and viral crop diseases',
          'Implement biological and cultural control methods',
          'Learn safe and responsible pesticide use'
        ],
        topics: [
          {
            id: 'topic-8-1',
            title: '8.1 What is IPM and Why It Matters',
            order: 1,
            duration: '1 Day',
            content: `
Integrated Pest Management (IPM) is a decision-making framework that uses a combination of biological, cultural, physical, and chemical tools to manage pests and diseases in a way that minimises economic loss, human health risk, and environmental harm.

The core principles of IPM:
- **Prevention first**: design the farming system to make it difficult for pests and diseases to establish — right crop, right place, right time.
- **Monitor regularly**: scout crops systematically to detect pest presence early and assess population size.
- **Set action thresholds**: do not spray automatically. Only intervene when pest numbers exceed the Economic Threshold — the point at which crop damage will cost more than the cost of control.
- **Use multiple tactics**: combine biological, cultural, and mechanical controls before resorting to chemicals.
- **Evaluate results**: record what you did, what happened, and use this to improve your decisions next season.

> **Why Not Just Spray?**: Pesticides kill beneficial insects (including pollinators and natural enemies of pests), accelerate the development of resistant pest populations, and leave residues on food. IPM reduces these negative effects while often delivering better long-term pest control at lower cost.
            `
          },
          {
            id: 'topic-8-2',
            title: '8.2 Pest Identification: Insects, Mites, and Rodents',
            order: 2,
            duration: '1 Day',
            content: `
Accurate pest identification is the foundation of IPM. The wrong diagnosis leads to the wrong treatment and wasted resources.

| Pest | Crops Affected | Identification and Key Signs |
| :--- | :--- | :--- |
| **Aphids (various spp.)** | Vegetables, maize, soya, legumes | Soft-bodied, pear-shaped insects in colonies; green, black, grey or white; sticky honeydew; sooty mould; curled, distorted growth; attended by ants |
| **Fall Armyworm (Spodoptera frugiperda)** | Maize, sorghum, rice, vegetables | Caterpillar with inverted Y on head; ragged holes in leaves; frass in whorl; feeding at night; devastating if unchecked |
| **Whitefly (Bemisia tabaci)** | Tomato, pepper, sweet potato, beans | Tiny white-winged insects on undersides of leaves; clouds fly up when disturbed; yellowing; transmits viruses |
| **Thrips** | Onion, tomato, beans, maize | Tiny, slender insects; silvery streaking on leaves; scarring on fruit surfaces; curled leaf tips |
| **Spider mites** | Vegetables, maize (hot/dry conditions) | Tiny dots on leaf surface; fine webbing; bronze or silver speckling; thrive in hot, dry, dusty conditions |
| **Cutworm** | All seedling crops at establishment | Cut seedlings at soil level overnight; fat, curled greyish larvae in top 5 cm of soil beside affected plants |
| **Rodents (rats, mice, African dormouse)** | Stored grain, maize, sweet potato, groundnuts | Gnaw marks on stems and cobs; droppings; burrow entrances in field edges; significant storage losses |
            `
          },
          {
            id: 'topic-8-3',
            title: '8.3 Common Crop Diseases: Fungal, Bacterial, and Viral',
            order: 3,
            duration: '1 Day',
            content: `
Diseases are caused by pathogens — microscopic organisms that infect plant tissue. Each pathogen type requires different management approaches.

| Disease | Type | Crops Affected | Key Symptoms |
| :--- | :--- | :--- | :--- |
| **Early Blight (Alternaria)** | Fungal | Tomato, potato | Brown concentric ring lesions on older leaves; progresses upward; worse in warm, humid weather |
| **Powdery Mildew** | Fungal | Cucurbits, legumes, wheat | White powdery coating on upper leaf surface; distorted growth; favoured by dry conditions with high humidity at night |
| **Damping off (Pythium/Rhizoctonia)** | Fungal | All seedlings in nursery | Seedlings collapse at soil level; watery rot at stem base; spreads rapidly in wet, overcrowded nurseries |
| **Bacterial Wilt (Ralstonia)** | Bacterial | Tomato, pepper, potato, tobacco | Sudden wilting of entire plant; brown vascular tissue inside stem; bacteria ooze in water test |
| **Maize Streak Virus** | Viral | Maize | Yellow streaking along leaf veins; stunted plants; transmitted by leafhoppers; no curative treatment |
| **Tomato Yellow Leaf Curl Virus** | Viral | Tomato | Yellowing, upward curling of leaves; stunted; transmitted by whitefly; use resistant varieties + whitefly control |
            `
          },
          {
            id: 'topic-8-4',
            title: '8.4 Biological Control Methods',
            order: 4,
            duration: '1 Day',
            content: `
Biological control (biocontrol) uses living organisms to suppress pest and disease populations. It is the most sustainable and often most cost-effective long-term pest management strategy.

Types of biological control:
- **Natural enemies — conservation**: protect and encourage existing predators and parasites. Avoid broad-spectrum insecticides; plant flowers to attract beneficial insects; maintain field margins with diverse vegetation.
- **Augmentative biocontrol**: release commercially produced beneficial organisms. Examples include Trichogramma wasps (parasitise moth eggs), Cryptolaemus beetles (mealybug predators), and Bacillus thuringiensis (Bt) — a naturally occurring soil bacterium that kills caterpillars when ingested.
- **Entomopathogenic fungi**: Beauveria bassiana and Metarhizium spp. infect and kill insects on contact. Available commercially for control of whitefly, thrips, aphids, and soil pests.
- **Predatory insects to encourage**: ladybird beetles (aphid predators), lacewings (aphids, whitefly, thrips), ground beetles (soil pests), parasitic wasps (caterpillar and aphid parasites).
            `
          },
          {
            id: 'topic-8-5',
            title: '8.5 Cultural Practices',
            order: 5,
            duration: '1 Day',
            content: `
Cultural controls modify the farming environment to make it less favourable for pests and diseases. They are the first line of defence in IPM and cost nothing beyond good farming practice.
- **Crop rotation**: breaking pest and disease cycles by planting different crop families in the same land each season. Rotate out of the same crop family for at least two seasons.
- **Resistant varieties**: selecting crop varieties with built-in resistance to major local pests and diseases is the single most powerful cultural tool available. Always check variety resistance ratings.
- **Sanitation**: removing crop debris after harvest removes overwintering pest populations and disease inoculum. Chop and incorporate, compost, or remove from the field.
- **Proper plant spacing**: overcrowded plants create humid microclimates that favour fungal diseases and reduce air circulation. Follow recommended spacing guidelines.
- **Optimal planting date**: planting to avoid peak pest seasons or to exploit periods when natural enemy populations are high can dramatically reduce pest pressure.
- **Healthy soil and balanced nutrition**: over-fertilised, lush crops are more attractive to some pests. Stressed plants are also more susceptible to disease. Balanced nutrition builds resilience.
            `
          },
          {
            id: 'topic-8-6',
            title: '8.6 Safe and Responsible Pesticide Use',
            order: 6,
            duration: '1 Day',
            content: `
When pest populations exceed the economic threshold and biological and cultural controls are insufficient, registered pesticides may be necessary. Safe, targeted, and responsible use minimises risks to people, the environment, and beneficial organisms.

The pesticide hierarchy — choose the least harmful option first:
- **Soft or selective products**: insecticidal soaps, neem-based products, spinosad, abamectin — effective against specific pests with low toxicity to beneficials
- **Biological pesticides**: Bt products, entomopathogenic fungi — targeted and safe
- **Conventional insecticides/fungicides**: use only when necessary; follow label instructions exactly

Critical rules for pesticide use:
- **Always read the label**: dosage, re-entry period, pre-harvest interval, and PPE requirements
- **Mix at the recommended rate** — more is not better; it increases resistance risk and costs
- **Never spray flowering crops when bees are active** — spray early morning or evening
- **Wear full PPE**: gloves, eye protection, respirator/mask, protective overalls
- **Observe the pre-harvest interval (PHI)** — the number of days between last spray and harvest. Spraying within the PHI leaves illegal residues on food.
- **Store pesticides in their original containers**, locked away from children and food
- **Never dispose of pesticide containers in waterways** — rinse containers three times and puncture before disposal
            `
          }
        ],
        assessment: {
          id: 'assessment-8',
          title: 'Module 8 Assessment: IPM Scenario & ID Quiz',
          description: 'For each scenario, apply IPM principles to recommend an appropriate course of action. Consider all available information before reaching for a chemical solution.',
          type: 'scenario',
          sections: [
            {
              title: 'Scenario 1 — The Tomato Field',
              description: '#### Scenario 1 — The Tomato Field\n\nA farmer scouts her 0.5-ha tomato field and finds that 15% of plants in one corner show signs of bacterial wilt — wilting during the day that does not recover at night. A water test on a stem cutting confirms bacterial ooze. She also finds moderate aphid colonies on 30% of plants, with some natural predators (lacewings and ladybird larvae) already present.',
              questions: [
                { label: 'Question (a)', text: 'What should she do immediately about the affected area and why?' },
                { label: 'Question (b)', text: 'Is the aphid infestation at an economic threshold requiring spray? What would you advise?' },
                { label: 'Question (c)', text: 'What cultural practices should she implement from next season to prevent the bacterial wilt recurring?' }
              ]
            },
            {
              title: 'Scenario 2 — The Maize Field',
              description: '**Scenario 2 — The Maize Field**\n\nIt is week 4 of a maize crop. On scouting, a farmer finds Fall Armyworm (FAW) caterpillars in the whorls of 22% of plants. Some plants have emerging damage but the crop has not yet reached the point of no recovery. He is farming organically and does not want to use synthetic chemicals.',
              questions: [
                { label: 'Question (a)', text: 'Has the infestation crossed the general economic threshold for FAW in maize (typically 20% of plants with actively feeding caterpillars)?' },
                { label: 'Question (b)', text: 'Recommend TWO biological or organic-approved control options he can use immediately.' },
                { label: 'Question (c)', text: 'What cultural practice could he implement next season to reduce FAW pressure at this growth stage?' }
              ]
            },
            {
              title: 'Part B — Pest and Disease Identification Quiz',
              description: '#### Part B — Pest and Disease Identification Quiz\n\nFor each description, identify the pest or disease:',
              questions: [
                { label: 'ID 1', text: 'White powdery coating appears on the upper surface of cucumber leaves in dry conditions. The coating wipes off, revealing green leaf beneath, but returns quickly.' },
                { label: 'ID 2', text: 'Maize seedlings are found cut clean off at soil level each morning. Small grey caterpillars are found curled in the soil nearby.' },
                { label: 'ID 3', text: 'Tomato leaves curl upward and turn yellow. Tiny white insects rise in a cloud when the plant is disturbed. The plants are stunted and not setting fruit.' },
                { label: 'ID 4', text: 'A tomato plant wilts suddenly even though the soil is moist. The stem cut near the base shows brown discolouration. When the cut stem is placed in water, a milky white ooze streams out.' },
                { label: 'ID 5', text: 'Maize leaves show bright yellow streaking along the veins. The plants are severely stunted and the symptoms appear in scattered patches across the field, not in continuous rows.' }
              ]
            }
          ]
        },
        quiz: [],
        answerGuide: `### Part A — IPM Decision-Making Scenarios
**Scenario 1 — Tomato Field**:
(a) **Action**: Rogueing (removing and destroying) all affected plants immediately. **Why**: Bacterial wilt is systemic and spreads through soil water and root contact; there is no curative treatment.
(b) **Aphids**: No, 30% infestation with predators present suggests natural control is working. Advise monitoring instead of spraying to protect ladybird/lacewing populations.
(c) **Cultural practices**: Strict crop rotation (no nightshades for 3+ years), use of resistant varieties, and ensuring clean irrigation sources and tools.

**Scenario 2 — Maize Field**:
(a) **Threshold**: Yes, 22% is above the 20% seedling stage threshold for FAW.
(b) **Control options**: Application of *Bacillus thuringiensis* (Bt) products or Neem-based extracts into the whorls.
(c) **Cultural practice**: Intercropping maize with "push-pull" companion plants like Desmodium and Napier grass.

### Part B — Pest and Disease Identification
1. **Powdery Mildew**
2. **Cutworm**
3. **Whitefly + Tomato Yellow Leaf Curl Virus**
4. **Bacterial Wilt (*Ralstonia solanacearum*)**
5. **Maize Streak Virus**`
      },
      {
        id: 'module-9',
        title: 'Module 9: Harvest & Postharvest Handling',
        description: 'Reducing losses through proper maturity determination, handling, and storage.',
        introduction: `
30–40% of food is lost between harvest and the consumer. 

This module gives you the knowledge to reduce these losses through:
- Proper maturity determination.
- Correct handling techniques.
- Effective storage solutions.
        `,
        duration: '1 Week',
        learningObjectives: [
          'Identify maturity indices for common crops',
          'Compare manual and mechanical harvesting',
          'Understand causes and prevention of postharvest losses',
          'Implement grading, sorting, and packaging standards',
          'Manage different storage types (Cold, Hermetic, Ambient)'
        ],
        topics: [
          {
            id: 'topic-9-1',
            title: '9.1 Maturity Indices: Visual, Physical, and Chemical',
            order: 1,
            duration: '1 Day',
            content: `
Harvesting at the wrong time — whether too early or too late — leads to poor quality, short shelf life, and reduced market value. Maturity indices are observable or measurable indicators that tell the farmer when a crop is ready.

| Crop | Maturity Type | Key Indicators | Avoid |
| :--- | :--- | :--- | :--- |
| **Maize (dry grain)** | Physical | Husk dry and brown; black layer visible at kernel base; moisture content 18–25% at harvest | Harvesting before black layer forms — kernels shrivel on drying |
| **Tomato** | Visual | Skin colour changes from green to red/pink (for fresh market: harvest at breaker stage — first colour break) | Over-ripe fruit — soft, splits easily, short shelf life |
| **Potato** | Physical | Skin 'sets' — cannot be rubbed off with thumb; vine dies back naturally | Harvesting too early — skin damage in storage leads to rots |
| **Beans (dry)** | Visual/Physical | Pods dry and papery; rattle when shaken; moisture 14–16% | Leaving too long — pods shatter and seeds scatter |
| **Cabbage** | Physical | Firm, solid head that resists gentle pressure; outer leaves have glossy sheen | Over-mature — heads split open and attract decay |
| **Mango** | Chemical/Visual | Skin begins to yellow; skin colour changes; fruit gives slightly to thumb pressure; specific gravity testing | Harvesting fully green — flavour does not develop properly |
            `
          },
          {
            id: 'topic-9-2',
            title: '9.2 Harvesting Methods',
            order: 2,
            duration: '1 Day',
            content: `
The harvesting method affects product quality, labour costs, and the speed at which perishable crops can be removed from the field.

#### Manual harvesting:
- Uses hand tools (knives, sickles, pruning shears) or hand-picking
- Allows selective harvesting of mature produce only — important for fresh market crops
- Lower damage when done carefully — trained harvesters cause less bruising than machine
- Labour-intensive — suitable for smallholder and intensive vegetable production

#### Mechanical harvesting:
- Tractors with headers, combine harvesters, or mechanical pickers
- Fast — essential for large-scale grain crops
- Can cause physical damage (bruising, skin abrasion) to fresh produce if not set correctly
- Requires significant investment and maintenance

Regardless of method, critical harvesting rules apply:
- **Harvest in the cool of the morning** — lower field temperatures slow deterioration
- **Handle all produce gently** — bruises are entry points for pathogens
- **Move produce out of the field rapidly** — do not leave in direct sun
- **Use clean, sanitised containers** — do not mix harvested produce with soil or old crop debris
            `
          },
          {
            id: 'topic-9-3',
            title: '9.3 Causes and Prevention of Postharvest Losses',
            order: 3,
            duration: '1 Day',
            content: `
Understanding why losses occur is the first step to preventing them.

| Cause of Loss | What Happens | Prevention |
| :--- | :--- | :--- |
| **Mechanical damage** | Bruising and cuts from rough handling create entry points for rot | Train harvesters; use padded containers; avoid overfilling crates |
| **Temperature abuse** | Heat accelerates respiration, ripening, and decay — doubling with every 10°C rise | Harvest in the cool of day; store promptly in shade or cold storage |
| **Moisture loss (water stress)** | Produce loses water through its skin — wilting and shrinkage reduce weight and quality | Maintain high humidity in storage; pre-cool before storage; wax coating on some crops |
| **Fungal and bacterial rots** | Pathogens infect through wounds, bruises, or natural openings | Sanitise equipment; avoid over-wetting; cold temperatures slow pathogen growth |
| **Insect and rodent damage** | Post-harvest insects (grain weevils, moths) consume stored grain; rodents contaminate and consume | Use hermetic storage; grain protectants; rodent traps and proofing |
| **Poor sorting and grading** | Mixing diseased or damaged produce accelerates spoilage of the entire batch | Sort at harvest; remove all damaged, diseased, or overripe produce |
            `
          },
          {
            id: 'topic-9-4',
            title: '9.4 Grading, Sorting, and Packaging',
            order: 4,
            duration: '1 Day',
            content: `
Sorting removes defective produce. Grading classifies produce by quality standards. Packaging protects produce and presents it for sale. Together, these three steps determine the price a farmer receives.

#### Sorting criteria:
- **Remove**: diseased, damaged, pest-affected, overripe, undersized, or misshapen produce
- **Keep**: clean, uniform, undamaged, properly matured produce free from blemishes

#### Common grading standards:
- **Grade 1 (Premium/Export)**: uniform size, colour, and shape; no blemishes; highest price
- **Grade 2 (Commercial)**: slight imperfections in size or colour; suitable for most markets
- **Grade 3 (Processing/Local)**: small, misshaped, or minor surface defects; suitable for processing or local markets

#### Packaging considerations:
- Packaging must allow airflow to prevent heat and moisture build-up (ventilated crates, net bags)
- Do not overfill containers — pressure damage is a leading cause of postharvest loss
- Label containers with crop, variety, grade, date, and farm name for traceability
            `
          },
          {
            id: 'topic-9-5',
            title: '9.5 Storage Types: Ambient, Cold, and Hermetic',
            order: 5,
            duration: '1 Day',
            content: `
The right storage system depends on the crop, length of storage needed, available infrastructure, and budget.

| Storage Type | How It Works | Best For | Considerations |
| :--- | :--- | :--- | :--- |
| **Ambient (shade store)** | Dry, well-ventilated building or shade structure. Relies on natural conditions. | Root crops (onion, potato), pumpkin, dry grain short-term | Temperature not controlled; limited to cool, dry climates or short storage |
| **Cold storage (refrigeration)** | Mechanically cooled chambers maintain specific temperature and humidity | Tomatoes, leafy vegetables, fruit, potatoes | High installation and energy cost; requires reliable electricity |
| **Hermetic storage (air-tight)** | Sealed bags or containers cut off oxygen, killing insects inside without chemicals | Dry grain (maize, beans, sorghum, soya) — up to 12 months | Low cost; no chemicals; grain must be dry (<14% MC) before sealing |
| **Evaporative cooling (pot-in-pot)** | Two clay pots separated by wet sand. Water evaporation cools the inner pot. | Vegetables, fruit — extends shelf life by 3–7 days | Low cost; effective in hot, dry climates; less effective in humid areas |

> **Hermetic Storage**: PICS (Purdue Improved Crop Storage) triple-layer hermetic bags and metal silos have transformed smallholder grain storage across sub-Saharan Africa and South Asia. Grain stored hermetically requires no chemical treatment and can maintain quality for 12 months or longer with grain moisture below 13%.
            `
          },
          {
            id: 'topic-9-6',
            title: '9.6 Food Safety Considerations at Harvest',
            order: 6,
            duration: '1 Day',
            content: `
Fresh produce can carry pathogenic bacteria (Salmonella, E. coli, Listeria) that cause serious illness in consumers. Food safety is not only an ethical obligation — in most markets, it is a legal requirement.

Critical food safety rules at harvest:
- **Personal hygiene**: harvesters must wash hands before handling produce, after toilet use, and after handling chemicals or animal waste
- **Water quality**: irrigation water and washing water must be clean — do not use water from streams or dams that may be contaminated with animal waste
- **Equipment sanitation**: harvesting tools, containers, and transport vehicles must be clean and free from soil and old crop residue
- **Chemical pre-harvest intervals**: respect PHI on all pesticides — never harvest within the PHI. Keep spray records to confirm compliance.
- **Cold chain integrity**: do not break the cold chain once produce is cooled — movement from cool storage to ambient temperatures and back promotes condensation and microbial growth
            `
          }
        ],
        assessment: {
          id: 'assessment-9',
          title: 'Module 9 Assessment: Postharvest Loss Analysis',
          description: 'Read the following case study carefully and answer all questions.',
          type: 'report',
          sections: [
            {
              title: 'Part A — Postharvest Loss Analysis Case Study',
              description: '#### Part A — Postharvest Loss Analysis Case Study\n\n**Joseph Case Study**: Joseph grows 1 hectare of tomatoes. After harvest, he loads 2,800 kg of tomatoes onto a truck in open plastic bags. The journey to the market takes 4 hours in full sun. By the time he arrives, 420 kg of tomatoes are soft, split, or rotting and cannot be sold. He sells the remaining 2,380 kg at R6.50/kg. The following week he is told that a buyer from a supermarket rejected his tomatoes because they found pesticide residue on a test sample. He remembers spraying a fungicide 3 days before harvest (the PHI on the label was 7 days).',
              questions: [
                { label: 'Question 1', text: 'Calculate Joseph\'s postharvest loss percentage. Show your working.' },
                { label: 'Question 2', text: 'Identify THREE specific mistakes Joseph made in the harvest-to-market chain and explain the consequence of each.' },
                { label: 'Question 3', text: 'What is a pre-harvest interval (PHI) and why is it illegal and dangerous to harvest before it has passed?' },
                { label: 'Question 4', text: 'If Joseph had prevented the postharvest losses entirely, how much additional income could he have earned at R6.50/kg? What does this tell you about the value of postharvest management?' }
              ]
            },
            {
              title: 'Part B — Storage Recommendation Report',
              description: '#### Part B — Storage Recommendation Report\n\nA farmer has just harvested the following crops and needs advice on how to store each one. Write a short storage recommendation for each crop, specifying the storage type, conditions required, and expected storage duration.',
              questions: [
                { label: 'Crop 1', text: '500 kg of dry grain maize (maize weevils are a major local problem).' },
                { label: 'Crop 2', text: '80 kg of fresh, ripe tomatoes for local market sales over the next 4 days.' },
                { label: 'Crop 3', text: '200 kg of cured onions for storage over the next 3 months.' },
                { label: 'Crop 4', text: '40 kg of fresh leafy spinach for sales tomorrow morning.' }
              ]
            }
          ]
        },
        quiz: [],
        answerGuide: `### PART A — Postharvest Loss Analysis
1. **Calculation**: 420 kg / 2,800 kg × 100 = **15% loss**.
2. **Mistakes**:
   - **Open bags in sun**: Causes extreme heat stress and dehydration.
   - **4-hour journey without temperature control**: Accelerates respiration and decay.
   - **PHI violation**: Harvesting Fungicide-treated crop only 3 days after application (label said 7 days).
3. **PHI Importance**: Pre-Harvest Interval (PHI) is the time needed for chemical residues to break down to safe levels. Harvesting early is illegal and dangerous as it leaves toxic residues on food, leading to market rejection and health risks for consumers.
4. **Lost Income**: 420 kg × R6.50 = **R 2,730**. This represents a massive loss of potential profit from a single handling failure.

### PART B — Storage Recommendation Report
- **Maize**: Hermetic bags (e.g., PICS) or metal silos; cool, dry conditions; <14% moisture content; 6–12 months.
- **Tomatoes**: Cold storage (10–12°C); 85–90% relative humidity; 2–4 days for ripe fruit.
- **Onions**: Ambient ventilated store (cool/dry); low humidity; 3–6 months after proper curing.
- **Spinach**: Cold storage (0–2°C); very high humidity; 5–10 days.`
      },
      {
        id: 'module-10',
        title: 'Module 10: Farm Planning & Record Keeping',
        description: 'Seasonal planning, crop rotation, budgeting, and data-driven management.',
        introduction: `
The difference between a hobby garden and a farming business is a plan. 

This module transforms everything learned into:
- A practical, integrated farm management approach.
- Seasonal planning and crop rotation.
- Budgeting and data-driven management.
        `,
        duration: '1 Week',
        learningObjectives: [
          'Understand why planning matters in farming',
          'Create seasonal crop calendars and schedules',
          'Design effective crop rotation plans',
          'Perform basic farm budgeting and cost estimation',
          'Implement comprehensive record-keeping systems'
        ],
        topics: [
          {
            id: 'topic-10-1',
            title: '10.1 Why Planning Matters',
            order: 1,
            duration: '1 Day',
            content: `
Farming is a business. Like any business, decisions made without information or foresight are more likely to fail. A farm plan is not bureaucracy — it is the roadmap that helps a farmer use land, water, labour, money, and time in the most productive way possible.

What good planning achieves:
- Aligns what you grow with what the market wants — and when
- Ensures inputs (seed, fertiliser, chemicals) are available and affordable before they are needed
- Identifies cash flow requirements so the farmer can arrange credit or savings in advance
- Reduces reactive decision-making — which is almost always more expensive than planned decision-making
- Creates a benchmark to measure actual performance against expectations

> **Farmer Case**: A farmer who plans her season in August for a November planting has time to source certified seed at a better price, book tractor hire in advance, apply lime to correct soil pH before planting, and negotiate a forward supply agreement with a buyer. A farmer who starts thinking about planting in October rushes all of these steps — and pays more for each one.
            `
          },
          {
            id: 'topic-10-2',
            title: '10.2 Seasonal Crop Calendars and Scheduling',
            order: 2,
            duration: '1 Day',
            content: `
A crop calendar maps all farming activities against weeks and months of the year. It is the practical expression of a farm plan and ensures no critical activity is missed or delayed.

A crop calendar should include:
- Land preparation start and completion dates
- Soil amendment application (lime, compost) dates — with lead times before planting
- Seed purchase and delivery date
- Nursery seeding date (if transplanting)
- Planting date and expected establishment period
- Irrigation schedule milestones
- Fertiliser application dates (basal and top-dressing)
- Pest and disease scouting schedule (at least weekly from emergence)
- Expected harvest window
- Post-harvest land preparation and cover crop establishment

Most farms in southern Africa operate on two main seasons: a warm-season (summer) and a cool-season (winter/dry season) production cycle. Crops must be matched to the right season based on temperature and water availability.
            `
          },
          {
            id: 'topic-10-3',
            title: '10.3 Introduction to Crop Rotation and Its Benefits',
            order: 3,
            duration: '1 Day',
            content: `
Crop rotation is the practice of growing different crops on the same piece of land in a planned sequence across seasons. It is one of the most powerful agronomic tools available to any farmer — and it costs nothing beyond planning.

Benefits of crop rotation:
- **Breaks pest and disease cycles**: soil-borne pathogens that specialise in one crop family (e.g., Fusarium in tomatoes) cannot survive without a host. Rotating away from that crop family for two or more seasons depletes the pathogen population.
- **Improves soil fertility**: legumes (beans, groundnuts, soybeans, peas) fix atmospheric nitrogen. A rotation that includes one legume season reduces fertiliser costs in subsequent seasons.
- **Reduces weed pressure**: different crops use different parts of the field and have different weed management regimes. Rotating prevents any single weed species from dominating.
- **Improves soil structure**: root systems of different crops explore different soil depths. Alternating deep-rooted and shallow-rooted crops improves overall soil structure.

#### Example 4-season rotation for a smallholder vegetable farm:

| Season | Plot A | Plot B | Plot C |
| :--- | :--- | :--- | :--- |
| **Season 1** | Tomato (nightshade) | Beans (legume) | Maize (grass) |
| **Season 2** | Maize (grass) | Tomato (nightshade) | Beans (legume) |
| **Season 3** | Beans (legume) | Maize (grass) | Tomato (nightshade) |
| **Season 4** | Cover crop + rest | Cover crop + rest | Cover crop + rest |
            `
          },
          {
            id: 'topic-10-4',
            title: '10.4 Basic Farm Budgeting and Cost Estimation',
            order: 4,
            duration: '1 Day',
            content: `
A farm budget estimates all costs (inputs and labour) against expected income (yield × price) to determine whether a planned crop enterprise will be profitable. Without a budget, a farmer cannot know if they are making money or losing it.

Budget components:
- **Variable costs (change with scale)**: seed, fertiliser, chemicals, irrigation, casual labour, packaging, transport to market
- **Fixed costs (remain constant)**: land rental or repayment, equipment depreciation, irrigation infrastructure, permanent staff
- **Gross income**: expected yield (tonnes) × expected price (R/tonne)
- **Gross margin**: Gross income − Variable costs (the most useful indicator for smallholder decisions)
- **Net profit**: Gross income − All costs (variable + fixed)

#### Simple gross margin example — 0.5 ha tomato crop:

| Item | Amount | Cost/Income (R) |
| :--- | :--- | :--- |
| **Gross income** | 8 000 kg × R6.50/kg | R 52 000 |
| **Less: Seed (certified tomato transplants)** | 600 plants | R 1 800 |
| **Less: Fertiliser (basal + top-dress)** | — | R 3 200 |
| **Less: Chemicals (pesticide + fungicide)** | — | R 2 400 |
| **Less: Irrigation (pump fuel/electricity)** | — | R 1 600 |
| **Less: Labour (casual)** | — | R 5 500 |
| **Less: Packaging and transport** | — | R 2 000 |
| **GROSS MARGIN** | | **R 35 500** |

> **Important**: This budget assumes 8 000 kg/ha yield — achievable but not guaranteed. Build a conservative budget (use 60–70% of expected yield) to ensure viability even in a poor season. If the enterprise is not viable at 60% of expected yield, reconsider before committing capital.
            `
          },
          {
            id: 'topic-10-5',
            title: '10.5 Record Keeping: What to Track and Why',
            order: 5,
            duration: '1 Day',
            content: `
Records are the farm's memory. Without records, every season starts from scratch. With records, a farmer continuously improves — knowing which variety performed best, which pest problem cost the most, which field responded best to lime, and whether last season was profitable.

Essential farm records:
- **Field record**: crop, variety, planting date, soil preparation activities, amendments applied — per field or plot
- **Input record**: all inputs purchased — date, product name, supplier, quantity, cost, batch number
- **Spray record**: every pesticide or fertiliser application — date, product, rate, target pest/crop, operator, PHI compliance confirmation
- **Yield record**: harvest date, total weight per crop per field, grade breakdown
- **Sales record**: buyer, date, quantity, price per kg, total income received
- **Labour record**: days worked, tasks completed, wages paid — by employee or activity
- **Expense summary**: monthly and seasonal totals of all expenditure — by category

> **Why Spray Records Matter Beyond Compliance**: Food safety audits, retailer supplier programmes, GlobalG.A.P. certification, and export markets all require documented spray records. A farmer without spray records cannot access premium markets — regardless of how well they actually manage their farm.
            `
          },
          {
            id: 'topic-10-6',
            title: '10.6 Using Records to Improve Next Season',
            order: 6,
            duration: '1 Day',
            content: `
Records are only valuable if they are used. At the end of each season, a farmer should conduct a simple season review:
- **Compare actual yield to planned yield** — was the gap due to weather, pests, management, or inputs?
- **Compare actual costs to budgeted costs** — which items overspent and why?
- **Review spray records** — were interventions timely and effective? Were chemicals used that gave poor results?
- **Assess variety performance** — were some varieties more productive, more resistant, or better priced?
- **Review soil fertility** — is organic matter increasing? Has pH improved since liming?
- **Make a written record** of three things that went well and three things to do differently next season

This simple annual review, done consistently, is the most effective and lowest-cost farm improvement tool available.
            `
          },
          {
            id: 'topic-10-wrapup',
            title: 'Course Wrap-up & Completion Summary',
            order: 7,
            duration: '1 Day',
            content: `
Congratulations on reaching the end of the Intermediate Crop Production course! Below is a summary of the modules you have covered and the assessments required for certification.

#### Full Programme Assessment Summary:

| Module | Level | Title | Assessment | Pass Mark |
| :--- | :--- | :--- | :--- | :---: |
| **Module 6** | 2 | Soil Fertility & Amendments | Soil Test Case Study & Calculation | 80% |
| **Module 7** | 2 | Irrigation & Water Management | Irrigation Plan Design | 80% |
| **Module 8** | 2 | Integrated Pest & Disease Management | IPM Scenario & ID Quiz | 80% |
| **Module 9** | 2 | Harvest & Postharvest Handling | Loss Analysis & Storage Report | 80% |
| **Module 10** | 2 | Farm Planning & Record Keeping | Capstone Farm Plan | 100% |

Please ensure all assessments are submitted and graded to receive your professional certification.
            `
          }
        ],
        assessment: {
          id: 'assessment-10',
          title: 'Module 10 Assessment — Capstone Project',
          description: 'This is the capstone assessment for the full Level 2 Intermediate course. You must submit a complete seasonal crop production plan for your own farm or a hypothetical 1-hectare plot. The plan must include all six components below. This assessment is designed to demonstrate your ability to integrate all skills developed across Modules 6–10.',
          type: 'plan',
          sections: [
            {
              title: 'Component 1 — Crop Selection and Rotation Plan',
              description: '#### Component 1 — Crop Selection and Rotation Plan',
              questions: [
                { label: 'Selection', text: 'Choose TWO crops to grow in alternating seasons on a 1 ha plot. Justify your selection based on climate suitability, market demand, and rotation principles. Draw a two-season rotation table showing which crop occupies which plot in each season.' }
              ]
            },
            {
              title: 'Component 2 — Seasonal Crop Calendar',
              description: '#### Component 2 — Seasonal Crop Calendar',
              questions: [
                { label: 'Calendar', text: 'Create a week-by-week activity calendar for your primary crop covering the full season from soil preparation to post-harvest. Include at least 10 key activities with their timing.' }
              ]
            },
            {
              title: 'Component 3 — Soil Fertility and Amendment Plan',
              description: '#### Component 3 — Soil Fertility and Amendment Plan',
              questions: [
                { label: 'Fertility', text: 'Based on a hypothetical soil test result (pH 5.8, Low P, Medium K, 2.1% OM), develop a soil amendment and fertilisation plan for your primary crop. Include type, rate, and timing of all amendments.' }
              ]
            },
            {
              title: 'Component 4 — Irrigation Plan',
              description: '#### Component 4 — Irrigation Plan',
              questions: [
                { label: 'Irrigation', text: 'Describe your irrigation system choice for this plot and provide a seasonal irrigation schedule. Identify the critical irrigation periods for your crop and explain what signs would trigger an irrigation event.' }
              ]
            },
            {
              title: 'Component 5 — IPM Plan',
              description: '#### Component 5 — IPM Plan',
              questions: [
                { label: 'IPM', text: 'Identify the THREE most likely pests or diseases for your chosen crop in your area. For each, describe your scouting approach, your economic threshold, and your preferred control method (biological, cultural, or chemical as a last resort).' }
              ]
            },
            {
              title: 'Component 6 — Farm Budget',
              description: '#### Component 6 — Farm Budget',
              questions: [
                { label: 'Budget', text: 'Complete a gross margin budget for your primary crop on 1 hectare. Include all realistic variable costs and your expected income. Show whether the enterprise is viable.' }
              ]
            }
          ]
        },
        quiz: [],
        answerGuide: `### Capstone Project Evaluation Criteria
A passing project must demonstrate integration of all Level 2 skills:
- **Rotation**: Logic must show family differentiation (e.g., Solanaceous followed by Legume, then Cereal).
- **Calendar**: Must include at least 10 activities with realistic lead times (e.g., liming 3 months pre-plant).
- **Fertility**: Must base the plan on the provided soil test (Liming for pH 5.8, P-fertiliser for Low P).
- **Irrigation**: Choice (e.g., Drip) must be justified for the specified 1 ha scale.
- **IPM**: Must specify cultural and biological controls before mentioning chemicals.
- **Budget**: Gross margin calculation must subtract all listed variable costs from projected income. Yield assumptions should be conservative (60-70%).`
      }
    ]
  }
];

export const testimonials = [
  {
    id: '1',
    name: 'Johannes Khumalo',
    role: 'Commercial Farmer',
    content: 'Mojadi Academy transformed my approach to crop production. My yields have increased significantly in just two seasons.',
    avatar: 'https://picsum.photos/seed/johannes/100/100'
  },
  {
    id: '2',
    name: 'Nomvula Sithole',
    role: 'Organic Producer',
    content: 'The intermediate course gave me the confidence to implement advanced irrigation and pest management methods.',
    avatar: 'https://picsum.photos/seed/nomvula/100/100'
  },
  {
    id: '3',
    name: 'Pieter van der Merwe',
    role: 'Wheat Farmer',
    content: 'The farm planning modules are world-class. I finally feel in control of my farm\'s financial future.',
    avatar: 'https://picsum.photos/seed/pieter/100/100'
  }
];
