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

export interface Module {
  id: string;
  title: string;
  description: string;
  introduction: string;
  duration: string;
  topics: Topic[];
  learningObjectives: string[];
  quiz: QuizQuestion[];
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
        description: 'Comprehensive guide to soil health, nutrient management, and the application of organic and inorganic amendments.',
        introduction: 'Soil fertility is the foundation of successful crop production. This module covers the assessment of soil health, the role of essential nutrients, and the strategic use of amendments to optimize plant growth and yield.',
        duration: '2 Weeks',
        learningObjectives: [
          'Conduct and interpret soil nutrient assessments',
          'Differentiate between organic and inorganic amendments',
          'Calculate fertilizer application rates based on soil tests',
          'Manage soil pH for optimal nutrient availability'
        ],
        topics: [
          {
            id: 'topic-6-1',
            title: '6.1 Soil Nutrient Assessment',
            order: 1,
            duration: '60 mins',
            content: `
### Understanding Soil Testing
Soil testing is a critical diagnostic tool for determining the nutrient-supplying capacity of the soil. It involves collecting representative soil samples and analyzing them in a laboratory.

#### Key Components of a Soil Test:
1. **Macronutrients**: Nitrogen (N), Phosphorus (P), Potassium (K).
2. **Secondary Nutrients**: Calcium (Ca), Magnesium (Mg), Sulfur (S).
3. **Micronutrients**: Iron (Fe), Zinc (Zn), Manganese (Mn), Copper (Cu), Boron (B), Molybdenum (Mo).
4. **Soil pH**: Measures acidity or alkalinity.
5. **Organic Matter (OM)**: Indicates soil health and carbon content.
6. **Cation Exchange Capacity (CEC)**: Measures the soil's ability to hold and exchange nutrients.

| Nutrient | Role in Plant Growth | Deficiency Symptoms |
| :--- | :--- | :--- |
| **Nitrogen (N)** | Vegetative growth, chlorophyll production | Yellowing of older leaves (chlorosis) |
| **Phosphorus (P)** | Root development, flowering, energy transfer | Purplish tint on leaves, stunted growth |
| **Potassium (K)** | Water regulation, disease resistance | Scorching or browning of leaf edges |

#### Sampling Procedure:
- Use a soil probe or auger.
- Sample to a depth of 15-20 cm for most crops.
- Collect 10-15 sub-samples in a zigzag pattern across a uniform area.
- Mix sub-samples in a clean plastic bucket to create a composite sample.
            `
          },
          {
            id: 'topic-6-2',
            title: '6.2 Organic and Inorganic Amendments',
            order: 2,
            duration: '90 mins',
            content: `
### Soil Amendments: Organic vs. Inorganic
Amendments are materials added to the soil to improve its physical properties (structure, water retention) or chemical properties (fertility, pH).

#### 1. Organic Amendments
Derived from plant or animal sources. They improve soil structure and provide a slow-release source of nutrients.
- **Compost**: Decomposed organic matter. Improves CEC and microbial activity.
- **Manure**: Animal waste (poultry, cattle, sheep). High in N and P. Must be well-rotted to avoid pathogen risks.
- **Green Manure**: Cover crops (e.g., legumes) plowed back into the soil to add nitrogen and organic matter.

#### 2. Inorganic (Synthetic) Fertilizers
Manufactured minerals or chemicals. They provide immediate nutrient availability but do not improve soil structure.
- **Straight Fertilizers**: Contain one primary nutrient (e.g., Urea for N, Superphosphate for P).
- **Compound/Complex Fertilizers**: Contain two or more nutrients (e.g., NPK 2:3:2).

#### Fertilizer Calculation Example:
To apply 50kg of Nitrogen using Urea (46% N):
**Rate = (Target Amount / Nutrient %) * 100**
Rate = (50 / 46) * 100 = **108.7 kg of Urea**
            `
          },
          {
            id: 'topic-6-3',
            title: '6.3 Soil pH and Liming',
            order: 3,
            duration: '45 mins',
            content: `
### Managing Soil pH
Soil pH affects the availability of nutrients to plants. Most crops prefer a pH range of 6.0 to 7.0.

- **Acidic Soils (pH < 6.0)**: Common in high-rainfall areas. Nutrients like P, Ca, and Mg become less available, while Aluminum (Al) can become toxic.
- **Alkaline Soils (pH > 7.5)**: Common in arid regions. Micronutrients like Fe and Zn become deficient.

#### Correcting Soil pH:
1. **Liming**: Adding Agricultural Lime (Calcium Carbonate) or Dolomitic Lime (Ca + Mg) to raise the pH of acidic soils.
2. **Acidification**: Adding Elemental Sulfur or Aluminum Sulfate to lower the pH of alkaline soils (less common in commercial farming).
            `
          }
        ],
        quiz: [
          {
            id: 'q6-1',
            question: 'Which nutrient is primarily responsible for vegetative growth and green color?',
            options: ['Phosphorus', 'Nitrogen', 'Potassium', 'Calcium'],
            correctAnswer: 1,
            explanation: 'Nitrogen is a key component of chlorophyll and is essential for vegetative growth.'
          },
          {
            id: 'q6-2',
            question: 'What is the recommended sampling depth for most field crops?',
            options: ['5-10 cm', '15-20 cm', '40-50 cm', '1 meter'],
            correctAnswer: 1,
            explanation: 'Most active roots and nutrient interactions occur in the top 15-20 cm of the soil profile.'
          }
        ],
        answerGuide: 'Adhere to the NPK ratios specified in the soil test report. Always prioritize organic matter buildup alongside synthetic applications.'
      },
      {
        id: 'module-7',
        title: 'Module 7: Irrigation & Water Management',
        description: 'Techniques for efficient water use, irrigation system selection, and scheduling.',
        introduction: 'Water is the most limiting factor in crop production. This module explores how to calculate crop water requirements and manage irrigation systems to maximize Water Use Efficiency (WUE).',
        duration: '2 Weeks',
        learningObjectives: [
          'Calculate crop water requirements (ETc)',
          'Select appropriate irrigation systems for specific crops and soils',
          'Implement effective irrigation scheduling',
          'Understand water quality and conservation techniques'
        ],
        topics: [
          {
            id: 'topic-7-1',
            title: '7.1 Crop Water Requirements',
            order: 1,
            duration: '60 mins',
            content: `
### Understanding Evapotranspiration (ET)
Crop water requirement is the amount of water needed by a crop for optimal growth. It is determined by the rate of Evapotranspiration.

**ETc = ETo x Kc**
- **ETo**: Reference Evapotranspiration (based on weather data: temp, wind, humidity, sun).
- **Kc**: Crop Coefficient (varies by crop type and growth stage).

#### Growth Stages and Water Demand:
1. **Initial Stage**: Low water demand (germination).
2. **Development Stage**: Increasing demand as leaf area grows.
3. **Mid-Season (Flowering/Fruiting)**: **Peak water demand**. Stress at this stage causes the most yield loss.
4. **Late Season**: Decreasing demand as the crop matures.
            `
          },
          {
            id: 'topic-7-2',
            title: '7.2 Irrigation Systems and Efficiency',
            order: 2,
            duration: '75 mins',
            content: `
### Choosing the Right Irrigation System
Different systems have varying levels of efficiency and capital costs.

| System Type | Efficiency | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- |
| **Surface (Flood/Furrow)** | 40-60% | Low cost, simple | High water loss, labor intensive |
| **Sprinkler (Center Pivot)** | 70-85% | Automated, uniform | High capital cost, wind sensitive |
| **Drip (Micro-irrigation)** | 90-95% | Highest efficiency, reduces weeds | Clogging risk, high maintenance |

#### Factors Influencing Selection:
- **Crop Type**: High-value crops justify drip systems.
- **Soil Type**: Sandy soils require frequent, light applications (drip/sprinkler).
- **Topography**: Steep slopes are unsuitable for surface irrigation.
- **Water Availability**: Scarcity mandates high-efficiency systems.
            `
          }
        ],
        quiz: [
          {
            id: 'q7-1',
            question: 'At which growth stage is water stress most critical for yield?',
            options: ['Initial stage', 'Development stage', 'Mid-season (Flowering)', 'Late season'],
            correctAnswer: 2,
            explanation: 'Flowering and fruiting are the most sensitive stages where water deficit directly impacts the number and size of harvested units.'
          }
        ],
        answerGuide: 'Always monitor soil moisture before irrigating. Use the ETc formula to avoid over-irrigation, which leads to nutrient leaching.'
      },
      {
        id: 'module-8',
        title: 'Module 8: Integrated Pest & Disease Management',
        description: 'Sustainable strategies for protecting crops from pests and diseases using the IPM framework.',
        introduction: 'Pests and diseases can devastate crop yields if not managed correctly. Integrated Pest Management (IPM) provides a holistic approach that combines biological, cultural, and chemical tools to minimize economic loss and environmental impact.',
        duration: '2 Weeks',
        learningObjectives: [
          'Identify common agricultural pests and diseases',
          'Understand the four pillars of IPM',
          'Implement biological and cultural control methods',
          'Apply pesticides safely and effectively when necessary'
        ],
        topics: [
          {
            id: 'topic-8-1',
            title: '8.1 Principles of IPM',
            order: 1,
            duration: '60 mins',
            content: `
### The IPM Framework
Integrated Pest Management is not about eliminating all pests, but about keeping them below the **Economic Injury Level (EIL)**.

#### The Four Pillars of IPM:
1. **Prevention**: Using resistant varieties, crop rotation, and clean planting material.
2. **Monitoring (Scouting)**: Regularly checking fields to identify pest levels and beneficial insect activity.
3. **Intervention (Mechanical/Biological)**: Using traps, barriers, or natural predators (e.g., ladybugs for aphids).
4. **Chemical Control**: Used as a last resort. Selecting targeted pesticides that minimize harm to non-target organisms.

#### Common Pest Types:
- **Insects**: Aphids, bollworms, thrips, leaf miners.
- **Fungi**: Powdery mildew, rust, late blight.
- **Bacteria**: Bacterial wilt, leaf spot.
- **Viruses**: Mosaic virus (often spread by aphids/whiteflies).
            `
          },
          {
            id: 'topic-8-2',
            title: '8.2 Biological and Cultural Controls',
            order: 2,
            duration: '45 mins',
            content: `
### Sustainable Intervention
#### Cultural Controls:
- **Crop Rotation**: Breaks the life cycle of soil-borne pests.
- **Intercropping**: Planting different crops together to confuse pests.
- **Sanitation**: Removing diseased plant debris from the field.

#### Biological Controls:
- **Predators**: Insects that eat other insects (e.g., lacewings).
- **Parasitoids**: Insects that lay eggs inside pests (e.g., parasitic wasps).
- **Microbials**: Using beneficial bacteria or fungi (e.g., *Bacillus thuringiensis* or Bt).
            `
          }
        ],
        quiz: [
          {
            id: 'q8-1',
            question: 'What is the "Economic Injury Level" (EIL)?',
            options: [
              'The point where all pests are killed',
              'The pest density at which the cost of control equals the value of crop loss saved',
              'The maximum amount of pesticide allowed by law',
              'The level of pests that causes 100% crop failure'
            ],
            correctAnswer: 1,
            explanation: 'IPM aims to intervene only when it is economically justified, i.e., when the potential loss exceeds the cost of treatment.'
          }
        ],
        answerGuide: 'Always scout your fields twice a week. Identify the pest correctly before choosing a treatment.'
      },
      {
        id: 'module-9',
        title: 'Module 9: Harvest & Postharvest Handling',
        description: 'Best practices for harvesting, preserving quality, and minimizing post-harvest losses.',
        introduction: 'The journey of a crop doesn\'t end at harvest. Proper handling and storage are vital to ensure that the quality produced in the field reaches the consumer, maximizing market value.',
        duration: '2 Weeks',
        learningObjectives: [
          'Determine optimal harvest maturity for different crops',
          'Implement proper harvesting techniques to minimize damage',
          'Understand post-harvest physiology (respiration and ethylene)',
          'Manage the cold chain and storage environments'
        ],
        topics: [
          {
            id: 'topic-9-1',
            title: '9.1 Harvest Maturity and Techniques',
            order: 1,
            duration: '50 mins',
            content: `
### When to Harvest?
Harvesting too early or too late reduces quality and shelf life.

#### Maturity Indices:
- **Visual**: Color change, size, drying of foliage (e.g., onions/garlic).
- **Physical**: Firmness (using a penetrometer), ease of detachment.
- **Chemical**: Sugar content (Brix level), starch-to-sugar conversion.

#### Harvesting Best Practices:
- Harvest during the coolest part of the day (early morning).
- Use sharp, clean tools to avoid bruising and infection.
- Keep harvested produce in the shade immediately.
            `
          },
          {
            id: 'topic-9-2',
            title: '9.2 Post-Harvest Physiology and Cooling',
            order: 2,
            duration: '60 mins',
            content: `
### Preserving Quality
Once harvested, produce continues to "breathe" (respiration). High respiration rates lead to rapid spoilage.

#### The Role of Temperature:
For every 10°C increase in temperature, the rate of deterioration doubles or triples. **Pre-cooling** is the process of rapidly removing "field heat" after harvest.

#### Ethylene Management:
Ethylene is a natural ripening hormone (gas). Some crops produce a lot of it (climacteric, e.g., tomatoes, bananas), while others are very sensitive to it (e.g., leafy greens).
**Rule**: Never store ethylene producers with ethylene-sensitive crops.

| Crop Type | Storage Temp (°C) | Relative Humidity (%) |
| :--- | :--- | :--- |
| **Leafy Greens** | 0 - 2 | 95 - 100 |
| **Potatoes** | 4 - 10 | 90 - 95 |
| **Tomatoes (Ripe)** | 10 - 13 | 85 - 90 |
            `
          }
        ],
        quiz: [
          {
            id: 'q9-1',
            question: 'What is the primary goal of pre-cooling produce?',
            options: [
              'To wash off dirt',
              'To remove field heat and slow down respiration',
              'To make the produce freeze for long-term storage',
              'To change the color of the fruit'
            ],
            correctAnswer: 1,
            explanation: 'Removing field heat immediately after harvest is the single most effective way to extend shelf life.'
          }
        ],
        answerGuide: 'Maintain the cold chain from the field to the final customer. Avoid mechanical damage at all costs.'
      },
      {
        id: 'module-10',
        title: 'Module 10: Farm Planning & Record Keeping',
        description: 'Strategic planning, financial management, and the importance of accurate farm records.',
        introduction: 'Farming is a business. This module teaches you how to plan your operations, track your finances, and use data to make informed decisions that ensure long-term sustainability.',
        duration: '2 Weeks',
        learningObjectives: [
          'Develop a seasonal farm production plan',
          'Implement comprehensive record-keeping systems',
          'Analyze farm profitability using basic financial tools',
          'Understand risk management in agriculture'
        ],
        topics: [
          {
            id: 'topic-10-1',
            title: '10.1 Seasonal Production Planning',
            order: 1,
            duration: '60 mins',
            content: `
### The Farm Plan
A good plan aligns your resources (land, labor, capital) with market opportunities.

#### Steps in Planning:
1. **Market Analysis**: What do customers want? When is the price highest?
2. **Crop Selection**: Based on soil, climate, and market.
3. **Resource Audit**: Do you have enough water, labor, and equipment?
4. **Timeline**: Creating a planting and harvest calendar.

#### Crop Rotation Planning:
Avoid planting crops from the same family in the same soil consecutively (e.g., Tomatoes followed by Potatoes).
            `
          },
          {
            id: 'topic-10-2',
            title: '10.2 Effective Record Keeping',
            order: 2,
            duration: '60 mins',
            content: `
### Data-Driven Farming
If you don't measure it, you can't manage it.

#### Types of Records:
- **Production Records**: Planting dates, fertilizer/pesticide applications, yields.
- **Financial Records**: Receipts, invoices, cash flow, labor costs.
- **Inventory Records**: Seeds, chemicals, and equipment on hand.

#### Benefits of Good Records:
- Easier to get bank loans or insurance.
- Identifies which crops are actually making money.
- Required for food safety certifications (e.g., GlobalGAP).
            `
          }
        ],
        quiz: [
          {
            id: 'q10-1',
            question: 'Why is crop rotation important in a farm plan?',
            options: [
              'It makes the farm look better',
              'It breaks pest cycles and prevents soil nutrient depletion',
              'It is required by the government',
              'It allows you to use more fertilizer'
            ],
            correctAnswer: 1,
            explanation: 'Rotating crops from different families prevents the buildup of specific pests and balances nutrient extraction from the soil.'
          }
        ],
        answerGuide: 'Update your records daily. A farm plan is a living document—adjust it as conditions change.'
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
